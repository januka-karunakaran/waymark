import {
  defaultHomeContent,
  userFacingHomeIntro,
  DEFAULT_QUICK_PLACES
} from '../data/homeContent';
import {
  isValidHomeScreenData,
  sanitizeHomeScreenData,
  formatTimeOfDayGreeting,
  isSampleContent
} from '../utils/homePresentation';
import { HomeScreenData } from '../types';

describe('Home Content Architecture & Typed Model', () => {
  describe('defaultHomeContent structure', () => {
    it('defines all required top-level fields', () => {
      expect(defaultHomeContent.hero).toBeDefined();
      expect(defaultHomeContent.suggestion).toBeDefined();
      expect(defaultHomeContent.quickPlaces).toBeDefined();
      expect(defaultHomeContent.architectureStatus).toBeDefined();
      expect(defaultHomeContent.accessibilityNotice).toBeDefined();
      expect(defaultHomeContent.availability).toBe('available');
    });

    it('contains non-empty hero titles and details', () => {
      expect(defaultHomeContent.hero.title).toBe('Where would you like to');
      expect(defaultHomeContent.hero.titleHighlight).toBe('go?');
      expect(defaultHomeContent.hero.subtitle.length).toBeGreaterThan(0);
      expect(defaultHomeContent.hero.eyebrow).toBe('Good morning, navigator');
    });

    it('honestly tags simulated route recommendation as sample data', () => {
      expect(defaultHomeContent.suggestion?.isSample).toBe(true);
      expect(defaultHomeContent.dataSource).toBe('sample_data');
      expect(isSampleContent(defaultHomeContent.suggestion, defaultHomeContent.dataSource)).toBe(true);
    });

    it('identifies developer-only foundation architecture content', () => {
      expect(defaultHomeContent.architectureStatus?.isDeveloperContent).toBe(true);
      expect(defaultHomeContent.architectureStatus?.modules.length).toBeGreaterThanOrEqual(4);
    });

    it('tags accessibility statement as informational/unverified baseline', () => {
      expect(defaultHomeContent.accessibilityNotice.isVerifiedStepFree).toBe(false);
      expect(defaultHomeContent.accessibilityNotice.verificationLevel).toBe('informational');
    });

    it('defines default quick places with standard navigational icons', () => {
      expect(DEFAULT_QUICK_PLACES.length).toBe(6);
      const placeIds = DEFAULT_QUICK_PLACES.map((p) => p.id);
      expect(placeIds).toContain('place-home');
      expect(placeIds).toContain('place-kandy');
    });
  });

  describe('Validation & Sanitization utilities', () => {
    it('validates a valid home screen data object', () => {
      expect(isValidHomeScreenData(defaultHomeContent)).toBe(true);
    });

    it('rejects invalid or null objects', () => {
      expect(isValidHomeScreenData(null)).toBe(false);
      expect(isValidHomeScreenData(undefined)).toBe(false);
      expect(isValidHomeScreenData({})).toBe(false);
      expect(isValidHomeScreenData({ hero: { title: 123 } })).toBe(false);
    });

    it('safely sanitizes empty input without crashing, returning guaranteed defaults', () => {
      const sanitized = sanitizeHomeScreenData(null);
      expect(sanitized).toBeDefined();
      expect(sanitized.hero.title).toBe(defaultHomeContent.hero.title);
      expect(sanitized.quickPlaces).toEqual(DEFAULT_QUICK_PLACES);
    });

    it('safely handles missing optional fields', () => {
      const partial: Partial<HomeScreenData> = {
        hero: {
          eyebrow: 'CUSTOM',
          title: 'Custom Title',
          subtitle: 'Custom Subtitle'
        },
        suggestion: null,
        architectureStatus: null
      };

      const sanitized = sanitizeHomeScreenData(partial);
      expect(sanitized.hero.title).toBe('Custom Title');
      expect(sanitized.suggestion).toBeNull();
      expect(sanitized.architectureStatus).toBeNull();
      expect(sanitized.accessibilityNotice).toBeDefined();
    });

    it('formats time-of-day greetings correctly', () => {
      const morning = new Date(2026, 0, 1, 9, 0);
      const afternoon = new Date(2026, 0, 1, 14, 0);
      const evening = new Date(2026, 0, 1, 20, 0);

      expect(formatTimeOfDayGreeting(morning)).toBe('Good morning');
      expect(formatTimeOfDayGreeting(afternoon)).toBe('Good afternoon');
      expect(formatTimeOfDayGreeting(evening)).toBe('Good evening');
    });

    it('provides user-facing home intro configuration for next phase', () => {
      expect(userFacingHomeIntro.eyebrow).toBe('Good morning, navigator');
      expect(userFacingHomeIntro.titleHighlight).toBe('go?');
    });
  });
});
