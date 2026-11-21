import { AuthService, unavailableAuthService, SupabaseAuthService } from '../services';
import { getSupabaseConfig, SupabaseConfig } from './supabaseConfig';
import { getSupabaseClient } from './supabaseClient';
import { SupabaseClient } from '@supabase/supabase-js';

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
 * - If Supabase credentials are valid: initializes real Supabase client and returns SupabaseAuthService
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

  return new SupabaseAuthService(client);
}
