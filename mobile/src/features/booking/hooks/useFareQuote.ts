/**
 * Waymark Mobile — Feature 05.2: Trip Selection, Ticket Catalog & Booking UI
 * Task 05.2.3: Authoritative Fare Quote Hook
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  FareQuote,
  FareClass,
  CurrencyCode,
  isFareQuoteExpired,
  FareQuoteProvider,
  UnavailableFareQuoteProvider,
  ProviderReadiness,
  validatePassengerCount
} from '../index';

export interface UseFareQuoteOptions {
  departureId: string | undefined;
  passengerCount: number;
  fareClass?: FareClass;
  preferredCurrency?: CurrencyCode;
  fareProvider?: FareQuoteProvider;
}

export interface UseFareQuoteResult {
  quote: FareQuote | null;
  isLoading: boolean;
  error: string | null;
  errorCode: string | null;
  readiness: ProviderReadiness;
  isExpired: boolean;
  requestQuote: () => Promise<void>;
  validateCurrentQuote: () => Promise<boolean>;
}

const DEFAULT_UNAVAILABLE_FARE_PROVIDER = new UnavailableFareQuoteProvider();

export function useFareQuote(options: UseFareQuoteOptions): UseFareQuoteResult {
  const {
    departureId,
    passengerCount,
    fareClass = 'standard',
    preferredCurrency,
    fareProvider = DEFAULT_UNAVAILABLE_FARE_PROVIDER
  } = options;

  const [quote, setQuote] = useState<FareQuote | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [errorCode, setErrorCode] = useState<string | null>(null);
  const [readiness, setReadiness] = useState<ProviderReadiness>('not_configured');

  const activeRequestIdRef = useRef<number>(0);

  const requestQuote = useCallback(async () => {
    const requestId = ++activeRequestIdRef.current;
    setIsLoading(true);
    setError(null);
    setErrorCode(null);

    // Validate inputs before requesting
    if (!departureId || !departureId.trim()) {
      setQuote(null);
      setError('Departure identifier is required for quotation.');
      setErrorCode('INVALID_REQUEST');
      setIsLoading(false);
      return;
    }

    const passengerValidation = validatePassengerCount(passengerCount);
    if (!passengerValidation.isValid) {
      setQuote(null);
      setError(passengerValidation.error || 'Invalid passenger count.');
      setErrorCode('INVALID_REQUEST');
      setIsLoading(false);
      return;
    }

    try {
      const providerReadiness = await fareProvider.getReadiness();

      if (requestId !== activeRequestIdRef.current) return;
      setReadiness(providerReadiness);

      if (providerReadiness !== 'ready') {
        setQuote(null);
        setError(
          providerReadiness === 'not_configured'
            ? 'Fare quotation provider is not configured. Live ticket pricing is unavailable.'
            : 'Fare quotation provider is currently degraded or unavailable.'
        );
        setErrorCode(providerReadiness.toUpperCase());
        setIsLoading(false);
        return;
      }

      const result = await fareProvider.getQuote({
        departureId,
        passengerCount,
        fareClass,
        preferredCurrency
      });

      if (requestId !== activeRequestIdRef.current) return;

      if (!result.success) {
        setQuote(null);
        setError(result.error.message || 'Failed to retrieve fare quote');
        setErrorCode(result.error.code);
      } else {
        const receivedQuote = result.data;
        // Verify quote matches request invariants
        if (receivedQuote.departureId !== departureId) {
          setQuote(null);
          setError('Received quote does not match the requested departure.');
          setErrorCode('INVALID_REQUEST');
        } else if (receivedQuote.passengerCount !== passengerCount) {
          setQuote(null);
          setError('Received quote does not match the requested passenger count.');
          setErrorCode('INVALID_REQUEST');
        } else if (isFareQuoteExpired(receivedQuote)) {
          setQuote(null);
          setError('Authoritative quote has already expired.');
          setErrorCode('FARE_EXPIRED');
        } else {
          setQuote(receivedQuote);
          setError(null);
          setErrorCode(null);
        }
      }
    } catch (err: unknown) {
      if (requestId !== activeRequestIdRef.current) return;
      const message = err instanceof Error ? err.message : 'Unknown fare quotation error';
      setQuote(null);
      setError(message);
      setErrorCode('SERVICE_UNAVAILABLE');
    } finally {
      if (requestId === activeRequestIdRef.current) {
        setIsLoading(false);
      }
    }
  }, [departureId, passengerCount, fareClass, preferredCurrency, fareProvider]);

  const validateCurrentQuote = useCallback(async (): Promise<boolean> => {
    if (!quote) return false;
    if (isFareQuoteExpired(quote)) {
      setQuote(null);
      setError('Authoritative quote has expired.');
      setErrorCode('FARE_EXPIRED');
      return false;
    }

    try {
      const result = await fareProvider.validateQuote(quote.id);
      if (!result.success || isFareQuoteExpired(result.data)) {
        setQuote(null);
        setError(result.success ? 'Authoritative quote has expired.' : result.error.message);
        setErrorCode(result.success ? 'FARE_EXPIRED' : result.error.code);
        return false;
      }
      return true;
    } catch {
      return false;
    }
  }, [quote, fareProvider]);

  useEffect(() => {
    requestQuote();
    return () => {
      activeRequestIdRef.current += 1;
    };
  }, [requestQuote]);

  const isExpired = quote ? isFareQuoteExpired(quote) : false;

  return {
    quote,
    isLoading,
    error,
    errorCode,
    readiness,
    isExpired,
    requestQuote,
    validateCurrentQuote
  };
}
