import {
  isValidCoordinates,
  isValidNodeName,
  isValidUrl,
  sanitizeText,
  validateRequired,
  validateEmail,
  validateMinLength,
  validateMaxLength,
  validatePasswordMinLength,
  validateMatching
} from '../../src/utils/validation';

describe('Validation Utilities', () => {
  describe('sanitizeText', () => {
    it('strips HTML/XML tags and trims input', () => {
      expect(sanitizeText('<script>alert("hack")</script>Kandy')).toBe('alert("hack")Kandy');
      expect(sanitizeText('   Ratmalana Central   ')).toBe('Ratmalana Central');
      expect(sanitizeText(12345)).toBe('');
    });
  });

  describe('isValidNodeName', () => {
    it('accepts valid node names between 2 and 100 characters', () => {
      expect(isValidNodeName('KDU Gate')).toBe(true);
      expect(isValidNodeName('A')).toBe(false);
      expect(isValidNodeName('')).toBe(false);
      expect(isValidNodeName(null)).toBe(false);
    });
  });

  describe('isValidCoordinates', () => {
    it('validates latitude and longitude ranges', () => {
      expect(isValidCoordinates(6.8172, 79.8883)).toBe(true);
      expect(isValidCoordinates(91, 0)).toBe(false);
      expect(isValidCoordinates(0, 185)).toBe(false);
      expect(isValidCoordinates(NaN, 50)).toBe(false);
      expect(isValidCoordinates('6.81', '79.88')).toBe(false);
    });
  });

  describe('isValidUrl', () => {
    it('validates standard http and https URLs', () => {
      expect(isValidUrl('https://api.waymark.com')).toBe(true);
      expect(isValidUrl('http://localhost:8081')).toBe(true);
      expect(isValidUrl('javascript:alert(1)')).toBe(false);
      expect(isValidUrl('not-a-valid-url')).toBe(false);
    });
  });

  describe('Form Validation Utilities', () => {
    // TC-02.4-22: Required validation works
    it('TC-02.4-22: validates required fields properly', () => {
      expect(validateRequired('Janu', 'Name')).toEqual({ isValid: true });
      expect(validateRequired('', 'Name')).toEqual({
        isValid: false,
        error: 'Name is required.'
      });
      expect(validateRequired('   ', 'Name')).toEqual({
        isValid: false,
        error: 'Name is required.'
      });
      expect(validateRequired(null, 'Name')).toEqual({
        isValid: false,
        error: 'Name is required.'
      });
      expect(validateRequired(undefined, 'Field')).toEqual({
        isValid: false,
        error: 'Field is required.'
      });
    });

    // TC-02.4-23: Minimum-length validation works
    it('TC-02.4-23: validates minimum length constraints', () => {
      expect(validateMinLength('waymark', 5, 'Passcode')).toEqual({ isValid: true });
      expect(validateMinLength('way', 5, 'Passcode')).toEqual({
        isValid: false,
        error: 'Passcode must be at least 5 characters.'
      });
      expect(validatePasswordMinLength('pass1234')).toEqual({ isValid: true });
      expect(validatePasswordMinLength('short')).toEqual({
        isValid: false,
        error: 'Password must be at least 8 characters.'
      });
    });

    // TC-02.4-24: Maximum-length validation works
    it('TC-02.4-24: validates maximum length constraints', () => {
      expect(validateMaxLength('short', 10, 'Bio')).toEqual({ isValid: true });
      expect(validateMaxLength('this string is far too long', 10, 'Bio')).toEqual({
        isValid: false,
        error: 'Bio must not exceed 10 characters.'
      });
    });

    // TC-02.4-25: Email validation handles normal valid and invalid inputs
    it('TC-02.4-25: validates email format correctly', () => {
      expect(validateEmail('janu@waymark.app')).toEqual({ isValid: true });
      expect(validateEmail('sathurjanv.23@uom.lk')).toEqual({ isValid: true });
      expect(validateEmail('user.name+tag@sub.domain.org')).toEqual({ isValid: true });

      expect(validateEmail('notanemail')).toEqual({
        isValid: false,
        error: 'Please enter a valid email address.'
      });
      expect(validateEmail('user@')).toEqual({
        isValid: false,
        error: 'Please enter a valid email address.'
      });
      expect(validateEmail('@domain.com')).toEqual({
        isValid: false,
        error: 'Please enter a valid email address.'
      });
      expect(validateEmail('user@domain')).toEqual({
        isValid: false,
        error: 'Please enter a valid email address.'
      });
    });

    // TC-02.4-26: Matching-value validation works
    it('TC-02.4-26: validates matching values for confirmations', () => {
      expect(validateMatching('Secret123', 'Secret123', 'Passwords')).toEqual({
        isValid: true
      });
      expect(validateMatching('Secret123', 'Different', 'Passwords')).toEqual({
        isValid: false,
        error: 'Passwords do not match.'
      });
    });

    // TC-02.4-27: Optional empty values are handled correctly
    it('TC-02.4-27: handles optional empty values safely without false errors', () => {
      expect(validateEmail('')).toEqual({ isValid: true });
      expect(validateEmail(null)).toEqual({ isValid: true });
      expect(validateEmail(undefined)).toEqual({ isValid: true });
      expect(validateMinLength('', 8)).toEqual({ isValid: true });
      expect(validateMinLength(null, 8)).toEqual({ isValid: true });
      expect(validateMinLength(undefined, 8)).toEqual({ isValid: true });
      expect(validateMaxLength('', 50)).toEqual({ isValid: true });
    });
  });
});
