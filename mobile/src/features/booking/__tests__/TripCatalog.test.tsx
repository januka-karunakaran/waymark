/**
 * Waymark Mobile — Feature 05.2: Trip Selection, Ticket Catalog & Booking UI
 * Task 05.2.2: Verified Trip Catalog & Search Unit, Hook & UI Integration Tests
 */

import React from 'react';
import { render, fireEvent, waitFor, renderHook, act } from '@testing-library/react-native';
import { useTripCatalog } from '../hooks/useTripCatalog';
import TicketCatalogScreen from '../../../../app/booking/catalog';
import BookingLandingScreen from '../../../../app/booking/index';
import {
  BookableDeparture,
  DepartureAvailability,
  TransitInventoryProvider,
  ProviderReadiness
} from '../index';
import { BookingResult } from '../services/BookingService';

const mockPush = jest.fn();
const mockReplace = jest.fn();
const mockBack = jest.fn();

jest.mock('expo-router', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: mockReplace,
    back: mockBack
  }),
  useLocalSearchParams: () => ({})
}));

describe('Feature 05.2 Task 05.2.2 — Trip Catalog, Search & Filters', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mockVerifiedDepartures: BookableDeparture[] = [
    {
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
    },
    {
      id: 'dep-colombo-galle-202',
      operatorId: 'op-coastal-hyper',
      originNodeId: 'node-colombo-fort',
      originName: 'Colombo Fort Central',
      destinationNodeId: 'node-galle-harbor',
      destinationName: 'Galle Coastal Hub',
      departureTime: '2026-12-01T09:15:00Z',
      arrivalTime: '2026-12-01T10:15:00Z',
      serviceIdentifier: 'HYP-202',
      inventorySource: 'operator_verified',
      bookableStatus: 'available',
      transitMode: 'hyperloop'
    },
    {
      id: 'dep-jaffna-colombo-303',
      operatorId: 'op-sky-transit',
      originNodeId: 'node-jaffna-air',
      originName: 'Jaffna Aerodrome',
      destinationNodeId: 'node-colombo-air',
      destinationName: 'Ratmalana Port',
      departureTime: '2026-12-01T14:00:00Z',
      arrivalTime: '2026-12-01T14:45:00Z',
      serviceIdentifier: 'SKY-303',
      inventorySource: 'operator_verified',
      bookableStatus: 'available',
      transitMode: 'air'
    },
    {
      id: 'dep-unverified-sample-404',
      operatorId: 'op-sample',
      originNodeId: 'node-sample-a',
      originName: 'Sample Node A',
      destinationNodeId: 'node-sample-b',
      destinationName: 'Sample Node B',
      departureTime: '2026-12-01T16:00:00Z',
      serviceIdentifier: 'SMP-404',
      inventorySource: 'sample_data', // Unverified!
      bookableStatus: 'available',
      transitMode: 'bus'
    }
  ];

  class MockReadyInventoryProvider implements TransitInventoryProvider {
    private departures: BookableDeparture[];

    constructor(departures: BookableDeparture[] = mockVerifiedDepartures) {
      this.departures = departures;
    }

    async getReadiness(): Promise<ProviderReadiness> {
      return 'ready';
    }

    async getDepartures(): Promise<BookingResult<BookableDeparture[]>> {
      return {
        success: true,
        data: this.departures
      };
    }

    async getDeparture(id: string): Promise<BookingResult<BookableDeparture>> {
      const dep = this.departures.find((d) => d.id === id);
      if (!dep) {
        return {
          success: false,
          error: { code: 'NOT_CONFIGURED', message: 'Departure not found' }
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
          source: 'operator_verified',
          observedAt: new Date().toISOString()
        }
      };
    }
  }

  // 1. Hook Unit Tests
  describe('1. useTripCatalog Hook Unit Tests', () => {
    it('initializes with loading state and defaults to UnavailableInventoryProvider', async () => {
      const { result } = renderHook(() => useTripCatalog());

      expect(result.current.isLoading).toBe(true);

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.readiness).toBe('not_configured');
      expect(result.current.error).toContain('not configured');
      expect(result.current.departures).toEqual([]);
    });

    it('loads departures from a ready provider and strictly filters out unverified sample data', async () => {
      const provider = new MockReadyInventoryProvider();
      const { result } = renderHook(() =>
        useTripCatalog({ inventoryProvider: provider })
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.readiness).toBe('ready');
      expect(result.current.error).toBeNull();

      // rawDepartures should ONLY contain the 3 operator_verified items, excluding the sample_data one
      expect(result.current.rawDepartures.length).toBe(3);
      expect(
        result.current.rawDepartures.every((d) => d.inventorySource === 'operator_verified')
      ).toBe(true);
    });

    it('filters departures by transit mode', async () => {
      const provider = new MockReadyInventoryProvider();
      const { result } = renderHook(() =>
        useTripCatalog({ inventoryProvider: provider })
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.departures.length).toBe(3);

      act(() => {
        result.current.setSelectedMode('maglev');
      });

      expect(result.current.departures.length).toBe(1);
      expect(result.current.departures[0].transitMode).toBe('maglev');

      act(() => {
        result.current.setSelectedMode('hyperloop');
      });

      expect(result.current.departures.length).toBe(1);
      expect(result.current.departures[0].transitMode).toBe('hyperloop');

      act(() => {
        result.current.setSelectedMode('all');
      });

      expect(result.current.departures.length).toBe(3);
    });

    it('filters departures by search query across origin, destination, serviceIdentifier and operator', async () => {
      const provider = new MockReadyInventoryProvider();
      const { result } = renderHook(() =>
        useTripCatalog({ inventoryProvider: provider })
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Search by destination "galle"
      act(() => {
        result.current.setSearchQuery('galle');
      });
      expect(result.current.departures.length).toBe(1);
      expect(result.current.departures[0].destinationName).toContain('Galle');

      // Search by service ID "EXP-101"
      act(() => {
        result.current.setSearchQuery('EXP-101');
      });
      expect(result.current.departures.length).toBe(1);
      expect(result.current.departures[0].serviceIdentifier).toBe('EXP-101');

      // Search non-existent
      act(() => {
        result.current.setSearchQuery('non-existent-station');
      });
      expect(result.current.departures.length).toBe(0);
    });

    it('sorts departures by earliest, latest, and duration', async () => {
      const provider = new MockReadyInventoryProvider();
      const { result } = renderHook(() =>
        useTripCatalog({ inventoryProvider: provider })
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Default is earliest
      expect(result.current.departures[0].serviceIdentifier).toBe('EXP-101'); // 08:30

      // Sort by latest
      act(() => {
        result.current.setSortOption('latest');
      });
      expect(result.current.departures[0].serviceIdentifier).toBe('SKY-303'); // 14:00

      // Sort by duration
      // SKY-303 duration: 45 min
      // HYP-202 duration: 60 min
      // EXP-101 duration: 150 min
      act(() => {
        result.current.setSortOption('duration');
      });
      expect(result.current.departures[0].serviceIdentifier).toBe('SKY-303');
      expect(result.current.departures[1].serviceIdentifier).toBe('HYP-202');
      expect(result.current.departures[2].serviceIdentifier).toBe('EXP-101');
    });

    it('handles provider errors gracefully without unhandled crashes', async () => {
      const failingProvider: TransitInventoryProvider = {
        getReadiness: async () => 'ready',
        getDepartures: async () => ({
          success: false,
          error: { code: 'SERVICE_UNAVAILABLE', message: 'Transit API connection timed out' }
        }),
        getDeparture: async () => ({
          success: false,
          error: { code: 'NOT_CONFIGURED', message: '' }
        }),
        checkAvailability: async () => ({
          success: false,
          error: { code: 'INVENTORY_UNAVAILABLE', message: '' }
        })
      };

      const { result } = renderHook(() =>
        useTripCatalog({ inventoryProvider: failingProvider })
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.error).toBe('Transit API connection timed out');
      expect(result.current.errorCode).toBe('SERVICE_UNAVAILABLE');
      expect(result.current.departures).toEqual([]);
    });
  });

  // 2. UI Component Integration Tests
  describe('2. TicketCatalogScreen Integration Tests', () => {
    it('renders unavailable state when inventory provider is unconfigured', async () => {
      const { getByTestId, queryByTestId, findByText } = render(<TicketCatalogScreen />);

      // Should show header
      expect(getByTestId('catalog-header')).toBeTruthy();

      // Should display degraded state notification
      await findByText('Live Catalog Inactive');
      expect(getByTestId('catalog-status-notice')).toBeTruthy();
      expect(getByTestId('catalog-unavailable-empty-state')).toBeTruthy();

      // No departure cards should be displayed
      expect(queryByTestId('departure-card-dep-colombo-kandy-101')).toBeNull();
    });

    it('renders list of verified departures when provider is ready', async () => {
      const mockHookResult: ReturnType<typeof useTripCatalog> = {
        departures: mockVerifiedDepartures.filter(
          (d) => d.inventorySource === 'operator_verified'
        ),
        rawDepartures: mockVerifiedDepartures.filter(
          (d) => d.inventorySource === 'operator_verified'
        ),
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

      const { getByTestId, getByText } = render(
        <TicketCatalogScreen testCatalogHook={mockHookResult} />
      );

      expect(getByTestId('catalog-results-count')).toBeTruthy();
      expect(getByText('3 departures found')).toBeTruthy();

      expect(getByTestId('departure-card-dep-colombo-kandy-101')).toBeTruthy();
      expect(getByTestId('departure-card-dep-colombo-galle-202')).toBeTruthy();
      expect(getByTestId('departure-card-dep-jaffna-colombo-303')).toBeTruthy();
    });

    it('handles departure card selection and navigates to departure details route', async () => {
      const mockHookResult: ReturnType<typeof useTripCatalog> = {
        departures: [mockVerifiedDepartures[0]],
        rawDepartures: [mockVerifiedDepartures[0]],
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
        <TicketCatalogScreen testCatalogHook={mockHookResult} />
      );

      const selectBtn = getByText('Select Trip');
      fireEvent.press(selectBtn);

      expect(mockPush).toHaveBeenCalledWith({
        pathname: '/booking/departure/[departureId]',
        params: { departureId: 'dep-colombo-kandy-101' }
      });
    });

    it('renders empty match state when search filters yield no results', async () => {
      const mockSetSearchQuery = jest.fn();
      const mockSetSelectedMode = jest.fn();

      const mockHookResult: ReturnType<typeof useTripCatalog> = {
        departures: [],
        rawDepartures: [mockVerifiedDepartures[0]], // raw items exist, but filtered to empty
        isLoading: false,
        error: null,
        errorCode: null,
        readiness: 'ready',
        searchQuery: 'Unknown Destination',
        setSearchQuery: mockSetSearchQuery,
        selectedMode: 'all',
        setSelectedMode: mockSetSelectedMode,
        sortOption: 'earliest',
        setSortOption: jest.fn(),
        filterDate: null,
        setFilterDate: jest.fn(),
        refresh: jest.fn()
      };

      const { getByTestId, getByText } = render(
        <TicketCatalogScreen testCatalogHook={mockHookResult} />
      );

      expect(getByTestId('catalog-no-matches-empty-state')).toBeTruthy();
      expect(getByText('No Matching Departures')).toBeTruthy();

      // Press clear filters
      fireEvent.press(getByText('Clear Filters'));
      expect(mockSetSearchQuery).toHaveBeenCalledWith('');
      expect(mockSetSelectedMode).toHaveBeenCalledWith('all');
    });

    it('allows clearing search input with clear button', () => {
      const mockSetSearchQuery = jest.fn();

      const mockHookResult: ReturnType<typeof useTripCatalog> = {
        departures: [mockVerifiedDepartures[0]],
        rawDepartures: [mockVerifiedDepartures[0]],
        isLoading: false,
        error: null,
        errorCode: null,
        readiness: 'ready',
        searchQuery: 'Colombo',
        setSearchQuery: mockSetSearchQuery,
        selectedMode: 'all',
        setSelectedMode: jest.fn(),
        sortOption: 'earliest',
        setSortOption: jest.fn(),
        filterDate: null,
        setFilterDate: jest.fn(),
        refresh: jest.fn()
      };

      const { getByTestId } = render(
        <TicketCatalogScreen testCatalogHook={mockHookResult} />
      );

      const clearBtn = getByTestId('catalog-clear-search-button');
      fireEvent.press(clearBtn);

      expect(mockSetSearchQuery).toHaveBeenCalledWith('');
    });
  });

  // 3. Booking Landing Navigation Test
  describe('3. BookingLandingScreen Navigation to Catalog', () => {
    it('renders browse catalog action and triggers navigation to /booking/catalog', async () => {
      const { getByTestId } = render(<BookingLandingScreen />);

      const browseBtn = getByTestId('booking-landing-browse-button');
      expect(browseBtn).toBeTruthy();

      fireEvent.press(browseBtn);
      expect(mockPush).toHaveBeenCalledWith('/booking/catalog');
    });
  });
});
