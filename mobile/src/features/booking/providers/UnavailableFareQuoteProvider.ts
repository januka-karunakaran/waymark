/**
 * Waymark Mobile — Feature 05.1: Booking & Ticketing Architecture Foundation
 * Task 05.1.2: Unavailable Fare Quote Provider Fallback Implementation
 */

import { FareQuote } from '../types/fareTypes';
import { BookingResult } from '../services/BookingService';
import { FareQuoteProvider, FareQuoteRequest } from './FareQuoteProvider';
import { ProviderReadiness } from './TransitInventoryProvider';

/**
 * Safe production fallback fare quote provider.
 * Strictly returns typed NOT_CONFIGURED errors.
 *
 * Guarantees:
 * 1. NEVER invents fare prices or monetary amounts.
 * 2. NEVER synthesizes arbitrary promotional discounts or taxes.
 * 3. NEVER issues fake quote identifiers or payment intents.
 * 4. NEVER logs or emits financial secrets or keys.
 */
export class UnavailableFareQuoteProvider implements FareQuoteProvider {
  private readonly reason: string;

  constructor(reason = 'Authoritative fare quotation is currently not configured.') {
    this.reason = reason;
  }

  async getReadiness(): Promise<ProviderReadiness> {
    return 'not_configured';
  }

  async getQuote(_request: FareQuoteRequest): Promise<BookingResult<FareQuote>> {
    return {
      success: false,
      error: {
        code: 'NOT_CONFIGURED',
        message: this.reason,
        details: {
          provider: 'UnavailableFareQuoteProvider',
          readiness: 'not_configured',
          departureId: _request?.departureId
        }
      }
    };
  }

  async validateQuote(_quoteId: string): Promise<BookingResult<FareQuote>> {
    return {
      success: false,
      error: {
        code: 'NOT_CONFIGURED',
        message: this.reason,
        details: {
          provider: 'UnavailableFareQuoteProvider',
          quoteId: _quoteId
        }
      }
    };
  }
}
