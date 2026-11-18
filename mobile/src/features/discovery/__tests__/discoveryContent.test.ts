import {
  defaultDiscoveryPayload,
  DEFAULT_DISCOVERY_SECTIONS,
  SAMPLE_CORRIDOR_ITEMS,
  SAMPLE_HUB_ITEMS,
  SAMPLE_MODE_ITEMS,
  SAMPLE_EXPERIENCE_ITEMS,
  LocalDiscoveryContentProvider
} from '../data/discoveryContent';
import {
  isValidDiscoveryItem,
  isValidDiscoverySection,
  isValidDiscoveryPayload,
  sanitizeDiscoveryPayload,
  hasDuplicateIdentifiers,
  deduplicateDiscoveryItems,
  filterDiscoveryItemsByCategory,
  findDiscoveryItemById,
  isDiscoverySampleContent,
  formatDiscoveryMetadataSummary
} from '../utils/discoveryPresentation';
import { DiscoveryItem } from '../types';

describe('Discovery Content Architecture & Typed Models (Task 3.2.1)', () => {
  describe('defaultDiscoveryPayload & Sample Dataset', () => {
    it('defines a valid top-level payload structure', () => {
      expect(defaultDiscoveryPayload.sections).toBeDefined();
      expect(defaultDiscoveryPayload.sections.length).toBe(4);
      expect(defaultDiscoveryPayload.availability).toBe('available');
      expect(defaultDiscoveryPayload.dataSource).toBe('sample_data');
      expect(defaultDiscoveryPayload.lastUpdatedTimestamp).toBeGreaterThan(0);
    });

    it('contains all four verified transit categories', () => {
      const categories = defaultDiscoveryPayload.sections.map((s) => s.category);
      expect(categories).toContain('corridors');
      expect(categories).toContain('hubs');
      expect(categories).toContain('modes');
      expect(categories).toContain('experiences');
    });

    it('honestly tags every discovery item as simulated sample data', () => {
      for (const section of defaultDiscoveryPayload.sections) {
        expect(section.items.length).toBeGreaterThanOrEqual(2);
        for (const item of section.items) {
          expect(item.isSample).toBe(true);
          expect(item.dataSource).toBe('sample_data');
          expect(isDiscoverySampleContent(item)).toBe(true);
        }
      }
    });

    it('guarantees unique identifiers across all discovery items', () => {
      const allItems = defaultDiscoveryPayload.sections.flatMap((s) => s.items);
      expect(hasDuplicateIdentifiers(allItems)).toBe(false);
    });

    it('validates verified corridor items and line codes', () => {
      const corridorSection = defaultDiscoveryPayload.sections.find((s) => s.category === 'corridors');
      expect(corridorSection).toBeDefined();
      expect(corridorSection?.items).toHaveLength(SAMPLE_CORRIDOR_ITEMS.length);

      const maglev = corridorSection?.items.find((i) => i.id === 'disc-corridor-cmb-kdy');
      expect(maglev?.title).toBe('Colombo–Kandy Maglev Corridor');
      expect(maglev?.metadata?.lineCode).toBe('M4');
      expect(maglev?.metadata?.duration).toBe('34 min');
      expect(maglev?.metadata?.status).toBe('nominal');
    });

    it('validates verified hub items and node codes', () => {
      const hubSection = defaultDiscoveryPayload.sections.find((s) => s.category === 'hubs');
      expect(hubSection).toBeDefined();

      const fort = hubSection?.items.find((i) => i.id === 'disc-hub-cmb-fort');
      expect(fort?.metadata?.nodeCode).toBe('CMB');
      expect(fort?.metadata?.modes).toContain('maglev');
    });

    it('validates verified experience items', () => {
      const expSection = defaultDiscoveryPayload.sections.find((s) => s.category === 'experiences');
      expect(expSection).toBeDefined();
      expect(expSection?.items).toHaveLength(SAMPLE_EXPERIENCE_ITEMS.length);

      const quiet = expSection?.items.find((i) => i.id === 'disc-exp-low-sensory');
      expect(quiet?.badgeText).toBe('ACCESSIBLE');
      expect(quiet?.metadata?.stepFree).toBe(true);
    });
  });

  describe('Validation Utilities (isValidDiscoveryItem, Section, Payload)', () => {
    const validSampleItem: DiscoveryItem = {
      id: 'test-item-1',
      title: 'Test Route',
      category: 'corridors',
      isSample: true,
      dataSource: 'sample_data'
    };

    it('validates conforming discovery items', () => {
      expect(isValidDiscoveryItem(validSampleItem)).toBe(true);
    });

    it('rejects invalid or malformed discovery items', () => {
      expect(isValidDiscoveryItem(null)).toBe(false);
      expect(isValidDiscoveryItem(undefined)).toBe(false);
      expect(isValidDiscoveryItem('not an object')).toBe(false);
      expect(isValidDiscoveryItem({})).toBe(false);
      expect(isValidDiscoveryItem({ ...validSampleItem, id: '' })).toBe(false);
      expect(isValidDiscoveryItem({ ...validSampleItem, title: '   ' })).toBe(false);
      expect(isValidDiscoveryItem({ ...validSampleItem, category: 'unknown_cat' })).toBe(false);
      expect(isValidDiscoveryItem({ ...validSampleItem, isSample: 'not a boolean' })).toBe(false);
    });

    it('validates conforming discovery sections', () => {
      const validSection = DEFAULT_DISCOVERY_SECTIONS[0];
      expect(isValidDiscoverySection(validSection)).toBe(true);
    });

    it('rejects malformed discovery sections', () => {
      expect(isValidDiscoverySection(null)).toBe(false);
      expect(isValidDiscoverySection({})).toBe(false);
      expect(
        isValidDiscoverySection({
          id: 'sec-1',
          category: 'corridors',
          eyebrow: 'TEST',
          title: 'Test',
          items: [{ invalid: 'item' }],
          availability: 'available'
        })
      ).toBe(false);
    });

    it('validates conforming discovery payload', () => {
      expect(isValidDiscoveryPayload(defaultDiscoveryPayload)).toBe(true);
    });

    it('rejects non-conforming discovery payload', () => {
      expect(isValidDiscoveryPayload(null)).toBe(false);
      expect(isValidDiscoveryPayload({ sections: 'not-array' })).toBe(false);
    });
  });

  describe('Sanitization & Degradation Utilities', () => {
    it('returns a safe empty payload when given null or undefined input', () => {
      const sanitized = sanitizeDiscoveryPayload(null);
      expect(sanitized.sections).toEqual([]);
      expect(sanitized.availability).toBe('empty');
    });

    it('filters out corrupt items and preserves valid ones', () => {
      const corruptPayload = {
        availability: 'available',
        dataSource: 'sample_data',
        lastUpdatedTimestamp: 12345678,
        sections: [
          {
            id: 'corrupt-section',
            category: 'corridors',
            eyebrow: 'CORRIDORS',
            title: 'Corridors',
            items: [
              { id: 'valid-1', title: 'Valid Item 1', category: 'corridors', isSample: true, dataSource: 'sample_data' },
              { id: '', title: 'Corrupt 1' },
              null,
              { id: 'valid-2', title: 'Valid Item 2', category: 'corridors', isSample: true, dataSource: 'sample_data' }
            ]
          }
        ]
      };

      const sanitized = sanitizeDiscoveryPayload(corruptPayload);
      expect(sanitized.sections.length).toBe(1);
      expect(sanitized.sections[0].items.length).toBe(2);
      expect(sanitized.sections[0].items[0].id).toBe('valid-1');
      expect(sanitized.sections[0].items[1].id).toBe('valid-2');
    });

    it('strips duplicate item identifiers during sanitization', () => {
      const duplicatePayload = {
        sections: [
          {
            id: 'sec-dup',
            category: 'hubs',
            eyebrow: 'HUBS',
            title: 'Hubs',
            items: [
              { id: 'dup-1', title: 'First', category: 'hubs', isSample: true, dataSource: 'sample_data' },
              { id: 'dup-1', title: 'Duplicate First', category: 'hubs', isSample: true, dataSource: 'sample_data' },
              { id: 'dup-2', title: 'Second', category: 'hubs', isSample: true, dataSource: 'sample_data' }
            ]
          }
        ]
      };

      const sanitized = sanitizeDiscoveryPayload(duplicatePayload);
      expect(sanitized.sections[0].items.length).toBe(2);
      expect(sanitized.sections[0].items[0].title).toBe('First');
      expect(sanitized.sections[0].items[1].title).toBe('Second');
    });
  });

  describe('Deduplication & Query Utilities', () => {
    it('detects duplicate items with hasDuplicateIdentifiers', () => {
      const uniqueItems: DiscoveryItem[] = [
        { id: 'a', title: 'A', category: 'corridors', isSample: true, dataSource: 'sample_data' },
        { id: 'b', title: 'B', category: 'corridors', isSample: true, dataSource: 'sample_data' }
      ];
      expect(hasDuplicateIdentifiers(uniqueItems)).toBe(false);

      const duplicateItems: DiscoveryItem[] = [
        { id: 'a', title: 'A', category: 'corridors', isSample: true, dataSource: 'sample_data' },
        { id: 'a', title: 'A copy', category: 'corridors', isSample: true, dataSource: 'sample_data' }
      ];
      expect(hasDuplicateIdentifiers(duplicateItems)).toBe(true);
    });

    it('removes duplicate items preserving the first occurrence with deduplicateDiscoveryItems', () => {
      const items: DiscoveryItem[] = [
        { id: 'x', title: 'First X', category: 'modes', isSample: true, dataSource: 'sample_data' },
        { id: 'y', title: 'First Y', category: 'modes', isSample: true, dataSource: 'sample_data' },
        { id: 'x', title: 'Second X', category: 'modes', isSample: true, dataSource: 'sample_data' }
      ];

      const deduped = deduplicateDiscoveryItems(items);
      expect(deduped.length).toBe(2);
      expect(deduped[0].title).toBe('First X');
      expect(deduped[1].title).toBe('First Y');
    });

    it('filters discovery items by category', () => {
      const allItems = defaultDiscoveryPayload.sections.flatMap((s) => s.items);
      const corridorItems = filterDiscoveryItemsByCategory(allItems, 'corridors');
      expect(corridorItems.every((i) => i.category === 'corridors')).toBe(true);
      expect(corridorItems.length).toBe(SAMPLE_CORRIDOR_ITEMS.length);
    });

    it('finds items across sections by unique ID', () => {
      const item = findDiscoveryItemById(defaultDiscoveryPayload.sections, 'disc-mode-maglev');
      expect(item).not.toBeNull();
      expect(item?.title).toBe('Maglev High-Speed Rail');

      const missing = findDiscoveryItemById(defaultDiscoveryPayload.sections, 'non-existent-id');
      expect(missing).toBeNull();
    });
  });

  describe('Metadata Formatting Utility (formatDiscoveryMetadataSummary)', () => {
    it('formats duration, frequency, and line code for corridors', () => {
      const maglev = SAMPLE_CORRIDOR_ITEMS[0];
      const summary = formatDiscoveryMetadataSummary(maglev);
      expect(summary).toBe('34 min · Every 8 min · Line M4 · Step-free');
    });

    it('formats node code and modes for hub cards', () => {
      const hub = SAMPLE_HUB_ITEMS[0];
      const summary = formatDiscoveryMetadataSummary(hub);
      expect(summary).toBe('Node CMB · Maglev, Bus, Walk · Step-free');
    });

    it('formats modes and step-free indicator when duration is absent', () => {
      const mode = SAMPLE_MODE_ITEMS[0];
      const summary = formatDiscoveryMetadataSummary(mode);
      expect(summary).toBe('Maglev · Step-free');
    });

    it('returns empty string when metadata is undefined', () => {
      const itemWithoutMeta: DiscoveryItem = {
        id: 'bare-item',
        title: 'Bare Item',
        category: 'modes',
        isSample: true,
        dataSource: 'sample_data'
      };
      expect(formatDiscoveryMetadataSummary(itemWithoutMeta)).toBe('');
    });
  });

  describe('LocalDiscoveryContentProvider', () => {
    let provider: LocalDiscoveryContentProvider;

    beforeEach(() => {
      provider = new LocalDiscoveryContentProvider();
    });

    it('asynchronously resolves all discovery sections', async () => {
      const payload = await provider.getDiscoverySections();
      expect(payload).toBeDefined();
      expect(payload.sections.length).toBe(4);
      expect(payload.availability).toBe('available');
    });

    it('returns isolated copies of sections so mutations do not leak', async () => {
      const payload1 = await provider.getDiscoverySections();
      payload1.sections[0].items.pop();

      const payload2 = await provider.getDiscoverySections();
      expect(payload2.sections[0].items.length).toBe(DEFAULT_DISCOVERY_SECTIONS[0].items.length);
    });

    it('asynchronously retrieves section by category', async () => {
      const section = await provider.getSectionByCategory('hubs');
      expect(section).not.toBeNull();
      expect(section?.title).toBe('Major Transit Hubs');
      expect(section?.items.length).toBe(SAMPLE_HUB_ITEMS.length);
    });

    it('returns null when category does not exist in payload', async () => {
      const emptyProvider = new LocalDiscoveryContentProvider({
        ...defaultDiscoveryPayload,
        sections: []
      });
      const section = await emptyProvider.getSectionByCategory('corridors');
      expect(section).toBeNull();
    });

    it('asynchronously retrieves item by ID across sections', async () => {
      const item = await provider.getItemById('disc-exp-low-sensory');
      expect(item).not.toBeNull();
      expect(item?.title).toBe('Low-Sensory Quiet Journey');
      expect(item?.category).toBe('experiences');
    });

    it('returns null when item ID is not found', async () => {
      const item = await provider.getItemById('unknown-item-id');
      expect(item).toBeNull();
    });
  });
});
