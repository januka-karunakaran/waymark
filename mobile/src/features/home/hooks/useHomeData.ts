/**
 * Waymark 2100 — Home Data State Management Hook
 * Provider-driven asynchronous state controller managing Home and Discovery datasets,
 * lifecycle safety, pull-to-refresh, error recovery, and truthful sample provenance.
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { HomeScreenData } from '../types';
import { defaultHomeContent } from '../data/homeContent';
import { isValidHomeScreenData, sanitizeHomeScreenData } from '../utils/homePresentation';
import { HomeContentProvider, defaultHomeProvider } from '../providers';
import {
  DiscoveryPayload,
  DiscoveryContentProvider,
  defaultDiscoveryProvider,
  defaultDiscoveryPayload
} from '../../discovery';

/**
 * High-level execution readiness state for the Home screen.
 */
export type HomeLoadStatus =
  | 'idle'
  | 'loading'
  | 'success'
  | 'empty'
  | 'error';

/**
 * Options for configuring the useHomeData hook.
 */
export interface UseHomeDataOptions {
  /**
   * Home domain content provider. Defaults to defaultHomeProvider.
   */
  homeProvider?: HomeContentProvider;

  /**
   * Discovery domain content provider. Defaults to defaultDiscoveryProvider.
   */
  discoveryProvider?: DiscoveryContentProvider;

  /**
   * Initial Home data before provider resolution.
   * Defaults to defaultHomeContent to prevent full-screen loading flash when verified defaults exist.
   * Pass null to enforce an explicit initial loading state.
   */
  initialHomeData?: HomeScreenData | null;

  /**
   * Initial Discovery payload before provider resolution.
   * Defaults to defaultDiscoveryPayload.
   * Pass null to enforce an explicit initial loading state.
   */
  initialDiscoveryPayload?: DiscoveryPayload | null;

  /**
   * Whether to trigger asynchronous loading automatically on mount.
   * Defaults to true.
   */
  autoLoad?: boolean;
}

/**
 * Complete state representation produced by useHomeData.
 */
export interface UseHomeDataState {
  /** Execution status of the primary Home data stream */
  status: HomeLoadStatus;
  /** Current verified Home screen dataset */
  homeData: HomeScreenData | null;
  /** Current Discovery transit sections payload */
  discoveryPayload: DiscoveryPayload | null;
  /** Whether initial or forced loading is active */
  isLoading: boolean;
  /** Whether pull-to-refresh is currently active */
  isRefreshing: boolean;
  /** Primary error if home data could not be retrieved */
  error: Error | null;
  /** Isolated Home provider error */
  homeError: Error | null;
  /** Isolated Discovery provider error */
  discoveryError: Error | null;
  /** Whether the dataset is completely devoid of content */
  isEmpty: boolean;
  /** True if data provenance is marked as illustrative sample data */
  isSample: boolean;
  /** Last update timestamp reported by the source provider (never fabricated) */
  lastUpdatedTimestamp?: number;
}

/**
 * Return signature of useHomeData including actions.
 */
export interface UseHomeDataReturn extends UseHomeDataState {
  /** Re-reads configured providers for pull-to-refresh */
  refresh: () => Promise<void>;
  /** Reloads content, resetting errors if successful */
  reload: () => Promise<void>;
}

/**
 * Determines whether a Home dataset is structurally empty.
 */
function isHomeDataEmpty(data: HomeScreenData | null): boolean {
  if (!data) return false;
  if (data.availability === 'empty') return true;
  const hasNoHero = !data.hero?.title;
  const hasNoSuggestion = !data.suggestion;
  const hasNoPlaces = !data.quickPlaces || data.quickPlaces.length === 0;
  return hasNoHero && hasNoSuggestion && hasNoPlaces;
}

/**
 * Asynchronous state management hook for Waymark Home and Discovery integration.
 */
export function useHomeData(options: UseHomeDataOptions = {}): UseHomeDataReturn {
  const {
    homeProvider = defaultHomeProvider,
    discoveryProvider = defaultDiscoveryProvider,
    initialHomeData = defaultHomeContent,
    initialDiscoveryPayload = defaultDiscoveryPayload,
    autoLoad = true
  } = options;

  const [homeData, setHomeData] = useState<HomeScreenData | null>(initialHomeData);
  const [discoveryPayload, setDiscoveryPayload] = useState<DiscoveryPayload | null>(
    initialDiscoveryPayload
  );
  const [status, setStatus] = useState<HomeLoadStatus>(
    initialHomeData ? 'idle' : 'loading'
  );
  const [isLoading, setIsLoading] = useState<boolean>(!initialHomeData && autoLoad);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [homeError, setHomeError] = useState<Error | null>(null);
  const [discoveryError, setDiscoveryError] = useState<Error | null>(null);

  // Lifecycle references for race-condition and unmount protection
  const isMountedRef = useRef<boolean>(true);
  const requestIdRef = useRef<number>(0);
  const isRefreshingRef = useRef<boolean>(false);
  const isLoadingRef = useRef<boolean>(false);
  const homeDataRef = useRef<HomeScreenData | null>(initialHomeData);
  const discoveryPayloadRef = useRef<DiscoveryPayload | null>(initialDiscoveryPayload);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const executeFetch = useCallback(
    async (isRefresh: boolean = false): Promise<void> => {
      // Prevent duplicate concurrent refresh executions
      if (isRefresh) {
        if (isRefreshingRef.current) return;
        isRefreshingRef.current = true;
        setIsRefreshing(true);
      } else {
        isLoadingRef.current = true;
        setIsLoading(true);
      }

      // Generate monotonic request ID for stale-response protection
      const currentRequestId = ++requestIdRef.current;

      try {
        // Query providers concurrently with independent error isolation
        const [homeResult, discoveryResult] = await Promise.allSettled([
          homeProvider.getHomeContent(),
          discoveryProvider.getDiscoverySections()
        ]);

        // Stale response or unmount guard
        if (!isMountedRef.current || currentRequestId !== requestIdRef.current) {
          return;
        }

        let resolvedHome: HomeScreenData | null = null;
        let resolvedHomeErr: Error | null = null;

        if (homeResult.status === 'fulfilled') {
          const raw = homeResult.value;
          resolvedHome = isValidHomeScreenData(raw) ? raw : sanitizeHomeScreenData(raw);
          homeDataRef.current = resolvedHome;
          setHomeData(resolvedHome);
          setHomeError(null);
        } else {
          resolvedHomeErr =
            homeResult.reason instanceof Error
              ? homeResult.reason
              : new Error(String(homeResult.reason));
          setHomeError(resolvedHomeErr);
          // Preserve previously existing home data on failure
        }

        if (discoveryResult.status === 'fulfilled') {
          discoveryPayloadRef.current = discoveryResult.value;
          setDiscoveryPayload(discoveryResult.value);
          setDiscoveryError(null);
        } else {
          const discErr =
            discoveryResult.reason instanceof Error
              ? discoveryResult.reason
              : new Error(String(discoveryResult.reason));
          setDiscoveryError(discErr);
          // Preserve previously existing discovery payload on failure
        }

        // Determine unified status
        if (resolvedHomeErr && !resolvedHome && !homeDataRef.current) {
          setStatus('error');
        } else if (resolvedHome && isHomeDataEmpty(resolvedHome)) {
          setStatus('empty');
        } else {
          setStatus('success');
        }
      } catch (unhandled) {
        if (!isMountedRef.current || currentRequestId !== requestIdRef.current) {
          return;
        }
        const err =
          unhandled instanceof Error ? unhandled : new Error(String(unhandled));
        setHomeError(err);
        if (!homeDataRef.current) {
          setStatus('error');
        }
      } finally {
        if (isRefresh) {
          isRefreshingRef.current = false;
          if (isMountedRef.current && currentRequestId === requestIdRef.current) {
            setIsRefreshing(false);
          }
        } else {
          isLoadingRef.current = false;
          if (isMountedRef.current && currentRequestId === requestIdRef.current) {
            setIsLoading(false);
          }
        }
      }
    },
    [homeProvider, discoveryProvider]
  );

  const refresh = useCallback(async (): Promise<void> => {
    return executeFetch(true);
  }, [executeFetch]);

  const reload = useCallback(async (): Promise<void> => {
    return executeFetch(false);
  }, [executeFetch]);

  useEffect(() => {
    if (autoLoad) {
      executeFetch(false);
    }
  }, [autoLoad, executeFetch]);

  const isEmpty = isHomeDataEmpty(homeData);
  const isSample = Boolean(
    homeData?.dataSource === 'sample_data' ||
    homeData?.suggestion?.isSample ||
    discoveryPayload?.dataSource === 'sample_data'
  );

  return {
    status,
    homeData,
    discoveryPayload,
    isLoading,
    isRefreshing,
    error: homeError,
    homeError,
    discoveryError,
    isEmpty,
    isSample,
    lastUpdatedTimestamp: homeData?.lastUpdatedTimestamp,
    refresh,
    reload
  };
}
