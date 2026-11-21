/**
 * Waymark Mobile — Feature 04.4: User Profile Domain Validation Tests
 * Verifies bounds, constraints, injection prevention, and edge cases.
 */

import {
  validateDisplayName,
  validateAvatarUrl,
  validateSavedPlaceInput,
  validatePreferencesInput,
  DISPLAY_NAME_MAX_LENGTH,
  LABEL_MAX_LENGTH,
  PLACE_TEXT_MAX_LENGTH,
  AVATAR_URL_MAX_LENGTH
} from '../validation';

describe('ProfileDomainValidation', () => {
  describe('validateDisplayName', () => {
    it('accepts valid display names and trims whitespace', () => {
      const result = validateDisplayName('  Janu Karunakaran  ');
      expect(result.isValid).toBe(true);
      expect(result.sanitized).toBe('Janu Karunakaran');
    });

    it('accepts null and undefined as optional/unset profile names', () => {
      expect(validateDisplayName(null)).toEqual({ isValid: true, sanitized: null });
      expect(validateDisplayName(undefined)).toEqual({ isValid: true, sanitized: null });
      expect(validateDisplayName('   ')).toEqual({ isValid: true, sanitized: null });
    });

    it('rejects non-string types', () => {
      expect(validateDisplayName(12345).isValid).toBe(false);
      expect(validateDisplayName({}).isValid).toBe(false);
    });

    it('rejects display names exceeding max length', () => {
      const longName = 'A'.repeat(DISPLAY_NAME_MAX_LENGTH + 1);
      const result = validateDisplayName(longName);
      expect(result.isValid).toBe(false);
      expect(result.error).toContain(`${DISPLAY_NAME_MAX_LENGTH}`);
    });

    it('rejects strings containing control or script injection characters', () => {
      expect(validateDisplayName('Janu<script>').isValid).toBe(false);
      expect(validateDisplayName('Janu\x00Null').isValid).toBe(false);
      expect(validateDisplayName('Janu{bad}').isValid).toBe(false);
    });
  });

  describe('validateAvatarUrl', () => {
    it('accepts valid https image URLs', () => {
      const url = 'https://images.waymark.app/avatars/user-123.png';
      const result = validateAvatarUrl(url);
      expect(result.isValid).toBe(true);
      expect(result.sanitized).toBe(url);
    });

    it('accepts null/undefined/empty string as null', () => {
      expect(validateAvatarUrl(null)).toEqual({ isValid: true, sanitized: null });
      expect(validateAvatarUrl(undefined)).toEqual({ isValid: true, sanitized: null });
      expect(validateAvatarUrl('   ')).toEqual({ isValid: true, sanitized: null });
    });

    it('rejects non-http protocols (e.g. javascript:, file:)', () => {
      expect(validateAvatarUrl('javascript:alert(1)').isValid).toBe(false);
      expect(validateAvatarUrl('file:///etc/passwd').isValid).toBe(false);
    });

    it('rejects URLs exceeding max length', () => {
      const longUrl = 'https://example.com/' + 'a'.repeat(AVATAR_URL_MAX_LENGTH);
      expect(validateAvatarUrl(longUrl).isValid).toBe(false);
    });

    it('rejects URLs containing injection characters', () => {
      expect(validateAvatarUrl('https://example.com/<script>').isValid).toBe(false);
    });
  });

  describe('validateSavedPlaceInput', () => {
    it('accepts valid home place input', () => {
      const input = {
        kind: 'home',
        label: 'Home',
        placeText: '123 Galle Road, Colombo 03'
      };
      const result = validateSavedPlaceInput(input);
      expect(result.isValid).toBe(true);
      expect(result.sanitized).toEqual({
        kind: 'home',
        label: 'Home',
        placeText: '123 Galle Road, Colombo 03'
      });
    });

    it('accepts valid work place input', () => {
      const input = {
        kind: 'work',
        label: 'Office HQ',
        placeText: 'World Trade Center, Colombo 01'
      };
      const result = validateSavedPlaceInput(input);
      expect(result.isValid).toBe(true);
      expect(result.sanitized?.kind).toBe('work');
    });

    it('accepts valid favorite custom shortcut', () => {
      const input = {
        kind: 'favorite',
        label: 'Gym',
        placeText: 'Fitness First, Bambalapitiya'
      };
      const result = validateSavedPlaceInput(input);
      expect(result.isValid).toBe(true);
      expect(result.sanitized?.kind).toBe('favorite');
    });

    it('rejects invalid kind', () => {
      const input = {
        kind: 'secret_base',
        label: 'Base',
        placeText: 'Somewhere'
      };
      const result = validateSavedPlaceInput(input);
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('Invalid place kind');
    });

    it('rejects empty or whitespace-only labels', () => {
      const input = {
        kind: 'home',
        label: '   ',
        placeText: '123 Galle Road'
      };
      const result = validateSavedPlaceInput(input);
      expect(result.isValid).toBe(false);
    });

    it('rejects labels exceeding max length', () => {
      const input = {
        kind: 'home',
        label: 'A'.repeat(LABEL_MAX_LENGTH + 1),
        placeText: '123 Galle Road'
      };
      const result = validateSavedPlaceInput(input);
      expect(result.isValid).toBe(false);
    });

    it('rejects placeText exceeding max length', () => {
      const input = {
        kind: 'home',
        label: 'Home',
        placeText: 'A'.repeat(PLACE_TEXT_MAX_LENGTH + 1)
      };
      const result = validateSavedPlaceInput(input);
      expect(result.isValid).toBe(false);
    });

    it('rejects placeText containing path traversal or control chars', () => {
      expect(
        validateSavedPlaceInput({
          kind: 'home',
          label: 'Home',
          placeText: '../secret/file'
        }).isValid
      ).toBe(false);

      expect(
        validateSavedPlaceInput({
          kind: 'home',
          label: 'Home',
          placeText: 'Null\0Byte'
        }).isValid
      ).toBe(false);
    });
  });

  describe('validatePreferencesInput', () => {
    it('accepts valid preferred transit modes and distance unit', () => {
      const input = {
        preferredModes: ['bus', 'train', 'metro'],
        distanceUnit: 'km'
      };
      const result = validatePreferencesInput(input);
      expect(result.isValid).toBe(true);
      expect(result.sanitized).toEqual({
        preferredModes: ['bus', 'train', 'metro'],
        distanceUnit: 'km'
      });
    });

    it('deduplicates preferred modes', () => {
      const input = {
        preferredModes: ['bus', 'bus', 'train']
      };
      const result = validatePreferencesInput(input);
      expect(result.isValid).toBe(true);
      expect(result.sanitized?.preferredModes).toEqual(['bus', 'train']);
    });

    it('accepts miles (mi) as distance unit', () => {
      const input = { distanceUnit: 'mi' };
      const result = validatePreferencesInput(input);
      expect(result.isValid).toBe(true);
      expect(result.sanitized?.distanceUnit).toBe('mi');
    });

    it('rejects invalid distance unit', () => {
      const input = { distanceUnit: 'yards' };
      const result = validatePreferencesInput(input);
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('Invalid distance unit');
    });

    it('rejects invalid transit modes', () => {
      const input = {
        preferredModes: ['bus', 'teleporter', 'train']
      };
      const result = validatePreferencesInput(input);
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('Invalid transit mode');
    });

    it('accepts empty preferences update', () => {
      const result = validatePreferencesInput({});
      expect(result.isValid).toBe(true);
      expect(result.sanitized).toEqual({});
    });
  });
});
