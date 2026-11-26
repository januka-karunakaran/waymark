/**
 * Waymark Mobile — Feature 05.1: Booking & Ticketing Architecture Foundation
 * Task 05.1.2: Unavailable Inventory Provider Fallback Implementation
 */

import { BookableDeparture } from '../types/bookingTypes';
import { BookingResult } from '../services/BookingService';
import {
  TransitInventoryProvider,
  ProviderReadiness,
  DepartureAvailability,
  DepartureQueryFilters
} from './TransitInventoryProvider';

/**
 * Safe production fallback inventory provider.
 * Strictly returns typed NOT_CONFIGURED or INVENTORY_UNAVAILABLE errors.
 *
 * Guarantees:
 * 1. NEVER fabricates operational departures.
 * 2. NEVER invents fake capacity or available seat numbers.
 * 3. NEVER promotes sample journey or discovery suggestions into bookable inventory.
 * 4. NEVER logs or emits sensitive credentials.
 */
export class UnavailableInventoryProvider implements TransitInventoryProvider {
  private readonly reason: string;

  constructor(reason = 'Live transit inventory integration is currently not configured.') {
    this.reason = reason;
  }

  async getReadiness(): Promise<ProviderReadiness> {
    return 'not_configured';
  }

  async getDepartures(_filters?: DepartureQueryFilters): Promise<BookingResult<BookableDeparture[]>> {
    return {
      success: false,
      error: {
        code: 'NOT_CONFIGURED',
        message: this.reason,
        details: { provider: 'UnavailableInventoryProvider', readiness: 'not_configured' }
      }
    };
  }

  async getDeparture(_departureId: string): Promise<BookingResult<BookableDeparture>> {
    return {
      success: false,
      error: {
        code: 'NOT_CONFIGURED',
        message: this.reason,
        details: { provider: 'UnavailableInventoryProvider', departureId: _departureId }
      }
    };
  }

  async checkAvailability(_departureId: string): Promise<BookingResult<DepartureAvailability>> {
    return {
      success: false,
      error: {
        code: 'INVENTORY_UNAVAILABLE',
        message: 'Live seat capacity verification is currently unavailable. No verified operator connection.',
        details: { provider: 'UnavailableInventoryProvider', departureId: _departureId }
      }
    };
  }
}
