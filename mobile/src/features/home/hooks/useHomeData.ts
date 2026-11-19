/**
 * Waymark 2100 — Home Data State Management Hook
 * Provider-driven asynchronous state controller managing Home and Discovery datasets,
 * offline resilience, error recovery, lifecycle safety, and truthful sample provenance.
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
import { NetworkStatus } from '../../../hooks/useNetworkStatus';

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
 * Known sensitive string patterns that MUST NEVER leak to user interfaces or screen readers.
 * Captures tokens, credentials, connection strings, hostnames, IP addresses, stack traces,
 * filesystem paths, memory addresses, and code error types.
 */
const SENSITIVE_ERROR_PATTERN =
  /(bearer\s+|auth_token=|api_key=|sk_live|password|secret|jwt|private_key|postgres:\/\/|mongodb:\/\/|mysql:\/\/|https?:\/\/|localhost|\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b|TypeError|ReferenceError|SyntaxError|JSON\.parse|at\s+[\w./\\-]+|\.(ts|js|tsx|jsx)\b|\/|\\|0x[0-9a-fA-F]+|<[^>]*>)/i;

/**
 * Standard safe user-facing error messages for transit telemetry.
 */
export const USER_FACING_ERRORS = {
  DEFAULT: 'An unexpected error occurred while loading transit data.',
  SERVICE_UNAVAILABLE: 'Transit telemetry service temporarily unavailable. Please retry.'
} as const;

/**
 * Filters out raw JavaScript stack traces, memory addresses, credentials, or file paths
 * to provide human-readable, secure user-facing messages. Preserves clean domain errors.
 */
export function formatUserFacingError(error: unknown): string {
  if (!error) return USER_FACING_ERRORS.DEFAULT;
  const rawMessage = error instanceof Error ? error.message : String(error);

  // If the error message contains stack traces, file paths, tokens, URLs, or code artifacts,
  // sanitize it immediately into a generic service message.
  if (SENSITIVE_ERROR_PATTERN.test(rawMessage)) {
    return USER_FACING_ERRORS.SERVICE_UNAVAILABLE;
  }

  // Preserve clean human-readable domain error messages
  return rawMessage;
}

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

  /**
   * Explicit network status override (used for testing offline workflows).
   * Defaults to the live useNetworkStatus hook.
   */
  networkStatus?: NetworkStatus;

  /**
   * Automatically retry query when connectivity is restored after an error.
   * Defaults to true.
   */
  autoRecoverOnReconnect?: boolean;
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
  /** Whether the device is currently disconnected from network */
  isOffline: boolean;
  /** Indicates whether the current content is preserved from a previous successful read or fallback */
  isUsingFallback: boolean;
  /** Last update timestamp reported by the source provider (never fabricated) */
  lastUpdatedTimestamp?: number;
  /** Local client timestamp when data was last successfully synchronized */
  lastSuccessfulSyncTimestamp?: number;
  /** Local client timestamp when sync was last attempted */
  lastAttemptedSyncTimestamp?: number;
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
 * Asynchronous state management hook for Waymark Home and Discovery integration
 * with full offline tolerance, defensive fallback preservation, and error recovery.
 */
export function useHomeData(options: UseHomeDataOptions = {}): UseHomeDataReturn {
  const {
    homeProvider = defaultHomeProvider,
    discoveryProvider = defaultDiscoveryProvider,
    initialHomeData = defaultHomeContent,
    initialDiscoveryPayload = defaultDiscoveryPayload,
    autoLoad = true,
    networkStatus,
    autoRecoverOnReconnect = true
  } = options;

  const isOffline = networkStatus ? !networkStatus.isConnected : false;

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
  const [isUsingFallback, setIsUsingFallback] = useState<boolean>(false);
  const [lastSuccessfulSyncTimestamp, setLastSuccessfulSyncTimestamp] = useState<number | undefined>(
    undefined
  );
  const [lastAttemptedSyncTimestamp, setLastAttemptedSyncTimestamp] = useState<number | undefined>(
    undefined
  );

  // Lifecycle and in-memory fallback preservation refs
  const isMountedRef = useRef<boolean>(true);
  const requestIdRef = useRef<number>(0);
  const isRefreshingRef = useRef<boolean>(false);
  const homeDataRef = useRef<HomeScreenData | null>(initialHomeData);
  const discoveryPayloadRef = useRef<DiscoveryPayload | null>(initialDiscoveryPayload);
  const lastSuccessfulHomeRef = useRef<HomeScreenData | null>(initialHomeData);
  const lastSuccessfulDiscoveryRef = useRef<DiscoveryPayload | null>(initialDiscoveryPayload);
  const prevConnectedRef = useRef<boolean>(networkStatus?.isConnected ?? true);
  const homeErrorRef = useRef<Error | null>(null);
  const isUsingFallbackRef = useRef<boolean>(false);
  const statusRef = useRef<HomeLoadStatus>(initialHomeData ? 'idle' : 'loading');

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
        setIsLoading(true);
      }

      setLastAttemptedSyncTimestamp(Date.now());

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
          lastSuccessfulHomeRef.current = resolvedHome;
          homeErrorRef.current = null;
          isUsingFallbackRef.current = false;
          setHomeData(resolvedHome);
          setHomeError(null);
          setIsUsingFallback(false);
          setLastSuccessfulSyncTimestamp(Date.now());
        } else {
          const formatted = formatUserFacingError(homeResult.reason);
          resolvedHomeErr = new Error(formatted);
          homeErrorRef.current = resolvedHomeErr;
          setHomeError(resolvedHomeErr);

          // Defensive fallback preservation: keep previous data if present
          if (lastSuccessfulHomeRef.current) {
            isUsingFallbackRef.current = true;
            setHomeData(lastSuccessfulHomeRef.current);
            setIsUsingFallback(true);
          } else {
            isUsingFallbackRef.current = false;
            setHomeData(null);
          }
        }

        if (discoveryResult.status === 'fulfilled') {
          discoveryPayloadRef.current = discoveryResult.value;
          lastSuccessfulDiscoveryRef.current = discoveryResult.value;
          setDiscoveryPayload(discoveryResult.value);
          setDiscoveryError(null);
        } else {
          const formattedDisc = formatUserFacingError(discoveryResult.reason);
          setDiscoveryError(new Error(formattedDisc));

          // Preserve previously existing discovery payload on failure
          if (lastSuccessfulDiscoveryRef.current) {
            setDiscoveryPayload(lastSuccessfulDiscoveryRef.current);
          }
        }

        // Determine unified status
        let newStatus: HomeLoadStatus = 'success';
        if (resolvedHomeErr && !lastSuccessfulHomeRef.current) {
          newStatus = 'error';
        } else if (resolvedHome && isHomeDataEmpty(resolvedHome)) {
          newStatus = 'empty';
        }
        statusRef.current = newStatus;
        setStatus(newStatus);
      } catch (unhandled) {
        if (!isMountedRef.current || currentRequestId !== requestIdRef.current) {
          return;
        }
        const safeErr = new Error(formatUserFacingError(unhandled));
        homeErrorRef.current = safeErr;
        setHomeError(safeErr);
        if (!lastSuccessfulHomeRef.current) {
          statusRef.current = 'error';
          setStatus('error');
        } else {
          isUsingFallbackRef.current = true;
          setIsUsingFallback(true);
        }
      } finally {
        if (isRefresh) {
          isRefreshingRef.current = false;
        }

        if (isMountedRef.current && currentRequestId === requestIdRef.current) {
          setIsRefreshing(false);
          setIsLoading(false);
          isRefreshingRef.current = false;
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

  // Initial autoLoad
  useEffect(() => {
    if (autoLoad) {
      executeFetch(false);
    }
  }, [autoLoad, executeFetch]);

  // Network recovery on reconnect
  useEffect(() => {
    if (!networkStatus) return;
    const wasOffline = !prevConnectedRef.current;
    const isNowOnline = networkStatus.isConnected;
    prevConnectedRef.current = networkStatus.isConnected;

    if (autoRecoverOnReconnect && wasOffline && isNowOnline) {
      // Reconnected! If an error is active or fallback is currently used, recover automatically
      if (homeErrorRef.current || isUsingFallbackRef.current || statusRef.current === 'error') {
        void executeFetch(false);
      }
    }
  }, [networkStatus, autoRecoverOnReconnect, executeFetch]);

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
    isOffline,
    isUsingFallback,
    lastUpdatedTimestamp: homeData?.lastUpdatedTimestamp,
    lastSuccessfulSyncTimestamp,
    lastAttemptedSyncTimestamp,
    refresh,
    reload
  };
}
