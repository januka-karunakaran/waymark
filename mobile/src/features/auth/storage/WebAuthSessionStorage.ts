import { AuthSessionStorage } from './AuthSessionStorage';
import { AuthSession } from '../types';

/**
 * WebAuthSessionStorage
 *
 * Implements session storage for Web environments strictly following the
 * Waymark critical authentication safety policy.
 *
 * Security Rationale:
 * Browser localStorage and sessionStorage are accessible to client-side scripts
 * and vulnerable to Cross-Site Scripting (XSS). Persisting long-lived access tokens
 * or refresh tokens in localStorage is prohibited.
 *
 * WebAuthSessionStorage keeps credentials in-memory ONLY.
 * Web session persistence requires future backend-driven HttpOnly; Secure; SameSite=Strict cookies.
 */
export class WebAuthSessionStorage implements AuthSessionStorage {
  private inMemorySession: AuthSession | null = null;

  async getSession(): Promise<AuthSession | null> {
    if (!this.inMemorySession) {
      return null;
    }

    // Reject expired sessions
    if (this.inMemorySession.expiresAt <= Date.now()) {
      this.inMemorySession = null;
      return null;
    }

    return this.inMemorySession;
  }

  async saveSession(session: AuthSession): Promise<void> {
    if (!session || !session.accessToken) {
      throw new Error('WebAuthSessionStorage: Cannot persist empty or invalid session.');
    }

    if (session.expiresAt <= Date.now()) {
      throw new Error('WebAuthSessionStorage: Cannot persist an expired session.');
    }

    // Retained strictly in transient memory
    this.inMemorySession = { ...session };
  }

  async clearSession(): Promise<void> {
    this.inMemorySession = null;
    return Promise.resolve();
  }

  /**
   * Test inspection helper to verify memory-only constraint.
   */
  getInMemorySessionForTesting(): AuthSession | null {
    return this.inMemorySession;
  }
}
