import { SupabaseClient, User, Session } from '@supabase/supabase-js';
import { AuthService } from './AuthService';
import {
  AuthError,
  AuthResult,
  AuthSession,
  AuthUser,
  ServiceReadiness,
  SignInCredentials,
  SignUpDetails
} from '../types';

/**
 * Safely maps a Supabase User object into the Waymark domain AuthUser model.
 *
 * Guarantees:
 * - Validates provider ID existence.
 * - Sanitizes display names and provides safe fallbacks.
 * - Extracts verification flags without trusting arbitrary profile metadata.
 * - Throws a sanitized AuthError if the payload is malformed.
 */
export function mapSupabaseUser(user: User): AuthUser {
  if (!user || typeof user.id !== 'string' || !user.id.trim()) {
    throw AuthError.unknown('Invalid user payload received from authentication provider.');
  }

  const metadata = (user.user_metadata || {}) as Record<string, unknown>;
  const rawDisplayName =
    (typeof metadata.display_name === 'string' && metadata.display_name.trim()) ||
    (typeof metadata.full_name === 'string' && metadata.full_name.trim()) ||
    (typeof metadata.name === 'string' && metadata.name.trim()) ||
    (user.email ? user.email.split('@')[0] : 'Waymark User');

  const displayName = rawDisplayName.slice(0, 50);

  return {
    id: user.id,
    email: user.email ?? '',
    displayName,
    avatarUrl: typeof metadata.avatar_url === 'string' ? metadata.avatar_url : undefined,
    emailVerified: !!user.email_confirmed_at,
    createdAt: user.created_at
  };
}

/**
 * Safely maps a Supabase Session object into the Waymark domain AuthSession container.
 *
 * Guarantees:
 * - Validates the access token string.
 * - Converts Unix epoch seconds from Supabase to UTC milliseconds for Waymark.
 * - Throws a sanitized AuthError if the payload is malformed.
 */
export function mapSupabaseSession(session: Session): AuthSession {
  if (!session || typeof session.access_token !== 'string' || !session.access_token.trim()) {
    throw AuthError.unknown('Invalid session payload received from authentication provider.');
  }

  const expiresAtMs = typeof session.expires_at === 'number'
    ? session.expires_at * 1000
    : Date.now() + ((session.expires_in ?? 3600) * 1000);

  return {
    accessToken: session.access_token,
    refreshToken: session.refresh_token,
    expiresAt: expiresAtMs,
    tokenType: session.token_type ?? 'Bearer',
    user: mapSupabaseUser(session.user)
  };
}

/**
 * Sanitizes and maps upstream Supabase errors and exceptions into domain AuthError instances.
 *
 * Security Guarantee:
 * Never leaks access tokens, passwords, authorization headers, raw server bodies,
 * internal project URLs, or stack traces to callers or user-facing messaging.
 */
export function mapSupabaseError(error: unknown): AuthError {
  if (error instanceof AuthError) {
    return error;
  }

  if (!error || typeof error !== 'object') {
    return AuthError.unknown('An unexpected authentication error occurred.');
  }

  const err = error as Record<string, unknown>;
  const rawMessage = typeof err.message === 'string' ? err.message : '';
  const status = typeof err.status === 'number' ? err.status : 0;
  const name = typeof err.name === 'string' ? err.name : '';

  // Network failures / offline connectivity
  if (
    name === 'FetchError' ||
    name === 'TypeError' ||
    /network|failed to fetch|fetch failed|connection|offline|econnrefused/i.test(rawMessage)
  ) {
    return AuthError.networkUnavailable();
  }

  // Rate limiting (HTTP 429 or explicit rate-limit responses)
  if (status === 429 || /rate limit|too many requests|over_email_send_rate_limit/i.test(rawMessage)) {
    return AuthError.rateLimited();
  }

  // Provider / Server Errors (HTTP 500, 502, 503, 504)
  if (status >= 500) {
    return AuthError.providerUnavailable();
  }

  // Invalid Credentials / Auth Failures (HTTP 400 with credential or verification errors)
  if (status === 400 || status === 401) {
    if (/invalid login credentials|invalid_grant|invalid email or password/i.test(rawMessage)) {
      return AuthError.invalidCredentials();
    }
    if (/email not confirmed/i.test(rawMessage)) {
      return new AuthError('UNAUTHORIZED', 'Please verify your email address before signing in.');
    }
    if (/user already registered/i.test(rawMessage)) {
      // Avoid account enumeration on sign-up; provide generic safe outcome
      return new AuthError('UNKNOWN', 'Unable to complete registration. Please check your information or sign in.');
    }
  }

  // Session expired
  if (/jwt expired|session expired|token expired/i.test(rawMessage)) {
    return AuthError.sessionExpired();
  }

  return AuthError.unknown('An unexpected authentication error occurred.');
}

/**
 * SupabaseAuthService
 *
 * Concrete implementation of the Waymark AuthService interface backed by Supabase Auth.
 * Adheres strictly to the Waymark zero-deception, privacy-by-design, and security policies.
 */
export class SupabaseAuthService implements AuthService {
  private readonly client: SupabaseClient | null;
  private readonly inFlightRequests: Map<string, Promise<AuthResult>> = new Map();

  constructor(client: SupabaseClient | null) {
    this.client = client;
  }

  getServiceReadiness(): ServiceReadiness {
    if (!this.client) {
      return 'not_configured';
    }
    return 'ready';
  }

  async getCurrentSession(): Promise<AuthSession | null> {
    if (!this.client) {
      return null;
    }

    try {
      const { data, error } = await this.client.auth.getSession();
      if (error || !data || !data.session) {
        return null;
      }
      return mapSupabaseSession(data.session);
    } catch {
      return null;
    }
  }

  async signIn(credentials: SignInCredentials): Promise<AuthResult> {
    if (!this.client) {
      return {
        success: false,
        error: AuthError.notConfigured()
      };
    }

    const client = this.client;
    const email = credentials?.email?.trim();
    const password = credentials?.password;

    if (!email || !password) {
      return {
        success: false,
        error: AuthError.invalidCredentials('Email and password are required.')
      };
    }

    // Deduplicate in-flight concurrent requests for identical email
    const flightKey = `signin:${email.toLowerCase()}`;
    const inFlight = this.inFlightRequests.get(flightKey);
    if (inFlight) {
      return inFlight;
    }

    const dispatch = (async (): Promise<AuthResult> => {
      try {
        const { data, error } = await client.auth.signInWithPassword({
          email,
          password
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
            error: AuthError.unknown('Authentication succeeded but no active session was returned by the provider.')
          };
        }

        const session = mapSupabaseSession(data.session);
        const user = mapSupabaseUser(data.user);

        return {
          success: true,
          session,
          user
        };
      } catch (err) {
        return {
          success: false,
          error: mapSupabaseError(err)
        };
      }
    })();

    this.inFlightRequests.set(flightKey, dispatch);
    try {
      return await dispatch;
    } finally {
      this.inFlightRequests.delete(flightKey);
    }
  }

  async signUp(details: SignUpDetails): Promise<AuthResult> {
    if (!this.client) {
      return {
        success: false,
        error: AuthError.notConfigured()
      };
    }

    const client = this.client;
    const email = details?.email?.trim();
    const password = details?.password;
    const displayName = details?.displayName?.trim();

    if (!email || !password) {
      return {
        success: false,
        error: AuthError.invalidCredentials('Email and password are required.')
      };
    }

    // Deduplicate in-flight concurrent requests for identical email
    const flightKey = `signup:${email.toLowerCase()}`;
    const inFlight = this.inFlightRequests.get(flightKey);
    if (inFlight) {
      return inFlight;
    }

    const dispatch = (async (): Promise<AuthResult> => {
      try {
        const { data, error } = await client.auth.signUp({
          email,
          password,
          options: displayName
            ? { data: { display_name: displayName, name: displayName } }
            : undefined
        });

        if (error) {
          return {
            success: false,
            error: mapSupabaseError(error)
          };
        }

        if (!data || !data.user) {
          return {
            success: false,
            error: AuthError.unknown('Registration completed but no user record was returned by the provider.')
          };
        }

        // If user returned with empty identities array (Supabase email enumeration protection),
        // treat as verification required without fabricating a session.
        if (Array.isArray(data.user.identities) && data.user.identities.length === 0) {
          return {
            success: true,
            requiresVerification: true,
            user: mapSupabaseUser(data.user)
          };
        }

        const user = mapSupabaseUser(data.user);

        // Supabase returns null session when email confirmation is enabled
        if (!data.session) {
          return {
            success: true,
            user,
            requiresVerification: true
          };
        }

        const session = mapSupabaseSession(data.session);
        return {
          success: true,
          session,
          user,
          requiresVerification: false
        };
      } catch (err) {
        return {
          success: false,
          error: mapSupabaseError(err)
        };
      }
    })();

    this.inFlightRequests.set(flightKey, dispatch);
    try {
      return await dispatch;
    } finally {
      this.inFlightRequests.delete(flightKey);
    }
  }

  async signOut(): Promise<void> {
    if (!this.client) {
      return;
    }

    try {
      await this.client.auth.signOut();
    } catch {
      // Sign-out is idempotent: remote notification errors do not block local cleanup
    }
  }
}
