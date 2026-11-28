/**
 * Waymark Mobile — Feature 05.3: Secure Reservation Engine & Booking Lifecycle
 * Task 05.3.1: Reservation Cancellation Handler with Ownership & Transition Checks
 */

import {
  BackendApiResponse,
  AuthoritativeBookingRecord
} from '../types';
import { validateCancelPayload } from '../validation/reservationValidation';

export interface CancellationHandlerContext {
  authenticatedUserId: string;
  bookingStore?: Map<string, AuthoritativeBookingRecord>;
}

export async function handleCancellation(
  rawPayload: unknown,
  context: CancellationHandlerContext
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

  const validation = validateCancelPayload(rawPayload);
  if (!validation.isValid || !validation.data) {
    return {
      success: false,
      error: {
        code: 'INVALID_REQUEST',
        message: validation.error || 'Invalid cancellation request payload.'
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

  // Ownership check
  if (!record || record.userId !== context.authenticatedUserId) {
    return {
      success: false,
      error: {
        code: 'BOOKING_NOT_FOUND',
        message: `Booking '${bookingId}' was not found or does not belong to the authenticated user.`
      }
    };
  }

  // Lifecycle transition validation
  if (record.status !== 'held' && record.status !== 'pending_inventory') {
    return {
      success: false,
      error: {
        code: 'INVALID_STATE_TRANSITION',
        message: `Cannot cancel booking with current status '${record.status}'. Only held reservations can be cancelled via this endpoint.`
      }
    };
  }

  const updatedRecord: AuthoritativeBookingRecord = {
    ...record,
    status: 'cancelled',
    updatedAt: new Date().toISOString()
  };

  context.bookingStore.set(bookingId, updatedRecord);

  return {
    success: true,
    data: updatedRecord
  };
}
