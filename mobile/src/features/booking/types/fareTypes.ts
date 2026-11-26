/**
 * Waymark Mobile — Feature 05.1: Booking & Ticketing Architecture Foundation
 * ISO 4217 Currency, Minor Unit Monetary Modeling & Fare Quote Contracts
 */

export type CurrencyCode =
  | 'USD'
  | 'EUR'
  | 'GBP'
  | 'LKR'
  | 'JPY'
  | 'AUD'
  | 'CAD'
  | 'CHF'
  | 'SGD';

export type FareClass = 'standard' | 'priority' | 'comfort';

/**
 * Authoritative fare quote provided by trusted server-side inventory or operator integration.
 * Rule: Monetary amounts MUST be represented as non-negative integer minor units (e.g., cents, cents-equivalent).
 * Floating-point numbers are strictly forbidden for authoritative monetary calculations to prevent precision bugs.
 */
export interface FareQuote {
  /** Unique quote identifier */
  id: string;
  /** Verified departure reference */
  departureId: string;
  /** Price in integer minor units (e.g., 2500 represents $25.00 in USD) */
  amountMinorUnits: number;
  /** ISO 4217 uppercase 3-letter currency code */
  currency: CurrencyCode;
  /** Number of passengers covered by this quote (integer 1-9) */
  passengerCount: number;
  /** Optional fare classification */
  fareClass?: FareClass;
  /** ISO 8601 UTC timestamp of quote creation */
  issuedAt: string;
  /** ISO 8601 UTC timestamp after which this quote is no longer guaranteed */
  expiresAt: string;
  /** Provenance of the issuing authority / provider */
  issuingSource: string;
}

/**
 * Checks if a fare quote has passed its guaranteed expiration timestamp.
 */
export function isFareQuoteExpired(quote: FareQuote, now: Date = new Date()): boolean {
  if (!quote.expiresAt) return true;
  const expiryTime = new Date(quote.expiresAt).getTime();
  if (isNaN(expiryTime)) return true;
  return now.getTime() >= expiryTime;
}
