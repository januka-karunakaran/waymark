/**
 * Waymark Mobile — Feature 05.3: Secure Reservation Engine & Booking Lifecycle
 * Task 05.3.2: Atomic Reservation Request Handler with Database Transaction Enforcement
 *
 * Security & Integrity Guarantees:
 * 1. Zero uncommitted reservations: provider validation alone CANNOT produce a successful hold.
 * 2. Mandates atomic PostgreSQL transaction execution via ReservationTransactionCoordinator.
 * 3. Booking record and UUID originate strictly from committed database state.
 * 4. Fails closed with NOT_CONFIGURED if database transaction engine is unconfigured.
 */

import {
  BackendApiResponse,
  AuthoritativeBookingRecord
} from '../types';
import {
  validateReservationPayload,
  calculateRequestFingerprint
} from '../validation/reservationValidation';
import { ServerFareAuthority } from '../services/fareAuthority';
import { ServerOperatorAuthority } from '../services/operatorAuthority';
import {
  ReservationTransactionCoordinator,
  UnconfiguredReservationTransactionCoordinator
} from '../services/databaseTransaction';

export interface ReservationHandlerContext {
  authenticatedUserId: string;
  fareAuthority: ServerFareAuthority;
  operatorAuthority: ServerOperatorAuthority;
  transactionCoordinator?: ReservationTransactionCoordinator;
  bookingStore?: Map<string, AuthoritativeBookingRecord>;
}

export const DEFAULT_HOLD_DURATION_SECONDS = 900; // 15 minutes

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
  const totalAmountMinorUnits = authoritativeQuote.amountMinorUnits;
  const currency = authoritativeQuote.currency;

  // 6. Database Transaction Coordinator Gate
  // CRITICAL REMEDIATION: Provider validation alone CANNOT create a reservation.
  // Must execute atomic PostgreSQL transaction.
  const coordinator = context.transactionCoordinator ?? new UnconfiguredReservationTransactionCoordinator();
  if (!coordinator.isConfigured()) {
    return {
      success: false,
      error: {
        code: 'NOT_CONFIGURED',
        message: 'Database reservation transaction engine is not configured. Live capacity allocation is unavailable.'
      }
    };
  }

  // 7. Calculate canonical deterministic request hash for idempotency checking
  const requestHash = calculateRequestFingerprint({
    departureId,
    passengerCount,
    fareQuoteId,
    currency,
    totalAmountMinorUnits
  });

  // Calculate hold duration bounded by quote expiration
  const serverNow = Date.now();
  const quoteExpiresAtMs = new Date(authoritativeQuote.expiresAt).getTime();
  const remainingQuoteSeconds = Math.max(0, Math.floor((quoteExpiresAtMs - serverNow) / 1000));
  const effectiveDurationSeconds = Math.min(DEFAULT_HOLD_DURATION_SECONDS, remainingQuoteSeconds);

  if (effectiveDurationSeconds <= 0) {
    return {
      success: false,
      error: {
        code: 'FARE_EXPIRED',
        message: 'Authoritative fare quote has expired prior to reservation allocation.'
      }
    };
  }

  // 8. Execute Atomic PostgreSQL Transaction (lock inventory, check capacity, insert held reservation, write idempotency)
  const transactionOutcome = await coordinator.executeReservationHold({
    userId: context.authenticatedUserId,
    departureId,
    passengerCount,
    fareQuoteId,
    totalAmountMinorUnits,
    currency,
    idempotencyKey,
    requestHash,
    holdDurationSeconds: effectiveDurationSeconds
  });

  if (!transactionOutcome.success || !transactionOutcome.booking) {
    return {
      success: false,
      error: {
        code: transactionOutcome.errorCode || 'SERVICE_UNAVAILABLE',
        message: transactionOutcome.errorMessage || 'Database reservation transaction failed.'
      }
    };
  }

  if (context.bookingStore) {
    context.bookingStore.set(transactionOutcome.booking.id, transactionOutcome.booking);
  }

  // 9. Return strictly the committed database reservation outcome
  return {
    success: true,
    data: transactionOutcome.booking
  };
}
