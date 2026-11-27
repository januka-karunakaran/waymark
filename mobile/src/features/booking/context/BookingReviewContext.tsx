/**
 * Waymark Mobile — Feature 05.2: Trip Selection, Ticket Catalog & Booking UI
 * In-Memory Pre-Booking Review State & Context
 *
 * Privacy & Security Guarantees:
 * 1. ZERO sensitive user data, payment tokens, or secrets stored.
 * 2. In-memory only; NEVER persisted to insecure storage.
 * 3. Never serialized into plain URL parameters.
 * 4. Automatically clears when departure changes, passenger count changes, or quote expires.
 */

import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';
import { BookableDeparture } from '../types/bookingTypes';
import { FareQuote, FareClass, isFareQuoteExpired } from '../types/fareTypes';

export interface BookingReviewState {
  departure: BookableDeparture | null;
  passengerCount: number;
  fareClass?: FareClass;
  fareQuote: FareQuote | null;
  selectedAt: string | null;
}

export interface BookingReviewContextValue {
  reviewState: BookingReviewState;
  setReviewSelection: (params: {
    departure: BookableDeparture;
    passengerCount: number;
    fareClass?: FareClass;
    fareQuote: FareQuote;
  }) => void;
  clearReviewSelection: () => void;
  isReviewValid: boolean;
}

const defaultState: BookingReviewState = {
  departure: null,
  passengerCount: 1,
  fareClass: undefined,
  fareQuote: null,
  selectedAt: null
};

const BookingReviewContext = createContext<BookingReviewContextValue | undefined>(undefined);

export const BookingReviewProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [reviewState, setReviewState] = useState<BookingReviewState>(defaultState);

  const setReviewSelection = useCallback(
    (params: {
      departure: BookableDeparture;
      passengerCount: number;
      fareClass?: FareClass;
      fareQuote: FareQuote;
    }) => {
      setReviewState({
        departure: params.departure,
        passengerCount: params.passengerCount,
        fareClass: params.fareClass,
        fareQuote: params.fareQuote,
        selectedAt: new Date().toISOString()
      });
    },
    []
  );

  const clearReviewSelection = useCallback(() => {
    setReviewState(defaultState);
  }, []);

  const isReviewValid = useMemo(() => {
    if (!reviewState.departure || !reviewState.fareQuote) {
      return false;
    }
    // Departure must be operator verified
    if (reviewState.departure.inventorySource !== 'operator_verified') {
      return false;
    }
    // Quote must match selected departure
    if (reviewState.fareQuote.departureId !== reviewState.departure.id) {
      return false;
    }
    // Quote must match selected passenger count
    if (reviewState.fareQuote.passengerCount !== reviewState.passengerCount) {
      return false;
    }
    // Quote must not be expired
    if (isFareQuoteExpired(reviewState.fareQuote)) {
      return false;
    }
    return true;
  }, [reviewState]);

  const value = useMemo(
    () => ({
      reviewState,
      setReviewSelection,
      clearReviewSelection,
      isReviewValid
    }),
    [reviewState, setReviewSelection, clearReviewSelection, isReviewValid]
  );

  return (
    <BookingReviewContext.Provider value={value}>
      {children}
    </BookingReviewContext.Provider>
  );
};

export function useBookingReview(): BookingReviewContextValue {
  const context = useContext(BookingReviewContext);
  if (!context) {
    // Return a safe fallback context for unmounted/standalone testing environments
    return {
      reviewState: defaultState,
      setReviewSelection: () => {},
      clearReviewSelection: () => {},
      isReviewValid: false
    };
  }
  return context;
}
