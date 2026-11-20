import * as SecureStore from 'expo-secure-store';
import {
  AUTH_SESSION_STORAGE_KEY,
  AuthSession,
  CURRENT_SESSION_SCHEMA_VERSION,
  createAuthSessionStorage,
  NativeAuthSessionStorage,
  StoredSessionPayload,
  validateSessionPayload,
  WebAuthSessionStorage
} from '../index';

describe('Feature 04.1.2 — Secure Session Storage Foundation', () => {
  const validUser = {
    id: 'usr_2100_pilot',
    email: 'pilot@waymark.local',
    displayName: 'Chief Pilot',
    avatarUrl: 'https://cdn.waymark.local/avatar.png',
    emailVerified: true
  };

  const createValidSession = (expiresInMs: number = 3600 * 1000): AuthSession => ({
    accessToken: 'valid_jwt_access_token_123',
    refreshToken: 'valid_refresh_token_456',
    expiresAt: Date.now() + expiresInMs,
    tokenType: 'Bearer',
    user: validUser
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ---------------------------------------------------------------------------
  // 1. Native Secure Storage (NativeAuthSessionStorage)
  // ---------------------------------------------------------------------------
  describe('NativeAuthSessionStorage', () => {
    let nativeStorage: NativeAuthSessionStorage;

    beforeEach(() => {
      nativeStorage = new NativeAuthSessionStorage();
    });

    // 1. SecureStore read success
    it('1. reads and validates a genuine persisted session from SecureStore', async () => {
      const session = createValidSession();
      const payload: StoredSessionPayload = {
        version: CURRENT_SESSION_SCHEMA_VERSION,
        session,
        storedAt: Date.now()
      };

      (SecureStore.getItemAsync as jest.Mock).mockResolvedValueOnce(JSON.stringify(payload));

      const retrieved = await nativeStorage.getSession();

      expect(SecureStore.getItemAsync).toHaveBeenCalledWith(AUTH_SESSION_STORAGE_KEY);
      expect(retrieved).not.toBeNull();
      expect(retrieved?.accessToken).toBe(session.accessToken);
      expect(retrieved?.user.id).toBe(session.user.id);
      expect(retrieved?.user.email).toBe(session.user.email);
    });

    // 2. SecureStore write success
    it('2. writes versioned session payload to SecureStore', async () => {
      const session = createValidSession();
      (SecureStore.setItemAsync as jest.Mock).mockResolvedValueOnce(undefined);

      await nativeStorage.saveSession(session);

      expect(SecureStore.setItemAsync).toHaveBeenCalledTimes(1);
      const [key, value] = (SecureStore.setItemAsync as jest.Mock).mock.calls[0];
      expect(key).toBe(AUTH_SESSION_STORAGE_KEY);

      const parsed = JSON.parse(value);
      expect(parsed.version).toBe(CURRENT_SESSION_SCHEMA_VERSION);
      expect(parsed.session.accessToken).toBe(session.accessToken);
      expect(parsed.session.user.id).toBe(session.user.id);
      expect(parsed.storedAt).toBeGreaterThan(0);
    });

    // 3. SecureStore deletion
    it('3. deletes session record from SecureStore on clearSession', async () => {
      (SecureStore.deleteItemAsync as jest.Mock).mockResolvedValueOnce(undefined);

      await nativeStorage.clearSession();

      expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith(AUTH_SESSION_STORAGE_KEY);
    });

    // 4. Missing record
    it('4. returns null gracefully when no record exists in SecureStore', async () => {
      (SecureStore.getItemAsync as jest.Mock).mockResolvedValueOnce(null);

      const session = await nativeStorage.getSession();
      expect(session).toBeNull();
    });

    // 5. Corrupted JSON
    it('5. handles corrupted JSON gracefully, purges storage, and returns null', async () => {
      (SecureStore.getItemAsync as jest.Mock).mockResolvedValueOnce('{corrupted_json_payload:;;;');
      (SecureStore.deleteItemAsync as jest.Mock).mockResolvedValueOnce(undefined);

      const session = await nativeStorage.getSession();

      expect(session).toBeNull();
      expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith(AUTH_SESSION_STORAGE_KEY);
    });

    // 6. Invalid payload
    it('6. rejects invalid payload missing required fields, purges, and returns null', async () => {
      const invalidPayload = {
        version: CURRENT_SESSION_SCHEMA_VERSION,
        session: {
          accessToken: '', // invalid empty token
          expiresAt: Date.now() + 100000,
          user: { id: 'u1' } // missing email and displayName
        }
      };

      (SecureStore.getItemAsync as jest.Mock).mockResolvedValueOnce(JSON.stringify(invalidPayload));
      (SecureStore.deleteItemAsync as jest.Mock).mockResolvedValueOnce(undefined);

      const session = await nativeStorage.getSession();

      expect(session).toBeNull();
      expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith(AUTH_SESSION_STORAGE_KEY);
    });

    // 7. Storage rejection
    it('7. safely handles SecureStore read rejections without crashing', async () => {
      (SecureStore.getItemAsync as jest.Mock).mockRejectedValueOnce(new Error('Keystore unreadable'));

      const session = await nativeStorage.getSession();
      expect(session).toBeNull();
    });

    // 8. Session schema version changes
    it('8. rejects and purges obsolete schema versions', async () => {
      const obsoletePayload = {
        version: 999, // unsupported future/past version
        session: createValidSession(),
        storedAt: Date.now()
      };

      (SecureStore.getItemAsync as jest.Mock).mockResolvedValueOnce(JSON.stringify(obsoletePayload));
      (SecureStore.deleteItemAsync as jest.Mock).mockResolvedValueOnce(undefined);

      const session = await nativeStorage.getSession();

      expect(session).toBeNull();
      expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith(AUTH_SESSION_STORAGE_KEY);
    });

    // 9. Expired session
    it('9. rejects and purges expired sessions upon retrieval', async () => {
      const expiredSession = createValidSession(-10000); // expired 10 seconds ago
      const payload: StoredSessionPayload = {
        version: CURRENT_SESSION_SCHEMA_VERSION,
        session: expiredSession,
        storedAt: Date.now() - 20000
      };

      (SecureStore.getItemAsync as jest.Mock).mockResolvedValueOnce(JSON.stringify(payload));
      (SecureStore.deleteItemAsync as jest.Mock).mockResolvedValueOnce(undefined);

      const session = await nativeStorage.getSession();

      expect(session).toBeNull();
      expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith(AUTH_SESSION_STORAGE_KEY);
    });

    // 10. Unsupported session values
    it('10. handles non-object and primitive storage values safely', async () => {
      (SecureStore.getItemAsync as jest.Mock).mockResolvedValueOnce(JSON.stringify('just a string'));
      (SecureStore.deleteItemAsync as jest.Mock).mockResolvedValueOnce(undefined);

      const session = await nativeStorage.getSession();
      expect(session).toBeNull();
      expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith(AUTH_SESSION_STORAGE_KEY);
    });

    // 11. No password persistence
    it('11. throws error and blocks saving if password field is detected', async () => {
      const leakedPasswordSession = {
        ...createValidSession(),
        password: 'should_never_be_saved'
      };

      await expect(
        nativeStorage.saveSession(leakedPasswordSession as unknown as AuthSession)
      ).rejects.toThrow(/Security violation/);

      expect(SecureStore.setItemAsync).not.toHaveBeenCalled();
    });

    // 14. Failed cleanup behavior
    it('14. handles deleteItemAsync rejection safely without uncaught crashes', async () => {
      (SecureStore.deleteItemAsync as jest.Mock).mockRejectedValueOnce(new Error('Hardware Keystore locked'));

      await expect(nativeStorage.clearSession()).resolves.toBeUndefined();
    });
  });

  // ---------------------------------------------------------------------------
  // 2. Web Storage Policy (WebAuthSessionStorage)
  // ---------------------------------------------------------------------------
  describe('WebAuthSessionStorage', () => {
    let webStorage: WebAuthSessionStorage;

    beforeEach(() => {
      webStorage = new WebAuthSessionStorage();
    });

    // 12. Web memory-only behavior
    it('12. retains session in transient memory only and clears properly', async () => {
      const session = createValidSession();

      await webStorage.saveSession(session);
      const retrieved = await webStorage.getSession();

      expect(retrieved).not.toBeNull();
      expect(retrieved?.accessToken).toBe(session.accessToken);
      expect(webStorage.getInMemorySessionForTesting()).toEqual(session);

      await webStorage.clearSession();
      const afterClear = await webStorage.getSession();
      expect(afterClear).toBeNull();
      expect(webStorage.getInMemorySessionForTesting()).toBeNull();
    });

    // 13. No localStorage token persistence on web
    it('13. does not invoke localStorage or sessionStorage on web', async () => {
      const mockLocalStorage = { setItem: jest.fn(), getItem: jest.fn() };
      const mockSessionStorage = { setItem: jest.fn(), getItem: jest.fn() };
      const originalGlobal = global as Record<string, unknown>;

      originalGlobal.localStorage = mockLocalStorage;
      originalGlobal.sessionStorage = mockSessionStorage;

      const session = createValidSession();

      await webStorage.saveSession(session);
      await webStorage.getSession();
      await webStorage.clearSession();

      expect(mockLocalStorage.setItem).not.toHaveBeenCalled();
      expect(mockSessionStorage.setItem).not.toHaveBeenCalled();

      delete originalGlobal.localStorage;
      delete originalGlobal.sessionStorage;
    });

    it('rejects expired sessions in memory', async () => {
      const expiredSession = createValidSession(-5000);
      await expect(webStorage.saveSession(expiredSession)).rejects.toThrow(/expired session/);
    });
  });

  // ---------------------------------------------------------------------------
  // 3. Factory Selector & Schema Validation
  // ---------------------------------------------------------------------------
  describe('createAuthSessionStorage & validateSessionPayload', () => {
    it('creates NativeAuthSessionStorage for android and ios platforms', () => {
      const iosStorage = createAuthSessionStorage('ios');
      expect(iosStorage).toBeInstanceOf(NativeAuthSessionStorage);

      const androidStorage = createAuthSessionStorage('android');
      expect(androidStorage).toBeInstanceOf(NativeAuthSessionStorage);
    });

    it('creates WebAuthSessionStorage for web platform', () => {
      const webStorage = createAuthSessionStorage('web');
      expect(webStorage).toBeInstanceOf(WebAuthSessionStorage);
    });

    it('validateSessionPayload rejects null, undefined, and non-object inputs', () => {
      expect(validateSessionPayload(null)).toBeNull();
      expect(validateSessionPayload(undefined)).toBeNull();
      expect(validateSessionPayload(123)).toBeNull();
      expect(validateSessionPayload('string')).toBeNull();
      expect(validateSessionPayload([])).toBeNull();
    });
  });
});
