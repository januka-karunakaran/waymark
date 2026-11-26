/**
 * Waymark Mobile — Feature 05.1: Booking & Ticketing Architecture Foundation
 * Booking Service Interface & Result Contracts
 */

import { Booking, BookingRequest } from '../types/bookingTypes';
import { Ticket } from '../types/ticketTypes';

export type BookingErrorCode =
  | 'NOT_CONFIGURED'
  | 'INVENTORY_UNAVAILABLE'
  | 'FARE_EXPIRED'
  | 'INVALID_REQUEST'
  | 'UNAUTHORIZED'
  | 'BOOKING_NOT_FOUND'
  | 'INVALID_STATE_TRANSITION'
  | 'IDEMPOTENCY_CONFLICT'
  | 'SERVICE_UNAVAILABLE';

export interface BookingError {
  code: BookingErrorCode;
  message: string;
  details?: Record<string, unknown>;
}

export type BookingResult<T = Booking> =
  | { success: true; data: T }
  | { success: false; error: BookingError };

/**
 * Service contract governing reservation management, booking queries, and cancellations.
 * Separates client read operations from privileged server mutations.
 */
export interface BookingService {
  /**
   * Retrieves an existing booking record by identifier.
   */
  getBooking(bookingId: string): Promise<BookingResult<Booking>>;

  /**
   * Submits a reservation request to hold inventory.
   * Rule: Authoritative price is determined server-side from verified quotes, never from client input.
   */
  requestReservation(request: BookingRequest): Promise<BookingResult<Booking>>;

  /**
   * Cancels a pending or held reservation.
   */
  cancelReservation(bookingId: string, reason?: string): Promise<BookingResult<Booking>>;

  /**
   * Retrieves digital tickets issued for a confirmed booking.
   * Rule: Tickets are only returned when the booking is confirmed and verified.
   */
  getTickets(bookingId: string): Promise<BookingResult<Ticket[]>>;
}
