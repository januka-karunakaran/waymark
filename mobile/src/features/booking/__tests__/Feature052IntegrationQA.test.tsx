/**
 * Waymark Mobile — Feature 05.2: Trip Selection, Ticket Catalog & Booking UI
 * Task 05.2.4: Comprehensive Security, Accessibility & Final Integration QA Tests
 */

import React from 'react';
import { render, fireEvent, waitFor, renderHook, act } from '@testing-library/react-native';
import {
  BookingReviewProvider,
  useBookingReview
} from '../context/BookingReviewContext';
import { PassengerSelector } from '../components/PassengerSelector';
import { useTripCatalog } from '../hooks/useTripCatalog';
import { useFareQuote } from '../hooks/useFareQuote';
import BookingLandingScreen from '../../../../app/booking/index';
import TicketCatalogScreen from '../../../../app/booking/catalog';
import DepartureDetailsScreen from '../../../../app/booking/departure/[departureId]';
import BookingReviewScreen from '../../../../app/booking/review';
import {
  BookableDeparture,
  DepartureAvailability,
  TransitInventoryProvider,
  FareQuoteProvider,
  FareQuote,
  FareQuoteRequest,
  ProviderReadiness,
  validatePassengerCount,
  validateMinorUnitAmount
} from '../index';
import { BookingResult } from '../services/BookingService';

const mockPush = jest.fn();
const mockReplace = jest.fn();
const mockBack = jest.fn();
let mockParams: Record<string, string> = {};

jest.mock('expo-router', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: mockReplace,
    back: mockBack
  }),
  useLocalSearchParams: () => mockParams
}));

describe('Feature 05.2 Task 05.2.4 — Booking UI Security, Accessibility & Final Integration QA', () => {
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

  const sampleUnverifiedDeparture: BookableDeparture = {
    id: 'dep-sample-404',
    operatorId: 'op-sample',
    originNodeId: 'node-sample-a',
    originName: 'Sample City Alpha',
    destinationNodeId: 'node-sample-b',
    destinationName: 'Sample City Beta',
    departureTime: '2026-12-01T12:00:00Z',
    serviceIdentifier: 'SMP-404',
    inventorySource: 'sample_data',
    bookableStatus: 'available',
    transitMode: 'bus'
  };

  const validFareQuote: FareQuote = {
    id: 'quote-rail-2026-001',
    departureId: 'dep-colombo-kandy-101',
    amountMinorUnits: 250000, // 2,500.00 LKR
    currency: 'LKR',
    passengerCount: 1,
    fareClass: 'standard',
    issuedAt: '2026-11-27T10:00:00Z',
    expiresAt: '2026-12-31T23:59:59Z',
    issuingSource: 'operator_verified'
  };

  class InjectedInventoryProvider implements TransitInventoryProvider {
    private departures: BookableDeparture[];

    constructor(departures: BookableDeparture[] = [validVerifiedDeparture, sampleUnverifiedDeparture]) {
      this.departures = departures;
    }

    async getReadiness(): Promise<ProviderReadiness> {
      return 'ready';
    }

    async getDepartures(): Promise<BookingResult<BookableDeparture[]>> {
      return { success: true, data: this.departures };
    }

    async getDeparture(id: string): Promise<BookingResult<BookableDeparture>> {
      const dep = this.departures.find((d) => d.id === id);
      if (!dep) {
        return {
          success: false,
          error: { code: 'BOOKING_NOT_FOUND', message: 'Departure not found.' }
        };
      }
      return { success: true, data: dep };
    }

    async checkAvailability(id: string): Promise<BookingResult<DepartureAvailability>> {
      return {
        success: true,
        data: {
          departureId: id,
          isAvailable: true,
          availableSeats: 48,
          totalCapacity: 120,
          source: 'operator_verified',
          observedAt: new Date().toISOString()
        }
      };
    }
  }

  class InjectedFareQuoteProvider implements FareQuoteProvider {
    private baseQuote: FareQuote;

    constructor(base: FareQuote = validFareQuote) {
      this.baseQuote = base;
    }

    async getReadiness(): Promise<ProviderReadiness> {
      return 'ready';
    }

    async getQuote(req: FareQuoteRequest): Promise<BookingResult<FareQuote>> {
      return {
        success: true,
        data: {
          ...this.baseQuote,
          departureId: req.departureId,
          passengerCount: req.passengerCount,
          amountMinorUnits: this.baseQuote.amountMinorUnits * req.passengerCount
        }
      };
    }

    async validateQuote(_quoteId: string): Promise<BookingResult<FareQuote>> {
      return { success: true, data: this.baseQuote };
    }
  }

  // =========================================================================
  // Section A: Navigation & Flow Integrity
  // =========================================================================
  describe('A. End-to-End Navigation Flow & Boundary Safety', () => {
    it('QA-05.2.4-01: Landing screen navigates to Catalog without carrying sensitive query params', () => {
      const { getByTestId } = render(<BookingLandingScreen />);
      const browseButton = getByTestId('booking-landing-browse-button');

      fireEvent.press(browseButton);
      expect(mockPush).toHaveBeenCalledWith('/booking/catalog');
    });

    it('QA-05.2.4-02: Catalog navigates to Departure Details using only opaque departureId param', () => {
      const catalogHookResult: ReturnType<typeof useTripCatalog> = {
        departures: [validVerifiedDeparture],
        rawDepartures: [validVerifiedDeparture],
        isLoading: false,
        error: null,
        errorCode: null,
        readiness: 'ready',
        searchQuery: '',
        setSearchQuery: jest.fn(),
        selectedMode: 'all',
        setSelectedMode: jest.fn(),
        sortOption: 'earliest',
        setSortOption: jest.fn(),
        filterDate: null,
        setFilterDate: jest.fn(),
        refresh: jest.fn()
      };

      const { getByText } = render(
        <TicketCatalogScreen testCatalogHook={catalogHookResult} />
      );

      fireEvent.press(getByText('Select Trip'));
      expect(mockPush).toHaveBeenCalledWith({
        pathname: '/booking/departure/[departureId]',
        params: { departureId: 'dep-colombo-kandy-101' }
      });
    });

    it('QA-05.2.4-03: Unknown or invalid departureId fails safely with error state', async () => {
      mockParams = { departureId: 'unknown-corridor-id' };
      const inventoryProvider = new InjectedInventoryProvider([validVerifiedDeparture]);

      const { getByTestId, findByText } = render(
        <DepartureDetailsScreen testInventoryProvider={inventoryProvider} />
      );

      await findByText('Departure Unavailable');
      expect(getByTestId('departure-details-error-empty-state')).toBeTruthy();
    });

    it('QA-05.2.4-04: Direct deep-linking to /booking/review without valid state fails safely', () => {
      const { getByTestId, getByText } = render(<BookingReviewScreen />);

      expect(getByTestId('booking-review-empty-state')).toBeTruthy();
      expect(getByText('No Active Selection')).toBeTruthy();

      fireEvent.press(getByText('Browse Catalog'));
      expect(mockReplace).toHaveBeenCalledWith('/booking/catalog');
    });
  });

  // =========================================================================
  // Section B: Inventory Truthfulness & Provenance Rules
  // =========================================================================
  describe('B. Inventory Truthfulness & Sample Data Rejection', () => {
    it('QA-05.2.4-05: useTripCatalog strictly purges sample_data departures from client display', async () => {
      const provider = new InjectedInventoryProvider();
      const { result } = renderHook(() =>
        useTripCatalog({ inventoryProvider: provider })
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.departures.length).toBe(1);
      expect(result.current.departures[0].id).toBe('dep-colombo-kandy-101');
      expect(result.current.departures[0].inventorySource).toBe('operator_verified');
    });

    it('QA-05.2.4-06: Departure details screen strictly rejects sample_data source even if requested by ID', async () => {
      mockParams = { departureId: 'dep-sample-404' };
      const provider = new InjectedInventoryProvider();

      const { getByTestId, findByText } = render(
        <DepartureDetailsScreen testInventoryProvider={provider} />
      );

      await findByText('Departure Unavailable');
      expect(getByTestId('departure-details-error-empty-state')).toBeTruthy();
    });
  });

  // =========================================================================
  // Section C: Critical Quote Expiration & Review State Remediation
  // =========================================================================
  describe('C. Quote Expiration, Invalidation & ReviewContext Integrity', () => {
    it('QA-05.2.4-07: Quote valid at T0 automatically becomes invalid when expiry timestamp is reached', () => {
      jest.useFakeTimers();
      try {
        const now = Date.now();
        const futureExpiryIso = new Date(now + 10000).toISOString(); // 10 seconds in future

        const quote: FareQuote = {
          ...validFareQuote,
          expiresAt: futureExpiryIso
        };

        const wrapper = ({ children }: { children: React.ReactNode }) => (
          <BookingReviewProvider>{children}</BookingReviewProvider>
        );

        const { result, unmount } = renderHook(() => useBookingReview(), { wrapper });

        act(() => {
          result.current.setReviewSelection({
            departure: validVerifiedDeparture,
            passengerCount: 1,
            fareClass: 'standard',
            fareQuote: quote
          });
        });

        // Initially valid
        expect(result.current.isReviewValid).toBe(true);

        // Advance time past expiration timestamp
        act(() => {
          jest.advanceTimersByTime(11000);
        });

        // Automatically transitions to invalid without manual interaction
        expect(result.current.isReviewValid).toBe(false);

        unmount();
      } finally {
        jest.useRealTimers();
      }
    });

    it('QA-05.2.4-08: Review screen immediately switches to invalid/empty state once quote expires', () => {
      const mockReviewHook: ReturnType<typeof useBookingReview> = {
        reviewState: {
          departure: validVerifiedDeparture,
          passengerCount: 1,
          fareClass: 'standard',
          fareQuote: {
            ...validFareQuote,
            expiresAt: '2020-01-01T00:00:00Z' // Expired!
          },
          selectedAt: new Date().toISOString()
        },
        setReviewSelection: jest.fn(),
        clearReviewSelection: jest.fn(),
        isReviewValid: false // Flagged as invalid due to expiration
      };

      const { getByTestId, queryByTestId } = render(
        <BookingReviewScreen testReviewHook={mockReviewHook} />
      );

      expect(getByTestId('booking-review-empty-state')).toBeTruthy();
      expect(queryByTestId('booking-review-corridor-card')).toBeNull();
    });

    it('QA-05.2.4-09: Changing passenger count or departure invalidates existing quote', async () => {
      const provider = new InjectedFareQuoteProvider();
      let passengerCount = 1;

      const { result, rerender } = renderHook(
        () =>
          useFareQuote({
            departureId: 'dep-colombo-kandy-101',
            passengerCount,
            fareProvider: provider
          })
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
      expect(result.current.quote?.passengerCount).toBe(1);

      // Change passenger count
      passengerCount = 3;
      rerender({
        departureId: 'dep-colombo-kandy-101',
        passengerCount,
        fareProvider: provider
      });

      await waitFor(() => {
        expect(result.current.quote?.passengerCount).toBe(3);
      });
      expect(result.current.quote?.amountMinorUnits).toBe(750000);
    });
  });

  // =========================================================================
  // Section D: Security & Financial Architecture
  // =========================================================================
  describe('D. Security, Pricing Authority & Minor-Unit Validation', () => {
    it('QA-05.2.4-10: validatePassengerCount strictly enforces integer bounds 1..9', () => {
      expect(validatePassengerCount(1).isValid).toBe(true);
      expect(validatePassengerCount(9).isValid).toBe(true);
      expect(validatePassengerCount(0).isValid).toBe(false);
      expect(validatePassengerCount(10).isValid).toBe(false);
      expect(validatePassengerCount(-1).isValid).toBe(false);
      expect(validatePassengerCount(2.5).isValid).toBe(false);
      expect(validatePassengerCount('2').isValid).toBe(false);
    });

    it('QA-05.2.4-11: validateMinorUnitAmount rejects floating point or negative amounts', () => {
      expect(validateMinorUnitAmount(250000).isValid).toBe(true);
      expect(validateMinorUnitAmount(0).isValid).toBe(true);
      expect(validateMinorUnitAmount(-100).isValid).toBe(false);
      expect(validateMinorUnitAmount(25.5).isValid).toBe(false);
      expect(validateMinorUnitAmount(NaN).isValid).toBe(false);
      expect(validateMinorUnitAmount(Infinity).isValid).toBe(false);
    });

    it('QA-05.2.4-12: Review screen CTA is explicitly disabled with "Reservations Coming Soon"', () => {
      const mockReviewHook: ReturnType<typeof useBookingReview> = {
        reviewState: {
          departure: validVerifiedDeparture,
          passengerCount: 1,
          fareClass: 'standard',
          fareQuote: validFareQuote,
          selectedAt: new Date().toISOString()
        },
        setReviewSelection: jest.fn(),
        clearReviewSelection: jest.fn(),
        isReviewValid: true
      };

      const { getByTestId, getByText } = render(
        <BookingReviewScreen testReviewHook={mockReviewHook} />
      );

      const btn = getByTestId('booking-review-coming-soon-button');
      expect(btn).toBeTruthy();
      expect(getByText('Reservations Coming Soon')).toBeTruthy();

      // Ensure button press does nothing (cannot confirm reservation or trigger payment)
      fireEvent.press(btn);
      expect(mockPush).not.toHaveBeenCalled();
    });
  });

  // =========================================================================
  // Section E: Accessibility & Screen-Reader Attributes
  // =========================================================================
  describe('E. Mobile Accessibility & Assistive Technology Roles', () => {
    it('QA-05.2.4-13: PassengerSelector provides accessible button roles and increment/decrement labels', () => {
      const { getByTestId } = render(
        <PassengerSelector count={2} onChange={jest.fn()} />
      );

      const inc = getByTestId('passenger-selector-increment');
      const dec = getByTestId('passenger-selector-decrement');

      expect(inc.props.accessibilityRole).toBe('button');
      expect(inc.props.accessibilityLabel).toBe('Increase passenger count');
      expect(dec.props.accessibilityRole).toBe('button');
      expect(dec.props.accessibilityLabel).toBe('Decrease passenger count');
    });

    it('QA-05.2.4-14: Booking review cards provide semantic accessibility headings and notices', () => {
      const mockReviewHook: ReturnType<typeof useBookingReview> = {
        reviewState: {
          departure: validVerifiedDeparture,
          passengerCount: 1,
          fareClass: 'standard',
          fareQuote: validFareQuote,
          selectedAt: new Date().toISOString()
        },
        setReviewSelection: jest.fn(),
        clearReviewSelection: jest.fn(),
        isReviewValid: true
      };

      const { getByTestId } = render(
        <BookingReviewScreen testReviewHook={mockReviewHook} />
      );

      expect(getByTestId('booking-review-status-notice').props.accessibilityRole).toBe('alert');
      expect(getByTestId('booking-review-header')).toBeTruthy();
    });
  });
});
