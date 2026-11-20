import * as SecureStore from 'expo-secure-store';
import {
  AUTH_SESSION_STORAGE_KEY,
  AuthSessionStorage,
  CURRENT_SESSION_SCHEMA_VERSION,
  StoredSessionPayload,
  validateSessionPayload
} from './AuthSessionStorage';
import { AuthSession } from '../types';
import { logger } from '../../../utils/logger';

/**
 * NativeAuthSessionStorage
 *
 * Implements hardware-backed secure session storage for native mobile platforms
 * (iOS Keychain & Android KeyStore) via expo-secure-store.
 *
 * Enforces strict security boundaries:
 * - Versioned storage keys
 * - Structural schema validation on read
 * - Automatic purge of expired or corrupted payloads
 * - Zero password or private telemetry logging
 */
export class NativeAuthSessionStorage implements AuthSessionStorage {
  private readonly storageKey: string;

  constructor(storageKey: string = AUTH_SESSION_STORAGE_KEY) {
    this.storageKey = storageKey;
  }

  async getSession(): Promise<AuthSession | null> {
    try {
      const raw = await SecureStore.getItemAsync(this.storageKey);
      if (!raw) {
        return null;
      }

      let parsed: unknown;
      try {
        parsed = JSON.parse(raw);
      } catch {
        logger.warn('AuthSessionStorage: Corrupted JSON encountered in secure storage; purging.');
        await this.clearSession();
        return null;
      }

      const validated = validateSessionPayload(parsed);
      if (!validated) {
        logger.warn('AuthSessionStorage: Obsolete, expired, or invalid session payload; purging.');
        await this.clearSession();
        return null;
      }

      return validated;
    } catch (error) {
      logger.error('AuthSessionStorage: Failed to read from secure store', error);
      return null;
    }
  }

  async saveSession(session: AuthSession): Promise<void> {
    if (!session || !session.accessToken) {
      throw new Error('AuthSessionStorage: Cannot persist empty or invalid session.');
    }

    if (session.expiresAt <= Date.now()) {
      throw new Error('AuthSessionStorage: Cannot persist an expired session.');
    }

    // Safety guard: ensure no password fields leaked into session object
    const sessionAny = session as unknown as Record<string, unknown>;
    if (sessionAny.password || (session.user && (session.user as unknown as Record<string, unknown>).password)) {
      throw new Error('AuthSessionStorage: Security violation - passwords must never be persisted.');
    }

    const payload: StoredSessionPayload = {
      version: CURRENT_SESSION_SCHEMA_VERSION,
      session: {
        accessToken: session.accessToken,
        refreshToken: session.refreshToken,
        expiresAt: session.expiresAt,
        tokenType: session.tokenType ?? 'Bearer',
        user: {
          id: session.user.id,
          email: session.user.email,
          displayName: session.user.displayName,
          avatarUrl: session.user.avatarUrl,
          emailVerified: session.user.emailVerified,
          createdAt: session.user.createdAt
        }
      },
      storedAt: Date.now()
    };

    try {
      await SecureStore.setItemAsync(this.storageKey, JSON.stringify(payload));
    } catch (error) {
      logger.error('AuthSessionStorage: Failed to persist session to secure store', error);
      throw error;
    }
  }

  async clearSession(): Promise<void> {
    try {
      await SecureStore.deleteItemAsync(this.storageKey);
    } catch (error) {
      logger.error('AuthSessionStorage: Failed to delete session from secure store', error);
    }
  }
}
