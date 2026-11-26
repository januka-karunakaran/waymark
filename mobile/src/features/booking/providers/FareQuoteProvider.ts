/**
 * Waymark Mobile — Feature 05.1: Booking & Ticketing Architecture Foundation
 * Task 05.1.2: Fare Quote Provider Contract & Request Interfaces
 */

import { CurrencyCode, FareClass, FareQuote } from '../types/fareTypes';
import { BookingResult } from '../services/BookingService';
import { ProviderReadiness } from './TransitInventoryProvider';

/**
 * Request payload for obtaining an authoritative fare quote for a verified departure.
 */
export interface FareQuoteRequest {
  /** Identifier of the verified bookable departure */
  departureId: string;
  /** Number of passengers (integer 1-9) */
  passengerCount: number;
  /** Desired fare classification (standard, priority, comfort) */
  fareClass?: FareClass;
  /** Preferred settlement currency (ISO 4217 code) */
  preferredCurrency?: CurrencyCode;
}

/**
 * Contract governing authoritative fare quotation from verified operator services.
 *
 * Rules:
 * 1. Quotes MUST specify amounts in integer minor units (e.g. cents).
 * 2. Floating-point currency amounts are strictly prohibited.
 * 3. Quotes must carry expiration timestamps and source provenance.
 * 4. Quotes must match the requested passenger count and departure.
 * 5. Expired quotes must never be treated as payable.
 */
export interface FareQuoteProvider {
  /**
   * Reports the operational readiness of this fare provider.
   */
  getReadiness(): Promise<ProviderReadiness>;

  /**
   * Requests an authoritative fare quote from the inventory engine or operator.
   * Rule: Does not invent fare amounts, taxes, or discounts.
   */
  getQuote(request: FareQuoteRequest): Promise<BookingResult<FareQuote>>;

  /**
   * Validates whether a previously issued fare quote remains valid and active.
   */
  validateQuote(quoteId: string): Promise<BookingResult<FareQuote>>;
}
