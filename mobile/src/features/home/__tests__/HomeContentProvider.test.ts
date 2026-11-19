/**
 * Waymark 2100 — Home Content Provider Tests
 * Validates the HomeContentProvider contract, defensive deep copying,
 * validation boundaries, sample provenance preservation, and concurrency safety.
 */

import {
  HomeContentProvider,
  LocalHomeContentProvider,
  defaultHomeProvider,
  cloneHomeScreenData
} from '../providers';
import { defaultHomeContent } from '../data/homeContent';
import { HomeScreenData } from '../types';
import { defaultDiscoveryProvider } from '../../discovery';

describe('HomeContentProvider Architecture (Task 3.4.1)', () => {
  describe('LocalHomeContentProvider Contract Implementation', () => {
    let provider: HomeContentProvider;

    beforeEach(() => {
      provider = new LocalHomeContentProvider();
    });

    it('implements getHomeContent and returns a complete valid HomeScreenData structure', async () => {
      const content = await provider.getHomeContent();

      expect(content).toBeDefined();
      expect(content.hero).toBeDefined();
      expect(content.hero.title).toBe(defaultHomeContent.hero.title);
      expect(content.hero.eyebrow).toBe(defaultHomeContent.hero.eyebrow);
      expect(content.hero.subtitle).toBe(defaultHomeContent.hero.subtitle);
      expect(Array.isArray(content.quickPlaces)).toBe(true);
      expect(content.quickPlaces.length).toBeGreaterThan(0);
      expect(content.accessibilityNotice).toBeDefined();
      expect(content.availability).toBe('available');
    });

    it('implements getSuggestedRoute and returns the active route recommendation', async () => {
      if (provider.getSuggestedRoute) {
        const suggestion = await provider.getSuggestedRoute();
        expect(suggestion).not.toBeNull();
        expect(suggestion?.id).toBe('suggested-kdu-kandy');
        expect(suggestion?.title).toBe('KDU Gate → Kandy City');
        expect(suggestion?.isSample).toBe(true);
      }
    });

    it('implements getQuickPlaces and returns configured place nodes', async () => {
      if (provider.getQuickPlaces) {
        const places = await provider.getQuickPlaces();
        expect(Array.isArray(places)).toBe(true);
        expect(places.map((p) => p.id)).toContain('place-home');
        expect(places.map((p) => p.id)).toContain('place-work');
      }
    });

    it('provides a default singleton provider instance', async () => {
      expect(defaultHomeProvider).toBeInstanceOf(LocalHomeContentProvider);
      const content = await defaultHomeProvider.getHomeContent();
      expect(content.hero.title).toBe(defaultHomeContent.hero.title);
    });
  });

  describe('Defensive Copying & Mutation Isolation', () => {
    it('prevents mutation of hero properties from polluting subsequent reads', async () => {
      const provider = new LocalHomeContentProvider();

      const firstRead = await provider.getHomeContent();
      firstRead.hero.title = 'MUTATED TITLE';

      const secondRead = await provider.getHomeContent();
      expect(secondRead.hero.title).toBe(defaultHomeContent.hero.title);
      expect(defaultHomeContent.hero.title).not.toBe('MUTATED TITLE');
    });

    it('prevents mutation of quickPlaces array from polluting subsequent reads or defaults', async () => {
      const provider = new LocalHomeContentProvider();

      const firstRead = await provider.getHomeContent();
      firstRead.quickPlaces.push({
        id: 'place-alien-node',
        label: 'Alien Node',
        destination: 'Unknown Sector',
        iconName: 'map-pin'
      });
      firstRead.quickPlaces[0].label = 'Mutated Home';

      const secondRead = await provider.getHomeContent();
      expect(secondRead.quickPlaces.length).toBe(defaultHomeContent.quickPlaces.length);
      expect(secondRead.quickPlaces[0].label).toBe(defaultHomeContent.quickPlaces[0].label);
      expect(secondRead.quickPlaces.find((p) => p.id === 'place-alien-node')).toBeUndefined();
    });

    it('prevents mutation of suggestion transitModes from polluting subsequent reads', async () => {
      const provider = new LocalHomeContentProvider();

      const firstRead = await provider.getHomeContent();
      if (firstRead.suggestion?.transitModes) {
        firstRead.suggestion.transitModes.push('maglev');
      }

      const secondRead = await provider.getHomeContent();
      expect(secondRead.suggestion?.transitModes).toEqual(
        defaultHomeContent.suggestion?.transitModes
      );
    });

    it('prevents mutation of architectureStatus diagnostics modules', async () => {
      const provider = new LocalHomeContentProvider();

      const firstRead = await provider.getHomeContent();
      if (firstRead.architectureStatus?.modules) {
        firstRead.architectureStatus.modules[0].value = 'CORRUPTED VALUE';
      }

      const secondRead = await provider.getHomeContent();
      expect(secondRead.architectureStatus?.modules[0].value).toBe(
        defaultHomeContent.architectureStatus?.modules[0].value
      );
    });

    it('cloneHomeScreenData creates complete deep copies of all nested structures', () => {
      const clone = cloneHomeScreenData(defaultHomeContent);

      expect(clone).not.toBe(defaultHomeContent);
      expect(clone.hero).not.toBe(defaultHomeContent.hero);
      expect(clone.quickPlaces).not.toBe(defaultHomeContent.quickPlaces);
      expect(clone.quickPlaces[0]).not.toBe(defaultHomeContent.quickPlaces[0]);
      expect(clone.suggestion).not.toBe(defaultHomeContent.suggestion);
      expect(clone.accessibilityNotice).not.toBe(defaultHomeContent.accessibilityNotice);
      expect(clone.architectureStatus).not.toBe(defaultHomeContent.architectureStatus);
      if (clone.architectureStatus?.modules) {
        expect(clone.architectureStatus.modules[0]).not.toBe(
          defaultHomeContent.architectureStatus?.modules[0]
        );
      }
    });
  });

  describe('Data Validation & Sanitization Boundaries', () => {
    it('safely tolerates and sanitizes partial/incomplete input in constructor', async () => {
      const malformedData = {
        hero: { title: 'Custom Title' }
      } as unknown as HomeScreenData;

      const provider = new LocalHomeContentProvider(malformedData);
      const result = await provider.getHomeContent();

      expect(result.hero.title).toBe('Custom Title');
      expect(result.hero.subtitle).toBe(defaultHomeContent.hero.subtitle);
      expect(result.quickPlaces).toEqual(defaultHomeContent.quickPlaces);
      expect(result.accessibilityNotice).toBeDefined();
    });

    it('tolerates nullable optional sections without throwing', async () => {
      const customData: HomeScreenData = {
        ...defaultHomeContent,
        suggestion: null,
        architectureStatus: null
      };

      const provider = new LocalHomeContentProvider(customData);
      const result = await provider.getHomeContent();

      expect(result.suggestion).toBeNull();
      expect(result.architectureStatus).toBeNull();

      if (provider.getSuggestedRoute) {
        const route = await provider.getSuggestedRoute();
        expect(route).toBeNull();
      }
    });
  });

  describe('Truthful Telemetry & Data Provenance', () => {
    it('strictly preserves sample_data source classification', async () => {
      const provider = new LocalHomeContentProvider();
      const content = await provider.getHomeContent();

      expect(content.dataSource).toBe('sample_data');
      expect(content.suggestion?.isSample).toBe(true);
      expect(content.architectureStatus?.isDeveloperContent).toBe(true);
      expect(content.accessibilityNotice.verificationLevel).toBe('informational');
    });

    it('does not artificially delay response (immediate resolution)', async () => {
      const provider = new LocalHomeContentProvider();
      const start = Date.now();
      await provider.getHomeContent();
      const duration = Date.now() - start;

      // Local provider must resolve immediately without fake setTimeout latency
      expect(duration).toBeLessThan(50);
    });
  });

  describe('Dual Provider Interoperability (Home + Discovery)', () => {
    it('allows concurrent retrieval alongside DiscoveryContentProvider without collision', async () => {
      const [homeData, discoveryPayload] = await Promise.all([
        defaultHomeProvider.getHomeContent(),
        defaultDiscoveryProvider.getDiscoverySections()
      ]);

      expect(homeData).toBeDefined();
      expect(homeData.hero.title).toBe(defaultHomeContent.hero.title);
      expect(discoveryPayload).toBeDefined();
      expect(discoveryPayload.sections.length).toBeGreaterThan(0);
      expect(homeData.dataSource).toBe('sample_data');
      expect(discoveryPayload.dataSource).toBe('sample_data');
    });
  });
});
