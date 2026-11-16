import { API_CONSTANTS } from '../constants/api';

export interface AppConfig {
  apiUrl: string;
  apiTimeoutMs: number;
  appEnv: 'development' | 'staging' | 'production' | 'test';
  enableAirShuttles: boolean;
  enableOfflineCache: boolean;
}

export function loadAppConfig(customEnv?: Record<string, string | undefined>): AppConfig {
  const envSource = customEnv || process.env;
  const rawApiUrl = envSource.EXPO_PUBLIC_API_URL || API_CONSTANTS.DEFAULT_BASE_URL;
  const rawTimeout = envSource.EXPO_PUBLIC_API_TIMEOUT_MS;
  const apiTimeoutMs = rawTimeout
    ? parseInt(rawTimeout, 10)
    : API_CONSTANTS.DEFAULT_TIMEOUT_MS;
  const rawEnv = (envSource.EXPO_PUBLIC_APP_ENV || 'development').toLowerCase();
  const appEnv: AppConfig['appEnv'] =
    rawEnv === 'production' || rawEnv === 'staging' || rawEnv === 'test'
      ? rawEnv
      : 'development';

  const enableAirShuttles =
    envSource.EXPO_PUBLIC_ENABLE_AIR_SHUTTLES !== 'false';
  const enableOfflineCache =
    envSource.EXPO_PUBLIC_ENABLE_OFFLINE_CACHE !== 'false';

  return {
    apiUrl: sanitizeApiUrl(rawApiUrl),
    apiTimeoutMs: Number.isNaN(apiTimeoutMs) || apiTimeoutMs <= 0 ? API_CONSTANTS.DEFAULT_TIMEOUT_MS : apiTimeoutMs,
    appEnv,
    enableAirShuttles,
    enableOfflineCache
  };
}

function sanitizeApiUrl(url: string): string {
  const trimmed = url.trim();
  return trimmed.endsWith('/') ? trimmed.slice(0, -1) : trimmed;
}

export const appConfig = loadAppConfig();
