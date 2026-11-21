import { AuthService } from './AuthService';
import {
  AuthError,
  AuthResult,
  AuthSession,
  ServiceReadiness,
  SignInCredentials,
  SignUpDetails
} from '../types';

/**
 * UnavailableAuthService
 *
 * Safe fallback implementation for environments where no genuine authentication
 * provider (e.g. Supabase, Firebase, Auth0, Cognito) is configured.
 *
 * Adheres strictly to the Waymark critical authentication safety policy:
 * - Returns no authenticated session (always null)
 * - Never authenticates a user or issues fake tokens
 * - Never registers accounts locally or fakes a database
 * - Exposes explicit NOT_CONFIGURED error outcomes
 * - Completely side-effect free with no network requests
 */
export class UnavailableAuthService implements AuthService {
  async getCurrentSession(): Promise<AuthSession | null> {
    return null;
  }

  async signIn(_credentials: SignInCredentials): Promise<AuthResult> {
    const error = AuthError.notConfigured();
    return {
      success: false,
      error
    };
  }

  async signUp(_details: SignUpDetails): Promise<AuthResult> {
    const error = AuthError.notConfigured();
    return {
      success: false,
      error
    };
  }

  async signOut(): Promise<void> {
    // Safe idempotent no-op
    return Promise.resolve();
  }

  getServiceReadiness(): ServiceReadiness {
    return 'not_configured';
  }

  async resetPassword(_email: string): Promise<AuthResult> {
    return {
      success: false,
      error: AuthError.notConfigured('Authentication provider is not configured. Password recovery is currently unavailable.')
    };
  }

  async refreshSession(): Promise<AuthResult> {
    return {
      success: false,
      error: AuthError.notConfigured()
    };
  }

  onAuthStateChange(_callback: (session: AuthSession | null, event?: string) => void): () => void {
    return () => {};
  }

  async updatePassword(_password: string): Promise<AuthResult> {
    return {
      success: false,
      error: AuthError.notConfigured()
    };
  }
}

export const unavailableAuthService = new UnavailableAuthService();
