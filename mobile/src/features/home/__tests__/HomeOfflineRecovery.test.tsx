/**
 * Waymark 2100 — Home Offline Data & Error Recovery Tests (Task 3.4.3)
 * Tests offline local content availability, provider failure resilience,
 * in-memory fallback preservation, reconnection auto-recovery, and error sanitization.
 */

import React from 'react';
import { renderHook, act, waitFor, render, screen, fireEvent } from '@testing-library/react-native';
import { useRouter } from 'expo-router';
import { useHomeData, formatUserFacingError } from '../hooks/useHomeData';
import { HomeContentProvider } from '../providers';
import { defaultHomeContent } from '../data/homeContent';
import {
  DiscoveryContentProvider,
  defaultDiscoveryPayload
} from '../../discovery';
import { HomeContent } from '../components/HomeContent';
import HomeScreen from '../../../../app/(tabs)/index';
import * as networkHook from '../../../hooks/useNetworkStatus';

// Mock expo-router
jest.mock('expo-router', () => ({
  useRouter: jest.fn(),
  useLocalSearchParams: jest.fn(() => ({}))
}));

describe('Home Offline Data & Error Recovery (Task 3.4.3)', () => {
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
        lastUpdatedTimestamp: 1710000000000
      })
    };

    mockDiscoveryProvider = {
      getDiscoverySections: jest.fn().mockResolvedValue({
        ...defaultDiscoveryPayload,
        lastUpdatedTimestamp: 1710000000000
      }),
      getSectionByCategory: jest.fn().mockResolvedValue(null),
      getItemById: jest.fn().mockResolvedValue(null)
    };
  });

  describe('1. Offline Local Content Availability', () => {
    it('provides full local content while offline without fabricating live telemetry', async () => {
      const offlineNetwork = {
        isConnected: false,
        isInternetReachable: false,
        connectionType: 'none'
      };

      const { result } = renderHook(() =>
        useHomeData({
          homeProvider: mockHomeProvider as unknown as HomeContentProvider,
          discoveryProvider: mockDiscoveryProvider as unknown as DiscoveryContentProvider,
          networkStatus: offlineNetwork
        })
      );

      await waitFor(() => {
        expect(result.current.status).toBe('success');
      });

      expect(result.current.isOffline).toBe(true);
      expect(result.current.homeData).toBeDefined();
      expect(result.current.homeData?.hero.title).toBe(defaultHomeContent.hero.title);
      expect(result.current.isSample).toBe(true);
      expect(result.current.homeData?.dataSource).toBe('sample_data');
    });

    it('HomeScreen displays offline network banner and preserves local content interactivity while offline', () => {
      const spy = jest.spyOn(networkHook, 'useNetworkStatus').mockReturnValue({
        isConnected: false,
        isInternetReachable: false,
        connectionType: 'none'
      });

      render(<HomeScreen />);

      // Verify offline banner
      expect(
        screen.getByText('TRANSIT LINK OFFLINE · OPERATING WITH LOCAL DEFAULTS')
      ).toBeTruthy();

      // Verify local content is accessible
      expect(screen.getByText('Good morning, navigator')).toBeTruthy();
      expect(screen.getByText('KDU Gate → Kandy City')).toBeTruthy();

      spy.mockRestore();
    });
  });

  describe('2. Defensive Last-Successful Data Preservation', () => {
    it('preserves previously loaded content as fallback when subsequent provider call fails', async () => {
      const { result } = renderHook(() =>
        useHomeData({
          homeProvider: mockHomeProvider as unknown as HomeContentProvider,
          discoveryProvider: mockDiscoveryProvider as unknown as DiscoveryContentProvider
        })
      );

      await waitFor(() => {
        expect(result.current.status).toBe('success');
        expect(result.current.isUsingFallback).toBe(false);
      });

      const previousTitle = result.current.homeData?.hero.title;

      // Provider now experiences an outage
      mockHomeProvider.getHomeContent.mockRejectedValueOnce(
        new Error('Regional dispatch link timeout')
      );

      await act(async () => {
        await result.current.refresh();
      });

      // Data MUST NOT be wiped
      expect(result.current.homeData).not.toBeNull();
      expect(result.current.homeData?.hero.title).toBe(previousTitle);
      expect(result.current.isUsingFallback).toBe(true);
      expect(result.current.homeError?.message).toBe('Regional dispatch link timeout');
      expect(result.current.isRefreshing).toBe(false);
    });

    it('recovers from fallback mode when a subsequent refresh succeeds', async () => {
      const { result } = renderHook(() =>
        useHomeData({
          homeProvider: mockHomeProvider as unknown as HomeContentProvider,
          discoveryProvider: mockDiscoveryProvider as unknown as DiscoveryContentProvider
        })
      );

      await waitFor(() => {
        expect(result.current.status).toBe('success');
      });

      // Cause a failure
      mockHomeProvider.getHomeContent.mockRejectedValueOnce(
        new Error('Temporary disruption')
      );

      await act(async () => {
        await result.current.refresh();
      });

      expect(result.current.isUsingFallback).toBe(true);
      expect(result.current.homeError).not.toBeNull();

      // Next refresh succeeds
      mockHomeProvider.getHomeContent.mockResolvedValueOnce({
        ...defaultHomeContent,
        hero: { ...defaultHomeContent.hero, title: 'Recovered Grid' }
      });

      await act(async () => {
        await result.current.refresh();
      });

      expect(result.current.isUsingFallback).toBe(false);
      expect(result.current.homeError).toBeNull();
      expect(result.current.homeData?.hero.title).toBe('Recovered Grid');
    });
  });

  describe('3. Error Recovery and Retry Workflow', () => {
    it('recovers from initial error when user triggers reload (retry)', async () => {
      mockHomeProvider.getHomeContent.mockRejectedValueOnce(
        new Error('Network service unreachable')
      );

      const { result } = renderHook(() =>
        useHomeData({
          homeProvider: mockHomeProvider as unknown as HomeContentProvider,
          discoveryProvider: mockDiscoveryProvider as unknown as DiscoveryContentProvider,
          initialHomeData: null
        })
      );

      await waitFor(() => {
        expect(result.current.status).toBe('error');
        expect(result.current.homeData).toBeNull();
      });

      // Service restored, trigger reload
      mockHomeProvider.getHomeContent.mockResolvedValueOnce(defaultHomeContent);

      await act(async () => {
        await result.current.reload();
      });

      await waitFor(() => {
        expect(result.current.status).toBe('success');
        expect(result.current.homeData).not.toBeNull();
        expect(result.current.homeError).toBeNull();
      });
    });

    it('renders ErrorState in HomeContent and invokes onRetry callback when pressed', () => {
      const onRetryMock = jest.fn();

      render(
        <HomeContent
          isError={true}
          errorMessage="Core telemetry unavailable. Operating offline."
          onRetry={onRetryMock}
        />
      );

      expect(screen.getByText('Telemetry Sync Disrupted')).toBeTruthy();
      expect(
        screen.getByText('Core telemetry unavailable. Operating offline.')
      ).toBeTruthy();

      const retryBtn = screen.getByTestId('home-content-error-state-retry');
      fireEvent.press(retryBtn);

      expect(onRetryMock).toHaveBeenCalledTimes(1);
    });
  });

  describe('4. Secure Error Message Formatting', () => {
    it('filters raw JavaScript stack traces and file paths to safe user-facing message', () => {
      const internalError = new Error(
        "TypeError: Cannot read property 'coordinates' of undefined at Module.load (c:/users/app/src/grid.ts:42:10)"
      );

      const formatted = formatUserFacingError(internalError);
      expect(formatted).toBe('Transit telemetry service temporarily unavailable. Please retry.');
      expect(formatted).not.toContain('TypeError');
      expect(formatted).not.toContain('grid.ts');
    });

    it('preserves clean human-readable domain error messages', () => {
      const domainError = new Error('Transit schedule temporarily unavailable');
      expect(formatUserFacingError(domainError)).toBe('Transit schedule temporarily unavailable');
    });
  });

  describe('5. Accurate Timestamp & Sync Distinction', () => {
    it('strictly separates source observation timestamp from local client sync timestamp', async () => {
      const sourceObservationTimestamp = 1680000000000;
      mockHomeProvider.getHomeContent.mockResolvedValue({
        ...defaultHomeContent,
        lastUpdatedTimestamp: sourceObservationTimestamp
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

      // Source timestamp remains exactly as reported by provider (never fabricated)
      expect(result.current.lastUpdatedTimestamp).toBe(sourceObservationTimestamp);

      // Local client sync timestamp is recorded separately
      expect(result.current.lastSuccessfulSyncTimestamp).toBeDefined();
      expect(result.current.lastSuccessfulSyncTimestamp).toBeGreaterThan(sourceObservationTimestamp);
      expect(result.current.lastAttemptedSyncTimestamp).toBeDefined();
    });
  });

  describe('6. Reconnection Auto-Recovery', () => {
    it('automatically attempts recovery when reconnecting after an active error', async () => {
      let isConnectedState = false;

      mockHomeProvider.getHomeContent.mockImplementation(() => {
        if (!isConnectedState) {
          return Promise.reject(new Error('Connection offline'));
        }
        return Promise.resolve(defaultHomeContent);
      });

      const { result, rerender } = renderHook(
        ({ netStatus }) =>
          useHomeData({
            homeProvider: mockHomeProvider as unknown as HomeContentProvider,
            discoveryProvider: mockDiscoveryProvider as unknown as DiscoveryContentProvider,
            initialHomeData: null,
            networkStatus: netStatus,
            autoRecoverOnReconnect: true
          }),
        {
          initialProps: {
            netStatus: {
              isConnected: false,
              isInternetReachable: false,
              connectionType: 'none'
            }
          }
        }
      );

      await waitFor(() => {
        expect(result.current.status).toBe('error');
        expect(result.current.homeData).toBeNull();
      });

      // Reconnect
      isConnectedState = true;
      rerender({
        netStatus: {
          isConnected: true,
          isInternetReachable: true,
          connectionType: 'wifi'
        }
      });

      await waitFor(() => {
        expect(result.current.status).toBe('success');
        expect(result.current.homeData).not.toBeNull();
      });
    });
  });
});
