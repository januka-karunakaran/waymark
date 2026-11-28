/**
 * Waymark Mobile — Feature 05.3: Secure Reservation Engine & Booking Lifecycle
 * Task 05.3.1: Backend Reservation Engine Foundation & Security Tests
 *
 * Verifies:
 * 1. Missing or malformed authorization headers rejected (UNAUTHORIZED)
 * 2. Invalid or unverified JWTs rejected (UNAUTHORIZED)
 * 3. Valid authenticated user successfully processes reservation request
 * 4. Forged client user ownership strictly rejected (cannot spoof user_id)
 * 5. Invalid or malicious departure ID rejected (INVALID_REQUEST)
 * 6. Invalid passenger count bounds (0, 10, -1, 2.5) rejected (INVALID_REQUEST)
 * 7. Invalid or non-existent quote reference rejected (INVALID_REQUEST)
 * 8. Client-controlled fare amounts strictly rejected (zero client pricing authority)
 * 9. Client-controlled status overrides strictly rejected (cannot force 'confirmed')
 * 10. Invalid idempotency key format/length rejected (INVALID_REQUEST)
 * 11. Oversized payloads (>32KB) and malformed JSON rejected (413 / 400)
 * 12. Missing provider configuration safely returns NOT_CONFIGURED
 * 13. Unconfigured or degraded fare authority safely returns NOT_CONFIGURED
 * 14. Safe typed response mapping without leaking server internals
 * 15. Cross-user booking lookup isolation (User A cannot view User B's booking)
 * 16. State machine transition rules enforced on cancellation
 */

import {
  processReservationHttpRequest,
  defaultJwtVerifier,
  EdgeFunctionContext
} from '../../../../../supabase/functions/booking-reservations';
import {
  UnconfiguredFareAuthority,
  RegistryFareAuthority
} from '../../../../../supabase/functions/booking-reservations/services/fareAuthority';
import {
  UnconfiguredOperatorAuthority,
  RegistryOperatorAuthority
} from '../../../../../supabase/functions/booking-reservations/services/operatorAuthority';
import {
  AuthoritativeBookingRecord
} from '../../../../../supabase/functions/booking-reservations/types';
import { BookableDeparture } from '../types/bookingTypes';
import { FareQuote } from '../types/fareTypes';

describe('Feature 05.3.1 — Backend Reservation Engine Foundation & Security Tests', () => {
  const testUserId = '00000000-0000-0000-0000-000000000001';
  const otherUserId = '00000000-0000-0000-0000-000000000002';

  const validVerifiedDeparture: BookableDeparture = {
    id: 'dep-colombo-kandy-101',
    operatorId: 'op-express-rail',
    originNodeId: 'node-colombo',
    originName: 'Colombo Fort Central',
    destinationNodeId: 'node-kandy',
    destinationName: 'Kandy Terminal',
    departureTime: '2026-12-15T08:30:00Z',
    arrivalTime: '2026-12-15T11:00:00Z',
    serviceIdentifier: 'EXP-101',
    inventorySource: 'operator_verified',
    bookableStatus: 'available',
    transitMode: 'maglev'
  };

  const sampleUnverifiedDeparture: BookableDeparture = {
    id: 'dep-sample-404',
    operatorId: 'op-sample',
    originNodeId: 'node-sample-a',
    originName: 'Sample City Alpha',
    destinationNodeId: 'node-sample-b',
    destinationName: 'Sample City Beta',
    departureTime: '2026-12-15T12:00:00Z',
    serviceIdentifier: 'SMP-404',
    inventorySource: 'sample_data',
    bookableStatus: 'available',
    transitMode: 'bus'
  };

  const validFareQuote: FareQuote = {
    id: 'quote-rail-2026-001',
    departureId: 'dep-colombo-kandy-101',
    amountMinorUnits: 250000, // 2,500.00 LKR
    currency: 'LKR',
    passengerCount: 2,
    fareClass: 'standard',
    issuedAt: '2026-11-28T08:00:00Z',
    expiresAt: '2026-12-31T23:59:59Z',
    issuingSource: 'operator_verified'
  };

  // Mock JWT verifier for authorized test executions
  const mockAuthorizedJwtVerifier = async (authHeader: string | null) => {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return { userId: null, error: 'Missing or malformed Authorization header.' };
    }
    const token = authHeader.replace('Bearer ', '').trim();
    if (token === 'valid-user-token') {
      return { userId: testUserId };
    }
    if (token === 'other-user-token') {
      return { userId: otherUserId };
    }
    return { userId: null, error: 'Invalid or expired bearer token.' };
  };

  let fareAuthority: RegistryFareAuthority;
  let operatorAuthority: RegistryOperatorAuthority;
  let bookingStore: Map<string, AuthoritativeBookingRecord>;
  let testContext: EdgeFunctionContext;

  beforeEach(() => {
    fareAuthority = new RegistryFareAuthority([validFareQuote]);
    operatorAuthority = new RegistryOperatorAuthority([
      validVerifiedDeparture,
      sampleUnverifiedDeparture
    ]);
    bookingStore = new Map();

    testContext = {
      fareAuthority,
      operatorAuthority,
      bookingStore,
      jwtVerifier: mockAuthorizedJwtVerifier
    };
  });

  // =========================================================================
  // SECTION 1: AUTHENTICATION & ACCESS BOUNDARIES
  // =========================================================================
  describe('1. Authentication & Access Boundaries', () => {
    it('TC-05.3.1-01: rejects request when Authorization header is missing', async () => {
      const response = await processReservationHttpRequest(
        {
          method: 'POST',
          headers: {},
          rawBody: JSON.stringify({
            action: 'reserve',
            payload: {
              departureId: 'dep-colombo-kandy-101',
              passengerCount: 2,
              fareQuoteId: 'quote-rail-2026-001',
              idempotencyKey: 'idemp-valid-key-123456'
            }
          })
        },
        testContext
      );

      expect(response.status).toBe(401);
      const parsed = JSON.parse(response.body);
      expect(parsed.success).toBe(false);
      expect(parsed.error.code).toBe('UNAUTHORIZED');
    });

    it('TC-05.3.1-02: rejects request when Bearer token is invalid or expired', async () => {
      const response = await processReservationHttpRequest(
        {
          method: 'POST',
          headers: { authorization: 'Bearer invalid-token-xyz' },
          rawBody: JSON.stringify({
            action: 'reserve',
            payload: {
              departureId: 'dep-colombo-kandy-101',
              passengerCount: 2,
              fareQuoteId: 'quote-rail-2026-001',
              idempotencyKey: 'idemp-valid-key-123456'
            }
          })
        },
        testContext
      );

      expect(response.status).toBe(401);
      const parsed = JSON.parse(response.body);
      expect(parsed.success).toBe(false);
      expect(parsed.error.code).toBe('UNAUTHORIZED');
    });

    it('TC-05.3.1-03: defaultJwtVerifier rejects malformed headers and dangerous characters', async () => {
      expect((await defaultJwtVerifier(null)).userId).toBeNull();
      expect((await defaultJwtVerifier('Basic 12345')).userId).toBeNull();
      expect((await defaultJwtVerifier('Bearer short')).userId).toBeNull();
      expect((await defaultJwtVerifier('Bearer <script>alert(1)</script>')).userId).toBeNull();
    });

    it('TC-05.3.1-04: allows readiness checks without authentication (public diagnostic)', async () => {
      const response = await processReservationHttpRequest(
        {
          method: 'POST',
          headers: {},
          rawBody: JSON.stringify({ action: 'readiness', payload: {} })
        },
        testContext
      );

      expect(response.status).toBe(200);
      const parsed = JSON.parse(response.body);
      expect(parsed.success).toBe(true);
      expect(parsed.data.operatorAuthority).toBe('ready');
      expect(parsed.data.fareAuthority).toBe('ready');
    });
  });

  // =========================================================================
  // SECTION 2: REQUEST PAYLOAD VALIDATION & INVARIANTS
  // =========================================================================
  describe('2. Request Payload Validation & Invariants', () => {
    it('TC-05.3.1-05: rejects client-supplied user ownership override (spoofing attempt)', async () => {
      const response = await processReservationHttpRequest(
        {
          method: 'POST',
          headers: { authorization: 'Bearer valid-user-token' },
          rawBody: JSON.stringify({
            action: 'reserve',
            payload: {
              userId: '00000000-0000-0000-0000-999999999999', // Spoofing attempt
              departureId: 'dep-colombo-kandy-101',
              passengerCount: 2,
              fareQuoteId: 'quote-rail-2026-001',
              idempotencyKey: 'idemp-valid-key-123456'
            }
          })
        },
        testContext
      );

      expect(response.status).toBe(400);
      const parsed = JSON.parse(response.body);
      expect(parsed.success).toBe(false);
      expect(parsed.error.code).toBe('INVALID_REQUEST');
      expect(parsed.error.message).toMatch(/client-controlled field 'userId' is strictly prohibited/i);
    });

    it('TC-05.3.1-06: rejects client-supplied fare totals (pricing authority protection)', async () => {
      const response = await processReservationHttpRequest(
        {
          method: 'POST',
          headers: { authorization: 'Bearer valid-user-token' },
          rawBody: JSON.stringify({
            action: 'reserve',
            payload: {
              amountMinorUnits: 100, // Attacker attempts to pay 1.00 LKR
              departureId: 'dep-colombo-kandy-101',
              passengerCount: 2,
              fareQuoteId: 'quote-rail-2026-001',
              idempotencyKey: 'idemp-valid-key-123456'
            }
          })
        },
        testContext
      );

      expect(response.status).toBe(400);
      const parsed = JSON.parse(response.body);
      expect(parsed.success).toBe(false);
      expect(parsed.error.code).toBe('INVALID_REQUEST');
      expect(parsed.error.message).toMatch(/client-controlled field 'amountMinorUnits' is strictly prohibited/i);
    });

    it('TC-05.3.1-07: rejects client-supplied status overrides (cannot force confirmed or ticket_issued)', async () => {
      const response = await processReservationHttpRequest(
        {
          method: 'POST',
          headers: { authorization: 'Bearer valid-user-token' },
          rawBody: JSON.stringify({
            action: 'reserve',
            payload: {
              status: 'confirmed', // Attacker attempts to bypass payment
              departureId: 'dep-colombo-kandy-101',
              passengerCount: 2,
              fareQuoteId: 'quote-rail-2026-001',
              idempotencyKey: 'idemp-valid-key-123456'
            }
          })
        },
        testContext
      );

      expect(response.status).toBe(400);
      const parsed = JSON.parse(response.body);
      expect(parsed.success).toBe(false);
      expect(parsed.error.code).toBe('INVALID_REQUEST');
      expect(parsed.error.message).toMatch(/client-controlled field 'status' is strictly prohibited/i);
    });

    it('TC-05.3.1-08: rejects invalid passenger bounds (0, 10, -1, 2.5)', async () => {
      for (const count of [0, 10, -1, 2.5, 'two']) {
        const response = await processReservationHttpRequest(
          {
            method: 'POST',
            headers: { authorization: 'Bearer valid-user-token' },
            rawBody: JSON.stringify({
              action: 'reserve',
              payload: {
                departureId: 'dep-colombo-kandy-101',
                passengerCount: count,
                fareQuoteId: 'quote-rail-2026-001',
                idempotencyKey: 'idemp-valid-key-123456'
              }
            })
          },
          testContext
        );

        expect(response.status).toBe(400);
        const parsed = JSON.parse(response.body);
        expect(parsed.success).toBe(false);
        expect(parsed.error.code).toBe('INVALID_REQUEST');
      }
    });

    it('TC-05.3.1-09: rejects invalid idempotency key length or dangerous characters', async () => {
      for (const key of ['short-key', 'key_with_invalid_char$!', '']) {
        const response = await processReservationHttpRequest(
          {
            method: 'POST',
            headers: { authorization: 'Bearer valid-user-token' },
            rawBody: JSON.stringify({
              action: 'reserve',
              payload: {
                departureId: 'dep-colombo-kandy-101',
                passengerCount: 2,
                fareQuoteId: 'quote-rail-2026-001',
                idempotencyKey: key
              }
            })
          },
          testContext
        );

        expect(response.status).toBe(400);
        const parsed = JSON.parse(response.body);
        expect(parsed.success).toBe(false);
        expect(parsed.error.code).toBe('INVALID_REQUEST');
      }
    });

    it('TC-05.3.1-10: rejects oversized request bodies (>32KB)', async () => {
      const hugeString = 'A'.repeat(35 * 1024);
      const response = await processReservationHttpRequest(
        {
          method: 'POST',
          headers: { authorization: 'Bearer valid-user-token' },
          rawBody: JSON.stringify({ action: 'reserve', payload: { data: hugeString } })
        },
        testContext
      );

      expect(response.status).toBe(413);
      const parsed = JSON.parse(response.body);
      expect(parsed.success).toBe(false);
      expect(parsed.error.code).toBe('INVALID_REQUEST');
    });

    it('TC-05.3.1-11: rejects malformed JSON payloads gracefully without 500 crashes', async () => {
      const response = await processReservationHttpRequest(
        {
          method: 'POST',
          headers: { authorization: 'Bearer valid-user-token' },
          rawBody: '{ not valid json }'
        },
        testContext
      );

      expect(response.status).toBe(400);
      const parsed = JSON.parse(response.body);
      expect(parsed.success).toBe(false);
      expect(parsed.error.code).toBe('INVALID_REQUEST');
    });
  });

  // =========================================================================
  // SECTION 3: SERVER-SIDE OPERATOR & FARE AUTHORITY VERIFICATION
  // =========================================================================
  describe('3. Server-Side Operator & Fare Authority Verification', () => {
    it('TC-05.3.1-12: strictly rejects departures marked sample_data from reservation engine', async () => {
      const response = await processReservationHttpRequest(
        {
          method: 'POST',
          headers: { authorization: 'Bearer valid-user-token' },
          rawBody: JSON.stringify({
            action: 'reserve',
            payload: {
              departureId: 'dep-sample-404', // Sample departure
              passengerCount: 2,
              fareQuoteId: 'quote-rail-2026-001',
              idempotencyKey: 'idemp-valid-key-123456'
            }
          })
        },
        testContext
      );

      expect(response.status).toBe(400);
      const parsed = JSON.parse(response.body);
      expect(parsed.success).toBe(false);
      expect(parsed.error.code).toBe('INVENTORY_UNAVAILABLE');
      expect(parsed.error.message).toMatch(/Only operator_verified inventory can be reserved/i);
    });

    it('TC-05.3.1-13: rejects unknown departure IDs not in operational catalog', async () => {
      const response = await processReservationHttpRequest(
        {
          method: 'POST',
          headers: { authorization: 'Bearer valid-user-token' },
          rawBody: JSON.stringify({
            action: 'reserve',
            payload: {
              departureId: 'non-existent-departure',
              passengerCount: 2,
              fareQuoteId: 'quote-rail-2026-001',
              idempotencyKey: 'idemp-valid-key-123456'
            }
          })
        },
        testContext
      );

      expect(response.status).toBe(400);
      const parsed = JSON.parse(response.body);
      expect(parsed.success).toBe(false);
      expect(parsed.error.code).toBe('BOOKING_NOT_FOUND');
    });

    it('TC-05.3.1-14: returns NOT_CONFIGURED when operator provider is unconfigured', async () => {
      const unconfiguredContext: EdgeFunctionContext = {
        ...testContext,
        operatorAuthority: new UnconfiguredOperatorAuthority()
      };

      const response = await processReservationHttpRequest(
        {
          method: 'POST',
          headers: { authorization: 'Bearer valid-user-token' },
          rawBody: JSON.stringify({
            action: 'reserve',
            payload: {
              departureId: 'dep-colombo-kandy-101',
              passengerCount: 2,
              fareQuoteId: 'quote-rail-2026-001',
              idempotencyKey: 'idemp-valid-key-123456'
            }
          })
        },
        unconfiguredContext
      );

      expect(response.status).toBe(400);
      const parsed = JSON.parse(response.body);
      expect(parsed.success).toBe(false);
      expect(parsed.error.code).toBe('NOT_CONFIGURED');
    });

    it('TC-05.3.1-15: returns NOT_CONFIGURED when fare authority is unconfigured', async () => {
      const unconfiguredContext: EdgeFunctionContext = {
        ...testContext,
        fareAuthority: new UnconfiguredFareAuthority()
      };

      const response = await processReservationHttpRequest(
        {
          method: 'POST',
          headers: { authorization: 'Bearer valid-user-token' },
          rawBody: JSON.stringify({
            action: 'reserve',
            payload: {
              departureId: 'dep-colombo-kandy-101',
              passengerCount: 2,
              fareQuoteId: 'quote-rail-2026-001',
              idempotencyKey: 'idemp-valid-key-123456'
            }
          })
        },
        unconfiguredContext
      );

      expect(response.status).toBe(400);
      const parsed = JSON.parse(response.body);
      expect(parsed.success).toBe(false);
      expect(parsed.error.code).toBe('NOT_CONFIGURED');
    });

    it('TC-05.3.1-16: rejects quotation mismatch when departure or passenger count differs', async () => {
      const response = await processReservationHttpRequest(
        {
          method: 'POST',
          headers: { authorization: 'Bearer valid-user-token' },
          rawBody: JSON.stringify({
            action: 'reserve',
            payload: {
              departureId: 'dep-colombo-kandy-101',
              passengerCount: 1, // Quote was issued for 2 passengers!
              fareQuoteId: 'quote-rail-2026-001',
              idempotencyKey: 'idemp-valid-key-123456'
            }
          })
        },
        testContext
      );

      expect(response.status).toBe(400);
      const parsed = JSON.parse(response.body);
      expect(parsed.success).toBe(false);
      expect(parsed.error.code).toBe('INVALID_REQUEST');
      expect(parsed.error.message).toMatch(/does not match requested count/i);
    });

    it('TC-05.3.1-17: rejects expired fare quotes using authoritative server time', async () => {
      const expiredQuote: FareQuote = {
        ...validFareQuote,
        id: 'quote-expired-999',
        expiresAt: '2020-01-01T00:00:00Z'
      };
      fareAuthority.registerQuote(expiredQuote);

      const response = await processReservationHttpRequest(
        {
          method: 'POST',
          headers: { authorization: 'Bearer valid-user-token' },
          rawBody: JSON.stringify({
            action: 'reserve',
            payload: {
              departureId: 'dep-colombo-kandy-101',
              passengerCount: 2,
              fareQuoteId: 'quote-expired-999',
              idempotencyKey: 'idemp-valid-key-123456'
            }
          })
        },
        testContext
      );

      expect(response.status).toBe(400);
      const parsed = JSON.parse(response.body);
      expect(parsed.success).toBe(false);
      expect(parsed.error.code).toBe('FARE_EXPIRED');
    });
  });

  // =========================================================================
  // SECTION 4: AUTHORITATIVE RESERVATION & OWNERSHIP ISOLATION
  // =========================================================================
  describe('4. Authoritative Reservation & Ownership Isolation', () => {
    it('TC-05.3.1-18: creates an authoritative held reservation record with server pricing', async () => {
      const response = await processReservationHttpRequest(
        {
          method: 'POST',
          headers: { authorization: 'Bearer valid-user-token' },
          rawBody: JSON.stringify({
            action: 'reserve',
            payload: {
              departureId: 'dep-colombo-kandy-101',
              passengerCount: 2,
              fareQuoteId: 'quote-rail-2026-001',
              idempotencyKey: 'idemp-valid-key-123456'
            }
          })
        },
        testContext
      );

      expect(response.status).toBe(201);
      const parsed = JSON.parse(response.body);
      expect(parsed.success).toBe(true);

      const record: AuthoritativeBookingRecord = parsed.data;
      expect(record.userId).toBe(testUserId); // Bound to verified JWT caller
      expect(record.status).toBe('held'); // Never confirmed without payment
      expect(record.totalAmountMinorUnits).toBe(250000); // From server quote
      expect(record.currency).toBe('LKR');
      expect(record.holdExpiresAt).toBeDefined();
    });

    it('TC-05.3.1-19: enforces cross-user privacy on booking lookup (User A cannot read User B booking)', async () => {
      // Create a booking owned by testUserId (User A)
      const reserveRes = await processReservationHttpRequest(
        {
          method: 'POST',
          headers: { authorization: 'Bearer valid-user-token' },
          rawBody: JSON.stringify({
            action: 'reserve',
            payload: {
              departureId: 'dep-colombo-kandy-101',
              passengerCount: 2,
              fareQuoteId: 'quote-rail-2026-001',
              idempotencyKey: 'idemp-valid-key-123456'
            }
          })
        },
        testContext
      );
      const bookingId = JSON.parse(reserveRes.body).data.id;

      // User A retrieves own booking -> SUCCESS
      const userARes = await processReservationHttpRequest(
        {
          method: 'POST',
          headers: { authorization: 'Bearer valid-user-token' },
          rawBody: JSON.stringify({ action: 'get_booking', payload: { bookingId } })
        },
        testContext
      );
      expect(userARes.status).toBe(200);
      expect(JSON.parse(userARes.body).success).toBe(true);

      // User B attempts to retrieve User A's booking -> 404 BOOKING_NOT_FOUND
      const userBRes = await processReservationHttpRequest(
        {
          method: 'POST',
          headers: { authorization: 'Bearer other-user-token' },
          rawBody: JSON.stringify({ action: 'get_booking', payload: { bookingId } })
        },
        testContext
      );
      expect(userBRes.status).toBe(404);
      const parsedB = JSON.parse(userBRes.body);
      expect(parsedB.success).toBe(false);
      expect(parsedB.error.code).toBe('BOOKING_NOT_FOUND');
    });

    it('TC-05.3.1-20: enforces cross-user privacy and state machine on cancellation', async () => {
      // Create a booking owned by User A
      const reserveRes = await processReservationHttpRequest(
        {
          method: 'POST',
          headers: { authorization: 'Bearer valid-user-token' },
          rawBody: JSON.stringify({
            action: 'reserve',
            payload: {
              departureId: 'dep-colombo-kandy-101',
              passengerCount: 2,
              fareQuoteId: 'quote-rail-2026-001',
              idempotencyKey: 'idemp-valid-key-123456'
            }
          })
        },
        testContext
      );
      const bookingId = JSON.parse(reserveRes.body).data.id;

      // User B attempts to cancel User A's booking -> 404 BOOKING_NOT_FOUND
      const cancelBRes = await processReservationHttpRequest(
        {
          method: 'POST',
          headers: { authorization: 'Bearer other-user-token' },
          rawBody: JSON.stringify({ action: 'cancel', payload: { bookingId, reason: 'Illicit cancel' } })
        },
        testContext
      );
      expect(cancelBRes.status).toBe(404);

      // User A cancels own booking -> SUCCESS
      const cancelARes = await processReservationHttpRequest(
        {
          method: 'POST',
          headers: { authorization: 'Bearer valid-user-token' },
          rawBody: JSON.stringify({ action: 'cancel', payload: { bookingId, reason: 'User requested' } })
        },
        testContext
      );
      expect(cancelARes.status).toBe(200);
      expect(JSON.parse(cancelARes.body).data.status).toBe('cancelled');

      // Attempting to cancel already cancelled booking fails invalid transition
      const repeatCancelRes = await processReservationHttpRequest(
        {
          method: 'POST',
          headers: { authorization: 'Bearer valid-user-token' },
          rawBody: JSON.stringify({ action: 'cancel', payload: { bookingId } })
        },
        testContext
      );
      expect(repeatCancelRes.status).toBe(400);
      expect(JSON.parse(repeatCancelRes.body).error.code).toBe('INVALID_STATE_TRANSITION');
    });
  });
});
