/**
 * Waymark Mobile — Feature 05.1 Task 05.1.1
 * Booking Domain Contracts, State Machine, Validation & Security Boundaries Suite
 */

import {
  Booking,
  BookingRequest,
  BookingStatus,
  BookableDeparture,
  TransportOperator,
  BOOKING_ALLOWED_TRANSITIONS,
  isValidBookingStateTransition,
  isTerminalBookingStatus
} from '../types/bookingTypes';
import { FareQuote, isFareQuoteExpired } from '../types/fareTypes';
import { Ticket } from '../types/ticketTypes';
import {
  validatePassengerCount,
  validateMinorUnitAmount,
  validateCurrencyCode,
  validateIdempotencyKey,
  validateBookingRequest,
  validateFareQuote,
  validateTransportOperator,
  validateBookableDeparture,
  validatePassengerInput,
  MIN_PASSENGER_COUNT,
  MAX_PASSENGER_COUNT
} from '../validation/bookingValidation';
import { UnavailableBookingService } from '../services/UnavailableBookingService';

describe('Feature 05.1 Task 05.1.1 — Booking & Ticketing Domain Architecture', () => {
  const validDeparture: BookableDeparture = {
    id: 'dep-colombo-kandy-101',
    operatorId: 'op-sri-lanka-maglev',
    originNodeId: 'node-colombo-fort',
    originName: 'Colombo Fort Central',
    destinationNodeId: 'node-kandy-central',
    destinationName: 'Kandy City Centre',
    departureTime: '2026-12-01T08:30:00Z',
    arrivalTime: '2026-12-01T09:15:00Z',
    serviceIdentifier: 'MAG-2104',
    inventorySource: 'operator_verified',
    bookableStatus: 'available',
    transitMode: 'maglev'
  };

  const validFareQuote: FareQuote = {
    id: 'quote-882190',
    departureId: 'dep-colombo-kandy-101',
    amountMinorUnits: 2500, // $25.00 in minor units
    currency: 'USD',
    passengerCount: 2,
    fareClass: 'standard',
    issuedAt: '2026-11-26T10:00:00Z',
    expiresAt: '2026-11-26T10:15:00Z',
    issuingSource: 'sl-maglev-engine'
  };

  const validOperator: TransportOperator = {
    id: 'op-sri-lanka-maglev',
    name: 'Sri Lanka Planetary Maglev Authority',
    sourceIdentifier: 'LK-MAGLEV-GTFS',
    verificationState: 'verified',
    websiteUrl: 'https://transit.waymark.lk'
  };

  // 1. Domain model validation
  describe('1. Domain Model Validation', () => {
    it('validates a well-formed BookableDeparture', () => {
      const outcome = validateBookableDeparture(validDeparture);
      expect(outcome.isValid).toBe(true);
      expect(outcome.sanitized?.id).toBe('dep-colombo-kandy-101');
      expect(outcome.sanitized?.inventorySource).toBe('operator_verified');
    });

    it('validates a well-formed TransportOperator', () => {
      const outcome = validateTransportOperator(validOperator);
      expect(outcome.isValid).toBe(true);
      expect(outcome.sanitized?.name).toBe('Sri Lanka Planetary Maglev Authority');
      expect(outcome.sanitized?.verificationState).toBe('verified');
    });

    it('validates a well-formed FareQuote', () => {
      const outcome = validateFareQuote(validFareQuote);
      expect(outcome.isValid).toBe(true);
      expect(outcome.sanitized?.amountMinorUnits).toBe(2500);
      expect(outcome.sanitized?.currency).toBe('USD');
    });
  });

  // 2. Booking status modeling & state transitions
  describe('2. Booking Status Modeling & State Transitions', () => {
    it('allows valid progressive lifecycle transitions', () => {
      expect(isValidBookingStateTransition('draft', 'pending_inventory')).toBe(true);
      expect(isValidBookingStateTransition('pending_inventory', 'held')).toBe(true);
      expect(isValidBookingStateTransition('held', 'awaiting_payment')).toBe(true);
      expect(isValidBookingStateTransition('awaiting_payment', 'confirmed')).toBe(true);
      expect(isValidBookingStateTransition('confirmed', 'ticket_issued')).toBe(true);
    });

    it('identifies terminal booking states correctly', () => {
      expect(isTerminalBookingStatus('expired')).toBe(true);
      expect(isTerminalBookingStatus('cancelled')).toBe(true);
      expect(isTerminalBookingStatus('failed')).toBe(true);
      expect(isTerminalBookingStatus('refunded')).toBe(true);
      expect(isTerminalBookingStatus('held')).toBe(false);
      expect(isTerminalBookingStatus('awaiting_payment')).toBe(false);
    });

    it('defines explicit transition rules for every known state', () => {
      const allStates: BookingStatus[] = [
        'draft',
        'pending_inventory',
        'held',
        'awaiting_payment',
        'confirmed',
        'ticket_issued',
        'expired',
        'cancelled',
        'payment_failed',
        'failed',
        'refund_pending',
        'refunded'
      ];
      allStates.forEach((state) => {
        expect(Array.isArray(BOOKING_ALLOWED_TRANSITIONS[state])).toBe(true);
      });
    });
  });

  // 3. Fare minor-unit validation
  describe('3. Fare Minor-Unit Validation', () => {
    it('accepts positive integer minor units', () => {
      expect(validateMinorUnitAmount(0).isValid).toBe(true);
      expect(validateMinorUnitAmount(100).isValid).toBe(true);
      expect(validateMinorUnitAmount(250000).isValid).toBe(true);
    });

    it('rejects floating-point and fractional money values', () => {
      const floatOutcome = validateMinorUnitAmount(24.99);
      expect(floatOutcome.isValid).toBe(false);
      expect(floatOutcome.error).toContain('integer');

      expect(validateMinorUnitAmount(10.5).isValid).toBe(false);
      expect(validateMinorUnitAmount(0.01).isValid).toBe(false);
    });

    it('rejects negative numbers, NaN, and non-numeric types', () => {
      expect(validateMinorUnitAmount(-100).isValid).toBe(false);
      expect(validateMinorUnitAmount(NaN).isValid).toBe(false);
      expect(validateMinorUnitAmount(Infinity).isValid).toBe(false);
      expect(validateMinorUnitAmount('2500').isValid).toBe(false);
      expect(validateMinorUnitAmount(null).isValid).toBe(false);
    });
  });

  // 4. Currency validation
  describe('4. Currency Validation', () => {
    it('accepts supported uppercase ISO 4217 currencies', () => {
      expect(validateCurrencyCode('USD').isValid).toBe(true);
      expect(validateCurrencyCode('EUR').isValid).toBe(true);
      expect(validateCurrencyCode('LKR').isValid).toBe(true);
      expect(validateCurrencyCode('JPY').isValid).toBe(true);
    });

    it('sanitizes lowercase or whitespace-padded currency codes', () => {
      const outcome = validateCurrencyCode(' usd ');
      expect(outcome.isValid).toBe(true);
      expect(outcome.sanitized).toBe('USD');
    });

    it('rejects unsupported or malformed currency codes', () => {
      expect(validateCurrencyCode('XYZ').isValid).toBe(false);
      expect(validateCurrencyCode('US').isValid).toBe(false);
      expect(validateCurrencyCode('USDD').isValid).toBe(false);
      expect(validateCurrencyCode(123).isValid).toBe(false);
    });
  });

  // 5. Passenger-count bounds
  describe('5. Passenger-Count Bounds', () => {
    it('accepts integer passenger counts within boundaries (1 to 9)', () => {
      expect(validatePassengerCount(MIN_PASSENGER_COUNT).isValid).toBe(true);
      expect(validatePassengerCount(5).isValid).toBe(true);
      expect(validatePassengerCount(MAX_PASSENGER_COUNT).isValid).toBe(true);
    });

    it('rejects counts outside boundaries, zero, and negative numbers', () => {
      expect(validatePassengerCount(0).isValid).toBe(false);
      expect(validatePassengerCount(-1).isValid).toBe(false);
      expect(validatePassengerCount(MAX_PASSENGER_COUNT + 1).isValid).toBe(false);
      expect(validatePassengerCount(100).isValid).toBe(false);
    });

    it('rejects fractional or non-integer passenger counts', () => {
      expect(validatePassengerCount(2.5).isValid).toBe(false);
      expect(validatePassengerCount('2').isValid).toBe(false);
      expect(validatePassengerCount(null).isValid).toBe(false);
    });
  });

  // 6. Missing departure reference
  describe('6. Missing Departure Reference Validation', () => {
    it('rejects FareQuote without departureId', () => {
      const invalidQuote = { ...validFareQuote, departureId: '' };
      const outcome = validateFareQuote(invalidQuote);
      expect(outcome.isValid).toBe(false);
      expect(outcome.error).toContain('Departure ID');
    });

    it('rejects BookingRequest without departureId', () => {
      const invalidRequest = {
        departureId: '  ',
        passengerCount: 1,
        fareQuoteId: 'quote-101',
        idempotencyKey: 'idemp-key-1234567890'
      };
      const outcome = validateBookingRequest(invalidRequest);
      expect(outcome.isValid).toBe(false);
      expect(outcome.error).toContain('Departure ID');
    });
  });

  // 7. Invalid operator source / verification state handling
  describe('7. Operator Source & Verification States', () => {
    it('accepts verified and simulated operator states', () => {
      expect(validateTransportOperator({ ...validOperator, verificationState: 'simulated' }).isValid).toBe(true);
      expect(validateTransportOperator({ ...validOperator, verificationState: 'unverified' }).isValid).toBe(true);
    });

    it('rejects invalid or arbitrary verification states', () => {
      const invalidOp = { ...validOperator, verificationState: 'arbitrary_trusted' };
      const outcome = validateTransportOperator(invalidOp);
      expect(outcome.isValid).toBe(false);
      expect(outcome.error).toContain('verificationState');
    });

    it('rejects invalid inventory sources in BookableDeparture', () => {
      const invalidDep = { ...validDeparture, inventorySource: 'fabricated_live' };
      const outcome = validateBookableDeparture(invalidDep);
      expect(outcome.isValid).toBe(false);
      expect(outcome.error).toContain('inventorySource');
    });
  });

  // 8. Invalid booking input (empty fields, malformed IDs)
  describe('8. Invalid Booking Input Validation', () => {
    it('validates idempotency key bounds and patterns directly', () => {
      expect(validateIdempotencyKey('valid-idemp-key-12345').isValid).toBe(true);
      expect(validateIdempotencyKey('').isValid).toBe(false);
      expect(validateIdempotencyKey('short').isValid).toBe(false);
      expect(validateIdempotencyKey('invalid space key 12345').isValid).toBe(false);
    });

    it('rejects empty idempotency keys or keys below minimum length', () => {
      const shortKeyRequest = {
        departureId: 'dep-101',
        passengerCount: 1,
        fareQuoteId: 'quote-101',
        idempotencyKey: 'short'
      };
      const outcome = validateBookingRequest(shortKeyRequest);
      expect(outcome.isValid).toBe(false);
      expect(outcome.error).toContain('Idempotency key');
    });

    it('rejects injection characters in identifiers', () => {
      const injectionRequest = {
        departureId: '<script>alert(1)</script>',
        passengerCount: 1,
        fareQuoteId: 'quote-101',
        idempotencyKey: 'valid-idempotency-key-12345'
      };
      const outcome = validateBookingRequest(injectionRequest);
      expect(outcome.isValid).toBe(false);
      expect(outcome.error).toContain('invalid characters');
    });
  });

  // 9. No client-controlled price authority
  describe('9. No Client-Controlled Price Authority', () => {
    it('strictly rejects BookingRequest containing client-supplied prices or amounts', () => {
      const maliciousRequestWithPrice = {
        departureId: 'dep-colombo-kandy-101',
        passengerCount: 1,
        fareQuoteId: 'quote-882190',
        idempotencyKey: 'key-1234567890123456',
        price: 0 // Attempting to set free fare from client
      };
      const outcome = validateBookingRequest(maliciousRequestWithPrice);
      expect(outcome.isValid).toBe(false);
      expect(outcome.error).toContain('Client cannot supply authoritative fare prices');

      const requestWithTotalPrice = {
        departureId: 'dep-colombo-kandy-101',
        passengerCount: 1,
        fareQuoteId: 'quote-882190',
        idempotencyKey: 'key-1234567890123456',
        totalPrice: 100
      };
      expect(validateBookingRequest(requestWithTotalPrice).isValid).toBe(false);

      const requestWithMinorUnits = {
        departureId: 'dep-colombo-kandy-101',
        passengerCount: 1,
        fareQuoteId: 'quote-882190',
        idempotencyKey: 'key-1234567890123456',
        amountMinorUnits: 50
      };
      expect(validateBookingRequest(requestWithMinorUnits).isValid).toBe(false);
    });
  });

  // 10. Unavailable service behavior
  describe('10. Unavailable Booking Service Adapter Behavior', () => {
    const service = new UnavailableBookingService();

    it('returns NOT_CONFIGURED when requestReservation is called', async () => {
      const validReq: BookingRequest = {
        departureId: 'dep-colombo-kandy-101',
        passengerCount: 1,
        fareQuoteId: 'quote-882190',
        idempotencyKey: 'valid-idemp-key-123456'
      };
      const result = await service.requestReservation(validReq);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('NOT_CONFIGURED');
        expect(result.error.message).toContain('not configured');
      }
    });

    it('returns NOT_CONFIGURED when getBooking is called', async () => {
      const result = await service.getBooking('any-id');
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('NOT_CONFIGURED');
      }
    });

    it('returns NOT_CONFIGURED when cancelReservation is called', async () => {
      const result = await service.cancelReservation('any-id');
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('NOT_CONFIGURED');
      }
    });
  });

  // 11. No fabricated booking confirmation
  describe('11. No Fabricated Booking Confirmation', () => {
    it('forbids direct client transition from draft to confirmed or ticket_issued', () => {
      expect(isValidBookingStateTransition('draft', 'confirmed')).toBe(false);
      expect(isValidBookingStateTransition('draft', 'ticket_issued')).toBe(false);
      expect(isValidBookingStateTransition('held', 'confirmed')).toBe(false);
    });

    it('Booking record requires server-confirmed amount and user reference', () => {
      const validBooking: Booking = {
        id: 'book-99120',
        userId: 'usr-auth-uuid-42',
        departureId: 'dep-colombo-kandy-101',
        fareQuoteId: 'quote-882190',
        passengerCount: 1,
        confirmedAmountMinorUnits: 2500,
        currency: 'USD',
        status: 'held',
        idempotencyKey: 'key-1234567890123456',
        createdAt: '2026-11-26T10:00:00Z',
        updatedAt: '2026-11-26T10:00:00Z'
      };
      expect(validBooking.status).toBe('held');
      expect(validBooking.confirmedAmountMinorUnits).toBe(2500);
    });
  });

  // 12. No fake ticket issuance
  describe('12. No Fake Ticket Issuance', () => {
    const service = new UnavailableBookingService();

    it('UnavailableBookingService strictly returns NOT_CONFIGURED when getTickets is requested', async () => {
      const result = await service.getTickets('book-99120');
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('NOT_CONFIGURED');
        expect(result.error.message).toContain('Digital ticket issuance is not configured');
      }
    });

    it('Ticket contract mandates authoritative issuingAuthority and secureVerificationReference', () => {
      const ticket: Ticket = {
        id: 'tkt-00192',
        bookingId: 'book-99120',
        departureId: 'dep-colombo-kandy-101',
        passenger: { fullName: 'Traveler One' },
        issuingAuthority: 'Sri Lanka Planetary Maglev Authority',
        issuedAt: '2026-11-26T10:05:00Z',
        status: 'valid',
        secureVerificationReference: 'SHA256:e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855'
      };
      expect(ticket.secureVerificationReference).toContain('SHA256:');
      expect(ticket.status).toBe('valid');
    });
  });

  // 13. Correct typed errors
  describe('13. Correct Typed Errors', () => {
    it('conforms to BookingError interface with recognized BookingErrorCode', async () => {
      const service = new UnavailableBookingService();
      const res = await service.requestReservation({
        departureId: 'dep-1',
        passengerCount: 1,
        fareQuoteId: 'q-1',
        idempotencyKey: '1234567890123456'
      });
      expect(res.success).toBe(false);
      if (!res.success) {
        const err = res.error;
        expect(typeof err.code).toBe('string');
        expect(typeof err.message).toBe('string');
        expect(['NOT_CONFIGURED', 'INVENTORY_UNAVAILABLE']).toContain(err.code);
      }
    });
  });

  // 14. Invalid state transitions
  describe('14. Invalid State Transitions Rejection', () => {
    it('disallows invalid backward transitions', () => {
      expect(isValidBookingStateTransition('confirmed', 'draft')).toBe(false);
      expect(isValidBookingStateTransition('ticket_issued', 'draft')).toBe(false);
      expect(isValidBookingStateTransition('held', 'draft')).toBe(false);
    });

    it('disallows transitions from terminal states', () => {
      expect(isValidBookingStateTransition('expired', 'held')).toBe(false);
      expect(isValidBookingStateTransition('expired', 'confirmed')).toBe(false);
      expect(isValidBookingStateTransition('cancelled', 'confirmed')).toBe(false);
      expect(isValidBookingStateTransition('failed', 'awaiting_payment')).toBe(false);
      expect(isValidBookingStateTransition('refunded', 'ticket_issued')).toBe(false);
    });
  });

  // 15. No fake user identity
  describe('15. No Fake User Identity in Reservation Requests', () => {
    it('rejects BookingRequest containing client-supplied userId or user_id', () => {
      const forgedRequest = {
        departureId: 'dep-colombo-kandy-101',
        passengerCount: 1,
        fareQuoteId: 'quote-882190',
        idempotencyKey: 'valid-idemp-key-123456',
        userId: 'forged-victim-uuid'
      };
      const outcome = validateBookingRequest(forgedRequest);
      expect(outcome.isValid).toBe(false);
      expect(outcome.error).toContain('Client cannot specify user_id');

      const forgedSnakeCase = {
        departureId: 'dep-colombo-kandy-101',
        passengerCount: 1,
        fareQuoteId: 'quote-882190',
        idempotencyKey: 'valid-idemp-key-123456',
        user_id: 'forged-victim-uuid'
      };
      expect(validateBookingRequest(forgedSnakeCase).isValid).toBe(false);
    });
  });

  // 16. No secrets or payment-card data stored or permitted in domain models
  describe('16. No Secrets or Payment-Card Data in Inputs', () => {
    it('rejects credit card PAN numbers in passenger name inputs', () => {
      const cardInPassenger = validatePassengerInput({
        fullName: '4111 2222 3333 4444'
      });
      expect(cardInPassenger.isValid).toBe(false);
      expect(cardInPassenger.error).toContain('prohibited financial or card data');
    });

    it('rejects CVV / CVC tokens in passenger inputs', () => {
      const cvvInPassenger = validatePassengerInput({
        fullName: 'John Doe CVV 999'
      });
      expect(cvvInPassenger.isValid).toBe(false);
      expect(cvvInPassenger.error).toContain('prohibited financial or card data');
    });

    it('detects quote expiration accurately', () => {
      const pastQuote: FareQuote = {
        ...validFareQuote,
        expiresAt: '2020-01-01T00:00:00Z'
      };
      expect(isFareQuoteExpired(pastQuote)).toBe(true);

      const futureQuote: FareQuote = {
        ...validFareQuote,
        expiresAt: '2099-01-01T00:00:00Z'
      };
      expect(isFareQuoteExpired(futureQuote)).toBe(false);
    });
  });
});

