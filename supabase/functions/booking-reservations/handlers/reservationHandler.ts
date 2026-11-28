/**
 * Waymark Mobile — Feature 05.3: Secure Reservation Engine & Booking Lifecycle
 * Task 05.3.1: Reservation Request Handler & Security Verification
 */

import {
  ReservationRequestPayload,
  BackendApiResponse,
  AuthoritativeBookingRecord
} from '../types';
import { validateReservationPayload } from '../validation/reservationValidation';
import { ServerFareAuthority } from '../services/fareAuthority';
import { ServerOperatorAuthority } from '../services/operatorAuthority';

export interface ReservationHandlerContext {
  authenticatedUserId: string;
  fareAuthority: ServerFareAuthority;
  operatorAuthority: ServerOperatorAuthority;
  // Optional booking store for testing / in-memory ledger
  bookingStore?: Map<string, AuthoritativeBookingRecord>;
}

export const DEFAULT_HOLD_DURATION_MS = 15 * 60 * 1000; // 15 minutes

export async function handleReservationRequest(
  rawPayload: unknown,
  context: ReservationHandlerContext
): Promise<BackendApiResponse<AuthoritativeBookingRecord>> {
  // 1. Authenticated user verification
  if (!context.authenticatedUserId || !context.authenticatedUserId.trim()) {
    return {
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: 'Authentication required. Missing verified user identity.'
      }
    };
  }

  // 2. Request payload validation & rejection of client-controlled fields
  const validation = validateReservationPayload(rawPayload);
  if (!validation.isValid || !validation.data) {
    return {
      success: false,
      error: {
        code: 'INVALID_REQUEST',
        message: validation.error || 'Invalid reservation request payload.'
      }
    };
  }

  const { departureId, passengerCount, fareQuoteId, idempotencyKey } = validation.data;

  // 3. Operator Authority: Server-side departure & inventory provenance verification
  const operatorOutcome = await context.operatorAuthority.verifyDeparture(departureId);
  if (!operatorOutcome.isValid || !operatorOutcome.verifiedDeparture) {
    return {
      success: false,
      error: {
        code: operatorOutcome.errorCode || 'INVENTORY_UNAVAILABLE',
        message: operatorOutcome.errorMessage || 'Departure inventory is unavailable.'
      }
    };
  }

  // 4. Fare Authority: Server-side authoritative quote verification
  const fareOutcome = await context.fareAuthority.validateQuote({
    fareQuoteId,
    departureId,
    passengerCount
  });

  if (!fareOutcome.isValid || !fareOutcome.authoritativeQuote) {
    return {
      success: false,
      error: {
        code: fareOutcome.errorCode || 'INVALID_REQUEST',
        message: fareOutcome.errorMessage || 'Authoritative fare validation failed.'
      }
    };
  }

  const authoritativeQuote = fareOutcome.authoritativeQuote;

  // 5. Authoritative Pricing Calculation (Never trusting client inputs)
  // Total minor units is authoritatively derived from the verified quote
  const totalAmountMinorUnits = authoritativeQuote.amountMinorUnits;
  const currency = authoritativeQuote.currency;

  // 6. Hold Expiration Calculation (Server-controlled timestamp)
  const serverNow = Date.now();
  const quoteExpiresAtMs = new Date(authoritativeQuote.expiresAt).getTime();
  const maxHoldMs = serverNow + DEFAULT_HOLD_DURATION_MS;
  const effectiveHoldExpiresMs = Math.min(maxHoldMs, quoteExpiresAtMs);
  const holdExpiresAtIso = new Date(effectiveHoldExpiresMs).toISOString();

  // 7. Construct Authoritative Held Booking Record
  const bookingRecord: AuthoritativeBookingRecord = {
    id: `res-${idempotencyKey.slice(0, 12)}-${Date.now().toString(36)}`,
    userId: context.authenticatedUserId,
    departureId,
    passengerCount,
    fareQuoteId,
    totalAmountMinorUnits,
    currency,
    status: 'held',
    idempotencyKey,
    holdExpiresAt: holdExpiresAtIso,
    createdAt: new Date(serverNow).toISOString(),
    updatedAt: new Date(serverNow).toISOString()
  };

  if (context.bookingStore) {
    context.bookingStore.set(bookingRecord.id, bookingRecord);
  }

  return {
    success: true,
    data: bookingRecord
  };
}
