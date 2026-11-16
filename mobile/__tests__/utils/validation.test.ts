import {
  isValidCoordinates,
  isValidNodeName,
  isValidUrl,
  sanitizeText
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
});
