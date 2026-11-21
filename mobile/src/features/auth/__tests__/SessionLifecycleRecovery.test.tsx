import React from 'react';
import { render, screen, act, waitFor, fireEvent } from '@testing-library/react-native';
import { Text, View, Button } from 'react-native';
import { SupabaseClient, Session, User } from '@supabase/supabase-js';
import { AuthProvider } from '../context/AuthContext';
import { useAuth } from '../hooks/useAuth';
import { SupabaseAuthService } from '../services/SupabaseAuthService';
import { AuthSessionStorage } from '../storage/AuthSessionStorage';
import { AuthSession, AuthUser } from '../types';
import {
  validateCallbackUrl,
  parseAuthCallbackUrl,
  handleAuthCallback
} from '../utils/authCallback';

// In-Memory Test Session Storage
class MockSessionStorage implements AuthSessionStorage {
  private session: AuthSession | null = null;
  public getCalls = 0;
  public saveCalls = 0;
  public clearCalls = 0;

  constructor(initialSession: AuthSession | null = null) {
    this.session = initialSession;
  }

  async getSession(): Promise<AuthSession | null> {
    this.getCalls++;
    return this.session;
  }

  async saveSession(s: AuthSession): Promise<void> {
    this.saveCalls++;
    this.session = s;
  }

  async clearSession(): Promise<void> {
    this.clearCalls++;
    this.session = null;
  }
}

// Consumer test harness
const TestHarness: React.FC<{ onAuthReady?: (auth: ReturnType<typeof useAuth>) => void }> = ({
  onAuthReady
}) => {
  const auth = useAuth();
  React.useEffect(() => {
    onAuthReady?.(auth);
  }, [auth, onAuthReady]);

  return (
    <View testID="test-harness">
      <Text testID="auth-status">{auth.status}</Text>
      <Text testID="auth-email">{auth.user?.email ?? 'none'}</Text>
      <Text testID="auth-is-auth">{auth.isAuthenticated ? 'true' : 'false'}</Text>
      <Button title="Sign Out" testID="btn-sign-out" onPress={() => auth.signOut()} />
      <Button
        title="Reset"
        testID="btn-reset"
        onPress={() => auth.resetPassword('pilot@waymark.local')}
      />
    </View>
  );
};

describe('Feature 04.3.3 — Session Lifecycle, Verification & Recovery', () => {
  const sampleUser: AuthUser = {
    id: 'usr-pilot-1234',
    email: 'pilot@waymark.local',
    displayName: 'Chief Pilot',
    emailVerified: true
  };

  const sampleSession: AuthSession = {
    accessToken: 'valid-jwt-token-xyz',
    refreshToken: 'valid-refresh-token-xyz',
    expiresAt: Date.now() + 3600 * 1000,
    user: sampleUser
  };

  const sampleSupabaseUser: User = {
    id: 'usr-pilot-1234',
    email: 'pilot@waymark.local',
    user_metadata: { display_name: 'Chief Pilot' },
    email_confirmed_at: '2026-11-21T10:00:00Z',
    created_at: '2026-11-20T10:00:00Z',
    app_metadata: {},
    aud: 'authenticated'
  };

  const sampleSupabaseSession: Session = {
    access_token: 'valid-jwt-token-xyz',
    refresh_token: 'valid-refresh-token-xyz',
    expires_in: 3600,
    expires_at: Math.floor((Date.now() + 3600 * 1000) / 1000),
    token_type: 'bearer',
    user: sampleSupabaseUser
  };

  const createMockSupabaseClient = (overrides: Record<string, unknown> = {}): SupabaseClient => {
    return {
      auth: {
        getSession: jest.fn().mockResolvedValue({ data: { session: null }, error: null }),
        signInWithPassword: jest.fn(),
        signUp: jest.fn(),
        signOut: jest.fn().mockResolvedValue({ error: null }),
        refreshSession: jest.fn(),
        resetPasswordForEmail: jest.fn().mockResolvedValue({ data: {}, error: null }),
        exchangeCodeForSession: jest.fn(),
        setSession: jest.fn(),
        updateUser: jest.fn(),
        onAuthStateChange: jest.fn().mockReturnValue({
          data: { subscription: { unsubscribe: jest.fn() } }
        }),
        ...overrides
      }
    } as unknown as SupabaseClient;
  };

  // 1. App startup without session
  it('TC-04.3.3-01: initializes to guest state when no candidate or provider session exists', async () => {
    const mockClient = createMockSupabaseClient();
    const service = new SupabaseAuthService(mockClient);
    const storage = new MockSessionStorage(null);

    render(
      <AuthProvider authService={service} storage={storage}>
        <TestHarness />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('auth-status').props.children).toBe('guest');
      expect(screen.getByTestId('auth-is-auth').props.children).toBe('false');
    });
  });

  // 2. Valid session restoration
  it('TC-04.3.3-02: restores and authenticates when provider confirms active session', async () => {
    const mockClient = createMockSupabaseClient({
      getSession: jest.fn().mockResolvedValue({
        data: { session: sampleSupabaseSession },
        error: null
      })
    });
    const service = new SupabaseAuthService(mockClient);
    const storage = new MockSessionStorage(sampleSession);

    render(
      <AuthProvider authService={service} storage={storage}>
        <TestHarness />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('auth-status').props.children).toBe('authenticated');
      expect(screen.getByTestId('auth-email').props.children).toBe('pilot@waymark.local');
      expect(screen.getByTestId('auth-is-auth').props.children).toBe('true');
    });
  });

  // 3. Expired token handling
  it('TC-04.3.3-03: handles expired token at startup by purging storage and falling back to guest', async () => {
    const expiredSupabaseSession: Session = {
      ...sampleSupabaseSession,
      expires_at: Math.floor((Date.now() - 5000) / 1000) // 5 seconds in the past
    };

    const mockClient = createMockSupabaseClient({
      getSession: jest.fn().mockResolvedValue({
        data: { session: expiredSupabaseSession },
        error: null
      }),
      refreshSession: jest.fn().mockResolvedValue({
        data: { session: null },
        error: { message: 'Invalid refresh token', status: 401 }
      })
    });
    const service = new SupabaseAuthService(mockClient);
    const storage = new MockSessionStorage({
      ...sampleSession,
      expiresAt: Date.now() - 5000
    });

    render(
      <AuthProvider authService={service} storage={storage}>
        <TestHarness />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('auth-status').props.children).toBe('guest');
      expect(storage.clearCalls).toBeGreaterThanOrEqual(1);
    });
  });

  // 4. Refresh success and failure
  it('TC-04.3.3-04: refreshSession successfully returns updated AuthSession with UTC ms', async () => {
    const newExpiresAtSec = Math.floor((Date.now() + 7200 * 1000) / 1000);
    const refreshedSupabaseSession: Session = {
      ...sampleSupabaseSession,
      access_token: 'new-refreshed-jwt',
      expires_at: newExpiresAtSec
    };

    const mockClient = createMockSupabaseClient({
      refreshSession: jest.fn().mockResolvedValue({
        data: { session: refreshedSupabaseSession, user: sampleSupabaseUser },
        error: null
      })
    });
    const service = new SupabaseAuthService(mockClient);

    const result = await service.refreshSession();
    expect(result.success).toBe(true);
    expect(result.session?.accessToken).toBe('new-refreshed-jwt');
    expect(result.session?.expiresAt).toBe(newExpiresAtSec * 1000);
  });

  it('TC-04.3.3-04b: refreshSession handles provider refresh error safely', async () => {
    const mockClient = createMockSupabaseClient({
      refreshSession: jest.fn().mockResolvedValue({
        data: { session: null, user: null },
        error: { message: 'Invalid Refresh Token', status: 400 }
      })
    });
    const service = new SupabaseAuthService(mockClient);

    const result = await service.refreshSession();
    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });

  // 5. Provider state-change events
  it('TC-04.3.3-05: updates session on TOKEN_REFRESHED event without logging user out', async () => {
    let authListener: (event: string, session: Session | null) => void = () => {};

    const mockClient = createMockSupabaseClient({
      getSession: jest.fn().mockResolvedValue({
        data: { session: sampleSupabaseSession },
        error: null
      }),
      onAuthStateChange: jest.fn().mockImplementation((cb) => {
        authListener = cb;
        return { data: { subscription: { unsubscribe: jest.fn() } } };
      })
    });

    const service = new SupabaseAuthService(mockClient);
    const storage = new MockSessionStorage(sampleSession);

    render(
      <AuthProvider authService={service} storage={storage}>
        <TestHarness />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('auth-status').props.children).toBe('authenticated');
    });

    // Simulate background token refresh event from Supabase
    const refreshedSupabaseSession: Session = {
      ...sampleSupabaseSession,
      access_token: 'background-refreshed-jwt'
    };

    await act(async () => {
      authListener('TOKEN_REFRESHED', refreshedSupabaseSession);
    });

    await waitFor(() => {
      expect(screen.getByTestId('auth-status').props.children).toBe('authenticated');
      expect(storage.saveCalls).toBeGreaterThanOrEqual(1);
    });
  });

  // 6. Logout
  it('TC-04.3.3-06: signOut clears in-memory state, storage, and transitions to guest', async () => {
    const mockClient = createMockSupabaseClient({
      getSession: jest.fn().mockResolvedValue({
        data: { session: sampleSupabaseSession },
        error: null
      })
    });
    const service = new SupabaseAuthService(mockClient);
    const storage = new MockSessionStorage(sampleSession);

    render(
      <AuthProvider authService={service} storage={storage}>
        <TestHarness />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('auth-is-auth').props.children).toBe('true');
    });

    await act(async () => {
      fireEvent.press(screen.getByTestId('btn-sign-out'));
    });

    await waitFor(() => {
      expect(screen.getByTestId('auth-status').props.children).toBe('guest');
      expect(screen.getByTestId('auth-is-auth').props.children).toBe('false');
      expect(storage.clearCalls).toBeGreaterThanOrEqual(1);
      expect(mockClient.auth.signOut).toHaveBeenCalled();
    });
  });

  // 7. Remote sign-out failure
  it('TC-04.3.3-07: ensures local state and storage are cleaned up even if provider sign-out throws', async () => {
    const mockClient = createMockSupabaseClient({
      getSession: jest.fn().mockResolvedValue({
        data: { session: sampleSupabaseSession },
        error: null
      }),
      signOut: jest.fn().mockRejectedValue(new Error('Network error during sign out'))
    });
    const service = new SupabaseAuthService(mockClient);
    const storage = new MockSessionStorage(sampleSession);

    render(
      <AuthProvider authService={service} storage={storage}>
        <TestHarness />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('auth-is-auth').props.children).toBe('true');
    });

    await act(async () => {
      fireEvent.press(screen.getByTestId('btn-sign-out'));
    });

    await waitFor(() => {
      expect(screen.getByTestId('auth-status').props.children).toBe('guest');
      expect(screen.getByTestId('auth-is-auth').props.children).toBe('false');
      expect(storage.clearCalls).toBeGreaterThanOrEqual(1);
    });
  });

  // 8. Race conditions
  it('TC-04.3.3-08: discards late sign-in result if signOut was invoked in between', async () => {
    let resolveSignIn: (val: unknown) => void;
    const signInPromise = new Promise((resolve) => {
      resolveSignIn = resolve;
    });

    const mockClient = createMockSupabaseClient({
      signInWithPassword: jest.fn().mockImplementation(() => signInPromise)
    });
    const service = new SupabaseAuthService(mockClient);
    const storage = new MockSessionStorage(null);

    let authInstance: ReturnType<typeof useAuth>;
    render(
      <AuthProvider authService={service} storage={storage}>
        <TestHarness onAuthReady={(a) => { authInstance = a; }} />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('auth-status').props.children).toBe('guest');
    });

    // Start sign-in (pending)
    let signInPromiseResult: Promise<unknown>;
    act(() => {
      signInPromiseResult = authInstance.signIn({
        email: 'pilot@waymark.local',
        password: 'Password123!'
      });
    });

    // Before sign-in finishes, user signs out
    await act(async () => {
      await authInstance.signOut();
    });

    // Now resolve late sign-in
    await act(async () => {
      resolveSignIn!({
        data: { session: sampleSupabaseSession, user: sampleSupabaseUser },
        error: null
      });
      await signInPromiseResult;
    });

    // Final status MUST be guest, NOT authenticated
    expect(screen.getByTestId('auth-status').props.children).toBe('guest');
    expect(screen.getByTestId('auth-is-auth').props.children).toBe('false');
  });

  // 9. Offline startup
  it('TC-04.3.3-09: offline failure during initialization defaults safely to guest without fabricating verification', async () => {
    const mockClient = createMockSupabaseClient({
      getSession: jest.fn().mockRejectedValue(new TypeError('Failed to fetch'))
    });
    const service = new SupabaseAuthService(mockClient);
    const storage = new MockSessionStorage(null);

    render(
      <AuthProvider authService={service} storage={storage}>
        <TestHarness />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('auth-status').props.children).toBe('guest');
      expect(screen.getByTestId('auth-is-auth').props.children).toBe('false');
    });
  });

  // 10. Verification callback validation
  it('TC-04.3.3-10: correctly parses and validates legitimate app auth callback URLs', () => {
    const validCodeUrl = 'waymark://auth/callback?code=pkce-auth-code-123&type=signup';
    const parsedCode = parseAuthCallbackUrl(validCodeUrl);
    expect(parsedCode.isValid).toBe(true);
    expect(parsedCode.type).toBe('code');
    expect(parsedCode.code).toBe('pkce-auth-code-123');

    const validTokenUrl = 'waymark://auth/callback#access_token=jwt-token-123&refresh_token=refresh-123&type=recovery';
    const parsedToken = parseAuthCallbackUrl(validTokenUrl);
    expect(parsedToken.isValid).toBe(true);
    expect(parsedToken.type).toBe('token');
    expect(parsedToken.accessToken).toBe('jwt-token-123');
    expect(parsedToken.refreshToken).toBe('refresh-123');
  });

  // 11. Dangerous deep-link rejection
  it('TC-04.3.3-11: strictly rejects dangerous and untrusted callback URLs', () => {
    expect(validateCallbackUrl('javascript:alert(1)').isValid).toBe(false);
    expect(validateCallbackUrl('data:text/html,<script>').isValid).toBe(false);
    expect(validateCallbackUrl('file:///etc/passwd').isValid).toBe(false);
    expect(validateCallbackUrl('https://evil.com/auth/callback').isValid).toBe(false);
    expect(validateCallbackUrl('waymark://malicious.host/auth/callback').isValid).toBe(false);
    expect(validateCallbackUrl('waymark://auth/callback/../../etc').isValid).toBe(false);
    expect(validateCallbackUrl('waymark://unauthorized/path').isValid).toBe(false);
  });

  // 12. Recovery request success
  it('TC-04.3.3-12: resetPassword invokes provider with correct redirect and returns success', async () => {
    const mockClient = createMockSupabaseClient({
      resetPasswordForEmail: jest.fn().mockResolvedValue({ data: {}, error: null })
    });
    const service = new SupabaseAuthService(mockClient);

    const result = await service.resetPassword('pilot@waymark.local');
    expect(result.success).toBe(true);
    expect(mockClient.auth.resetPasswordForEmail).toHaveBeenCalledWith(
      'pilot@waymark.local',
      expect.objectContaining({ redirectTo: 'waymark://auth/callback' })
    );
  });

  // 13. Recovery request rejection
  it('TC-04.3.3-13: maps provider reset password error to generic domain AuthError', async () => {
    const mockClient = createMockSupabaseClient({
      resetPasswordForEmail: jest.fn().mockResolvedValue({
        data: {},
        error: { message: 'Too many requests', status: 429 }
      })
    });
    const service = new SupabaseAuthService(mockClient);

    const result = await service.resetPassword('pilot@waymark.local');
    expect(result.success).toBe(false);
    expect(result.error?.code).toBe('RATE_LIMITED');
  });

  // 14. No fake recovery emails
  it('TC-04.3.3-14: unconfigured service returns NOT_CONFIGURED without claiming dispatch', async () => {
    const unconfiguredService = new SupabaseAuthService(null);
    const result = await unconfiguredService.resetPassword('pilot@waymark.local');

    expect(result.success).toBe(false);
    expect(result.error?.code).toBe('NOT_CONFIGURED');
  });

  // 15. No account enumeration
  it('TC-04.3.3-15: resetPassword handles unknown users generically without leaking existence', async () => {
    const mockClient = createMockSupabaseClient({
      resetPasswordForEmail: jest.fn().mockResolvedValue({
        data: {},
        error: null // Supabase returns success even if email not registered when enumeration defense is active
      })
    });
    const service = new SupabaseAuthService(mockClient);

    const result = await service.resetPassword('nonexistent@waymark.local');
    expect(result.success).toBe(true);
    // Generic outcome returned; no details leaked
    expect(result.error).toBeUndefined();
  });

  // 16. Correct session cleanup
  it('TC-04.3.3-16: ensures session and user records are completely removed on clearSession', async () => {
    const storage = new MockSessionStorage(sampleSession);
    expect(await storage.getSession()).not.toBeNull();

    await storage.clearSession();
    expect(await storage.getSession()).toBeNull();
  });

  // 17. No duplicate listeners
  it('TC-04.3.3-17: attaches exactly one auth state change subscription and unmounts cleanly', async () => {
    const unsubscribeMock = jest.fn();
    const mockClient = createMockSupabaseClient({
      onAuthStateChange: jest.fn().mockReturnValue({
        data: { subscription: { unsubscribe: unsubscribeMock } }
      })
    });
    const service = new SupabaseAuthService(mockClient);
    const storage = new MockSessionStorage(null);

    const { unmount } = render(
      <AuthProvider authService={service} storage={storage}>
        <TestHarness />
      </AuthProvider>
    );

    expect(mockClient.auth.onAuthStateChange).toHaveBeenCalledTimes(1);

    unmount();
    expect(unsubscribeMock).toHaveBeenCalledTimes(1);
  });

  // 18. Callback handler execution
  it('TC-04.3.3-18: handleAuthCallback executes code exchange successfully', async () => {
    const mockClient = createMockSupabaseClient({
      exchangeCodeForSession: jest.fn().mockResolvedValue({
        data: { session: sampleSupabaseSession, user: sampleSupabaseUser },
        error: null
      })
    });

    const result = await handleAuthCallback(
      'waymark://auth/callback?code=auth-code-789',
      mockClient
    );

    expect(result.success).toBe(true);
    expect(result.session?.accessToken).toBe('valid-jwt-token-xyz');
    expect(mockClient.auth.exchangeCodeForSession).toHaveBeenCalledWith('auth-code-789');
  });
});
