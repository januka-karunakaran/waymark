/**
 * Waymark Mobile — Feature 05.2: Trip Selection, Ticket Catalog & Booking UI
 * Task 05.2.2: Verified Trip Catalog & Search Hook
 */

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  BookableDeparture,
  DepartureQueryFilters,
  TransitInventoryProvider,
  UnavailableInventoryProvider,
  ProviderReadiness
} from '../index';

export type CatalogSortOption = 'earliest' | 'latest' | 'duration';
export type TransitModeFilter = 'all' | 'maglev' | 'bus' | 'hyperloop' | 'air';

export interface UseTripCatalogOptions {
  inventoryProvider?: TransitInventoryProvider;
  initialFilters?: DepartureQueryFilters;
  initialSort?: CatalogSortOption;
}

export interface UseTripCatalogResult {
  departures: BookableDeparture[];
  rawDepartures: BookableDeparture[];
  isLoading: boolean;
  error: string | null;
  errorCode: string | null;
  readiness: ProviderReadiness;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  selectedMode: TransitModeFilter;
  setSelectedMode: (mode: TransitModeFilter) => void;
  sortOption: CatalogSortOption;
  setSortOption: (sort: CatalogSortOption) => void;
  filterDate: string | null;
  setFilterDate: (date: string | null) => void;
  refresh: () => Promise<void>;
}

const DEFAULT_UNAVAILABLE_PROVIDER = new UnavailableInventoryProvider();
const DEFAULT_INITIAL_FILTERS: DepartureQueryFilters = {};

export function useTripCatalog(options: UseTripCatalogOptions = {}): UseTripCatalogResult {
  const {
    inventoryProvider = DEFAULT_UNAVAILABLE_PROVIDER,
    initialFilters = DEFAULT_INITIAL_FILTERS,
    initialSort = 'earliest'
  } = options;

  const [rawDepartures, setRawDepartures] = useState<BookableDeparture[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [errorCode, setErrorCode] = useState<string | null>(null);
  const [readiness, setReadiness] = useState<ProviderReadiness>('not_configured');

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedMode, setSelectedMode] = useState<TransitModeFilter>(
    (initialFilters.transitMode as TransitModeFilter) || 'all'
  );
  const [sortOption, setSortOption] = useState<CatalogSortOption>(initialSort);
  const [filterDate, setFilterDate] = useState<string | null>(initialFilters.fromDate || null);

  const activeRequestIdRef = useRef<number>(0);

  const loadDepartures = useCallback(async () => {
    const requestId = ++activeRequestIdRef.current;
    setIsLoading(true);
    setError(null);
    setErrorCode(null);

    try {
      const providerReadiness = await inventoryProvider.getReadiness();

      // Guard against stale response
      if (requestId !== activeRequestIdRef.current) return;
      setReadiness(providerReadiness);

      if (providerReadiness !== 'ready') {
        setRawDepartures([]);
        setError(
          providerReadiness === 'not_configured'
            ? 'Transit inventory provider is not configured. Live bookable departures are unavailable.'
            : 'Transit inventory service is currently degraded or unavailable.'
        );
        setErrorCode(providerReadiness.toUpperCase());
        setIsLoading(false);
        return;
      }

      const result = await inventoryProvider.getDepartures(initialFilters);

      if (requestId !== activeRequestIdRef.current) return;

      if (!result.success) {
        setRawDepartures([]);
        setError(result.error.message || 'Failed to fetch departures');
        setErrorCode(result.error.code);
      } else {
        // Enforce Architectural Rule: Filter out any departure that is NOT operator_verified
        const verifiedOnly = result.data.filter(
          (dep) => dep.inventorySource === 'operator_verified'
        );
        setRawDepartures(verifiedOnly);
        setError(null);
        setErrorCode(null);
      }
    } catch (err: unknown) {
      if (requestId !== activeRequestIdRef.current) return;
      const message = err instanceof Error ? err.message : 'Unknown inventory fetch error';
      setError(message);
      setErrorCode('FETCH_FAILED');
      setRawDepartures([]);
    } finally {
      if (requestId === activeRequestIdRef.current) {
        setIsLoading(false);
      }
    }
  }, [inventoryProvider, initialFilters]);

  useEffect(() => {
    loadDepartures();
    return () => {
      // Invalidate on unmount
      activeRequestIdRef.current += 1;
    };
  }, [loadDepartures]);

  // Client-side filtering & sorting
  const filteredAndSortedDepartures = useMemo(() => {
    let result = [...rawDepartures];

    // Filter by mode
    if (selectedMode !== 'all') {
      result = result.filter(
        (dep) => dep.transitMode?.toLowerCase() === selectedMode.toLowerCase()
      );
    }

    // Filter by date (YYYY-MM-DD prefix matching against departureTime)
    if (filterDate) {
      result = result.filter((dep) => dep.departureTime.startsWith(filterDate));
    }

    // Filter by search query (origin, destination, or serviceIdentifier)
    if (searchQuery.trim()) {
      const normalizedQuery = searchQuery.trim().toLowerCase();
      result = result.filter(
        (dep) =>
          dep.originName.toLowerCase().includes(normalizedQuery) ||
          dep.destinationName.toLowerCase().includes(normalizedQuery) ||
          dep.serviceIdentifier.toLowerCase().includes(normalizedQuery) ||
          dep.operatorId.toLowerCase().includes(normalizedQuery)
      );
    }

    // Sorting
    result.sort((a, b) => {
      const timeA = new Date(a.departureTime).getTime();
      const timeB = new Date(b.departureTime).getTime();

      if (sortOption === 'earliest') {
        return timeA - timeB;
      }
      if (sortOption === 'latest') {
        return timeB - timeA;
      }
      if (sortOption === 'duration') {
        const durA = a.arrivalTime ? new Date(a.arrivalTime).getTime() - timeA : 0;
        const durB = b.arrivalTime ? new Date(b.arrivalTime).getTime() - timeB : 0;
        return durA - durB;
      }
      return 0;
    });

    return result;
  }, [rawDepartures, selectedMode, filterDate, searchQuery, sortOption]);

  return {
    departures: filteredAndSortedDepartures,
    rawDepartures,
    isLoading,
    error,
    errorCode,
    readiness,
    searchQuery,
    setSearchQuery,
    selectedMode,
    setSelectedMode,
    sortOption,
    setSortOption,
    filterDate,
    setFilterDate,
    refresh: loadDepartures
  };
}
