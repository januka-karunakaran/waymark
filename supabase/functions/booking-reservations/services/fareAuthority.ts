/**
 * Waymark Mobile — Feature 05.3: Secure Reservation Engine & Booking Lifecycle
 * Task 05.3.1: Server-Side Authoritative Fare Authority & Validation
 *
 * Requirements:
 * - A client-provided fareQuoteId is never accepted on trust alone.
 * - Server must verify: issuing authority, departure match, passenger count match,
 *   currency, minor-unit amount, and that quote expiration >= server time.
 * - If no live fare authority is configured, strictly returns NOT_CONFIGURED.
 * - Never fabricates fake quotes or amounts in production.
 */

import { FareQuote } from '../../../../mobile/src/features/booking/types/fareTypes';
import { BookingErrorCode } from '../../../../mobile/src/features/booking/services/BookingService';

export interface ServerFareValidationRequest {
  fareQuoteId: string;
  departureId: string;
  passengerCount: number;
}

export interface ServerFareValidationOutcome {
  isValid: boolean;
  errorCode?: BookingErrorCode;
  errorMessage?: string;
  authoritativeQuote?: FareQuote;
}

export interface ServerFareAuthority {
  isConfigured(): boolean;
  validateQuote(req: ServerFareValidationRequest): Promise<ServerFareValidationOutcome>;
}

/**
 * Production Safe Fallback Fare Authority:
 * When no live fare provider integration is active, rejects quotation lookups with NOT_CONFIGURED.
 */
export class UnconfiguredFareAuthority implements ServerFareAuthority {
  isConfigured(): boolean {
    return false;
  }

  async validateQuote(_req: ServerFareValidationRequest): Promise<ServerFareValidationOutcome> {
    return {
      isValid: false,
      errorCode: 'NOT_CONFIGURED',
      errorMessage: 'Authoritative fare quotation provider is not configured. Live ticket reservations are unavailable.'
    };
  }
}

/**
 * Registry-Backed Authoritative Fare Authority for controlled testing & authorized staging environments.
 */
export class RegistryFareAuthority implements ServerFareAuthority {
  private quotes: Map<string, FareQuote>;

  constructor(initialQuotes: FareQuote[] = []) {
    this.quotes = new Map(initialQuotes.map((q) => [q.id, q]));
  }

  isConfigured(): boolean {
    return true;
  }

  registerQuote(quote: FareQuote): void {
    this.quotes.set(quote.id, quote);
  }

  async validateQuote(req: ServerFareValidationRequest): Promise<ServerFareValidationOutcome> {
    const quote = this.quotes.get(req.fareQuoteId);

    if (!quote) {
      return {
        isValid: false,
        errorCode: 'INVALID_REQUEST',
        errorMessage: `Fare quote '${req.fareQuoteId}' not found in authoritative quote registry.`
      };
    }

    // Departure invariant check
    if (quote.departureId !== req.departureId) {
      return {
        isValid: false,
        errorCode: 'INVALID_REQUEST',
        errorMessage: 'Quotation departure does not match the requested departure identifier.'
      };
    }

    // Passenger count invariant check
    if (quote.passengerCount !== req.passengerCount) {
      return {
        isValid: false,
        errorCode: 'INVALID_REQUEST',
        errorMessage: `Quotation passenger count (${quote.passengerCount}) does not match requested count (${req.passengerCount}).`
      };
    }

    // Server-side quote expiration check
    const expiresAtMs = new Date(quote.expiresAt).getTime();
    const serverNowMs = Date.now();
    if (Number.isNaN(expiresAtMs) || serverNowMs >= expiresAtMs) {
      return {
        isValid: false,
        errorCode: 'FARE_EXPIRED',
        errorMessage: 'The authoritative fare quote has expired. Please obtain a refreshed quote.'
      };
    }

    // Provenance verification: reject sample or unverified quote sources
    if (quote.issuingSource !== 'operator_verified') {
      return {
        isValid: false,
        errorCode: 'INVENTORY_UNAVAILABLE',
        errorMessage: 'Authoritative quotes must originate from an operator_verified source.'
      };
    }

    return {
      isValid: true,
      authoritativeQuote: quote
    };
  }
}
