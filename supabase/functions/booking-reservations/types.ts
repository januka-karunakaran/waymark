/**
 * Waymark Mobile — Feature 05.3: Secure Reservation Engine & Booking Lifecycle
 * Task 05.3.1: Backend Reservation API Types & Result Contracts
 */

import { BookingStatus, PassengerInput } from '../../../mobile/src/features/booking/types/bookingTypes';
import { CurrencyCode, FareClass } from '../../../mobile/src/features/booking/types/fareTypes';
import { BookingErrorCode } from '../../../mobile/src/features/booking/services/BookingService';

export type ReservationAction = 'reserve' | 'get_booking' | 'cancel' | 'readiness';

export interface ReservationRequestPayload {
  departureId: string;
  passengerCount: number;
  fareQuoteId: string;
  idempotencyKey: string;
  fareClass?: FareClass;
  passengers?: PassengerInput[];
}

export interface BookingLookupPayload {
  bookingId: string;
}

export interface CancelReservationPayload {
  bookingId: string;
  reason?: string;
}

export interface ReservationApiEnvelope<T = unknown> {
  action: ReservationAction;
  payload: T;
}

export interface BackendErrorResponse {
  code: BookingErrorCode;
  message: string;
  details?: Record<string, unknown>;
}

export type BackendApiResponse<T> =
  | { success: true; data: T }
  | { success: false; error: BackendErrorResponse };

export interface BackendReadiness {
  isConfigured: boolean;
  operatorAuthority: 'ready' | 'pending' | 'unavailable';
  fareAuthority: 'ready' | 'pending' | 'unavailable';
  databaseTransactions: 'ready' | 'pending' | 'unavailable';
  version: string;
}

export interface AuthoritativeBookingRecord {
  id: string;
  userId: string;
  departureId: string;
  passengerCount: number;
  fareQuoteId: string;
  totalAmountMinorUnits: number;
  currency: CurrencyCode;
  status: BookingStatus;
  idempotencyKey: string;
  holdExpiresAt: string | null;
  createdAt: string;
  updatedAt: string;
}
