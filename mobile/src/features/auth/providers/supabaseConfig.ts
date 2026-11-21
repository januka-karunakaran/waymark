import { logger } from '../../../utils/logger';

/**
 * Strongly typed Supabase project configuration model.
 */
export interface SupabaseConfig {
  /** Supabase Project URL (e.g. https://xyz.supabase.co) */
  url: string;
  /** Supabase Publishable / Anon Key */
  publishableKey: string;
  /** Whether URL and publishable key are present and structurally valid */
  isConfigured: boolean;
}

const URL_REGEX = /^https:\/\/[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}(:\d+)?(\/.*)?$/;
// Allows localhost / 127.0.0.1 strictly for local automated development and testing
const LOCAL_URL_REGEX = /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?(\/.*)?$/;

/**
 * Validates Supabase project URL.
 * Requires HTTPS for all remote domains; permits HTTP strictly for localhost/127.0.0.1.
 */
export function isValidSupabaseUrl(url: string): boolean {
  if (!url || typeof url !== 'string') return false;
  const trimmed = url.trim();
  return URL_REGEX.test(trimmed) || LOCAL_URL_REGEX.test(trimmed);
}

/**
 * Validates Supabase client API key.
 * Enforces minimum length and strictly prohibits service_role keys in mobile client code.
 */
export function isValidSupabaseKey(key: string): boolean {
  if (!key || typeof key !== 'string') return false;
  const trimmed = key.trim();
  if (trimmed.length < 20) return false;

  // Security Guard: Prohibit administrative service_role tokens in client bundles
  if (trimmed.includes('service_role')) {
    logger.error(
      'CRITICAL SECURITY VIOLATION: Supabase service_role key detected in mobile client configuration. Rejecting key.'
    );
    return false;
  }

  return true;
}

function getEnvVar(key: string): string {
  if (typeof process !== 'undefined' && process.env) {
    return (process.env as Record<string, string | undefined>)[key] ?? '';
  }
  return '';
}

/**
 * Resolves and validates Supabase configuration from environment variables or custom overrides.
 *
 * Environment variables evaluated:
 * - EXPO_PUBLIC_SUPABASE_URL
 * - EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY (preferred) or EXPO_PUBLIC_SUPABASE_ANON_KEY (legacy fallback)
 *
 * Safe Degraded Behavior:
 * If either variable is missing, empty, or invalid, returns isConfigured: false with empty strings.
 * Never throws exceptions or leaks key contents.
 */
export function getSupabaseConfig(envOverrides?: {
  url?: string;
  publishableKey?: string;
}): SupabaseConfig {
  const rawUrl = envOverrides?.url ?? getEnvVar('EXPO_PUBLIC_SUPABASE_URL');
  const rawKey =
    envOverrides?.publishableKey ??
    (getEnvVar('EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY') ||
      getEnvVar('EXPO_PUBLIC_SUPABASE_ANON_KEY'));

  const trimmedUrl = typeof rawUrl === 'string' ? rawUrl.trim() : '';
  const trimmedKey = typeof rawKey === 'string' ? rawKey.trim() : '';

  const isUrlValid = isValidSupabaseUrl(trimmedUrl);
  const isKeyValid = isValidSupabaseKey(trimmedKey);

  const isConfigured = Boolean(isUrlValid && isKeyValid);

  return {
    url: isUrlValid ? trimmedUrl : '',
    publishableKey: isKeyValid ? trimmedKey : '',
    isConfigured
  };
}
