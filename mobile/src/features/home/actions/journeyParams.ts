/**
 * Waymark 2100 — Journey Navigation Parameters & Validation Contracts
 * Provides parameter validation and destination verification when transferring
 * context from the Home screen to the Mission Route (Journey) screen.
 */

import { TransitMode } from '../../../types/transit';

/**
 * Maximum permitted character length for route parameters to guard against buffer abuse.
 */
export const MAX_PARAM_STRING_LENGTH = 128;

/**
 * Known forbidden URL scheme patterns, script markers, null bytes, and traversal tokens.
 */
export const UNSAFE_PARAM_PATTERN = /(https?|javascript|data|file|blob|vbscript|about):|<[^>]*>|%00|\0|&#|\.\.[/\\]/i;

/**
 * Validated destination context presented on the Journey screen.
 */
export interface ValidatedJourneyDestination {
  /** Internal canonical destination identifier */
  id: string;
  /** Display title of destination */
  name: string;
  /** Primary transit hub identifier */
  hubId: string;
  /** Human-readable name of arrival transit hub */
  hubName: string;
  /** Suggested transit modes */
  suggestedModes: TransitMode[];
  /** Truthful flag indicating whether destination data is simulated demo telemetry */
  isSample: boolean;
  /** Operational corridor status or route advisory */
  corridorAdvisory: string;
}

/**
 * Allowlist of supported Journey destinations.
 */
export const ALLOWED_JOURNEY_DESTINATIONS: Record<string, ValidatedJourneyDestination> = {
  'dest-kandy': {
    id: 'dest-kandy',
    name: 'Kandy City Centre',
    hubId: 'hub-kandy-central',
    hubName: 'Kandy Central Maglev Terminal',
    suggestedModes: ['maglev', 'bus'],
    isSample: true,
    corridorAdvisory: 'Central highlands line nominal · Monsoon surge barrier active'
  },
  'dest-colombo': {
    id: 'dest-colombo',
    name: 'Colombo Fort Central',
    hubId: 'hub-colombo-fort',
    hubName: 'Colombo Fort Multimodal Interchange',
    suggestedModes: ['maglev', 'bus'],
    isSample: true,
    corridorAdvisory: 'Coastal elevated corridor operational · Normal frequency'
  },
  'dest-airport': {
    id: 'dest-airport',
    name: 'Bandaranaike Skyport',
    hubId: 'hub-bia-skyport',
    hubName: 'BIA Skyport International Gate',
    suggestedModes: ['air', 'bus'],
    isSample: true,
    corridorAdvisory: 'Skyport air shuttle active · Automated luggage sync operational'
  },
  'suggested-kdu-kandy': {
    id: 'suggested-kdu-kandy',
    name: 'KDU Gate → Kandy City',
    hubId: 'hub-kandy-central',
    hubName: 'Kandy Central Maglev Terminal',
    suggestedModes: ['walk', 'bus', 'air'],
    isSample: true,
    corridorAdvisory: 'Avoids monsoon ground surge · Air Shuttle flight sync ready'
  }
};

/**
 * Validates and sanitizes incoming route parameters on the Journey screen.
 *
 * @param params Unknown params dictionary received from useLocalSearchParams
 * @returns Strongly typed ValidatedJourneyDestination if valid, or null if invalid/unsafe
 */
export function validateJourneyParams(params: unknown): ValidatedJourneyDestination | null {
  if (!params || typeof params !== 'object') {
    return null;
  }

  const record = params as Record<string, unknown>;
  const rawId = record.destinationId;

  if (typeof rawId !== 'string' || !rawId.trim()) {
    return null;
  }

  const trimmedId = rawId.trim();

  // Guard against oversized parameters or malicious payloads
  if (
    trimmedId.length > MAX_PARAM_STRING_LENGTH ||
    UNSAFE_PARAM_PATTERN.test(trimmedId) ||
    trimmedId.includes('..') ||
    trimmedId.includes('\0')
  ) {
    return null;
  }

  // Check allowlist
  if (ALLOWED_JOURNEY_DESTINATIONS[trimmedId]) {
    return ALLOWED_JOURNEY_DESTINATIONS[trimmedId];
  }

  // Check validated user saved destinations (e.g. dest-saved-home, dest-saved-work)
  if (trimmedId.startsWith('dest-saved-')) {
    const rawName = record.destinationName;
    if (typeof rawName === 'string' && rawName.trim()) {
      const trimmedName = rawName.trim();
      if (
        trimmedName.length <= MAX_PARAM_STRING_LENGTH &&
        !UNSAFE_PARAM_PATTERN.test(trimmedName) &&
        !trimmedName.includes('\0') &&
        !trimmedName.includes('..') &&
        !trimmedName.includes('/') &&
        !trimmedName.includes('\\')
      ) {
        return {
          id: trimmedId,
          name: trimmedName,
          hubId: 'hub-custom-node',
          hubName: 'Custom Saved Destination',
          suggestedModes: ['maglev', 'bus', 'walk'],
          isSample: false,
          corridorAdvisory: 'User-configured route node · Live guidance pending'
        };
      }
    }
  }

  return null;
}

/**
 * Creates route query parameters for navigating to the Journey screen.
 */
export function createJourneyRouteParams(
  destinationId: string,
  destinationName?: string,
  source = 'quick_shortcut'
): Record<string, string> {
  const params: Record<string, string> = {
    destinationId
  };
  if (destinationName) {
    params.destinationName = destinationName;
  }
  if (source) {
    params.source = source;
  }
  return params;
}
