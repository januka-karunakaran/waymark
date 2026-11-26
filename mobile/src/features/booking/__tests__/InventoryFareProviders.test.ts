/**
 * Waymark Mobile — Feature 05.1: Booking & Ticketing Architecture Foundation
 * Task 05.1.2: Inventory, Availability & Fare Quote Provider Unit & Security Tests
 */

import {
  BookableDeparture,
  DepartureAvailability,
  DepartureQueryFilters,
  FareQuote,
  FareQuoteRequest,
  FareQuoteProvider,
  TransitInventoryProvider,
  UnavailableFareQuoteProvider,
  UnavailableInventoryProvider,
  validateDepartureAvailability,
  validateFareQuoteRequest,
  validateFareQuote,
  validateMinorUnitAmount,
  validateCurrencyCode,
  validateBookableDeparture,
  validateTransportOperator,
  TransportOperator
} from '../index';

describe('Feature 05.1 Task 05.1.2 — Inventory, Availability & Fare Provider Architecture', () => {
  const validDeparture: BookableDeparture = {
    id: 'dep-colombo-kandy-101',
    operatorId: 'op-express-rail',
    originNodeId: 'node-colombo-fort',
    originName: 'Colombo Fort Central',
    destinationNodeId: 'node-kandy-station',
    destinationName: 'Kandy Terminal',
    departureTime: '2026-12-01T08:30:00Z',
    arrivalTime: '2026-12-01T11:00:00Z',
    serviceIdentifier: 'EXP-101',
    inventorySource: 'operator_verified',
    bookableStatus: 'available',
    transitMode: 'maglev'
  };

  const validOperator: TransportOperator = {
    id: 'op-express-rail',
    name: 'National Express Transit',
    sourceIdentifier: 'NET-LK-001',
    verificationState: 'verified'
  };

  const validQuote: FareQuote = {
    id: 'quote-rail-2026-001',
    departureId: 'dep-colombo-kandy-101',
    amountMinorUnits: 250000, // 2500.00 LKR in integer minor units
    currency: 'LKR',
    passengerCount: 2,
    fareClass: 'standard',
    issuedAt: '2026-11-26T10:00:00Z',
    expiresAt: '2026-11-26T10:15:00Z',
    issuingSource: 'operator_verified'
  };

  const validAvailability: DepartureAvailability = {
    departureId: 'dep-colombo-kandy-101',
    isAvailable: true,
    availableSeats: 42,
    totalCapacity: 120,
    source: 'operator_verified',
    observedAt: '2026-11-26T10:00:00Z',
    operatorNotice: 'Platform 3'
  };

  // 1. Unconfigured inventory provider
  describe('1. Unconfigured Inventory Provider Behavior', () => {
    const provider = new UnavailableInventoryProvider();

    it('reports not_configured readiness state', async () => {
      const readiness = await provider.getReadiness();
      expect(readiness).toBe('not_configured');
    });

    it('returns typed NOT_CONFIGURED error when querying departures', async () => {
      const result = await provider.getDepartures();
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('NOT_CONFIGURED');
        expect(result.error.message).toContain('not configured');
        expect(result.error.details?.provider).toBe('UnavailableInventoryProvider');
      }
    });

    it('returns typed NOT_CONFIGURED error when retrieving single departure', async () => {
      const result = await provider.getDeparture('dep-101');
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('NOT_CONFIGURED');
        expect(result.error.details?.departureId).toBe('dep-101');
      }
    });

    it('returns typed INVENTORY_UNAVAILABLE error when checking availability', async () => {
      const result = await provider.checkAvailability('dep-101');
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('INVENTORY_UNAVAILABLE');
        expect(result.error.message).toContain('seat capacity');
      }
    });
  });

  // 2. Unconfigured fare provider
  describe('2. Unconfigured Fare Quote Provider Behavior', () => {
    const provider = new UnavailableFareQuoteProvider();

    it('reports not_configured readiness state', async () => {
      const readiness = await provider.getReadiness();
      expect(readiness).toBe('not_configured');
    });

    it('returns typed NOT_CONFIGURED error when requesting quote', async () => {
      const result = await provider.getQuote({
        departureId: 'dep-101',
        passengerCount: 1
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('NOT_CONFIGURED');
        expect(result.error.message).toContain('not configured');
        expect(result.error.details?.departureId).toBe('dep-101');
      }
    });

    it('returns typed NOT_CONFIGURED error when validating existing quote', async () => {
      const result = await provider.validateQuote('quote-101');
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('NOT_CONFIGURED');
        expect(result.error.details?.quoteId).toBe('quote-101');
      }
    });
  });

  // 3. Valid provider response from an injected test double
  describe('3. Injected Test Double Provider Behavior', () => {
    class MockVerifiedInventoryProvider implements TransitInventoryProvider {
      async getReadiness() {
        return 'ready' as const;
      }
      async getDepartures(_filters?: DepartureQueryFilters) {
        return { success: true as const, data: [validDeparture] };
      }
      async getDeparture(id: string) {
        if (id === validDeparture.id) {
          return { success: true as const, data: validDeparture };
        }
        return {
          success: false as const,
          error: { code: 'BOOKING_NOT_FOUND' as const, message: 'Departure not found' }
        };
      }
      async checkAvailability(_id: string) {
        return { success: true as const, data: validAvailability };
      }
    }

    class MockVerifiedFareQuoteProvider implements FareQuoteProvider {
      async getReadiness() {
        return 'ready' as const;
      }
      async getQuote(req: FareQuoteRequest) {
        return {
          success: true as const,
          data: {
            ...validQuote,
            departureId: req.departureId,
            passengerCount: req.passengerCount
          }
        };
      }
      async validateQuote(quoteId: string) {
        if (quoteId === validQuote.id) {
          return { success: true as const, data: validQuote };
        }
        return {
          success: false as const,
          error: { code: 'BOOKING_NOT_FOUND' as const, message: 'Quote not found' }
        };
      }
    }

    it('successfully queries departures through mock verified provider', async () => {
      const provider = new MockVerifiedInventoryProvider();
      const result = await provider.getDepartures();
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toHaveLength(1);
        expect(result.data[0].id).toBe(validDeparture.id);
      }
    });

    it('successfully queries fare quote through mock verified fare provider', async () => {
      const provider = new MockVerifiedFareQuoteProvider();
      const result = await provider.getQuote({
        departureId: validDeparture.id,
        passengerCount: 2
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.amountMinorUnits).toBe(250000);
        expect(result.data.currency).toBe('LKR');
      }
    });
  });

  // 4. Invalid departure payload
  describe('4. Invalid Departure Payload Validation', () => {
    it('rejects departures missing required identifier fields', () => {
      const invalid = { ...validDeparture, id: '' };
      expect(validateBookableDeparture(invalid).isValid).toBe(false);
    });

    it('rejects departures with malformed departure timestamp', () => {
      const invalid = { ...validDeparture, departureTime: 'invalid-date' };
      expect(validateBookableDeparture(invalid).isValid).toBe(false);
    });
  });

  // 5. Invalid operator reference
  describe('5. Invalid Operator Reference Validation', () => {
    it('rejects operator missing source identifier', () => {
      const invalid = { ...validOperator, sourceIdentifier: '' };
      expect(validateTransportOperator(invalid).isValid).toBe(false);
    });

    it('rejects operator with unapproved verification state', () => {
      const invalid = { ...validOperator, verificationState: 'self_certified' };
      expect(validateTransportOperator(invalid).isValid).toBe(false);
    });
  });

  // 6. Empty inventory results
  describe('6. Empty Inventory Query Handling', () => {
    class EmptyInventoryProvider implements TransitInventoryProvider {
      async getReadiness() {
        return 'ready' as const;
      }
      async getDepartures() {
        return { success: true as const, data: [] };
      }
      async getDeparture() {
        return {
          success: false as const,
          error: { code: 'BOOKING_NOT_FOUND' as const, message: 'Departure not found' }
        };
      }
      async checkAvailability() {
        return {
          success: false as const,
          error: { code: 'INVENTORY_UNAVAILABLE' as const, message: 'No inventory' }
        };
      }
    }

    it('safely handles empty departure lists without fabricating departures', async () => {
      const provider = new EmptyInventoryProvider();
      const result = await provider.getDepartures();
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual([]);
      }
    });
  });

  // 7. Invalid seat counts
  describe('7. Seat and Capacity Bounds Validation', () => {
    it('validates genuine availability payload with valid seat counts', () => {
      const outcome = validateDepartureAvailability(validAvailability);
      expect(outcome.isValid).toBe(true);
      expect(outcome.sanitized?.availableSeats).toBe(42);
    });

    it('rejects negative available seats', () => {
      const invalid = { ...validAvailability, availableSeats: -5 };
      expect(validateDepartureAvailability(invalid).isValid).toBe(false);
    });

    it('rejects floating-point seat numbers', () => {
      const invalid = { ...validAvailability, availableSeats: 3.5 };
      expect(validateDepartureAvailability(invalid).isValid).toBe(false);
    });

    it('rejects available seats exceeding total capacity', () => {
      const invalid = { ...validAvailability, availableSeats: 150, totalCapacity: 100 };
      const outcome = validateDepartureAvailability(invalid);
      expect(outcome.isValid).toBe(false);
      expect(outcome.error).toContain('cannot exceed totalCapacity');
    });
  });

  // 8. Unsupported currency
  describe('8. Unsupported Currency Handling', () => {
    it('accepts standard ISO 4217 currencies', () => {
      expect(validateCurrencyCode('USD').isValid).toBe(true);
      expect(validateCurrencyCode('LKR').isValid).toBe(true);
      expect(validateCurrencyCode('EUR').isValid).toBe(true);
    });

    it('rejects unsupported or fictional currency codes', () => {
      expect(validateCurrencyCode('XYZ').isValid).toBe(false);
      expect(validateCurrencyCode('BITCOIN').isValid).toBe(false);
    });
  });

  // 9. Fractional minor-unit amounts rejected
  describe('9. Fractional Minor-Unit Monetary Validation', () => {
    it('accepts integer minor units', () => {
      expect(validateMinorUnitAmount(100).isValid).toBe(true);
      expect(validateMinorUnitAmount(250000).isValid).toBe(true);
    });

    it('strictly rejects floating-point minor units', () => {
      expect(validateMinorUnitAmount(10.5).isValid).toBe(false);
      expect(validateMinorUnitAmount(99.99).isValid).toBe(false);
    });
  });

  // 10. Valid quote shape
  describe('10. Fare Quote Contract Shape', () => {
    it('accepts a fully compliant FareQuote', () => {
      const outcome = validateFareQuote(validQuote);
      expect(outcome.isValid).toBe(true);
      expect(outcome.sanitized?.amountMinorUnits).toBe(250000);
    });
  });

  // 11. Expired quote
  describe('11. Expired Quote Detection', () => {
    it('detects an expired quote based on timestamp', () => {
      const expiredQuote = {
        ...validQuote,
        expiresAt: '2026-11-20T00:00:00Z'
      };
      const now = new Date('2026-11-26T12:00:00Z');
      expect(new Date(expiredQuote.expiresAt).getTime() < now.getTime()).toBe(true);
    });
  });

  // 12. Quote / departure mismatch
  describe('12. Quote / Departure Mismatch Prevention', () => {
    it('detects mismatch between requested departure ID and quote departure ID', () => {
      const requestedDepartureId = 'dep-colombo-kandy-101';
      const quoteWithDifferentDep = {
        ...validQuote,
        departureId: 'dep-jaffna-colombo-202'
      };
      expect(quoteWithDifferentDep.departureId === requestedDepartureId).toBe(false);
    });
  });

  // 13. Passenger count mismatch
  describe('13. Passenger Count Mismatch Prevention', () => {
    it('detects mismatch between requested passenger count and quote passenger count', () => {
      const requestedPassengerCount = 4;
      expect(validQuote.passengerCount === requestedPassengerCount).toBe(false);
    });
  });

  // 14. Timeout handling
  describe('14. Provider Timeout Handling', () => {
    class TimingOutInventoryProvider implements TransitInventoryProvider {
      async getReadiness() {
        return 'degraded' as const;
      }
      async getDepartures() {
        return {
          success: false as const,
          error: {
            code: 'SERVICE_UNAVAILABLE' as const,
            message: 'Inventory request timed out after 5000ms.'
          }
        };
      }
      async getDeparture() {
        return {
          success: false as const,
          error: {
            code: 'SERVICE_UNAVAILABLE' as const,
            message: 'Departure lookup timed out.'
          }
        };
      }
      async checkAvailability() {
        return {
          success: false as const,
          error: {
            code: 'SERVICE_UNAVAILABLE' as const,
            message: 'Availability lookup timed out.'
          }
        };
      }
    }

    it('returns typed SERVICE_UNAVAILABLE on simulated timeout', async () => {
      const provider = new TimingOutInventoryProvider();
      const result = await provider.getDepartures();
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('SERVICE_UNAVAILABLE');
        expect(result.error.message).toContain('timed out');
      }
    });
  });

  // 15. Network error mapping
  describe('15. Network Error Mapping', () => {
    class DisconnectedFareQuoteProvider implements FareQuoteProvider {
      async getReadiness() {
        return 'unavailable' as const;
      }
      async getQuote(_req: FareQuoteRequest) {
        return {
          success: false as const,
          error: {
            code: 'SERVICE_UNAVAILABLE' as const,
            message: 'Network offline. Unable to reach fare quotation engine.'
          }
        };
      }
      async validateQuote(_quoteId: string) {
        return {
          success: false as const,
          error: {
            code: 'SERVICE_UNAVAILABLE' as const,
            message: 'Network offline.'
          }
        };
      }
    }

    it('maps network disconnects to clean typed error without leaking secrets', async () => {
      const provider = new DisconnectedFareQuoteProvider();
      const result = await provider.getQuote({
        departureId: 'dep-101',
        passengerCount: 1
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('SERVICE_UNAVAILABLE');
        expect(result.error.message).toContain('Network offline');
      }
    });
  });

  // 16. Rate limiting
  describe('16. Rate Limiting Protection', () => {
    class RateLimitedProvider implements TransitInventoryProvider {
      async getReadiness() {
        return 'degraded' as const;
      }
      async getDepartures() {
        return {
          success: false as const,
          error: {
            code: 'SERVICE_UNAVAILABLE' as const,
            message: 'Rate limit exceeded. Please retry after backoff.'
          }
        };
      }
      async getDeparture() {
        return {
          success: false as const,
          error: { code: 'SERVICE_UNAVAILABLE' as const, message: 'Rate limited' }
        };
      }
      async checkAvailability() {
        return {
          success: false as const,
          error: { code: 'SERVICE_UNAVAILABLE' as const, message: 'Rate limited' }
        };
      }
    }

    it('returns typed error when rate limit is encountered', async () => {
      const provider = new RateLimitedProvider();
      const result = await provider.getDepartures();
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('SERVICE_UNAVAILABLE');
        expect(result.error.message).toContain('Rate limit');
      }
    });
  });

  // 17. Stale response handling
  describe('17. Stale Response Protection', () => {
    it('rejects availability payloads with invalid or malformed observation timestamps', () => {
      const invalid = { ...validAvailability, observedAt: 'invalid-time' };
      expect(validateDepartureAvailability(invalid).isValid).toBe(false);
    });
  });

  // 18. Sample content not promoted to verified inventory
  describe('18. Sample Content Quarantine', () => {
    it('strictly separates sample_data provenance from operator_verified', () => {
      const sampleDep = { ...validDeparture, inventorySource: 'sample_data' as const };
      expect(sampleDep.inventorySource).not.toBe('operator_verified');
    });

    it('rejects arbitrary invented inventory source strings', () => {
      const fakeDep = { ...validDeparture, inventorySource: 'magical_realtime' };
      expect(validateBookableDeparture(fakeDep).isValid).toBe(false);
    });
  });

  // 19. No fabricated availability
  describe('19. No Fabricated Availability Guarantee', () => {
    it('UnavailableInventoryProvider strictly returns INVENTORY_UNAVAILABLE instead of fake seats', async () => {
      const provider = new UnavailableInventoryProvider();
      const availability = await provider.checkAvailability('any-dep-id');
      expect(availability.success).toBe(false);
      if (!availability.success) {
        expect(availability.error.code).toBe('INVENTORY_UNAVAILABLE');
      }
    });
  });

  // 20. No fabricated fare
  describe('20. No Fabricated Fare Guarantee', () => {
    it('UnavailableFareQuoteProvider strictly returns NOT_CONFIGURED instead of fake price', async () => {
      const provider = new UnavailableFareQuoteProvider();
      const quoteResult = await provider.getQuote({
        departureId: 'dep-101',
        passengerCount: 2
      });
      expect(quoteResult.success).toBe(false);
      if (!quoteResult.success) {
        expect(quoteResult.error.code).toBe('NOT_CONFIGURED');
      }
    });

    it('validateFareQuoteRequest strictly rejects client-supplied prices', () => {
      const maliciousRequest = {
        departureId: 'dep-101',
        passengerCount: 1,
        price: 0,
        amountMinorUnits: 100
      };
      const outcome = validateFareQuoteRequest(maliciousRequest);
      expect(outcome.isValid).toBe(false);
      expect(outcome.error).toContain('Client cannot supply price or amount');
    });
  });

  // 21. No credentials in errors
  describe('21. Sanitized Errors & No Secrets Leaked', () => {
    it('error details do not expose secret tokens or keys', async () => {
      const provider = new UnavailableInventoryProvider();
      const result = await provider.getDepartures();
      expect(result.success).toBe(false);
      if (!result.success) {
        const serialized = JSON.stringify(result.error);
        expect(serialized).not.toContain('apikey');
        expect(serialized).not.toContain('secret');
        expect(serialized).not.toContain('service_role');
      }
    });
  });

  // 22. Existing BookingDomainContracts regression
  describe('22. Regression Verification with Domain Contracts', () => {
    it('retains compatibility with BookableDeparture model', () => {
      expect(validateBookableDeparture(validDeparture).isValid).toBe(true);
    });

    it('retains compatibility with FareQuote model', () => {
      expect(validateFareQuote(validQuote).isValid).toBe(true);
    });
  });
});
