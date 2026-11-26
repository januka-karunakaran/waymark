/**
 * Waymark Mobile — Feature 05.1: Booking & Ticketing Architecture Foundation
 * Safe Unavailable Booking Service Adapter
 *
 * Requirements:
 * - Production safe fallback when no live operator integration is active.
 * - Cannot create bookings, holds, reservations, tickets, or payment requests.
 * - Returns explicit NOT_CONFIGURED or INVENTORY_UNAVAILABLE error outcomes.
 * - Never fabricates booking confirmation numbers or persists fake reservations.
 */

import { Booking, BookingRequest } from '../types/bookingTypes';
import { Ticket } from '../types/ticketTypes';
import { BookingService, BookingResult } from './BookingService';

export class UnavailableBookingService implements BookingService {
  async getBooking(_bookingId: string): Promise<BookingResult<Booking>> {
    return {
      success: false,
      error: {
        code: 'NOT_CONFIGURED',
        message: 'Transit booking service is not configured. Live operator departures will be enabled in Feature 05.3.'
      }
    };
  }

  async requestReservation(_request: BookingRequest): Promise<BookingResult<Booking>> {
    return {
      success: false,
      error: {
        code: 'NOT_CONFIGURED',
        message: 'Live inventory reservation is currently not configured. No operator booking engine is available.'
      }
    };
  }

  async cancelReservation(_bookingId: string, _reason?: string): Promise<BookingResult<Booking>> {
    return {
      success: false,
      error: {
        code: 'NOT_CONFIGURED',
        message: 'Booking cancellation cannot be processed. No active booking service is configured.'
      }
    };
  }

  async getTickets(_bookingId: string): Promise<BookingResult<Ticket[]>> {
    return {
      success: false,
      error: {
        code: 'NOT_CONFIGURED',
        message: 'Digital ticket issuance is not configured. Real boarding credentials require verified operator integration.'
      }
    };
  }
}
