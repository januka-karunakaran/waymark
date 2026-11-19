/**
 * Waymark 2100 — Feature 03.5 Task 3.5.1 Performance & Lifecycle Suite
 * Focused verification for asynchronous request deduplication, race condition prevention,
 * timer cleanup on unmount, navigation debouncing, layout re-render stability, and sample provenance.
 */

import React from 'react';
import { render, screen, fireEvent, act, renderHook } from '@testing-library/react-native';
import { useRouter } from 'expo-router';
import { useHomeData } from '../hooks/useHomeData';
import { HomeContentProvider } from '../providers/HomeContentProvider';
import { DiscoveryContentProvider, defaultDiscoveryPayload } from '../../discovery';
import { HomeScreenData } from '../types';
import { defaultHomeContent } from '../data/homeContent';
import HomeScreen from '../../../../app/(tabs)/index';
import { HomeContent } from '../components/HomeContent';

// Mock expo-router
jest.mock('expo-router', () => ({
  useRouter: jest.fn(),
  useLocalSearchParams: jest.fn(() => ({}))
}));

describe('Feature 03.5 Task 3.5.1 — Home Performance, Lifecycle & Optimization', () => {
  const mockRouter = {
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn()
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
  });

  describe('1. Asynchronous Provider Query Deduplication & Race Safety', () => {
    it('deduplicates simultaneous in-flight pull-to-refresh requests without redundant provider calls', async () => {
      let resolveHome: (data: HomeScreenData) => void = () => {};
      const mockHomeProvider: HomeContentProvider = {
        getHomeContent: jest.fn(
          () =>
            new Promise<HomeScreenData>((resolve) => {
              resolveHome = resolve;
            })
        )
      };

      const mockDiscoveryProvider: DiscoveryContentProvider = {
        getDiscoverySections: jest.fn().mockResolvedValue(defaultDiscoveryPayload),
        getSectionByCategory: jest.fn().mockResolvedValue(null),
        getItemById: jest.fn().mockResolvedValue(null)
      };

      const { result } = renderHook(() =>
        useHomeData({
          homeProvider: mockHomeProvider,
          discoveryProvider: mockDiscoveryProvider,
          autoLoad: false
        })
      );

      // Trigger first refresh
      let firstRefreshPromise: Promise<void>;
      act(() => {
        firstRefreshPromise = result.current.refresh();
      });

      expect(mockHomeProvider.getHomeContent).toHaveBeenCalledTimes(1);
      expect(result.current.isRefreshing).toBe(true);

      // Trigger second refresh while first is still in flight
      let secondRefreshPromise: Promise<void>;
      act(() => {
        secondRefreshPromise = result.current.refresh();
      });

      // Provider should NOT be called a second time
      expect(mockHomeProvider.getHomeContent).toHaveBeenCalledTimes(1);

      // Resolve the initial promise
      await act(async () => {
        resolveHome(defaultHomeContent);
        await Promise.all([firstRefreshPromise, secondRefreshPromise]);
      });

      expect(result.current.isRefreshing).toBe(false);
      expect(result.current.homeData).toEqual(defaultHomeContent);
    });

    it('prevents stuck loading flag when pull-to-refresh supersedes an in-flight initial load', async () => {
      let resolveInitialHome: (data: HomeScreenData) => void = () => {};
      let resolveRefreshHome: (data: HomeScreenData) => void = () => {};

      let callCount = 0;
      const mockHomeProvider: HomeContentProvider = {
        getHomeContent: jest.fn(() => {
          callCount++;
          if (callCount === 1) {
            return new Promise<HomeScreenData>((resolve) => {
              resolveInitialHome = resolve;
            });
          }
          return new Promise<HomeScreenData>((resolve) => {
            resolveRefreshHome = resolve;
          });
        })
      };

      const mockDiscoveryProvider: DiscoveryContentProvider = {
        getDiscoverySections: jest.fn().mockResolvedValue(defaultDiscoveryPayload),
        getSectionByCategory: jest.fn().mockResolvedValue(null),
        getItemById: jest.fn().mockResolvedValue(null)
      };

      const { result } = renderHook(() =>
        useHomeData({
          homeProvider: mockHomeProvider,
          discoveryProvider: mockDiscoveryProvider,
          initialHomeData: null,
          autoLoad: true
        })
      );

      // Initial load is active
      expect(result.current.isLoading).toBe(true);

      // User triggers pull-to-refresh while initial load is still unresolved
      let refreshPromise: Promise<void>;
      act(() => {
        refreshPromise = result.current.refresh();
      });

      expect(result.current.isRefreshing).toBe(true);

      // Resolve the superseded initial query first
      await act(async () => {
        resolveInitialHome(defaultHomeContent);
      });

      // Refresh is still in-flight
      expect(result.current.isRefreshing).toBe(true);

      // Now resolve the refresh query
      await act(async () => {
        resolveRefreshHome(defaultHomeContent);
        await refreshPromise;
      });

      // Crucial optimization check: BOTH flags must be false
      expect(result.current.isRefreshing).toBe(false);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.homeData).toEqual(defaultHomeContent);
    });

    it('discards stale response if newer request completes first', async () => {
      let resolveFirst: (data: HomeScreenData) => void = () => {};
      let resolveSecond: (data: HomeScreenData) => void = () => {};

      let count = 0;
      const mockHomeProvider: HomeContentProvider = {
        getHomeContent: jest.fn(() => {
          count++;
          if (count === 1) {
            return new Promise<HomeScreenData>((res) => {
              resolveFirst = res;
            });
          }
          return new Promise<HomeScreenData>((res) => {
            resolveSecond = res;
          });
        })
      };

      const mockDiscoveryProvider: DiscoveryContentProvider = {
        getDiscoverySections: jest.fn().mockResolvedValue(defaultDiscoveryPayload),
        getSectionByCategory: jest.fn().mockResolvedValue(null),
        getItemById: jest.fn().mockResolvedValue(null)
      };

      const { result } = renderHook(() =>
        useHomeData({
          homeProvider: mockHomeProvider,
          discoveryProvider: mockDiscoveryProvider,
          autoLoad: false
        })
      );

      // Request 1
      act(() => {
        void result.current.reload();
      });

      // Request 2 (refresh)
      act(() => {
        void result.current.refresh();
      });

      const staleData: HomeScreenData = {
        ...defaultHomeContent,
        hero: { ...defaultHomeContent.hero!, title: 'STALE DATA' }
      };

      const freshData: HomeScreenData = {
        ...defaultHomeContent,
        hero: { ...defaultHomeContent.hero!, title: 'FRESH DATA' }
      };

      // Second completes first
      await act(async () => {
        resolveSecond(freshData);
      });

      expect(result.current.homeData?.hero?.title).toBe('FRESH DATA');

      // First completes later (stale)
      await act(async () => {
        resolveFirst(staleData);
      });

      // Stale data must NOT overwrite fresh data
      expect(result.current.homeData?.hero?.title).toBe('FRESH DATA');
    });
  });

  describe('2. Navigation Multi-Tap Debounce & Timer Teardown', () => {
    it('debounces rapid multi-taps on Suggested Route card to exactly one navigation dispatch', () => {
      render(<HomeScreen />);

      const startRouteButton = screen.getByText('Start this route');

      // Simulate 3 rapid taps
      fireEvent.press(startRouteButton);
      fireEvent.press(startRouteButton);
      fireEvent.press(startRouteButton);

      expect(mockRouter.push).toHaveBeenCalledTimes(1);
      expect(mockRouter.push).toHaveBeenCalledWith({
        pathname: '/(tabs)/journey',
        params: {
          destinationId: 'suggested-kdu-kandy',
          destinationName: 'KDU Gate → Kandy City',
          source: 'suggested_corridor'
        }
      });
    });

    it('debounces rapid multi-taps on Quick Destination shortcuts', () => {
      render(<HomeScreen />);

      const kandyButton = screen.getByTestId('quick-place-place-kandy');

      // Rapidly fire multiple presses
      fireEvent.press(kandyButton);
      fireEvent.press(kandyButton);
      fireEvent.press(kandyButton);

      expect(mockRouter.push).toHaveBeenCalledTimes(1);
      expect(mockRouter.push).toHaveBeenCalledWith({
        pathname: '/(tabs)/journey',
        params: {
          destinationId: 'dest-kandy',
          destinationName: 'Kandy City Centre',
          source: 'quick_shortcut'
        }
      });
    });

    it('safely clears navigation unlock timer on unmount without warning', () => {
      const { unmount } = render(<HomeScreen />);

      const kandyButton = screen.getByTestId('quick-place-place-kandy');
      fireEvent.press(kandyButton);

      // Unmount before timeout completes
      unmount();

      expect(mockRouter.push).toHaveBeenCalledTimes(1);
    });
  });

  describe('3. Pure Component Stability & Truthful Provenance', () => {
    it('renders memoized HomeContent without throwing and preserves layout structure', () => {
      const onSelectPlace = jest.fn();
      const onSelectSuggestion = jest.fn();

      const { rerender } = render(
        <HomeContent
          data={defaultHomeContent}
          onSelectPlace={onSelectPlace}
          onSelectSuggestion={onSelectSuggestion}
        />
      );

      expect(screen.getByText('Good morning, navigator')).toBeTruthy();
      expect(screen.getByText('Quick Destinations')).toBeTruthy();

      // Re-render with identical props
      rerender(
        <HomeContent
          data={defaultHomeContent}
          onSelectPlace={onSelectPlace}
          onSelectSuggestion={onSelectSuggestion}
        />
      );

      expect(screen.getByText('Good morning, navigator')).toBeTruthy();
    });

    it('strictly preserves sample provenance and does not claim live operational telemetry', () => {
      const { result } = renderHook(() =>
        useHomeData({
          initialHomeData: defaultHomeContent,
          autoLoad: false
        })
      );

      expect(result.current.isSample).toBe(true);
      expect(result.current.homeData?.dataSource).toBe('sample_data');
      expect(result.current.homeData?.suggestion?.isSample).toBe(true);
    });
  });
});
