import { SupabaseClient, User, Session } from '@supabase/supabase-js';
import {
  SupabaseAuthService,
  mapSupabaseUser,
  mapSupabaseSession,
  mapSupabaseError
} from '../services/SupabaseAuthService';
import { createAuthService } from '../providers/authServiceFactory';
import { SupabaseConfig } from '../providers/supabaseConfig';

describe('SupabaseAuthService — Real Provider Adapter (Feature 04.3.2)', () => {
  const createMockClient = (overrides: Record<string, unknown> = {}): SupabaseClient => {
    return {
      auth: {
        signInWithPassword: jest.fn(),
        signUp: jest.fn(),
        getSession: jest.fn(),
        signOut: jest.fn(),
        ...overrides
      }
    } as unknown as SupabaseClient;
  };

  const sampleSupabaseUser = {
    id: 'usr-real-uuid-1234',
    email: 'passenger@example.com',
    user_metadata: {
      display_name: 'Colombo Commuter'
    },
    email_confirmed_at: '2026-11-21T10:00:00.000Z',
    created_at: '2026-11-20T08:00:00.000Z'
  };

  const sampleSupabaseSession = {
    access_token: 'provider-issued-jwt-token-xyz',
    refresh_token: 'provider-issued-refresh-token-xyz',
    expires_at: 1763730000, // seconds since epoch
    token_type: 'Bearer',
    user: sampleSupabaseUser
  };

  // 1. Successful test-provider sign-in
  it('TC-04.3.2-01: handles successful test-provider sign-in with genuine session and user mapping', async () => {
    const mockClient = createMockClient({
      signInWithPassword: jest.fn().mockResolvedValue({
        data: {
          session: sampleSupabaseSession,
          user: sampleSupabaseUser
        },
        error: null
      })
    });

    const service = new SupabaseAuthService(mockClient);
    const result = await service.signIn({
      email: 'passenger@example.com',
      password: 'SecurePassword123!'
    });

    expect(result.success).toBe(true);
    expect(result.session).toBeDefined();
    expect(result.session?.accessToken).toBe('provider-issued-jwt-token-xyz');
    expect(result.session?.expiresAt).toBe(1763730000 * 1000); // Converted to ms
    expect(result.user?.id).toBe('usr-real-uuid-1234');
    expect(result.user?.email).toBe('passenger@example.com');
    expect(result.user?.displayName).toBe('Colombo Commuter');
    expect(result.user?.emailVerified).toBe(true);
  });

  // 2. Invalid credentials
  it('TC-04.3.2-02: maps provider invalid credentials to generic domain AuthError', async () => {
    const mockClient = createMockClient({
      signInWithPassword: jest.fn().mockResolvedValue({
        data: { session: null, user: null },
        error: { message: 'Invalid login credentials', status: 400 }
      })
    });

    const service = new SupabaseAuthService(mockClient);
    const result = await service.signIn({
      email: 'passenger@example.com',
      password: 'WrongPassword999!'
    });

    expect(result.success).toBe(false);
    expect(result.error?.code).toBe('INVALID_CREDENTIALS');
    expect(result.error?.message).toBe('Invalid email or password.');
    expect(result.session).toBeUndefined();
  });

  // 3. Network failure
  it('TC-04.3.2-03: maps network and fetch failures to NETWORK_UNAVAILABLE', async () => {
    const mockClient = createMockClient({
      signInWithPassword: jest.fn().mockRejectedValue(new TypeError('Network request failed'))
    });

    const service = new SupabaseAuthService(mockClient);
    const result = await service.signIn({
      email: 'passenger@example.com',
      password: 'SecurePassword123!'
    });

    expect(result.success).toBe(false);
    expect(result.error?.code).toBe('NETWORK_UNAVAILABLE');
    expect(result.error?.message).toContain('Network connection unavailable');
  });

  // 4. Provider unavailable
  it('TC-04.3.2-04: maps upstream 5xx errors to PROVIDER_UNAVAILABLE', async () => {
    const mockClient = createMockClient({
      signInWithPassword: jest.fn().mockResolvedValue({
        data: { session: null, user: null },
        error: { message: 'Internal Server Error', status: 500 }
      })
    });

    const service = new SupabaseAuthService(mockClient);
    const result = await service.signIn({
      email: 'passenger@example.com',
      password: 'SecurePassword123!'
    });

    expect(result.success).toBe(false);
    expect(result.error?.code).toBe('PROVIDER_UNAVAILABLE');
    expect(result.error?.message).toContain('temporarily unavailable');
  });

  // 5. Rate limiting
  it('TC-04.3.2-05: maps HTTP 429 and rate-limit errors to RATE_LIMITED', async () => {
    const mockClient = createMockClient({
      signInWithPassword: jest.fn().mockResolvedValue({
        data: { session: null, user: null },
        error: { message: 'over_email_send_rate_limit', status: 429 }
      })
    });

    const service = new SupabaseAuthService(mockClient);
    const result = await service.signIn({
      email: 'passenger@example.com',
      password: 'SecurePassword123!'
    });

    expect(result.success).toBe(false);
    expect(result.error?.code).toBe('RATE_LIMITED');
    expect(result.error?.message).toContain('Too many authentication attempts');
  });

  // 6. Invalid user payload
  it('TC-04.3.2-06: safely rejects malformed user payload from provider without crashing', async () => {
    const mockClient = createMockClient({
      signInWithPassword: jest.fn().mockResolvedValue({
        data: {
          session: sampleSupabaseSession,
          user: { id: '', email: null } // Corrupt payload
        },
        error: null
      })
    });

    const service = new SupabaseAuthService(mockClient);
    const result = await service.signIn({
      email: 'passenger@example.com',
      password: 'SecurePassword123!'
    });

    expect(result.success).toBe(false);
    expect(result.error?.code).toBe('UNKNOWN');
    expect(result.session).toBeUndefined();
  });

  // 7. Invalid session payload
  it('TC-04.3.2-07: safely rejects malformed session payload missing access_token', async () => {
    const mockClient = createMockClient({
      signInWithPassword: jest.fn().mockResolvedValue({
        data: {
          session: { access_token: '', user: sampleSupabaseUser },
          user: sampleSupabaseUser
        },
        error: null
      })
    });

    const service = new SupabaseAuthService(mockClient);
    const result = await service.signIn({
      email: 'passenger@example.com',
      password: 'SecurePassword123!'
    });

    expect(result.success).toBe(false);
    expect(result.error?.code).toBe('UNKNOWN');
    expect(result.session).toBeUndefined();
  });

  // 8. Successful test-provider sign-up with immediate session
  it('TC-04.3.2-08: handles sign-up when session is immediately granted', async () => {
    const mockClient = createMockClient({
      signUp: jest.fn().mockResolvedValue({
        data: {
          session: sampleSupabaseSession,
          user: sampleSupabaseUser
        },
        error: null
      })
    });

    const service = new SupabaseAuthService(mockClient);
    const result = await service.signUp({
      email: 'passenger@example.com',
      password: 'SecurePassword123!',
      displayName: 'Colombo Commuter'
    });

    expect(result.success).toBe(true);
    expect(result.requiresVerification).toBe(false);
    expect(result.session).toBeDefined();
    expect(result.user?.id).toBe('usr-real-uuid-1234');
  });

  // 9. Verification-required registration
  it('TC-04.3.2-09: marks requiresVerification true when session is null on sign-up', async () => {
    const mockClient = createMockClient({
      signUp: jest.fn().mockResolvedValue({
        data: {
          session: null,
          user: {
            ...sampleSupabaseUser,
            email_confirmed_at: null
          }
        },
        error: null
      })
    });

    const service = new SupabaseAuthService(mockClient);
    const result = await service.signUp({
      email: 'unconfirmed@example.com',
      password: 'SecurePassword123!'
    });

    expect(result.success).toBe(true);
    expect(result.requiresVerification).toBe(true);
    expect(result.session).toBeUndefined();
    expect(result.user?.emailVerified).toBe(false);
  });

  // 10. Registration without session (Supabase user enumeration protection)
  it('TC-04.3.2-10: handles duplicate account signup safely without fabricating a session', async () => {
    const mockClient = createMockClient({
      signUp: jest.fn().mockResolvedValue({
        data: {
          session: null,
          user: {
            ...sampleSupabaseUser,
            identities: [] // Supabase returns empty identities when user already exists
          }
        },
        error: null
      })
    });

    const service = new SupabaseAuthService(mockClient);
    const result = await service.signUp({
      email: 'existing@example.com',
      password: 'SecurePassword123!'
    });

    expect(result.success).toBe(true);
    expect(result.requiresVerification).toBe(true);
    expect(result.session).toBeUndefined();
  });

  // 11. No fake account creation on sign-in
  it('TC-04.3.2-11: never creates accounts or returns dummy sessions during failed sign-in', async () => {
    const mockClient = createMockClient({
      signInWithPassword: jest.fn().mockResolvedValue({
        data: { session: null, user: null },
        error: { message: 'Invalid login credentials', status: 400 }
      })
    });

    const service = new SupabaseAuthService(mockClient);
    const result = await service.signIn({
      email: 'nonexistent@example.com',
      password: 'NonExistentPassword123!'
    });

    expect(result.success).toBe(false);
    expect(result.error?.code).toBe('INVALID_CREDENTIALS');
    expect(result.session).toBeUndefined();
    expect(result.user).toBeUndefined();
    // Confirm signUp was never called
    expect(mockClient.auth.signUp).not.toHaveBeenCalled();
  });

  // 12. No password persistence
  it('TC-04.3.2-12: does not persist passwords or store credentials in memory/properties', async () => {
    const mockClient = createMockClient({
      signInWithPassword: jest.fn().mockResolvedValue({
        data: { session: sampleSupabaseSession, user: sampleSupabaseUser },
        error: null
      })
    });

    const service = new SupabaseAuthService(mockClient);
    const secretPassword = 'UltraConfidentialPassword#2026';
    await service.signIn({
      email: 'passenger@example.com',
      password: secretPassword
    });

    const serialized = JSON.stringify(service);
    expect(serialized).not.toContain(secretPassword);
    expect((service as unknown as Record<string, unknown>).password).toBeUndefined();
  });

  // 13. No token exposure in errors
  it('TC-04.3.2-13: strictly strips sensitive tokens and headers from error messages', () => {
    const sensitiveError = {
      message: 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.secret failed for project ref test-ref-1234',
      status: 400
    };

    const sanitized = mapSupabaseError(sensitiveError);
    expect(sanitized.message).not.toContain('eyJhbGciOiJIUzI1Ni');
    expect(sanitized.message).not.toContain('test-ref-1234');
    expect(sanitized.message).toBe('An unexpected authentication error occurred.');
  });

  // 14. No duplicate dispatches
  it('TC-04.3.2-14: deduplicates concurrent in-flight sign-in requests for identical email', async () => {
    let resolveSignIn: (val: unknown) => void;
    const pendingPromise = new Promise((resolve) => {
      resolveSignIn = resolve;
    });

    const signInMock = jest.fn().mockImplementation(() => pendingPromise);
    const mockClient = createMockClient({
      signInWithPassword: signInMock
    });

    const service = new SupabaseAuthService(mockClient);

    const call1 = service.signIn({
      email: 'passenger@example.com',
      password: 'SecurePassword123!'
    });
    const call2 = service.signIn({
      email: 'passenger@example.com',
      password: 'SecurePassword123!'
    });

    expect(signInMock).toHaveBeenCalledTimes(1);

    resolveSignIn!({
      data: { session: sampleSupabaseSession, user: sampleSupabaseUser },
      error: null
    });

    const [res1, res2] = await Promise.all([call1, call2]);
    expect(res1.success).toBe(true);
    expect(res2.success).toBe(true);
    expect(signInMock).toHaveBeenCalledTimes(1);
  });

  // 15. Safe service-readiness behavior
  it('TC-04.3.2-15: handles unconfigured client cleanly and reports readiness correctly', async () => {
    const unconfiguredService = new SupabaseAuthService(null);

    expect(unconfiguredService.getServiceReadiness()).toBe('not_configured');

    const signInRes = await unconfiguredService.signIn({
      email: 'test@example.com',
      password: 'Password123!'
    });
    expect(signInRes.success).toBe(false);
    expect(signInRes.error?.code).toBe('NOT_CONFIGURED');

    const signUpRes = await unconfiguredService.signUp({
      email: 'test@example.com',
      password: 'Password123!'
    });
    expect(signUpRes.success).toBe(false);
    expect(signUpRes.error?.code).toBe('NOT_CONFIGURED');

    const session = await unconfiguredService.getCurrentSession();
    expect(session).toBeNull();

    await expect(unconfiguredService.signOut()).resolves.toBeUndefined();
  });

  // 16. Factory integration
  it('TC-04.3.2-16: createAuthService integrates SupabaseAuthService when configured', () => {
    const validConfig: SupabaseConfig = {
      url: 'https://test-ref.supabase.co',
      publishableKey: 'valid-test-anon-publishable-key-1234567890',
      isConfigured: true
    };

    const mockClient = createMockClient();
    const service = createAuthService({
      config: validConfig,
      supabaseClient: mockClient
    });

    expect(service.getServiceReadiness()).toBe('ready');
    expect(service instanceof SupabaseAuthService).toBe(true);
  });

  // Helper unit tests for mapSupabaseUser and mapSupabaseSession
  it('TC-04.3.2-17: mapSupabaseUser safely extracts display name fallbacks', () => {
    const userWithName = {
      id: 'uuid-1',
      email: 'test@example.com',
      user_metadata: { full_name: 'Jane Doe' }
    } as unknown as User;
    expect(mapSupabaseUser(userWithName).displayName).toBe('Jane Doe');

    const userWithNoName = {
      id: 'uuid-2',
      email: 'rider@example.com',
      user_metadata: {}
    } as unknown as User;
    expect(mapSupabaseUser(userWithNoName).displayName).toBe('rider');
  });

  it('TC-04.3.2-18: mapSupabaseSession calculates expiresAt from expires_in when expires_at is omitted', () => {
    const before = Date.now();
    const sessionNoExpiresAt = {
      access_token: 'valid-token',
      expires_in: 3600,
      user: sampleSupabaseUser
    } as unknown as Session;
    const mapped = mapSupabaseSession(sessionNoExpiresAt);
    expect(mapped.expiresAt).toBeGreaterThanOrEqual(before + 3600 * 1000 - 50);
  });
});
