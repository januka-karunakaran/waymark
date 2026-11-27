/**
 * Waymark Mobile — Feature 05.2: Trip Selection, Ticket Catalog & Booking UI
 * Task 05.2.3: Departure Details, Passenger Selection & Fare Review Unit & Integration Tests
 */

import React from 'react';
import { render, fireEvent, waitFor, renderHook } from '@testing-library/react-native';
import { useFareQuote } from '../hooks/useFareQuote';
import { useBookingReview } from '../context/BookingReviewContext';
import { PassengerSelector } from '../components/PassengerSelector';
import DepartureDetailsScreen from '../../../../app/booking/departure/[departureId]';
import BookingReviewScreen from '../../../../app/booking/review';
import {
  BookableDeparture,
  DepartureAvailability,
  TransitInventoryProvider,
  FareQuoteProvider,
  FareQuote,
  FareQuoteRequest,
  ProviderReadiness
} from '../index';
import { BookingResult } from '../services/BookingService';

const mockPush = jest.fn();
const mockReplace = jest.fn();
const mockBack = jest.fn();
let mockParams: Record<string, string> = { departureId: 'dep-colombo-kandy-101' };

jest.mock('expo-router', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: mockReplace,
    back: mockBack
  }),
  useLocalSearchParams: () => mockParams
}));

describe('Feature 05.2 Task 05.2.3 — Departure Details, Passenger Selection & Fare Review', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockParams = { departureId: 'dep-colombo-kandy-101' };
  });

  const validVerifiedDeparture: BookableDeparture = {
    id: 'dep-colombo-kandy-101',
    operatorId: 'op-express-rail',
    originNodeId: 'node-colombo-fort',
    originName: 'Colombo Fort Central',
    destinationNodeId: 'node-kandy-station',
    destinationName: 'Kandy Terminal',
    departureTime: '2026-12-01T08:30:00Z',
    arrivalTime: '2026-12-01T11:00:00Z',
    serviceIdentifier: 'EXP-101',
    inventorySource: 'operator_verified',
    bookableStatus: 'available',
    transitMode: 'maglev'
  };

  const validFareQuote: FareQuote = {
    id: 'quote-rail-2026-001',
    departureId: 'dep-colombo-kandy-101',
    amountMinorUnits: 250000, // 2500.00 LKR
    currency: 'LKR',
    passengerCount: 1,
    fareClass: 'standard',
    issuedAt: '2026-11-27T10:00:00Z',
    expiresAt: '2026-12-31T23:59:59Z',
    issuingSource: 'operator_verified'
  };

  class MockReadyInventoryProvider implements TransitInventoryProvider {
    private departure: BookableDeparture | null;

    constructor(dep: BookableDeparture | null = validVerifiedDeparture) {
      this.departure = dep;
    }

    async getReadiness(): Promise<ProviderReadiness> {
      return 'ready';
    }

    async getDepartures(): Promise<BookingResult<BookableDeparture[]>> {
      return { success: true, data: this.departure ? [this.departure] : [] };
    }

    async getDeparture(id: string): Promise<BookingResult<BookableDeparture>> {
      if (!this.departure || this.departure.id !== id) {
        return {
          success: false,
          error: { code: 'BOOKING_NOT_FOUND', message: 'Departure not found.' }
        };
      }
      return { success: true, data: this.departure };
    }

    async checkAvailability(id: string): Promise<BookingResult<DepartureAvailability>> {
      return {
        success: true,
        data: {
          departureId: id,
          isAvailable: true,
          availableSeats: 35,
          totalCapacity: 120,
          source: 'operator_verified',
          observedAt: new Date().toISOString()
        }
      };
    }
  }

  class MockReadyFareQuoteProvider implements FareQuoteProvider {
    private quote: FareQuote;

    constructor(q: FareQuote = validFareQuote) {
      this.quote = q;
    }

    async getReadiness(): Promise<ProviderReadiness> {
      return 'ready';
    }

    async getQuote(req: FareQuoteRequest): Promise<BookingResult<FareQuote>> {
      return {
        success: true,
        data: {
          ...this.quote,
          departureId: req.departureId,
          passengerCount: req.passengerCount,
          amountMinorUnits: this.quote.amountMinorUnits * req.passengerCount
        }
      };
    }

    async validateQuote(_quoteId: string): Promise<BookingResult<FareQuote>> {
      return { success: true, data: this.quote };
    }
  }

  // 1. PassengerSelector Component Tests
  describe('1. PassengerSelector Component Tests', () => {
    it('renders current passenger count and handles increment / decrement bounds', () => {
      const handleChange = jest.fn();
      const { getByTestId, getByText } = render(
        <PassengerSelector count={1} onChange={handleChange} />
      );

      expect(getByTestId('passenger-selector')).toBeTruthy();
      expect(getByText('1')).toBeTruthy();

      const incBtn = getByTestId('passenger-selector-increment');
      const decBtn = getByTestId('passenger-selector-decrement');

      // Decrement disabled at minimum 1
      fireEvent.press(decBtn);
      expect(handleChange).not.toHaveBeenCalled();

      // Increment valid
      fireEvent.press(incBtn);
      expect(handleChange).toHaveBeenCalledWith(2);
    });

    it('enforces maximum passenger bound of 9', () => {
      const handleChange = jest.fn();
      const { getByTestId } = render(
        <PassengerSelector count={9} onChange={handleChange} />
      );

      const incBtn = getByTestId('passenger-selector-increment');
      fireEvent.press(incBtn);
      expect(handleChange).not.toHaveBeenCalled();

      const decBtn = getByTestId('passenger-selector-decrement');
      fireEvent.press(decBtn);
      expect(handleChange).toHaveBeenCalledWith(8);
    });
  });

  // 2. useFareQuote Hook Tests
  describe('2. useFareQuote Hook Tests', () => {
    it('defaults to UnavailableFareQuoteProvider and sets not_configured error', async () => {
      const { result } = renderHook(() =>
        useFareQuote({
          departureId: 'dep-colombo-kandy-101',
          passengerCount: 1
        })
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.readiness).toBe('not_configured');
      expect(result.current.quote).toBeNull();
      expect(result.current.error).toContain('not configured');
    });

    it('requests and returns an authoritative quote from ready provider', async () => {
      const provider = new MockReadyFareQuoteProvider();
      const { result } = renderHook(() =>
        useFareQuote({
          departureId: 'dep-colombo-kandy-101',
          passengerCount: 2,
          fareProvider: provider
        })
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.readiness).toBe('ready');
      expect(result.current.error).toBeNull();
      expect(result.current.quote).not.toBeNull();
      expect(result.current.quote?.amountMinorUnits).toBe(500000); // 250000 * 2
      expect(result.current.quote?.passengerCount).toBe(2);
    });

    it('rejects invalid passenger counts before making requests', async () => {
      const provider = new MockReadyFareQuoteProvider();
      const { result } = renderHook(() =>
        useFareQuote({
          departureId: 'dep-colombo-kandy-101',
          passengerCount: 0, // Invalid!
          fareProvider: provider
        })
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.quote).toBeNull();
      expect(result.current.errorCode).toBe('INVALID_REQUEST');
      expect(result.current.error).toContain('Passenger count must be between');
    });

    it('rejects quotes with expired timestamps', async () => {
      const expiredQuote: FareQuote = {
        ...validFareQuote,
        expiresAt: '2020-01-01T00:00:00Z' // Expired in the past
      };
      const provider = new MockReadyFareQuoteProvider(expiredQuote);

      const { result } = renderHook(() =>
        useFareQuote({
          departureId: 'dep-colombo-kandy-101',
          passengerCount: 1,
          fareProvider: provider
        })
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.quote).toBeNull();
      expect(result.current.errorCode).toBe('FARE_EXPIRED');
    });
  });

  // 3. DepartureDetailsScreen Tests
  describe('3. DepartureDetailsScreen Tests', () => {
    it('renders error state when departureId is missing or unknown', async () => {
      mockParams = { departureId: 'unknown-id' };
      const inventoryProvider = new MockReadyInventoryProvider(null);

      const { getByTestId, findByText } = render(
        <DepartureDetailsScreen testInventoryProvider={inventoryProvider} />
      );

      await findByText('Departure Unavailable');
      expect(getByTestId('departure-details-error-empty-state')).toBeTruthy();
    });

    it('renders departure details, telemetry, passenger selector and fare quote', async () => {
      const inventoryProvider = new MockReadyInventoryProvider();
      const fareProvider = new MockReadyFareQuoteProvider();

      const { getByTestId, findByText } = render(
        <DepartureDetailsScreen
          testInventoryProvider={inventoryProvider}
          testFareProvider={fareProvider}
        />
      );

      await findByText('Trip Overview');
      expect(getByTestId('departure-details-main-card')).toBeTruthy();
      expect(getByTestId('departure-telemetry-card')).toBeTruthy();
      expect(getByTestId('departure-passenger-selector')).toBeTruthy();
      expect(getByTestId('departure-fare-display')).toBeTruthy();
      expect(getByTestId('departure-continue-review-button')).toBeTruthy();
    });

    it('navigates to review screen with in-memory review state when continue button is pressed', async () => {
      const inventoryProvider = new MockReadyInventoryProvider();
      const fareProvider = new MockReadyFareQuoteProvider();

      const { getByTestId, findByText } = render(
        <DepartureDetailsScreen
          testInventoryProvider={inventoryProvider}
          testFareProvider={fareProvider}
        />
      );

      await findByText('Trip Overview');
      const continueBtn = getByTestId('departure-continue-review-button');
      fireEvent.press(continueBtn);

      expect(mockPush).toHaveBeenCalledWith('/booking/review');
    });
  });

  // 4. BookingReviewScreen Tests
  describe('4. BookingReviewScreen Tests', () => {
    it('renders empty state if accessed directly without valid review state', () => {
      const { getByTestId, getByText } = render(<BookingReviewScreen />);

      expect(getByTestId('booking-review-empty-state')).toBeTruthy();
      expect(getByText('No Active Selection')).toBeTruthy();

      const browseBtn = getByText('Browse Catalog');
      fireEvent.press(browseBtn);
      expect(mockReplace).toHaveBeenCalledWith('/booking/catalog');
    });

    it('renders itinerary summary, fare display and prototype disclaimer when valid state exists', () => {
      const mockReviewHook: ReturnType<typeof useBookingReview> = {
        reviewState: {
          departure: validVerifiedDeparture,
          passengerCount: 2,
          fareClass: 'standard',
          fareQuote: {
            ...validFareQuote,
            passengerCount: 2,
            amountMinorUnits: 500000
          },
          selectedAt: new Date().toISOString()
        },
        setReviewSelection: jest.fn(),
        clearReviewSelection: jest.fn(),
        isReviewValid: true
      };

      const { getByTestId, getByText } = render(
        <BookingReviewScreen testReviewHook={mockReviewHook} />
      );

      expect(getByTestId('booking-review-corridor-card')).toBeTruthy();
      expect(getByTestId('booking-review-fare-display')).toBeTruthy();
      expect(getByTestId('booking-review-status-notice')).toBeTruthy();
      expect(getByTestId('booking-review-coming-soon-button')).toBeTruthy();
      expect(getByText('Reservations Coming Soon')).toBeTruthy();

      const backBtn = getByTestId('booking-review-back-button');
      fireEvent.press(backBtn);
      expect(mockBack).toHaveBeenCalled();
    });
  });
});
