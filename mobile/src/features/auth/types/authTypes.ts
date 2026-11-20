/**
 * Waymark Mobile — Authentication Domain Types & Contracts
 * Feature 04.1.1: Authentication Domain Contracts & Architecture
 *
 * Defines strongly typed models for user profiles, provider sessions,
 * authentication statuses, service readiness, and structured domain errors.
 */

/**
 * Core user identity representing a genuine, provider-verified user account.
 * Minimizes personal profile footprint according to privacy guidelines.
 */
export interface AuthUser {
  /** Unique provider-assigned identifier (UUID / subject string) */
  id: string;
  /** Primary user email address */
  email: string;
  /** Public display name or handle */
  displayName: string;
  /** Optional avatar or profile image URL */
  avatarUrl?: string;
  /** Whether the email has been verified by the identity provider */
  emailVerified?: boolean;
  /** Account creation timestamp (ISO 8601 string) */
  createdAt?: string;
}

/**
 * Genuine provider-issued session container.
 * Must only represent verified credentials issued by a trusted auth service.
 */
export interface AuthSession {
  /** Opaque access token for authorized API communication */
  accessToken: string;
  /** Optional refresh token for session lifecycle maintenance */
  refreshToken?: string;
  /** Expiration timestamp in UTC milliseconds */
  expiresAt: number;
  /** Authorization scheme (defaults to 'Bearer') */
  tokenType?: string;
  /** Authenticated user profile associated with this session */
  user: AuthUser;
}

/**
 * High-level authentication lifecycle status in the client application.
 */
export type AuthStatus =
  | 'initializing'
  | 'guest'
  | 'authenticating'
  | 'authenticated'
  | 'error';

/**
 * Service configuration and operational readiness status.
 * Explicitly distinguishes between user authentication state and service readiness.
 */
export type ServiceReadiness =
  | 'not_configured'
  | 'ready'
  | 'unavailable';

/**
 * Explicit error codes for authentication failure domain modeling.
 */
export type AuthErrorCode =
  | 'NOT_CONFIGURED'
  | 'INVALID_CREDENTIALS'
  | 'NETWORK_UNAVAILABLE'
  | 'SESSION_EXPIRED'
  | 'UNAUTHORIZED'
  | 'RATE_LIMITED'
  | 'PROVIDER_UNAVAILABLE'
  | 'UNKNOWN';

/**
 * Strongly typed domain error for authentication failures.
 * Ensures user-facing messages are sanitized and never leak sensitive tokens or passwords.
 */
export class AuthError extends Error {
  readonly code: AuthErrorCode;
  readonly details?: unknown;

  constructor(code: AuthErrorCode, message: string, details?: unknown) {
    super(message);
    this.name = 'AuthError';
    this.code = code;
    this.details = details;
    Object.setPrototypeOf(this, AuthError.prototype);
  }

  static notConfigured(customMessage?: string): AuthError {
    return new AuthError(
      'NOT_CONFIGURED',
      customMessage ?? 'Authentication provider is not configured. Account features are currently unavailable.'
    );
  }

  static invalidCredentials(customMessage?: string): AuthError {
    return new AuthError(
      'INVALID_CREDENTIALS',
      customMessage ?? 'Invalid email or password.'
    );
  }

  static sessionExpired(customMessage?: string): AuthError {
    return new AuthError(
      'SESSION_EXPIRED',
      customMessage ?? 'Your session has expired. Please sign in again.'
    );
  }

  static networkUnavailable(customMessage?: string): AuthError {
    return new AuthError(
      'NETWORK_UNAVAILABLE',
      customMessage ?? 'Network connection unavailable. Please check your connectivity and try again.'
    );
  }

  static rateLimited(customMessage?: string): AuthError {
    return new AuthError(
      'RATE_LIMITED',
      customMessage ?? 'Too many authentication attempts. Please wait before retrying.'
    );
  }

  static providerUnavailable(customMessage?: string): AuthError {
    return new AuthError(
      'PROVIDER_UNAVAILABLE',
      customMessage ?? 'The authentication service is temporarily unavailable. Please try again later.'
    );
  }

  static unknown(customMessage?: string, details?: unknown): AuthError {
    return new AuthError(
      'UNKNOWN',
      customMessage ?? 'An unexpected authentication error occurred.',
      details
    );
  }
}

/**
 * Credentials payload for sign-in operations.
 * Must never be retained in persistent memory or logged.
 */
export interface SignInCredentials {
  email: string;
  password: string;
}

/**
 * Payload for registration operations.
 * Must never be retained in persistent memory or logged.
 */
export interface SignUpDetails {
  email: string;
  password: string;
  displayName?: string;
}

/**
 * Standard outcome model returned by authentication service operations.
 */
export interface AuthResult {
  /** Whether the operation concluded successfully */
  success: boolean;
  /** Active session if successfully authenticated */
  session?: AuthSession;
  /** User profile if authenticated or created */
  user?: AuthUser;
  /** Whether out-of-band email verification is required before sign-in */
  requiresVerification?: boolean;
  /** Domain error describing failure cause */
  error?: AuthError;
}
