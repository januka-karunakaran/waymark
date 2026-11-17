/**
 * Input sanitization and validation utilities for Waymark Mobile
 */

export function sanitizeText(input: unknown): string {
  if (typeof input !== 'string') return '';
  return input
    .replace(/<[^>]*>/g, '') // Strip HTML/XML tags
    .replace(/[<>]/g, '') // Strip any dangling angle brackets
    .trim();
}

export function isValidNodeName(name: unknown): boolean {
  if (typeof name !== 'string') return false;
  const trimmed = name.trim();
  return trimmed.length >= 2 && trimmed.length <= 100;
}

export function isValidCoordinates(
  lat: unknown,
  lng: unknown
): boolean {
  if (typeof lat !== 'number' || typeof lng !== 'number') return false;
  if (Number.isNaN(lat) || Number.isNaN(lng)) return false;
  return lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
}

export function isValidUrl(url: unknown): boolean {
  if (typeof url !== 'string') return false;
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

/**
 * Validates that a required text field is non-empty and non-whitespace.
 */
export function validateRequired(
  value: unknown,
  fieldName = 'This field'
): ValidationResult {
  if (value === null || value === undefined) {
    return { isValid: false, error: `${fieldName} is required.` };
  }
  if (typeof value === 'string' && value.trim().length === 0) {
    return { isValid: false, error: `${fieldName} is required.` };
  }
  return { isValid: true };
}

/**
 * Validates standard email address format.
 * Empty or undefined value is considered valid (use validateRequired for mandatory check).
 */
export function validateEmail(
  email: unknown,
  fieldName = 'Email address'
): ValidationResult {
  if (email === null || email === undefined || email === '') {
    return { isValid: true };
  }
  if (typeof email !== 'string') {
    return { isValid: false, error: `Please enter a valid ${fieldName.toLowerCase()}.` };
  }
  const trimmed = email.trim();
  if (trimmed.length === 0) {
    return { isValid: true };
  }
  // Practical, conservative RFC-compliant email pattern without being overly restrictive
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(trimmed)) {
    return { isValid: false, error: `Please enter a valid ${fieldName.toLowerCase()}.` };
  }
  return { isValid: true };
}

/**
 * Validates minimum character length of a string.
 * Empty string is valid (use validateRequired to enforce presence).
 */
export function validateMinLength(
  value: string | undefined | null,
  min: number,
  fieldName = 'This field'
): ValidationResult {
  if (!value || value.length === 0) {
    return { isValid: true };
  }
  if (value.length < min) {
    return {
      isValid: false,
      error: `${fieldName} must be at least ${min} characters.`
    };
  }
  return { isValid: true };
}

/**
 * Validates maximum character length of a string.
 */
export function validateMaxLength(
  value: string | undefined | null,
  max: number,
  fieldName = 'This field'
): ValidationResult {
  if (!value || value.length === 0) {
    return { isValid: true };
  }
  if (value.length > max) {
    return {
      isValid: false,
      error: `${fieldName} must not exceed ${max} characters.`
    };
  }
  return { isValid: true };
}

/**
 * Validates password minimum length requirement (default 8 chars).
 */
export function validatePasswordMinLength(
  password: string | undefined | null,
  min = 8
): ValidationResult {
  return validateMinLength(password, min, 'Password');
}

/**
 * Validates that two values match (e.g. password and confirmation).
 */
export function validateMatching(
  val1: unknown,
  val2: unknown,
  fieldName = 'Values'
): ValidationResult {
  if (val1 !== val2) {
    return { isValid: false, error: `${fieldName} do not match.` };
  }
  return { isValid: true };
}
