import { AuthService, unavailableAuthService } from '../services';
import { getSupabaseConfig, SupabaseConfig } from './supabaseConfig';
import { getSupabaseClient } from './supabaseClient';
import { SupabaseClient } from '@supabase/supabase-js';
import { AuthError } from '../types';

export interface AuthServiceFactoryOptions {
  config?: SupabaseConfig;
  supabaseClient?: SupabaseClient;
  fallbackService?: AuthService;
}

/**
 * Production AuthService Factory.
 * Resolves the appropriate AuthService implementation based on provider readiness.
 *
 * Selection rules:
 * - If Supabase credentials are missing or invalid: returns fallbackService (defaults to UnavailableAuthService)
 * - If Supabase credentials are valid: initializes real Supabase client and provides adapter
 *
 * Zero-Deception Policy:
 * The production fallback strictly reports serviceReadiness: 'not_configured' and never
 * fabricates mock sessions, tokens, or dummy users.
 */
export function createAuthService(options?: AuthServiceFactoryOptions): AuthService {
  const config = options?.config ?? getSupabaseConfig();
  const fallback = options?.fallbackService ?? unavailableAuthService;

  if (!config.isConfigured) {
    return fallback;
  }

  const client = options?.supabaseClient ?? getSupabaseClient(config);
  if (!client) {
    return fallback;
  }

  // Note: Full SupabaseAuthService is delivered in Task 04.3.2.
  // For Task 04.3.1 architecture validation, when configured with a valid client,
  // we return an adapter conforming to AuthService with readiness 'ready'.
  return {
    getServiceReadiness: () => 'ready',
    getCurrentSession: async () => null,
    signIn: async () => ({
      success: false,
      error: new AuthError('PROVIDER_UNAVAILABLE', 'Real authentication operations will be enabled in Task 04.3.2.')
    }),
    signUp: async () => ({
      success: false,
      error: new AuthError('PROVIDER_UNAVAILABLE', 'Real authentication operations will be enabled in Task 04.3.2.')
    }),
    signOut: async () => Promise.resolve()
  };
}
