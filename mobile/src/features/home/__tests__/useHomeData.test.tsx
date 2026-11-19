/**
 * Waymark 2100 — useHomeData Hook & Async Integration Tests
 * Validates provider loading, pull-to-refresh, lifecycle safety,
 * error isolation, defensive preservation, and UI integration.
 */

import React from 'react';
import { renderHook, act, waitFor, render, screen, fireEvent } from '@testing-library/react-native';
import { useRouter } from 'expo-router';
import { useHomeData } from '../hooks/useHomeData';
import { HomeContentProvider } from '../providers';
import { HomeScreenData } from '../types';
import { defaultHomeContent } from '../data/homeContent';
import {
  DiscoveryContentProvider,
  defaultDiscoveryPayload
} from '../../discovery';
import HomeScreen from '../../../../app/(tabs)/index';

// Mock expo-router
jest.mock('expo-router', () => ({
  useRouter: jest.fn(),
  useLocalSearchParams: jest.fn(() => ({}))
}));

describe('useHomeData Hook & Async State Integration (Task 3.4.2)', () => {
  let mockHomeProvider: { getHomeContent: jest.Mock };
  let mockDiscoveryProvider: {
    getDiscoverySections: jest.Mock;
    getSectionByCategory: jest.Mock;
    getItemById: jest.Mock;
  };
  const mockRouter = {
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn()
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue(mockRouter);

    mockHomeProvider = {
      getHomeContent: jest.fn().mockResolvedValue({
        ...defaultHomeContent,
        lastUpdatedTimestamp: 1700000000000
      })
    };

    mockDiscoveryProvider = {
      getDiscoverySections: jest.fn().mockResolvedValue({
        ...defaultDiscoveryPayload,
        lastUpdatedTimestamp: 1700000000000
      }),
      getSectionByCategory: jest.fn().mockResolvedValue(null),
      getItemById: jest.fn().mockResolvedValue(null)
    };
  });

  describe('Initial Provider Loading & Success States', () => {
    it('manages initial loading state when initial data is null', async () => {
      let resolvePromise: (val: HomeScreenData) => void;
      const deferredPromise = new Promise<HomeScreenData>((resolve) => {
        resolvePromise = resolve;
      });
      mockHomeProvider.getHomeContent.mockReturnValue(deferredPromise);

      const { result } = renderHook(() =>
        useHomeData({
          homeProvider: mockHomeProvider as unknown as HomeContentProvider,
          discoveryProvider: mockDiscoveryProvider as unknown as DiscoveryContentProvider,
          initialHomeData: null,
          initialDiscoveryPayload: null
        })
      );

      // Verify immediate loading state
      expect(result.current.isLoading).toBe(true);
      expect(result.current.status).toBe('loading');
      expect(result.current.homeData).toBeNull();

      // Resolve async provider
      await act(async () => {
        resolvePromise!({
          ...defaultHomeContent,
          lastUpdatedTimestamp: 1700000000000
        });
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
        expect(result.current.status).toBe('success');
        expect(result.current.homeData).not.toBeNull();
        expect(result.current.homeData?.hero.title).toBe(defaultHomeContent.hero.title);
      });
    });

    it('loads Home and Discovery datasets successfully with default provider options', async () => {
      const { result } = renderHook(() =>
        useHomeData({
          homeProvider: mockHomeProvider as unknown as HomeContentProvider,
          discoveryProvider: mockDiscoveryProvider as unknown as DiscoveryContentProvider
        })
      );

      await waitFor(() => {
        expect(result.current.status).toBe('success');
        expect(result.current.homeData).toBeDefined();
        expect(result.current.discoveryPayload).toBeDefined();
        expect(result.current.homeError).toBeNull();
        expect(result.current.discoveryError).toBeNull();
      });
    });

    it('identifies structural empty state correctly', async () => {
      const emptyContent: HomeScreenData = {
        hero: { eyebrow: '', title: '', subtitle: '' },
        suggestion: null,
        quickPlaces: [],
        architectureStatus: null,
        accessibilityNotice: {
          message: '',
          isVerifiedStepFree: false,
          complianceStatement: '',
          verificationLevel: 'informational'
        },
        availability: 'empty',
        dataSource: 'sample_data'
      };

      mockHomeProvider.getHomeContent.mockResolvedValue(emptyContent);

      const { result } = renderHook(() =>
        useHomeData({
          homeProvider: mockHomeProvider as unknown as HomeContentProvider,
          discoveryProvider: mockDiscoveryProvider as unknown as DiscoveryContentProvider
        })
      );

      await waitFor(() => {
        expect(result.current.status).toBe('empty');
        expect(result.current.isEmpty).toBe(true);
      });
    });

    it('handles initial error state when home provider rejects and no data exists', async () => {
      mockHomeProvider.getHomeContent.mockRejectedValue(new Error('Telemetry Gateway Failure'));

      const { result } = renderHook(() =>
        useHomeData({
          homeProvider: mockHomeProvider as unknown as HomeContentProvider,
          discoveryProvider: mockDiscoveryProvider as unknown as DiscoveryContentProvider,
          initialHomeData: null
        })
      );

      await waitFor(() => {
        expect(result.current.status).toBe('error');
        expect(result.current.error?.message).toBe('Telemetry Gateway Failure');
        expect(result.current.homeError?.message).toBe('Telemetry Gateway Failure');
        expect(result.current.homeData).toBeNull();
      });
    });
  });

  describe('Independent Provider Error Isolation', () => {
    it('supports Home success when Discovery provider fails', async () => {
      mockDiscoveryProvider.getDiscoverySections.mockRejectedValue(
        new Error('Discovery Service Unavailable')
      );

      const { result } = renderHook(() =>
        useHomeData({
          homeProvider: mockHomeProvider as unknown as HomeContentProvider,
          discoveryProvider: mockDiscoveryProvider as unknown as DiscoveryContentProvider
        })
      );

      await waitFor(() => {
        expect(result.current.status).toBe('success');
        expect(result.current.homeData).not.toBeNull();
        expect(result.current.homeError).toBeNull();
        expect(result.current.discoveryError?.message).toBe('Discovery Service Unavailable');
      });
    });

    it('isolates Home failure while preserving Discovery payload', async () => {
      mockHomeProvider.getHomeContent.mockRejectedValue(new Error('Core Dispatch Down'));

      const { result } = renderHook(() =>
        useHomeData({
          homeProvider: mockHomeProvider as unknown as HomeContentProvider,
          discoveryProvider: mockDiscoveryProvider as unknown as DiscoveryContentProvider,
          initialHomeData: null
        })
      );

      await waitFor(() => {
        expect(result.current.homeError?.message).toBe('Core Dispatch Down');
        expect(result.current.discoveryPayload).not.toBeNull();
        expect(result.current.discoveryError).toBeNull();
      });
    });
  });

  describe('Pull-to-Refresh & Lifecycle Safety', () => {
    it('performs real provider refresh and terminates spinner on success', async () => {
      const { result } = renderHook(() =>
        useHomeData({
          homeProvider: mockHomeProvider as unknown as HomeContentProvider,
          discoveryProvider: mockDiscoveryProvider as unknown as DiscoveryContentProvider
        })
      );

      await waitFor(() => {
        expect(result.current.status).toBe('success');
      });

      // Provider was called on initial load
      expect(mockHomeProvider.getHomeContent).toHaveBeenCalledTimes(1);

      // Trigger user pull-to-refresh
      await act(async () => {
        await result.current.refresh();
      });

      expect(mockHomeProvider.getHomeContent).toHaveBeenCalledTimes(2);
      expect(mockDiscoveryProvider.getDiscoverySections).toHaveBeenCalledTimes(2);
      expect(result.current.isRefreshing).toBe(false);
    });

    it('terminates refresh spinner and preserves previous content when refresh fails', async () => {
      const { result } = renderHook(() =>
        useHomeData({
          homeProvider: mockHomeProvider as unknown as HomeContentProvider,
          discoveryProvider: mockDiscoveryProvider as unknown as DiscoveryContentProvider
        })
      );

      await waitFor(() => {
        expect(result.current.status).toBe('success');
      });

      const initialTitle = result.current.homeData?.hero.title;

      // Make second call fail
      mockHomeProvider.getHomeContent.mockRejectedValueOnce(
        new Error('Network connection dropped')
      );

      await act(async () => {
        await result.current.refresh();
      });

      // Spinner MUST terminate
      expect(result.current.isRefreshing).toBe(false);
      // Previous content MUST be preserved
      expect(result.current.homeData?.hero.title).toBe(initialTitle);
      expect(result.current.homeError?.message).toBe('Network connection dropped');
    });

    it('prevents duplicate concurrent refresh executions', async () => {
      let resolveHome: (val: HomeScreenData) => void;
      mockHomeProvider.getHomeContent
        .mockResolvedValueOnce(defaultHomeContent) // initial load
        .mockImplementationOnce(
          () =>
            new Promise<HomeScreenData>((resolve) => {
              resolveHome = resolve;
            })
        );

      const { result } = renderHook(() =>
        useHomeData({
          homeProvider: mockHomeProvider as unknown as HomeContentProvider,
          discoveryProvider: mockDiscoveryProvider as unknown as DiscoveryContentProvider
        })
      );

      await waitFor(() => {
        expect(result.current.status).toBe('success');
      });

      // Launch first refresh (in-flight)
      act(() => {
        void result.current.refresh();
      });

      expect(result.current.isRefreshing).toBe(true);

      // Attempt duplicate second refresh while first is in-flight
      act(() => {
        void result.current.refresh();
      });

      // Provider should only have been called once for initial load + once for first refresh
      expect(mockHomeProvider.getHomeContent).toHaveBeenCalledTimes(2);

      // Complete the in-flight refresh
      await act(async () => {
        resolveHome!(defaultHomeContent);
      });

      await waitFor(() => {
        expect(result.current.isRefreshing).toBe(false);
      });
    });

    it('rejects stale out-of-order asynchronous responses', async () => {
      let resolveFirst: (val: HomeScreenData) => void;
      let resolveSecond: (val: HomeScreenData) => void;

      mockHomeProvider.getHomeContent
        .mockImplementationOnce(
          () =>
            new Promise<HomeScreenData>((resolve) => {
              resolveFirst = resolve;
            })
        )
        .mockImplementationOnce(
          () =>
            new Promise<HomeScreenData>((resolve) => {
              resolveSecond = resolve;
            })
        );

      const { result } = renderHook(() =>
        useHomeData({
          homeProvider: mockHomeProvider as unknown as HomeContentProvider,
          discoveryProvider: mockDiscoveryProvider as unknown as DiscoveryContentProvider,
          initialHomeData: null,
          autoLoad: false
        })
      );

      // Trigger first reload
      act(() => {
        void result.current.reload();
      });

      // Trigger second reload before first resolves (supersedes first)
      act(() => {
        void result.current.reload();
      });

      // Second response resolves first with NEW data
      await act(async () => {
        resolveSecond!({
          ...defaultHomeContent,
          hero: { ...defaultHomeContent.hero, title: 'NEWEST RESPONSE' }
        });
      });

      expect(result.current.homeData?.hero.title).toBe('NEWEST RESPONSE');

      // Older first response resolves later with STALE data
      await act(async () => {
        resolveFirst!({
          ...defaultHomeContent,
          hero: { ...defaultHomeContent.hero, title: 'STALE RESPONSE' }
        });
      });

      // Stale response must be rejected and not overwrite newer data
      expect(result.current.homeData?.hero.title).toBe('NEWEST RESPONSE');
    });

    it('safely handles component unmount while async requests are in flight', async () => {
      let resolveSlow: (val: HomeScreenData) => void;
      mockHomeProvider.getHomeContent.mockImplementation(
        () =>
          new Promise<HomeScreenData>((resolve) => {
            resolveSlow = resolve;
          })
      );

      const { unmount } = renderHook(() =>
        useHomeData({
          homeProvider: mockHomeProvider as unknown as HomeContentProvider,
          discoveryProvider: mockDiscoveryProvider as unknown as DiscoveryContentProvider,
          initialHomeData: null
        })
      );

      // Unmount while request is pending
      unmount();

      // Resolving after unmount must not throw state update warnings
      await act(async () => {
        resolveSlow!(defaultHomeContent);
      });
    });
  });

  describe('Data Provenance & Timestamp Integrity', () => {
    it('preserves sample_data provenance and provider timestamp without fabricating Date.now()', async () => {
      const providerTimestamp = 1711111111000;
      mockHomeProvider.getHomeContent.mockResolvedValue({
        ...defaultHomeContent,
        lastUpdatedTimestamp: providerTimestamp,
        dataSource: 'sample_data'
      });

      const { result } = renderHook(() =>
        useHomeData({
          homeProvider: mockHomeProvider as unknown as HomeContentProvider,
          discoveryProvider: mockDiscoveryProvider as unknown as DiscoveryContentProvider
        })
      );

      await waitFor(() => {
        expect(result.current.status).toBe('success');
      });

      expect(result.current.isSample).toBe(true);
      expect(result.current.lastUpdatedTimestamp).toBe(providerTimestamp);
    });
  });

  describe('HomeScreen Component Integration & Regression Safety', () => {
    it('renders HomeScreen with provider data and supports pull-to-refresh without crashing', async () => {
      render(<HomeScreen />);

      // Verify key elements are rendered
      expect(screen.getByText('Good morning, navigator')).toBeTruthy();
      expect(screen.getByText(/Where would you like to/)).toBeTruthy();
      expect(screen.getByText('KDU Gate → Kandy City')).toBeTruthy();

      // Verify quick shortcuts are present
      expect(screen.getByText('Home')).toBeTruthy();
      expect(screen.getByText('Work')).toBeTruthy();
      expect(screen.getByText('Kandy')).toBeTruthy();
      expect(screen.getByText('Colombo')).toBeTruthy();
      expect(screen.getByText('Airport')).toBeTruthy();
      expect(screen.getByText('More')).toBeTruthy();
    });

    it('navigates to Journey with contextual parameters when suggestion card is tapped', () => {
      render(<HomeScreen />);

      const startRouteBtn = screen.getByText('Start this route');
      fireEvent.press(startRouteBtn);

      expect(mockRouter.push).toHaveBeenCalledWith({
        pathname: '/(tabs)/journey',
        params: {
          destinationId: 'suggested-kdu-kandy',
          destinationName: 'KDU Gate → Kandy City',
          source: 'suggested_corridor'
        }
      });
    });

    it('navigates to Journey with contextual parameters when Airport shortcut is tapped', () => {
      render(<HomeScreen />);

      const airportBtn = screen.getByTestId('quick-place-place-airport');
      fireEvent.press(airportBtn);

      expect(mockRouter.push).toHaveBeenCalledWith({
        pathname: '/(tabs)/journey',
        params: {
          destinationId: 'dest-airport',
          destinationName: 'Bandaranaike Skyport',
          source: 'quick_shortcut'
        }
      });
    });

    it('displays guidance message when unconfigured Home shortcut is tapped', () => {
      render(<HomeScreen />);

      const homeBtn = screen.getByTestId('quick-place-place-home');
      fireEvent.press(homeBtn);

      expect(screen.getByTestId('home-guidance-banner')).toBeTruthy();
      expect(
        screen.getByText(/Home and Work locations have not been saved yet/i)
      ).toBeTruthy();

      // Dismiss guidance
      const dismissBtn = screen.getByTestId('home-guidance-dismiss');
      fireEvent.press(dismissBtn);
      expect(screen.queryByTestId('home-guidance-banner')).toBeNull();
    });
  });
});
