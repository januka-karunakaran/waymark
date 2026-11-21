import {
  AuthResult,
  AuthSession,
  ServiceReadiness,
  SignInCredentials,
  SignUpDetails
} from '../types';

/**
 * AuthService
 *
 * Core replaceable service interface decoupling the Waymark Mobile client
 * from specific authentication providers (e.g. Supabase, Firebase, Auth0, Cognito, or custom OAuth2/OIDC).
 *
 * All implementations must strictly conform to:
 * - Returning only genuine, verified sessions (no fabricated tokens)
 * - Safe handling of credentials (no passwords persisted)
 * - Sanitized domain error reporting
 * - Single authority of truth for session and lifecycle maintenance
 */
export interface AuthService {
  /**
   * Retrieves the currently active and validated provider session.
   * Resolves to null when in guest mode or when no valid session exists.
   */
  getCurrentSession(): Promise<AuthSession | null>;

  /**
   * Authenticates against the configured identity provider using email & password.
   *
   * @param credentials Email and password payload
   * @returns AuthResult containing session upon success or typed AuthError upon failure
   */
  signIn(credentials: SignInCredentials): Promise<AuthResult>;

  /**
   * Registers a new user account with the configured identity provider.
   * May require out-of-band email verification before session issuance.
   *
   * @param details Registration payload
   * @returns AuthResult containing user/session or verification flags
   */
  signUp(details: SignUpDetails): Promise<AuthResult>;

  /**
   * Revokes the active session with the remote identity provider and cleans up credentials.
   * Must be idempotent and safe to call when unauthenticated.
   */
  signOut(): Promise<void>;

  /**
   * Returns the current operational readiness of the authentication service.
   * Used by UI and Context layers to determine whether auth actions can be dispatched.
   */
  getServiceReadiness(): ServiceReadiness;

  /**
   * Dispatches an account password recovery request via the identity provider.
   *
   * @param email Validated email address
   * @returns AuthResult indicating whether the reset dispatch was accepted
   */
  resetPassword?(email: string): Promise<AuthResult>;

  /**
   * Explicitly revalidates and refreshes the current session with the provider.
   *
   * @returns AuthResult containing the refreshed session or expired error
   */
  refreshSession?(): Promise<AuthResult>;

  /**
   * Attaches an event listener for provider-driven authentication state changes.
   * (e.g. background token refresh, user sign-out, session revocation).
   *
   * @param callback Handler receiving the updated session or null
   * @returns Unsubscribe function
   */
  onAuthStateChange?(callback: (session: AuthSession | null, event?: string) => void): () => void;

  /**
   * Updates the password for an authenticated or recovery-linked user session.
   *
   * @param password New password
   * @returns AuthResult indicating update outcome
   */
  updatePassword?(password: string): Promise<AuthResult>;
}
