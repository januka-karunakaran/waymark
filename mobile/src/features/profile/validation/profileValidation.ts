/**
 * Waymark Mobile — Feature 04.4: User Profile, Saved Places & Traveler Preferences
 * Domain validation rules and bounds enforcement.
 */

import {
  SavedPlaceInput,
  SavedPlaceKind,
  PreferencesUpdateInput,
  SupportedTransitMode,
  DistanceUnit
} from '../types';

export const DISPLAY_NAME_MIN_LENGTH = 1;
export const DISPLAY_NAME_MAX_LENGTH = 50;

export const LABEL_MIN_LENGTH = 1;
export const LABEL_MAX_LENGTH = 50;

export const PLACE_TEXT_MIN_LENGTH = 1;
export const PLACE_TEXT_MAX_LENGTH = 120;

export const AVATAR_URL_MAX_LENGTH = 500;

export const VALID_PLACE_KINDS: readonly SavedPlaceKind[] = ['home', 'work', 'favorite'] as const;

export const VALID_TRANSIT_MODES: readonly SupportedTransitMode[] = [
  'bus',
  'train',
  'metro',
  'tram',
  'ferry',
  'walking',
  'cycling'
] as const;

export const VALID_DISTANCE_UNITS: readonly DistanceUnit[] = ['km', 'mi'] as const;

// Dangerous character pattern (HTML/injection)
const INJECTION_TAG_PATTERN = /[<>{}]/;

/**
 * Checks for control characters (0-31, 127) or injection characters (<, >, {, }).
 */
function containsControlOrInjection(str: string): boolean {
  for (let i = 0; i < str.length; i++) {
    const code = str.charCodeAt(i);
    if ((code >= 0 && code <= 31) || code === 127) {
      return true;
    }
  }
  return INJECTION_TAG_PATTERN.test(str);
}

export interface ValidationOutcome<T> {
  isValid: boolean;
  error?: string;
  sanitized?: T;
}

/**
 * Validates and sanitizes a traveler display name.
 */
export function validateDisplayName(name: unknown): ValidationOutcome<string | null> {
  if (name === null || name === undefined) {
    return { isValid: true, sanitized: null };
  }

  if (typeof name !== 'string') {
    return { isValid: false, error: 'Display name must be a string.' };
  }

  const trimmed = name.trim();
  if (trimmed.length === 0) {
    return { isValid: true, sanitized: null };
  }

  if (trimmed.length < DISPLAY_NAME_MIN_LENGTH || trimmed.length > DISPLAY_NAME_MAX_LENGTH) {
    return {
      isValid: false,
      error: `Display name must be between ${DISPLAY_NAME_MIN_LENGTH} and ${DISPLAY_NAME_MAX_LENGTH} characters.`
    };
  }

  if (containsControlOrInjection(trimmed)) {
    return { isValid: false, error: 'Display name contains invalid characters.' };
  }

  return { isValid: true, sanitized: trimmed };
}

/**
 * Validates and sanitizes an avatar image URL.
 */
export function validateAvatarUrl(url: unknown): ValidationOutcome<string | null> {
  if (url === null || url === undefined) {
    return { isValid: true, sanitized: null };
  }

  if (typeof url !== 'string') {
    return { isValid: false, error: 'Avatar URL must be a string.' };
  }

  const trimmed = url.trim();
  if (trimmed.length === 0) {
    return { isValid: true, sanitized: null };
  }

  if (trimmed.length > AVATAR_URL_MAX_LENGTH) {
    return {
      isValid: false,
      error: `Avatar URL must not exceed ${AVATAR_URL_MAX_LENGTH} characters.`
    };
  }

  if (!trimmed.startsWith('https://') && !trimmed.startsWith('http://')) {
    return { isValid: false, error: 'Avatar URL must start with http:// or https://.' };
  }

  if (containsControlOrInjection(trimmed)) {
    return { isValid: false, error: 'Avatar URL contains invalid characters.' };
  }

  return { isValid: true, sanitized: trimmed };
}

/**
 * Validates and sanitizes a saved place input.
 */
export function validateSavedPlaceInput(input: unknown): ValidationOutcome<SavedPlaceInput> {
  if (!input || typeof input !== 'object') {
    return { isValid: false, error: 'Saved place input must be an object.' };
  }

  const { kind, label, placeText } = input as Record<string, unknown>;

  if (typeof kind !== 'string' || !VALID_PLACE_KINDS.includes(kind as SavedPlaceKind)) {
    return {
      isValid: false,
      error: `Invalid place kind. Must be one of: ${VALID_PLACE_KINDS.join(', ')}.`
    };
  }

  if (typeof label !== 'string') {
    return { isValid: false, error: 'Label must be a string.' };
  }

  const trimmedLabel = label.trim();
  if (trimmedLabel.length < LABEL_MIN_LENGTH || trimmedLabel.length > LABEL_MAX_LENGTH) {
    return {
      isValid: false,
      error: `Label must be between ${LABEL_MIN_LENGTH} and ${LABEL_MAX_LENGTH} characters.`
    };
  }

  if (containsControlOrInjection(trimmedLabel)) {
    return { isValid: false, error: 'Label contains invalid characters.' };
  }

  if (typeof placeText !== 'string') {
    return { isValid: false, error: 'Place text must be a string.' };
  }

  const trimmedPlaceText = placeText.trim();
  if (
    trimmedPlaceText.length < PLACE_TEXT_MIN_LENGTH ||
    trimmedPlaceText.length > PLACE_TEXT_MAX_LENGTH
  ) {
    return {
      isValid: false,
      error: `Place text must be between ${PLACE_TEXT_MIN_LENGTH} and ${PLACE_TEXT_MAX_LENGTH} characters.`
    };
  }

  if (
    trimmedPlaceText.includes('\0') ||
    trimmedPlaceText.includes('..') ||
    containsControlOrInjection(trimmedPlaceText)
  ) {
    return { isValid: false, error: 'Place text contains invalid characters.' };
  }

  return {
    isValid: true,
    sanitized: {
      kind: kind as SavedPlaceKind,
      label: trimmedLabel,
      placeText: trimmedPlaceText
    }
  };
}

/**
 * Validates and sanitizes traveler preferences input.
 */
export function validatePreferencesInput(input: unknown): ValidationOutcome<PreferencesUpdateInput> {
  if (!input || typeof input !== 'object') {
    return { isValid: false, error: 'Preferences input must be an object.' };
  }

  const { preferredModes, distanceUnit } = input as Record<string, unknown>;
  const sanitized: PreferencesUpdateInput = {};

  if (preferredModes !== undefined) {
    if (!Array.isArray(preferredModes)) {
      return { isValid: false, error: 'Preferred modes must be an array.' };
    }

    const uniqueModes = Array.from(new Set(preferredModes));
    for (const mode of uniqueModes) {
      if (typeof mode !== 'string' || !VALID_TRANSIT_MODES.includes(mode as SupportedTransitMode)) {
        return {
          isValid: false,
          error: `Invalid transit mode: "${String(mode)}". Allowed: ${VALID_TRANSIT_MODES.join(', ')}.`
        };
      }
    }
    sanitized.preferredModes = uniqueModes as SupportedTransitMode[];
  }

  if (distanceUnit !== undefined) {
    if (typeof distanceUnit !== 'string' || !VALID_DISTANCE_UNITS.includes(distanceUnit as DistanceUnit)) {
      return {
        isValid: false,
        error: `Invalid distance unit: "${String(distanceUnit)}". Allowed: ${VALID_DISTANCE_UNITS.join(', ')}.`
      };
    }
    sanitized.distanceUnit = distanceUnit as DistanceUnit;
  }

  return { isValid: true, sanitized };
}
