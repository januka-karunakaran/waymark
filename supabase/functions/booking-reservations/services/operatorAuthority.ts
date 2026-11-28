/**
 * Waymark Mobile — Feature 05.3: Secure Reservation Engine & Booking Lifecycle
 * Task 05.3.1: Server-Side Operator Authority & Departure Verification
 *
 * Requirements:
 * - Rejects any departures labeled 'sample_data' or 'provider_unavailable'.
 * - Verifies operator departure existence, departure status ('available'), and future timestamp.
 * - If no live operator provider is configured, strictly returns NOT_CONFIGURED.
 */

import { BookableDeparture } from '../../../../mobile/src/features/booking/types/bookingTypes';
import { BookingErrorCode } from '../../../../mobile/src/features/booking/services/BookingService';

export interface ServerOperatorValidationOutcome {
  isValid: boolean;
  errorCode?: BookingErrorCode;
  errorMessage?: string;
  verifiedDeparture?: BookableDeparture;
}

export interface ServerOperatorAuthority {
  isConfigured(): boolean;
  verifyDeparture(departureId: string): Promise<ServerOperatorValidationOutcome>;
}

/**
 * Production Safe Fallback Operator Authority:
 * When no live transport operator provider is active, returns NOT_CONFIGURED.
 */
export class UnconfiguredOperatorAuthority implements ServerOperatorAuthority {
  isConfigured(): boolean {
    return false;
  }

  async verifyDeparture(_departureId: string): Promise<ServerOperatorValidationOutcome> {
    return {
      isValid: false,
      errorCode: 'NOT_CONFIGURED',
      errorMessage: 'Live transit operator booking provider is not configured. Real departures are unavailable.'
    };
  }
}

/**
 * Registry-Backed Operator Authority for testing and staging environments.
 */
export class RegistryOperatorAuthority implements ServerOperatorAuthority {
  private departures: Map<string, BookableDeparture>;

  constructor(initialDepartures: BookableDeparture[] = []) {
    this.departures = new Map(initialDepartures.map((d) => [d.id, d]));
  }

  isConfigured(): boolean {
    return true;
  }

  registerDeparture(departure: BookableDeparture): void {
    this.departures.set(departure.id, departure);
  }

  async verifyDeparture(departureId: string): Promise<ServerOperatorValidationOutcome> {
    const departure = this.departures.get(departureId);

    if (!departure) {
      return {
        isValid: false,
        errorCode: 'BOOKING_NOT_FOUND',
        errorMessage: `Departure '${departureId}' not found in operational departures catalog.`
      };
    }

    // Provenance check: sample data is strictly prohibited from reservation engine
    if (departure.inventorySource !== 'operator_verified') {
      return {
        isValid: false,
        errorCode: 'INVENTORY_UNAVAILABLE',
        errorMessage: `Departure '${departureId}' has unverified source '${departure.inventorySource}'. Only operator_verified inventory can be reserved.`
      };
    }

    // Bookable status check
    if (departure.bookableStatus !== 'available') {
      return {
        isValid: false,
        errorCode: 'INVENTORY_UNAVAILABLE',
        errorMessage: `Departure '${departureId}' is currently '${departure.bookableStatus}' and cannot be reserved.`
      };
    }

    // Future departure timestamp check
    const departureMs = new Date(departure.departureTime).getTime();
    if (Number.isNaN(departureMs) || Date.now() >= departureMs) {
      return {
        isValid: false,
        errorCode: 'INVENTORY_UNAVAILABLE',
        errorMessage: `Departure '${departureId}' has already departed or has an invalid timestamp.`
      };
    }

    return {
      isValid: true,
      verifiedDeparture: departure
    };
  }
}
