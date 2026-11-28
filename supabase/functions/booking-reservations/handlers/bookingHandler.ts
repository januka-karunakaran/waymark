/**
 * Waymark Mobile — Feature 05.3: Secure Reservation Engine & Booking Lifecycle
 * Task 05.3.1: Booking Lookup Handler with Strict Ownership Enforcement
 */

import {
  BackendApiResponse,
  AuthoritativeBookingRecord
} from '../types';
import { validateBookingLookupPayload } from '../validation/reservationValidation';

export interface BookingHandlerContext {
  authenticatedUserId: string;
  bookingStore?: Map<string, AuthoritativeBookingRecord>;
}

export async function handleBookingLookup(
  rawPayload: unknown,
  context: BookingHandlerContext
): Promise<BackendApiResponse<AuthoritativeBookingRecord>> {
  if (!context.authenticatedUserId || !context.authenticatedUserId.trim()) {
    return {
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: 'Authentication required. Missing verified user identity.'
      }
    };
  }

  const validation = validateBookingLookupPayload(rawPayload);
  if (!validation.isValid || !validation.data) {
    return {
      success: false,
      error: {
        code: 'INVALID_REQUEST',
        message: validation.error || 'Invalid booking lookup payload.'
      }
    };
  }

  const { bookingId } = validation.data;

  if (!context.bookingStore) {
    return {
      success: false,
      error: {
        code: 'NOT_CONFIGURED',
        message: 'Booking datastore is not configured.'
      }
    };
  }

  const record = context.bookingStore.get(bookingId);

  // If record does not exist OR belongs to another user, return BOOKING_NOT_FOUND to prevent enumeration
  if (!record || record.userId !== context.authenticatedUserId) {
    return {
      success: false,
      error: {
        code: 'BOOKING_NOT_FOUND',
        message: `Booking '${bookingId}' was not found or does not belong to the authenticated user.`
      }
    };
  }

  return {
    success: true,
    data: record
  };
}
