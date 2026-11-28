/**
 * Waymark Mobile — Feature 05.3: Secure Reservation Engine & Booking Lifecycle
 * Task 05.3.1: Remote Booking Service Adapter & Factory Tests
 *
 * Verifies:
 * 1. Preflight validation catches malformed requests before network dispatch
 * 2. Unauthenticated clients safely receive UNAUTHORIZED errors
 * 3. Unconfigured Supabase environments safely receive NOT_CONFIGURED errors
 * 4. Successful edge function responses are correctly mapped to Booking domain models
 * 5. Server error codes are safely normalized without leaking stack traces
 * 6. getTickets strictly returns NOT_CONFIGURED (zero fake ticket minting)
 * 7. createBookingService & getBookingService factory safely defaults to UnavailableBookingService
 */

import { SupabaseClient } from '@supabase/supabase-js';
import {
  RemoteBookingService,
  createBookingService,
  getBookingService
} from '../services';
import { UnavailableBookingService } from '../services/UnavailableBookingService';
import { BookingRequest } from '../types/bookingTypes';
import { AuthoritativeBookingRecord } from '../../../../../supabase/functions/booking-reservations/types';

describe('Feature 05.3.1 — RemoteBookingService Adapter & Factory Tests', () => {
  const validRequest: BookingRequest = {
    departureId: 'dep-colombo-kandy-101',
    passengerCount: 2,
    fareQuoteId: 'quote-rail-2026-001',
    idempotencyKey: 'idemp-valid-key-123456'
  };

  const sampleAuthoritativeRecord: AuthoritativeBookingRecord = {
    id: 'res-idemp-valid-k7x8',
    userId: '00000000-0000-0000-0000-000000000001',
    departureId: 'dep-colombo-kandy-101',
    passengerCount: 2,
    fareQuoteId: 'quote-rail-2026-001',
    totalAmountMinorUnits: 250000,
    currency: 'LKR',
    status: 'held',
    idempotencyKey: 'idemp-valid-key-123456',
    holdExpiresAt: '2026-12-15T10:00:00Z',
    createdAt: '2026-11-28T08:00:00Z',
    updatedAt: '2026-11-28T08:00:00Z'
  };

  const createMockSupabaseClient = (options: {
    hasSession?: boolean;
    invokeResult?: { data: unknown; error: unknown };
  }): SupabaseClient => {
    return {
      auth: {
        getSession: jest.fn().mockResolvedValue({
          data: {
            session: options.hasSession !== false ? { user: { id: 'test-user-id' } } : null
          },
          error: options.hasSession === false ? new Error('No active session') : null
        })
      },
      functions: {
        invoke: jest.fn().mockResolvedValue(options.invokeResult ?? { data: { success: true, data: sampleAuthoritativeRecord }, error: null })
      }
    } as unknown as SupabaseClient;
  };

  // =========================================================================
  // SECTION 1: REQUEST PREFLIGHT VALIDATION
  // =========================================================================
  describe('1. Request Preflight Validation', () => {
    it('TC-05.3.1-21: rejects reservation with invalid passenger bounds before network call', async () => {
      const mockClient = createMockSupabaseClient({});
      const service = new RemoteBookingService({ supabaseClient: mockClient });

      const result = await service.requestReservation({
        ...validRequest,
        passengerCount: 0 // Invalid!
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('INVALID_REQUEST');
      }
      expect(mockClient.functions.invoke).not.toHaveBeenCalled();
    });

    it('TC-05.3.1-22: rejects reservation with missing departureId before network call', async () => {
      const mockClient = createMockSupabaseClient({});
      const service = new RemoteBookingService({ supabaseClient: mockClient });

      const result = await service.requestReservation({
        ...validRequest,
        departureId: ''
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('INVALID_REQUEST');
      }
      expect(mockClient.functions.invoke).not.toHaveBeenCalled();
    });

    it('TC-05.3.1-23: rejects reservation with invalid idempotency key before network call', async () => {
      const mockClient = createMockSupabaseClient({});
      const service = new RemoteBookingService({ supabaseClient: mockClient });

      const result = await service.requestReservation({
        ...validRequest,
        idempotencyKey: 'too-short'
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('INVALID_REQUEST');
      }
      expect(mockClient.functions.invoke).not.toHaveBeenCalled();
    });
  });

  // =========================================================================
  // SECTION 2: AUTHENTICATION & CONFIGURATION BOUNDARIES
  // =========================================================================
  describe('2. Authentication & Configuration Boundaries', () => {
    it('TC-05.3.1-24: returns UNAUTHORIZED when no active auth session exists', async () => {
      const mockClient = createMockSupabaseClient({ hasSession: false });
      const service = new RemoteBookingService({ supabaseClient: mockClient });

      const result = await service.requestReservation(validRequest);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('UNAUTHORIZED');
        expect(result.error.message).toMatch(/Active authentication session is required/i);
      }
    });

    it('TC-05.3.1-25: returns NOT_CONFIGURED when Supabase client is unconfigured/null', async () => {
      const service = new RemoteBookingService({ supabaseClient: null });

      const result = await service.requestReservation(validRequest);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('NOT_CONFIGURED');
        expect(result.error.message).toMatch(/Supabase client is not configured/i);
      }
    });
  });

  // =========================================================================
  // SECTION 3: INVOCATION & RESPONSE MAPPING
  // =========================================================================
  describe('3. Invocation & Response Mapping', () => {
    it('TC-05.3.1-26: invokes edge function and maps authoritative record to Booking domain model', async () => {
      const mockClient = createMockSupabaseClient({
        invokeResult: {
          data: { success: true, data: sampleAuthoritativeRecord },
          error: null
        }
      });
      const service = new RemoteBookingService({ supabaseClient: mockClient });

      const result = await service.requestReservation(validRequest);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.id).toBe(sampleAuthoritativeRecord.id);
        expect(result.data.userId).toBe(sampleAuthoritativeRecord.userId);
        expect(result.data.status).toBe('held');
        expect(result.data.confirmedAmountMinorUnits).toBe(250000);
        expect(result.data.currency).toBe('LKR');
        expect(result.data.expiresAt).toBe(sampleAuthoritativeRecord.holdExpiresAt);
      }
      expect(mockClient.functions.invoke).toHaveBeenCalledWith('booking-reservations', {
        body: {
          action: 'reserve',
          payload: validRequest
        }
      });
    });

    it('TC-05.3.1-27: maps backend error response safely into typed BookingError', async () => {
      const mockClient = createMockSupabaseClient({
        invokeResult: {
          data: {
            success: false,
            error: {
              code: 'INVENTORY_UNAVAILABLE',
              message: 'Departure capacity has been exhausted.'
            }
          },
          error: null
        }
      });
      const service = new RemoteBookingService({ supabaseClient: mockClient });

      const result = await service.requestReservation(validRequest);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('INVENTORY_UNAVAILABLE');
        expect(result.error.message).toBe('Departure capacity has been exhausted.');
      }
    });

    it('TC-05.3.1-28: handles network / edge function invocation errors gracefully', async () => {
      const mockClient = createMockSupabaseClient({
        invokeResult: {
          data: null,
          error: new Error('Network request failed')
        }
      });
      const service = new RemoteBookingService({ supabaseClient: mockClient });

      const result = await service.requestReservation(validRequest);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('SERVICE_UNAVAILABLE');
      }
    });
  });

  // =========================================================================
  // SECTION 4: BOOKING LOOKUP & CANCELLATION
  // =========================================================================
  describe('4. Booking Lookup & Cancellation', () => {
    it('TC-05.3.1-29: getBooking validates bookingId and invokes edge function', async () => {
      const mockClient = createMockSupabaseClient({});
      const service = new RemoteBookingService({ supabaseClient: mockClient });

      const result = await service.getBooking('res-idemp-valid-k7x8');
      expect(result.success).toBe(true);
      expect(mockClient.functions.invoke).toHaveBeenCalledWith('booking-reservations', {
        body: {
          action: 'get_booking',
          payload: { bookingId: 'res-idemp-valid-k7x8' }
        }
      });
    });

    it('TC-05.3.1-30: getBooking rejects empty booking identifier before network dispatch', async () => {
      const mockClient = createMockSupabaseClient({});
      const service = new RemoteBookingService({ supabaseClient: mockClient });

      const result = await service.getBooking('');
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('INVALID_REQUEST');
      }
      expect(mockClient.functions.invoke).not.toHaveBeenCalled();
    });

    it('TC-05.3.1-31: cancelReservation invokes cancellation action on edge function', async () => {
      const cancelledRecord = { ...sampleAuthoritativeRecord, status: 'cancelled' };
      const mockClient = createMockSupabaseClient({
        invokeResult: { data: { success: true, data: cancelledRecord }, error: null }
      });
      const service = new RemoteBookingService({ supabaseClient: mockClient });

      const result = await service.cancelReservation('res-idemp-valid-k7x8', 'User requested');
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.status).toBe('cancelled');
      }
      expect(mockClient.functions.invoke).toHaveBeenCalledWith('booking-reservations', {
        body: {
          action: 'cancel',
          payload: { bookingId: 'res-idemp-valid-k7x8', reason: 'User requested' }
        }
      });
    });
  });

  // =========================================================================
  // SECTION 5: TICKET ISSUANCE & FACTORY GUARDS
  // =========================================================================
  describe('5. Ticket Issuance & Factory Guards', () => {
    it('TC-05.3.1-32: getTickets strictly returns NOT_CONFIGURED (zero fake ticket minting)', async () => {
      const mockClient = createMockSupabaseClient({});
      const service = new RemoteBookingService({ supabaseClient: mockClient });

      const result = await service.getTickets('res-idemp-valid-k7x8');
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('NOT_CONFIGURED');
        expect(result.error.message).toMatch(/Digital ticket issuance is not configured/i);
      }
    });

    it('TC-05.3.1-33: createBookingService defaults safely to UnavailableBookingService', () => {
      // Default call without arguments
      const service1 = createBookingService();
      expect(service1).toBeInstanceOf(UnavailableBookingService);

      // Explicit useRemote: false
      const service2 = createBookingService({ useRemote: false });
      expect(service2).toBeInstanceOf(UnavailableBookingService);

      // useRemote: true but supabaseClient is null
      const service3 = createBookingService({ useRemote: true, supabaseClient: null });
      expect(service3).toBeInstanceOf(UnavailableBookingService);
    });

    it('TC-05.3.1-34: createBookingService instantiates RemoteBookingService when configured', () => {
      const mockClient = createMockSupabaseClient({});
      const service = createBookingService({ useRemote: true, supabaseClient: mockClient });
      expect(service).toBeInstanceOf(RemoteBookingService);
    });

    it('TC-05.3.1-35: getBookingService provides safe default singleton', () => {
      const service = getBookingService();
      expect(service).toBeInstanceOf(UnavailableBookingService);
    });
  });
});
