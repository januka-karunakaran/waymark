/**
 * Waymark Mobile — Feature 05.3: Secure Reservation Engine & Booking Lifecycle
 * Task 05.3.1: Remote Booking Service Client Adapter
 *
 * Requirements:
 * - Implements the canonical BookingService contract.
 * - Communicates with the trusted backend reservation boundary (Supabase Edge Function).
 * - Enforces client-side preflight validation before issuing network requests.
 * - Maps backend responses safely to BookingResult<Booking> without leaking internal errors.
 * - Strictly returns explicit NOT_CONFIGURED for ticket issuance until Feature 05.4 is completed.
 * - Zero direct writes to public.booking_reservations from the mobile client.
 */

import { SupabaseClient } from '@supabase/supabase-js';
import { getSupabaseClient } from '../../auth/providers/supabaseClient';
import { Booking, BookingRequest } from '../types/bookingTypes';
import { Ticket } from '../types/ticketTypes';
import {
  BookingService,
  BookingResult,
  BookingError,
  BookingErrorCode
} from './BookingService';
import { validateBookingRequest } from '../validation/bookingValidation';
import { AuthoritativeBookingRecord, BackendApiResponse } from '../../../../../supabase/functions/booking-reservations/types';

export interface RemoteBookingServiceConfig {
  supabaseClient?: SupabaseClient | null;
  functionName?: string;
  customInvoker?: (action: string, payload: unknown) => Promise<BookingResult<unknown>>;
}

export class RemoteBookingService implements BookingService {
  private client: SupabaseClient | null;
  private functionName: string;
  private customInvoker?: (action: string, payload: unknown) => Promise<BookingResult<unknown>>;

  constructor(config: RemoteBookingServiceConfig = {}) {
    this.client = config.supabaseClient ?? null;
    this.functionName = config.functionName || 'booking-reservations';
    this.customInvoker = config.customInvoker;
  }

  private getEffectiveClient(): SupabaseClient | null {
    if (this.client) {
      return this.client;
    }
    return getSupabaseClient();
  }

  /**
   * Translates an authoritative backend booking record into client domain model.
   */
  private mapRecordToBooking(record: AuthoritativeBookingRecord): Booking {
    return {
      id: record.id,
      userId: record.userId,
      departureId: record.departureId,
      passengerCount: record.passengerCount,
      fareQuoteId: record.fareQuoteId,
      confirmedAmountMinorUnits: record.totalAmountMinorUnits,
      currency: record.currency,
      status: record.status,
      idempotencyKey: record.idempotencyKey,
      expiresAt: record.holdExpiresAt || undefined,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt
    };
  }

  private mapError(code: string, message: string, details?: Record<string, unknown>): BookingError {
    const validCodes: BookingErrorCode[] = [
      'NOT_CONFIGURED',
      'INVENTORY_UNAVAILABLE',
      'FARE_EXPIRED',
      'INVALID_REQUEST',
      'UNAUTHORIZED',
      'BOOKING_NOT_FOUND',
      'INVALID_STATE_TRANSITION',
      'IDEMPOTENCY_CONFLICT',
      'SERVICE_UNAVAILABLE'
    ];

    const safeCode: BookingErrorCode = validCodes.includes(code as BookingErrorCode)
      ? (code as BookingErrorCode)
      : 'SERVICE_UNAVAILABLE';

    return {
      code: safeCode,
      message,
      details
    };
  }

  async requestReservation(request: BookingRequest): Promise<BookingResult<Booking>> {
    // 1. Client-side preflight validation
    const preflight = validateBookingRequest(request);
    if (!preflight.isValid) {
      return {
        success: false,
        error: {
          code: 'INVALID_REQUEST',
          message: preflight.error || 'Invalid booking request parameters.'
        }
      };
    }

    // 2. Custom invoker override (useful for isolated unit/integration tests)
    if (this.customInvoker) {
      const customRes = await this.customInvoker('reserve', request);
      if (!customRes.success) {
        return { success: false, error: customRes.error };
      }
      return { success: true, data: this.mapRecordToBooking(customRes.data as AuthoritativeBookingRecord) };
    }

    // 3. Supabase client resolution
    const client = this.getEffectiveClient();
    if (!client) {
      return {
        success: false,
        error: {
          code: 'NOT_CONFIGURED',
          message: 'Supabase client is not configured. Cannot contact reservation engine.'
        }
      };
    }

    // 4. Session authentication preflight
    const { data: sessionData, error: sessionError } = await client.auth.getSession();
    if (sessionError || !sessionData.session) {
      return {
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Active authentication session is required to create a reservation.'
        }
      };
    }

    // 5. Invoke Edge Function
    try {
      const { data, error } = await client.functions.invoke(this.functionName, {
        body: {
          action: 'reserve',
          payload: request
        }
      });

      if (error) {
        return {
          success: false,
          error: this.mapError('SERVICE_UNAVAILABLE', error.message || 'Edge function call failed')
        };
      }

      const response = data as BackendApiResponse<AuthoritativeBookingRecord>;
      if (!response || !response.success) {
        return {
          success: false,
          error: this.mapError(
            response?.error?.code || 'SERVICE_UNAVAILABLE',
            response?.error?.message || 'Reservation request failed.'
          )
        };
      }

      return {
        success: true,
        data: this.mapRecordToBooking(response.data)
      };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unknown reservation communication error.';
      return {
        success: false,
        error: this.mapError('SERVICE_UNAVAILABLE', msg)
      };
    }
  }

  async getBooking(bookingId: string): Promise<BookingResult<Booking>> {
    if (!bookingId || !bookingId.trim()) {
      return {
        success: false,
        error: {
          code: 'INVALID_REQUEST',
          message: 'Booking identifier is required.'
        }
      };
    }

    if (this.customInvoker) {
      const customRes = await this.customInvoker('get_booking', { bookingId: bookingId.trim() });
      if (!customRes.success) {
        return { success: false, error: customRes.error };
      }
      return { success: true, data: this.mapRecordToBooking(customRes.data as AuthoritativeBookingRecord) };
    }

    const client = this.getEffectiveClient();
    if (!client) {
      return {
        success: false,
        error: {
          code: 'NOT_CONFIGURED',
          message: 'Supabase client is not configured. Cannot contact reservation engine.'
        }
      };
    }

    const { data: sessionData, error: sessionError } = await client.auth.getSession();
    if (sessionError || !sessionData.session) {
      return {
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Active authentication session is required to view reservations.'
        }
      };
    }

    try {
      const { data, error } = await client.functions.invoke(this.functionName, {
        body: {
          action: 'get_booking',
          payload: { bookingId: bookingId.trim() }
        }
      });

      if (error) {
        return {
          success: false,
          error: this.mapError('SERVICE_UNAVAILABLE', error.message || 'Booking lookup failed')
        };
      }

      const response = data as BackendApiResponse<AuthoritativeBookingRecord>;
      if (!response || !response.success) {
        return {
          success: false,
          error: this.mapError(
            response?.error?.code || 'BOOKING_NOT_FOUND',
            response?.error?.message || 'Booking not found.'
          )
        };
      }

      return {
        success: true,
        data: this.mapRecordToBooking(response.data)
      };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unknown booking lookup communication error.';
      return {
        success: false,
        error: this.mapError('SERVICE_UNAVAILABLE', msg)
      };
    }
  }

  async cancelReservation(bookingId: string, reason?: string): Promise<BookingResult<Booking>> {
    if (!bookingId || !bookingId.trim()) {
      return {
        success: false,
        error: {
          code: 'INVALID_REQUEST',
          message: 'Booking identifier is required.'
        }
      };
    }

    if (this.customInvoker) {
      const customRes = await this.customInvoker('cancel', { bookingId: bookingId.trim(), reason });
      if (!customRes.success) {
        return { success: false, error: customRes.error };
      }
      return { success: true, data: this.mapRecordToBooking(customRes.data as AuthoritativeBookingRecord) };
    }

    const client = this.getEffectiveClient();
    if (!client) {
      return {
        success: false,
        error: {
          code: 'NOT_CONFIGURED',
          message: 'Supabase client is not configured. Cannot contact reservation engine.'
        }
      };
    }

    const { data: sessionData, error: sessionError } = await client.auth.getSession();
    if (sessionError || !sessionData.session) {
      return {
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Active authentication session is required to cancel reservations.'
        }
      };
    }

    try {
      const { data, error } = await client.functions.invoke(this.functionName, {
        body: {
          action: 'cancel',
          payload: { bookingId: bookingId.trim(), reason }
        }
      });

      if (error) {
        return {
          success: false,
          error: this.mapError('SERVICE_UNAVAILABLE', error.message || 'Booking cancellation failed')
        };
      }

      const response = data as BackendApiResponse<AuthoritativeBookingRecord>;
      if (!response || !response.success) {
        return {
          success: false,
          error: this.mapError(
            response?.error?.code || 'INVALID_STATE_TRANSITION',
            response?.error?.message || 'Cancellation request failed.'
          )
        };
      }

      return {
        success: true,
        data: this.mapRecordToBooking(response.data)
      };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unknown cancellation communication error.';
      return {
        success: false,
        error: this.mapError('SERVICE_UNAVAILABLE', msg)
      };
    }
  }

  async getTickets(_bookingId: string): Promise<BookingResult<Ticket[]>> {
    // Digital tickets are strictly issued after confirmed payment and authorized issuance.
    // In Feature 05.3, ticket issuance is strictly not configured.
    return {
      success: false,
      error: {
        code: 'NOT_CONFIGURED',
        message: 'Digital ticket issuance is not configured. Real boarding credentials require verified operator integration and confirmed payment.'
      }
    };
  }
}
