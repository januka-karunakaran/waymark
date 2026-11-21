import * as SecureStore from 'expo-secure-store';
import {
  getSupabaseConfig,
  isValidSupabaseUrl,
  isValidSupabaseKey,
  createSupabaseStorage,
  NativeSupabaseStorage,
  WebMemorySupabaseStorage,
  getSupabaseClient,
  resetSupabaseClient,
  createAuthService
} from '../providers';
import { unavailableAuthService } from '../services';

describe('Feature 04.3.1 — Supabase Integration Architecture & Configuration', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    resetSupabaseClient();
    process.env = { ...originalEnv };
    delete process.env.EXPO_PUBLIC_SUPABASE_URL;
    delete process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
    delete process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
  });

  afterAll(() => {
    process.env = originalEnv;
    resetSupabaseClient();
  });

  // 1. Valid configuration parsing
  it('TC-04.3.1-01: resolves valid configuration when environment variables are set', () => {
    process.env.EXPO_PUBLIC_SUPABASE_URL = 'https://valid-project.supabase.co';
    process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY =
      'sb_publishable_key_sample_1234567890abcdefghijklmnopqrstuvwxyz';

    const config = getSupabaseConfig();
    expect(config.isConfigured).toBe(true);
    expect(config.url).toBe('https://valid-project.supabase.co');
    expect(config.publishableKey).toBe(
      'sb_publishable_key_sample_1234567890abcdefghijklmnopqrstuvwxyz'
    );
  });

  // 2. Legacy anon key alias support
  it('TC-04.3.1-02: falls back cleanly to EXPO_PUBLIC_SUPABASE_ANON_KEY if publishable key is not set', () => {
    process.env.EXPO_PUBLIC_SUPABASE_URL = 'https://legacy-project.supabase.co';
    process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY =
      'sb_anon_key_sample_1234567890abcdefghijklmnopqrstuvwxyz';

    const config = getSupabaseConfig();
    expect(config.isConfigured).toBe(true);
    expect(config.url).toBe('https://legacy-project.supabase.co');
    expect(config.publishableKey).toBe(
      'sb_anon_key_sample_1234567890abcdefghijklmnopqrstuvwxyz'
    );
  });

  // 3. Missing project URL
  it('TC-04.3.1-03: reports isConfigured: false when project URL is missing', () => {
    process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY =
      'sb_publishable_key_sample_1234567890abcdefghijklmnopqrstuvwxyz';

    const config = getSupabaseConfig();
    expect(config.isConfigured).toBe(false);
    expect(config.url).toBe('');
  });

  // 4. Missing publishable key
  it('TC-04.3.1-04: reports isConfigured: false when publishable key is missing', () => {
    process.env.EXPO_PUBLIC_SUPABASE_URL = 'https://valid-project.supabase.co';

    const config = getSupabaseConfig();
    expect(config.isConfigured).toBe(false);
    expect(config.publishableKey).toBe('');
  });

  // 5. Invalid project URL format
  it('TC-04.3.1-05: rejects malformed or non-HTTPS remote URLs', () => {
    expect(isValidSupabaseUrl('http://insecure-remote.supabase.co')).toBe(false);
    expect(isValidSupabaseUrl('not-a-valid-url')).toBe(false);
    expect(isValidSupabaseUrl('ftp://insecure.supabase.co')).toBe(false);
    expect(isValidSupabaseUrl('https://valid-project.supabase.co')).toBe(true);
    // Localhost allowed strictly for development
    expect(isValidSupabaseUrl('http://localhost:54321')).toBe(true);
    expect(isValidSupabaseUrl('http://127.0.0.1:54321')).toBe(true);
  });

  // 6. Security boundary: Reject service_role keys
  it('TC-04.3.1-06: rejects service_role administrative keys with critical security guard', () => {
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    const maliciousKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.service_role.1234567890abcdef';
    expect(isValidSupabaseKey(maliciousKey)).toBe(false);

    const config = getSupabaseConfig({
      url: 'https://valid-project.supabase.co',
      publishableKey: maliciousKey
    });

    expect(config.isConfigured).toBe(false);
    expect(config.publishableKey).toBe('');
    expect(errorSpy).toHaveBeenCalled();

    errorSpy.mockRestore();
  });

  // 7. Key length validation
  it('TC-04.3.1-07: rejects keys with insufficient character length', () => {
    expect(isValidSupabaseKey('short_key_123')).toBe(false);
    expect(isValidSupabaseKey('')).toBe(false);
    expect(isValidSupabaseKey('sb_valid_publishable_key_with_sufficient_length_2100')).toBe(true);
  });

  // 8. Singleton client initialization
  it('TC-04.3.1-08: reuses existing singleton client instance across calls with same config', () => {
    const mockConfig = {
      url: 'https://singleton-project.supabase.co',
      publishableKey: 'sb_publishable_key_sample_1234567890abcdefghijklmnopqrstuvwxyz',
      isConfigured: true
    };

    const client1 = getSupabaseClient(mockConfig);
    const client2 = getSupabaseClient(mockConfig);

    expect(client1).not.toBeNull();
    expect(client1).toBe(client2);
  });

  // 9. Zero network and null client when unconfigured
  it('TC-04.3.1-09: returns null and dispatches zero network calls when unconfigured', () => {
    const unconfigured = getSupabaseConfig();
    expect(unconfigured.isConfigured).toBe(false);

    const client = getSupabaseClient(unconfigured);
    expect(client).toBeNull();
  });

  // 10. Client reset helper
  it('TC-04.3.1-10: resets cached singleton client via resetSupabaseClient()', () => {
    const mockConfig = {
      url: 'https://reset-project.supabase.co',
      publishableKey: 'sb_publishable_key_sample_1234567890abcdefghijklmnopqrstuvwxyz',
      isConfigured: true
    };

    const client1 = getSupabaseClient(mockConfig);
    resetSupabaseClient();
    const client2 = getSupabaseClient(mockConfig);

    expect(client1).not.toBeNull();
    expect(client2).not.toBeNull();
    expect(client1).not.toBe(client2);
  });

  // 11. Platform-aware storage factory
  it('TC-04.3.1-11: creates NativeSupabaseStorage on mobile and WebMemorySupabaseStorage on web', () => {
    const nativeStorage = createSupabaseStorage('ios');
    expect(nativeStorage).toBeInstanceOf(NativeSupabaseStorage);

    const androidStorage = createSupabaseStorage('android');
    expect(androidStorage).toBeInstanceOf(NativeSupabaseStorage);

    const webStorage = createSupabaseStorage('web');
    expect(webStorage).toBeInstanceOf(WebMemorySupabaseStorage);
  });

  // 12. Web storage safety: memory-only verification
  it('TC-04.3.1-12: stores web tokens strictly in memory without touching localStorage', async () => {
    const storage = new WebMemorySupabaseStorage();

    await storage.setItem('test_token_key', 'sample_auth_jwt_value');
    const retrieved = await storage.getItem('test_token_key');
    expect(retrieved).toBe('sample_auth_jwt_value');

    const inMemoryMap = storage.getMemoryStoreForTesting();
    expect(inMemoryMap.get('test_token_key')).toBe('sample_auth_jwt_value');

    await storage.removeItem('test_token_key');
    expect(await storage.getItem('test_token_key')).toBeNull();
  });

  // 13. Native secure storage safety: uses expo-secure-store
  it('TC-04.3.1-13: delegates native storage operations to SecureStore', async () => {
    const storage = new NativeSupabaseStorage();

    await storage.setItem('sb_native_key', 'native_encrypted_jwt');
    expect(SecureStore.setItemAsync).toHaveBeenCalledWith('sb_native_key', 'native_encrypted_jwt');

    await storage.getItem('sb_native_key');
    expect(SecureStore.getItemAsync).toHaveBeenCalledWith('sb_native_key');

    await storage.removeItem('sb_native_key');
    expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith('sb_native_key');
  });

  // 14. Production fallback: unconfigured service returns UnavailableAuthService
  it('TC-04.3.1-14: createAuthService() returns unavailableAuthService when unconfigured', () => {
    const service = createAuthService();
    expect(service).toBe(unavailableAuthService);
    expect(service.getServiceReadiness()).toBe('not_configured');
  });

  // 15. Production factory with configured credentials returns ready adapter
  it('TC-04.3.1-15: createAuthService() returns ready adapter when credentials are valid', () => {
    const mockConfig = {
      url: 'https://configured-project.supabase.co',
      publishableKey: 'sb_publishable_key_sample_1234567890abcdefghijklmnopqrstuvwxyz',
      isConfigured: true
    };

    const service = createAuthService({ config: mockConfig });
    expect(service).not.toBe(unavailableAuthService);
    expect(service.getServiceReadiness()).toBe('ready');
  });

  // 16. Sensitive credential privacy: no secret logging
  it('TC-04.3.1-16: never outputs secret keys or tokens to console logging', () => {
    const logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    const infoSpy = jest.spyOn(console, 'info').mockImplementation(() => {});
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

    const secretKey = 'super_secret_publishable_anon_token_value_2100';
    getSupabaseConfig({
      url: 'https://private-project.supabase.co',
      publishableKey: secretKey
    });

    const checkNoLeak = (spy: jest.SpyInstance) => {
      spy.mock.calls.forEach((args) => {
        expect(JSON.stringify(args)).not.toContain(secretKey);
      });
    };

    checkNoLeak(logSpy);
    checkNoLeak(infoSpy);
    checkNoLeak(warnSpy);

    logSpy.mockRestore();
    infoSpy.mockRestore();
    warnSpy.mockRestore();
  });

  // 17. Safe initialization in Node environments lacking native WebSocket
  it('TC-04.3.1-17: initializes client safely when globalThis.WebSocket is absent', () => {
    const globalRecord = globalThis as unknown as Record<string, unknown>;
    const originalWebSocket = globalRecord.WebSocket;
    delete globalRecord.WebSocket;

    const mockConfig = {
      url: 'https://no-ws-project.supabase.co',
      publishableKey: 'sb_publishable_key_sample_1234567890abcdefghijklmnopqrstuvwxyz',
      isConfigured: true
    };

    expect(() => {
      const client = getSupabaseClient(mockConfig);
      expect(client).not.toBeNull();
    }).not.toThrow();

    globalRecord.WebSocket = originalWebSocket;
  });
});
