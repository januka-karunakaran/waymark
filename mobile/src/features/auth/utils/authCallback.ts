import { SupabaseClient } from '@supabase/supabase-js';
import { AuthError, AuthResult } from '../types';
import { mapSupabaseError, mapSupabaseSession, mapSupabaseUser } from '../services/SupabaseAuthService';

export interface ParsedAuthCallback {
  isValid: boolean;
  type: 'code' | 'token' | 'error' | 'invalid';
  code?: string;
  accessToken?: string;
  refreshToken?: string;
  expiresIn?: number;
  tokenType?: string;
  error?: string;
  errorDescription?: string;
  actionType?: string;
  rejectionReason?: string;
}

/**
 * Validates whether an incoming URL is an authorized, safe authentication callback.
 *
 * Security Requirements:
 * - Scheme must strictly match the authorized app scheme (defaults to 'waymark').
 * - Dangerous schemes (javascript:, file:, data:, blob:) are unconditionally rejected.
 * - Host and path must conform to the designated auth callback route ('auth/callback' or '/auth/callback').
 * - Path traversal attempts ('..', '%2e') are detected and rejected.
 */
export function validateCallbackUrl(
  url: string,
  allowedScheme: string = 'waymark'
): { isValid: boolean; reason?: string } {
  if (!url || typeof url !== 'string' || !url.trim()) {
    return { isValid: false, reason: 'Empty or missing callback URL.' };
  }

  const trimmed = url.trim();

  // Guard against dangerous schemes
  const lower = trimmed.toLowerCase();
  if (
    lower.startsWith('javascript:') ||
    lower.startsWith('data:') ||
    lower.startsWith('file:') ||
    lower.startsWith('blob:') ||
    lower.startsWith('about:')
  ) {
    return { isValid: false, reason: 'Dangerous URI scheme detected.' };
  }

  // Guard against directory traversal
  if (trimmed.includes('..') || lower.includes('%2e%2e') || lower.includes('%2f%2e')) {
    return { isValid: false, reason: 'Directory traversal payload detected.' };
  }

  // Check scheme
  const schemePrefix = `${allowedScheme.toLowerCase()}:`;
  if (!lower.startsWith(schemePrefix)) {
    return { isValid: false, reason: `URL scheme does not match expected '${allowedScheme}:'.` };
  }

  // Verify host and path
  // Standard format: waymark://auth/callback
  const afterScheme = trimmed.slice(schemePrefix.length);
  const normalizedPath = afterScheme.replace(/^\/+/, '');
  const pathWithoutQuery = normalizedPath.split('?')[0].split('#')[0];

  if (pathWithoutQuery !== 'auth/callback') {
    return { isValid: false, reason: `Callback path '${pathWithoutQuery}' is not authorized.` };
  }

  return { isValid: true };
}

/**
 * Parses parameters from an authentication callback URL.
 * Handles both PKCE code query strings and implicit grant hash fragments.
 */
export function parseAuthCallbackUrl(
  url: string,
  allowedScheme: string = 'waymark'
): ParsedAuthCallback {
  const validation = validateCallbackUrl(url, allowedScheme);
  if (!validation.isValid) {
    return {
      isValid: false,
      type: 'invalid',
      rejectionReason: validation.reason
    };
  }

  try {
    const queryIndex = url.indexOf('?');
    const hashIndex = url.indexOf('#');

    // Extract query parameters
    const queryParams: Record<string, string> = {};
    if (queryIndex !== -1) {
      const queryString = hashIndex > queryIndex
        ? url.slice(queryIndex + 1, hashIndex)
        : url.slice(queryIndex + 1);
      for (const pair of queryString.split('&')) {
        const [k, v] = pair.split('=');
        if (k) queryParams[decodeURIComponent(k)] = decodeURIComponent(v || '');
      }
    }

    // Extract hash parameters
    const hashParams: Record<string, string> = {};
    if (hashIndex !== -1) {
      const hashString = url.slice(hashIndex + 1);
      for (const pair of hashString.split('&')) {
        const [k, v] = pair.split('=');
        if (k) hashParams[decodeURIComponent(k)] = decodeURIComponent(v || '');
      }
    }

    // Check for provider error responses
    const error = queryParams.error || hashParams.error;
    const errorDescription = queryParams.error_description || hashParams.error_description;
    if (error) {
      return {
        isValid: true,
        type: 'error',
        error,
        errorDescription
      };
    }

    // PKCE authorization code flow
    if (queryParams.code) {
      return {
        isValid: true,
        type: 'code',
        code: queryParams.code,
        actionType: queryParams.type
      };
    }

    // Implicit grant hash fragment
    if (hashParams.access_token) {
      return {
        isValid: true,
        type: 'token',
        accessToken: hashParams.access_token,
        refreshToken: hashParams.refresh_token,
        expiresIn: hashParams.expires_in ? parseInt(hashParams.expires_in, 10) : undefined,
        tokenType: hashParams.token_type || 'Bearer',
        actionType: hashParams.type
      };
    }

    return {
      isValid: false,
      type: 'invalid',
      rejectionReason: 'No authorization code or tokens found in callback parameters.'
    };
  } catch {
    return {
      isValid: false,
      type: 'invalid',
      rejectionReason: 'Failed to parse callback parameters.'
    };
  }
}

/**
 * Handles an incoming authentication callback using the Supabase client.
 *
 * Supports:
 * - PKCE code exchange: client.auth.exchangeCodeForSession(code)
 * - Implicit token restoration: client.auth.setSession({ access_token, refresh_token })
 */
export async function handleAuthCallback(
  url: string,
  client: SupabaseClient | null,
  allowedScheme: string = 'waymark'
): Promise<AuthResult> {
  if (!client) {
    return {
      success: false,
      error: AuthError.notConfigured('Authentication provider is not configured.')
    };
  }

  const parsed = parseAuthCallbackUrl(url, allowedScheme);

  if (!parsed.isValid) {
    return {
      success: false,
      error: AuthError.unknown(parsed.rejectionReason ?? 'Invalid or unauthorized callback URL.')
    };
  }

  if (parsed.type === 'error') {
    return {
      success: false,
      error: mapSupabaseError({ message: parsed.errorDescription || parsed.error })
    };
  }

  // 1. Handle PKCE Code exchange
  if (parsed.type === 'code' && parsed.code) {
    try {
      const { data, error } = await client.auth.exchangeCodeForSession(parsed.code);
      if (error) {
        return {
          success: false,
          error: mapSupabaseError(error)
        };
      }

      if (!data || !data.session || !data.user) {
        return {
          success: false,
          error: AuthError.unknown('Code exchange succeeded but no active session was returned.')
        };
      }

      return {
        success: true,
        session: mapSupabaseSession(data.session),
        user: mapSupabaseUser(data.user)
      };
    } catch (err) {
      return {
        success: false,
        error: mapSupabaseError(err)
      };
    }
  }

  // 2. Handle Implicit token setSession
  if (parsed.type === 'token' && parsed.accessToken) {
    try {
      const { data, error } = await client.auth.setSession({
        access_token: parsed.accessToken,
        refresh_token: parsed.refreshToken || ''
      });

      if (error) {
        return {
          success: false,
          error: mapSupabaseError(error)
        };
      }

      if (!data || !data.session || !data.user) {
        return {
          success: false,
          error: AuthError.unknown('Token session established but no active session returned.')
        };
      }

      return {
        success: true,
        session: mapSupabaseSession(data.session),
        user: mapSupabaseUser(data.user)
      };
    } catch (err) {
      return {
        success: false,
        error: mapSupabaseError(err)
      };
    }
  }

  return {
    success: false,
    error: AuthError.unknown('Unsupported callback format.')
  };
}
