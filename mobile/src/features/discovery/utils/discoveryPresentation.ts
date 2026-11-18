/**
 * Waymark 2100 — Discovery Content Presentation & Validation Utilities
 *
 * Provides type guards, defensive sanitizers, query helpers, and metadata
 * formatting utilities to ensure reliable and accessible discovery card presentation.
 */

import {
  DiscoveryCategory,
  DiscoveryItem,
  DiscoveryPayload,
  DiscoverySectionData
} from '../types';

const VALID_CATEGORIES: ReadonlySet<DiscoveryCategory> = new Set([
  'corridors',
  'hubs',
  'modes',
  'experiences'
]);

/**
 * Validates whether an unknown value conforms to the DiscoveryItem interface.
 */
export function isValidDiscoveryItem(value: unknown): value is DiscoveryItem {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const candidate = value as Record<string, unknown>;

  return (
    typeof candidate.id === 'string' &&
    candidate.id.trim().length > 0 &&
    typeof candidate.title === 'string' &&
    candidate.title.trim().length > 0 &&
    typeof candidate.category === 'string' &&
    VALID_CATEGORIES.has(candidate.category as DiscoveryCategory) &&
    typeof candidate.isSample === 'boolean' &&
    typeof candidate.dataSource === 'string'
  );
}

/**
 * Validates whether an unknown value conforms to the DiscoverySectionData interface.
 */
export function isValidDiscoverySection(value: unknown): value is DiscoverySectionData {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const candidate = value as Record<string, unknown>;

  return (
    typeof candidate.id === 'string' &&
    candidate.id.trim().length > 0 &&
    typeof candidate.category === 'string' &&
    VALID_CATEGORIES.has(candidate.category as DiscoveryCategory) &&
    typeof candidate.eyebrow === 'string' &&
    typeof candidate.title === 'string' &&
    Array.isArray(candidate.items) &&
    candidate.items.every(isValidDiscoveryItem) &&
    typeof candidate.availability === 'string'
  );
}

/**
 * Validates whether an unknown value conforms to the DiscoveryPayload interface.
 */
export function isValidDiscoveryPayload(value: unknown): value is DiscoveryPayload {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const candidate = value as Record<string, unknown>;

  return (
    Array.isArray(candidate.sections) &&
    candidate.sections.every(isValidDiscoverySection) &&
    typeof candidate.availability === 'string' &&
    typeof candidate.dataSource === 'string' &&
    typeof candidate.lastUpdatedTimestamp === 'number'
  );
}

/**
 * Fallback empty payload for defensive degradation.
 */
export const EMPTY_DISCOVERY_PAYLOAD: DiscoveryPayload = {
  sections: [],
  availability: 'empty',
  dataSource: 'sample_data',
  lastUpdatedTimestamp: 0,
  attributionNotice: 'Waymark 2100 Multimodal Transit Authority'
};

/**
 * Sanitizes an unknown or untrusted payload into a safe DiscoveryPayload.
 * Ensures no duplicate IDs, strips invalid items, and applies sensible fallbacks.
 */
export function sanitizeDiscoveryPayload(raw: unknown): DiscoveryPayload {
  if (!raw || typeof raw !== 'object') {
    return { ...EMPTY_DISCOVERY_PAYLOAD };
  }

  const candidate = raw as Record<string, unknown>;
  const rawSections = Array.isArray(candidate.sections) ? candidate.sections : [];

  const sanitizedSections: DiscoverySectionData[] = [];
  const seenSectionIds = new Set<string>();

  for (const s of rawSections) {
    if (!s || typeof s !== 'object') continue;
    const sec = s as Record<string, unknown>;
    const id = typeof sec.id === 'string' && sec.id.trim().length > 0 ? sec.id.trim() : `sec-${sanitizedSections.length}`;
    if (seenSectionIds.has(id)) continue;
    seenSectionIds.add(id);

    const category: DiscoveryCategory =
      typeof sec.category === 'string' && VALID_CATEGORIES.has(sec.category as DiscoveryCategory)
        ? (sec.category as DiscoveryCategory)
        : 'corridors';

    const rawItems = Array.isArray(sec.items) ? sec.items : [];
    const validItems: DiscoveryItem[] = [];
    const seenItemIds = new Set<string>();

    for (const it of rawItems) {
      if (isValidDiscoveryItem(it) && !seenItemIds.has(it.id)) {
        seenItemIds.add(it.id);
        validItems.push(it);
      }
    }

    sanitizedSections.push({
      id,
      category,
      eyebrow: typeof sec.eyebrow === 'string' ? sec.eyebrow : '',
      title: typeof sec.title === 'string' ? sec.title : 'Untitled Section',
      description: typeof sec.description === 'string' ? sec.description : undefined,
      items: validItems,
      availability:
        typeof sec.availability === 'string'
          ? (sec.availability as DiscoverySectionData['availability'])
          : 'available',
      totalAvailable: typeof sec.totalAvailable === 'number' ? sec.totalAvailable : validItems.length
    });
  }

  return {
    sections: sanitizedSections,
    availability:
      typeof candidate.availability === 'string'
        ? (candidate.availability as DiscoveryPayload['availability'])
        : 'available',
    dataSource:
      typeof candidate.dataSource === 'string'
        ? (candidate.dataSource as DiscoveryPayload['dataSource'])
        : 'sample_data',
    lastUpdatedTimestamp:
      typeof candidate.lastUpdatedTimestamp === 'number' && !Number.isNaN(candidate.lastUpdatedTimestamp)
        ? candidate.lastUpdatedTimestamp
        : Date.now(),
    attributionNotice:
      typeof candidate.attributionNotice === 'string' ? candidate.attributionNotice : undefined
  };
}

/**
 * Checks whether an array of discovery items contains any duplicate IDs.
 */
export function hasDuplicateIdentifiers(items: DiscoveryItem[]): boolean {
  const seen = new Set<string>();
  for (const item of items) {
    if (seen.has(item.id)) {
      return true;
    }
    seen.add(item.id);
  }
  return false;
}

/**
 * Deduplicates an array of discovery items by preserving only the first occurrence of each ID.
 */
export function deduplicateDiscoveryItems(items: DiscoveryItem[]): DiscoveryItem[] {
  const seen = new Set<string>();
  return items.filter((item) => {
    if (seen.has(item.id)) {
      return false;
    }
    seen.add(item.id);
    return true;
  });
}

/**
 * Filters items by category.
 */
export function filterDiscoveryItemsByCategory(
  items: DiscoveryItem[],
  category: DiscoveryCategory
): DiscoveryItem[] {
  return items.filter((item) => item.category === category);
}

/**
 * Finds a discovery item across all sections by its unique ID.
 */
export function findDiscoveryItemById(
  sections: DiscoverySectionData[],
  id: string
): DiscoveryItem | null {
  for (const section of sections) {
    const item = section.items.find((it) => it.id === id);
    if (item) return item;
  }
  return null;
}

/**
 * Truthfully checks whether an item represents simulated or sample data.
 */
export function isDiscoverySampleContent(item: DiscoveryItem): boolean {
  return item.isSample === true || item.dataSource === 'sample_data';
}

/**
 * Formats operational metadata into a human-readable summary line for discovery cards.
 * E.g., '34 min · Every 8 min · Line M4' or 'Maglev, Bus · Step-free'.
 */
export function formatDiscoveryMetadataSummary(item: DiscoveryItem): string {
  if (!item.metadata) {
    return '';
  }

  const parts: string[] = [];
  const { duration, frequency, lineCode, nodeCode, modes, stepFree, distanceKm } = item.metadata;

  if (duration) {
    parts.push(duration);
  }

  if (frequency) {
    parts.push(frequency);
  }

  if (lineCode) {
    parts.push(`Line ${lineCode}`);
  } else if (nodeCode) {
    parts.push(`Node ${nodeCode}`);
  }

  if (distanceKm && !lineCode && !nodeCode) {
    parts.push(`${distanceKm} km`);
  }

  if (!duration && !frequency && modes && modes.length > 0) {
    const modeLabels = modes.map((m) => m.charAt(0).toUpperCase() + m.slice(1).replace('_', ' '));
    parts.push(modeLabels.join(', '));
  }

  if (stepFree && parts.length < 4) {
    parts.push('Step-free');
  }

  return parts.join(' · ');
}

/**
 * Verified, genuine navigation routes available within Waymark Mobile.
 * Used defensively to ensure Discovery actions only navigate to genuine screens.
 */
export const VERIFIED_DISCOVERY_ROUTES: ReadonlySet<string> = new Set([
  '/(tabs)',
  '/(tabs)/index',
  '/(tabs)/map',
  '/(tabs)/journey',
  '/(tabs)/oracle',
  '/(tabs)/comfort',
  '/',
  '/map',
  '/journey',
  '/oracle',
  '/comfort'
]);

/**
 * Validates whether a route string matches an active verified navigation destination.
 */
export function isValidDiscoveryRoute(route?: string): boolean {
  if (!route || typeof route !== 'string') {
    return false;
  }
  return VERIFIED_DISCOVERY_ROUTES.has(route.trim());
}
