import { AuthSession } from '../types';

/**
 * Persisted session record container with version tracking.
 */
export interface StoredSessionPayload {
  version: number;
  session: AuthSession;
  storedAt: number;
}

/**
 * Standard contract for secure session credential storage.
 * Decouples platform-specific secure persistence mechanisms (Keychain, Keystore, Memory)
 * from the authentication domain.
 */
export interface AuthSessionStorage {
  /**
   * Retrieves and validates the persisted session.
   * Resolves to null if no session is stored, if the record is malformed,
   * or if the session has passed its expiration timestamp.
   */
  getSession(): Promise<AuthSession | null>;

  /**
   * Securely persists a validated provider-issued session.
   *
   * @param session The active provider session to persist
   */
  saveSession(session: AuthSession): Promise<void>;

  /**
   * Clears persisted credentials from storage.
   * Must be safe and idempotent.
   */
  clearSession(): Promise<void>;
}

export const CURRENT_SESSION_SCHEMA_VERSION = 1;
export const AUTH_SESSION_STORAGE_KEY = 'waymark_auth_session_v1';

/**
 * Validates untrusted storage data against the AuthSession schema.
 * Rejects malformed records, obsolete schema versions, and expired sessions.
 */
export function validateSessionPayload(data: unknown): AuthSession | null {
  if (!data || typeof data !== 'object') {
    return null;
  }

  const payload = data as Record<string, unknown>;
  if (payload.version !== CURRENT_SESSION_SCHEMA_VERSION) {
    return null;
  }

  if (!payload.session || typeof payload.session !== 'object') {
    return null;
  }

  const session = payload.session as Record<string, unknown>;
  if (typeof session.accessToken !== 'string' || !session.accessToken.trim()) {
    return null;
  }

  if (typeof session.expiresAt !== 'number' || isNaN(session.expiresAt)) {
    return null;
  }

  // Reject expired sessions
  if (session.expiresAt <= Date.now()) {
    return null;
  }

  if (!session.user || typeof session.user !== 'object') {
    return null;
  }

  const user = session.user as Record<string, unknown>;
  if (typeof user.id !== 'string' || !user.id.trim()) {
    return null;
  }

  if (typeof user.email !== 'string' || !user.email.includes('@')) {
    return null;
  }

  if (typeof user.displayName !== 'string') {
    return null;
  }

  return {
    accessToken: session.accessToken,
    refreshToken: typeof session.refreshToken === 'string' ? session.refreshToken : undefined,
    expiresAt: session.expiresAt,
    tokenType: typeof session.tokenType === 'string' ? session.tokenType : 'Bearer',
    user: {
      id: user.id,
      email: user.email,
      displayName: user.displayName,
      avatarUrl: typeof user.avatarUrl === 'string' ? user.avatarUrl : undefined,
      emailVerified: typeof user.emailVerified === 'boolean' ? user.emailVerified : undefined,
      createdAt: typeof user.createdAt === 'string' ? user.createdAt : undefined
    }
  };
}
