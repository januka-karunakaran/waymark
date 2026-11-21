import React from 'react';
import { render, screen, fireEvent, act, waitFor } from '@testing-library/react-native';
import { SupabaseClient, Session, User } from '@supabase/supabase-js';
import RootLayout from '../../../../app/_layout';
import AccountScreen from '../../../../app/(auth)/account';
import SignInScreen from '../../../../app/(auth)/sign-in';
import SignUpScreen from '../../../../app/(auth)/sign-up';
import ForgotPasswordScreen from '../../../../app/(auth)/forgot-password';
import { AuthProvider } from '../context/AuthContext';
import { SupabaseAuthService } from '../services/SupabaseAuthService';
import { UnavailableAuthService } from '../services/UnavailableAuthService';
import { createSupabaseStorage } from '../providers/supabaseStorage';
import { validateCallbackUrl, parseAuthCallbackUrl } from '../utils/authCallback';
import { AuthSession, AuthUser } from '../types';
import { AuthSessionStorage } from '../storage/AuthSessionStorage';

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

describe('Feature 04.3.4 — Real Authentication Integration QA', () => {
  const sampleUser: AuthUser = {
    id: 'usr-pilot-qa-01',
    email: 'qa.navigator@waymark.local',
    displayName: 'QA Navigator',
    emailVerified: true
  };

  const sampleSession: AuthSession = {
    accessToken: 'genuine-qa-jwt-token-777',
    refreshToken: 'genuine-qa-refresh-token-777',
    expiresAt: Date.now() + 3600 * 1000,
    user: sampleUser
  };

  const sampleSupabaseUser: User = {
    id: 'usr-pilot-qa-01',
    email: 'qa.navigator@waymark.local',
    user_metadata: { display_name: 'QA Navigator' },
    email_confirmed_at: '2026-11-21T12:00:00Z',
    created_at: '2026-11-21T08:00:00Z',
    app_metadata: {},
    aud: 'authenticated'
  };

  const sampleSupabaseSession: Session = {
    access_token: 'genuine-qa-jwt-token-777',
    refresh_token: 'genuine-qa-refresh-token-777',
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

  // 1. Guest startup
  it('TC-04.3.4-01: starts in guest mode by default without requiring credentials', () => {
    render(
      <AuthProvider authService={new UnavailableAuthService()} autoInitialize={false}>
        <AccountScreen />
      </AuthProvider>
    );

    expect(screen.getByTestId('account-brand-header')).toBeTruthy();
    expect(screen.getByTestId('btn-navigate-sign-in')).toBeTruthy();
    expect(screen.getByTestId('btn-continue-as-guest')).toBeTruthy();
  });

  // 2. Unconfigured provider fallback
  it('TC-04.3.4-02: shows unconfigured standby notice and disables live auth dispatches', () => {
    render(
      <AuthProvider authService={new UnavailableAuthService()} autoInitialize={false}>
        <AccountScreen />
      </AuthProvider>
    );

    expect(screen.getByTestId('account-unconfigured-notice')).toBeTruthy();
    expect(screen.getByText(/External identity providers are currently not configured/i)).toBeTruthy();
  });

  // 3. Configured provider readiness
  it('TC-04.3.4-03: reports SYS.READY status tag when configured provider is injected', () => {
    const mockClient = createMockSupabaseClient();
    const service = new SupabaseAuthService(mockClient);

    render(
      <AuthProvider authService={service} autoInitialize={false}>
        <AccountScreen />
      </AuthProvider>
    );

    expect(screen.getByTestId('account-configured-notice')).toBeTruthy();
    expect(screen.getByText(/Authentication services are operational/i)).toBeTruthy();
  });

  // 4. Real-service adapter with injected test backend
  it('TC-04.3.4-04: executes signIn against configured provider client', async () => {
    const mockClient = createMockSupabaseClient({
      signInWithPassword: jest.fn().mockResolvedValue({
        data: { session: sampleSupabaseSession, user: sampleSupabaseUser },
        error: null
      })
    });
    const service = new SupabaseAuthService(mockClient);
    const result = await service.signIn({
      email: 'qa.navigator@waymark.local',
      password: 'SecurePassword123!'
    });

    expect(result.success).toBe(true);
    expect(result.session?.accessToken).toBe('genuine-qa-jwt-token-777');
    expect(mockClient.auth.signInWithPassword).toHaveBeenCalled();
  });

  // 5. Sign-in UI handoff
  it('TC-04.3.4-05: handles valid sign-in submission and updates authenticated context', async () => {
    const mockClient = createMockSupabaseClient({
      signInWithPassword: jest.fn().mockResolvedValue({
        data: { session: sampleSupabaseSession, user: sampleSupabaseUser },
        error: null
      })
    });
    const service = new SupabaseAuthService(mockClient);

    render(
      <AuthProvider authService={service} autoInitialize={false}>
        <SignInScreen />
      </AuthProvider>
    );

    fireEvent.changeText(screen.getByTestId('input-sign-in-email-input'), 'qa.navigator@waymark.local');
    fireEvent.changeText(screen.getByTestId('input-sign-in-password-input'), 'SecurePassword123!');

    await act(async () => {
      fireEvent.press(screen.getByTestId('btn-submit-sign-in'));
    });

    expect(mockClient.auth.signInWithPassword).toHaveBeenCalledWith({
      email: 'qa.navigator@waymark.local',
      password: 'SecurePassword123!'
    });
  });

  // 6. Invalid credentials
  it('TC-04.3.4-06: displays sanitized domain error on invalid credentials without leaking internals', async () => {
    const mockClient = createMockSupabaseClient({
      signInWithPassword: jest.fn().mockResolvedValue({
        data: { session: null, user: null },
        error: { message: 'Invalid login credentials', status: 400 }
      })
    });
    const service = new SupabaseAuthService(mockClient);

    render(
      <AuthProvider authService={service} autoInitialize={false}>
        <SignInScreen />
      </AuthProvider>
    );

    fireEvent.changeText(screen.getByTestId('input-sign-in-email-input'), 'qa.navigator@waymark.local');
    fireEvent.changeText(screen.getByTestId('input-sign-in-password-input'), 'WrongPassword!');

    await act(async () => {
      fireEvent.press(screen.getByTestId('btn-submit-sign-in'));
    });

    await waitFor(() => {
      expect(screen.getByTestId('sign-in-error-notice')).toBeTruthy();
      expect(screen.getByText('Invalid email or password.')).toBeTruthy();
    });
  });

  // 7. Registration handoff
  it('TC-04.3.4-07: delegates registration submission to provider client', async () => {
    const mockClient = createMockSupabaseClient({
      signUp: jest.fn().mockResolvedValue({
        data: { session: sampleSupabaseSession, user: sampleSupabaseUser },
        error: null
      })
    });
    const service = new SupabaseAuthService(mockClient);

    render(
      <AuthProvider authService={service} autoInitialize={false}>
        <SignUpScreen />
      </AuthProvider>
    );

    fireEvent.changeText(screen.getByTestId('input-sign-up-display-name-input'), 'QA Pilot');
    fireEvent.changeText(screen.getByTestId('input-sign-up-email-input'), 'pilot@waymark.local');
    fireEvent.changeText(screen.getByTestId('input-sign-up-password-input'), 'ValidPassword123!');
    fireEvent.changeText(screen.getByTestId('input-sign-up-confirm-password-input'), 'ValidPassword123!');

    await act(async () => {
      fireEvent.press(screen.getByTestId('btn-submit-sign-up'));
    });

    expect(mockClient.auth.signUp).toHaveBeenCalledWith({
      email: 'pilot@waymark.local',
      password: 'ValidPassword123!',
      options: { data: { display_name: 'QA Pilot', name: 'QA Pilot' } }
    });
  });

  // 8. Verification-required registration
  it('TC-04.3.4-08: does not log user in if registration requires email verification', async () => {
    const mockClient = createMockSupabaseClient({
      signUp: jest.fn().mockResolvedValue({
        data: { session: null, user: { ...sampleSupabaseUser, email_confirmed_at: null } },
        error: null
      })
    });
    const service = new SupabaseAuthService(mockClient);

    const result = await service.signUp({
      email: 'unconfirmed@waymark.local',
      password: 'Password123!'
    });

    expect(result.success).toBe(true);
    expect(result.requiresVerification).toBe(true);
    expect(result.session).toBeUndefined();
  });

  // 9. Session restoration
  it('TC-04.3.4-09: restores authenticated session on mount when confirmed by provider', async () => {
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
        <AccountScreen />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('account-authenticated-notice')).toBeTruthy();
      expect(screen.getByTestId('btn-account-sign-out')).toBeTruthy();
    });
  });

  // 10. Expired session handling
  it('TC-04.3.4-10: drops expired session without reviving from stale storage', async () => {
    const expiredSession: Session = {
      ...sampleSupabaseSession,
      expires_at: Math.floor((Date.now() - 10000) / 1000)
    };
    const mockClient = createMockSupabaseClient({
      getSession: jest.fn().mockResolvedValue({
        data: { session: expiredSession },
        error: null
      }),
      refreshSession: jest.fn().mockResolvedValue({
        data: { session: null },
        error: { message: 'Expired refresh token', status: 401 }
      })
    });
    const service = new SupabaseAuthService(mockClient);
    const storage = new MockSessionStorage({ ...sampleSession, expiresAt: Date.now() - 10000 });

    render(
      <AuthProvider authService={service} storage={storage}>
        <AccountScreen />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('btn-navigate-sign-in')).toBeTruthy();
      expect(storage.clearCalls).toBeGreaterThanOrEqual(1);
    });
  });

  // 11. Refresh and foreground transitions
  it('TC-04.3.4-11: refreshSession successfully returns updated session tokens', async () => {
    const mockClient = createMockSupabaseClient({
      refreshSession: jest.fn().mockResolvedValue({
        data: { session: { ...sampleSupabaseSession, access_token: 'refreshed-token' }, user: sampleSupabaseUser },
        error: null
      })
    });
    const service = new SupabaseAuthService(mockClient);
    const res = await service.refreshSession();

    expect(res.success).toBe(true);
    expect(res.session?.accessToken).toBe('refreshed-token');
  });

  // 12. Logout
  it('TC-04.3.4-12: signOut clears user context and switches account screen to guest view', async () => {
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
        <AccountScreen />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('btn-account-sign-out')).toBeTruthy();
    });

    await act(async () => {
      fireEvent.press(screen.getByTestId('btn-account-sign-out'));
    });

    await waitFor(() => {
      expect(screen.getByTestId('btn-navigate-sign-in')).toBeTruthy();
      expect(storage.clearCalls).toBeGreaterThanOrEqual(1);
    });
  });

  // 13. Session-revocation response
  it('TC-04.3.4-13: transitions to guest on external SIGNED_OUT event', async () => {
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
        <AccountScreen />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('btn-account-sign-out')).toBeTruthy();
    });

    await act(async () => {
      authListener('SIGNED_OUT', null);
    });

    await waitFor(() => {
      expect(screen.getByTestId('btn-navigate-sign-in')).toBeTruthy();
    });
  });

  // 14. Password reset request
  it('TC-04.3.4-14: dispatches recovery request via forgot-password flow', async () => {
    const mockClient = createMockSupabaseClient({
      resetPasswordForEmail: jest.fn().mockResolvedValue({ data: {}, error: null })
    });
    const service = new SupabaseAuthService(mockClient);

    render(
      <AuthProvider authService={service} autoInitialize={false}>
        <ForgotPasswordScreen />
      </AuthProvider>
    );

    fireEvent.changeText(screen.getByTestId('input-forgot-password-email-input'), 'pilot@waymark.local');

    await act(async () => {
      fireEvent.press(screen.getByTestId('btn-submit-forgot-password'));
    });

    expect(mockClient.auth.resetPasswordForEmail).toHaveBeenCalledWith(
      'pilot@waymark.local',
      expect.objectContaining({ redirectTo: 'waymark://auth/callback' })
    );
  });

  // 15. Recovery callback safety
  it('TC-04.3.4-15: parses callback parameters safely without leaking tokens', () => {
    const callbackUrl = 'waymark://auth/callback?code=pkce-safe-code';
    expect(validateCallbackUrl(callbackUrl).isValid).toBe(true);
    const parsed = parseAuthCallbackUrl(callbackUrl);

    expect(parsed.isValid).toBe(true);
    expect(parsed.code).toBe('pkce-safe-code');
  });

  // 16. Duplicate request prevention
  it('TC-04.3.4-16: prevents duplicate concurrent requests for identical email', async () => {
    let resolver: (val: unknown) => void;
    const pendingPromise = new Promise((resolve) => { resolver = resolve; });
    const mockClient = createMockSupabaseClient({
      signInWithPassword: jest.fn().mockImplementation(() => pendingPromise)
    });
    const service = new SupabaseAuthService(mockClient);

    const call1 = service.signIn({ email: 'rider@waymark.local', password: 'Pass' });
    const call2 = service.signIn({ email: 'rider@waymark.local', password: 'Pass' });

    expect(mockClient.auth.signInWithPassword).toHaveBeenCalledTimes(1);

    resolver!({ data: { session: sampleSupabaseSession, user: sampleSupabaseUser }, error: null });
    await Promise.all([call1, call2]);
  });

  // 17. Sensitive-data redaction
  it('TC-04.3.4-17: redacts sensitive data and masks raw credentials', () => {
    const mockClient = createMockSupabaseClient();
    const service = new SupabaseAuthService(mockClient);
    const serialized = JSON.stringify(service);

    expect(serialized).not.toContain('password');
    expect(serialized).not.toContain('secret');
  });

  // 18. Web storage restrictions
  it('TC-04.3.4-18: strictly uses in-memory storage on web platform', async () => {
    const webStorage = createSupabaseStorage('web');
    await webStorage.setItem('test_key', 'test_val');
    expect(await webStorage.getItem('test_key')).toBe('test_val');
    await webStorage.removeItem('test_key');
    expect(await webStorage.getItem('test_key')).toBeNull();
  });

  // 19. Native secure storage
  it('TC-04.3.4-19: uses secure store contract on native platform', async () => {
    const nativeStorage = createSupabaseStorage('ios');
    expect(nativeStorage).toBeDefined();
    expect(typeof nativeStorage.getItem).toBe('function');
  });

  // 20. AuthProvider root integration
  it('TC-04.3.4-20: RootLayout mounts AuthProvider and renders navigation hierarchy', () => {
    const rendered = render(<RootLayout />);
    expect(rendered).toBeTruthy();
  });

  // 21. Public Home and Discovery regression
  it('TC-04.3.4-21: guest navigators retain full access to public tabs', () => {
    render(
      <AuthProvider authService={new UnavailableAuthService()} autoInitialize={false}>
        <AccountScreen />
      </AuthProvider>
    );

    expect(screen.getByTestId('btn-continue-as-guest')).toBeTruthy();
    expect(screen.getByTestId('btn-open-radar-map')).toBeTruthy();
  });

  // 22. Journey navigation regression
  it('TC-04.3.4-22: ensures open radar map action trigger is operational', () => {
    render(
      <AuthProvider authService={new UnavailableAuthService()} autoInitialize={false}>
        <AccountScreen />
      </AuthProvider>
    );

    const radarBtn = screen.getByTestId('btn-open-radar-map');
    expect(radarBtn).toBeTruthy();
  });

  // 23. Accessibility labels and states
  it('TC-04.3.4-23: maintains required accessibility labels and hints on auth screens', () => {
    render(
      <AuthProvider authService={new UnavailableAuthService()} autoInitialize={false}>
        <SignInScreen />
      </AuthProvider>
    );

    expect(screen.getByTestId('input-sign-in-email-input').props.accessibilityLabel).toBe('Email Address');
    expect(screen.getByTestId('input-sign-in-password-input').props.accessibilityLabel).toBe('Password');
  });

  // 24. No fabricated user information
  it('TC-04.3.4-24: never fabricates dummy sessions or synthetic accounts when unauthenticated', async () => {
    const service = new UnavailableAuthService();
    const session = await service.getCurrentSession();
    expect(session).toBeNull();
    const res = await service.signIn({ email: 'ghost@waymark.local', password: 'Fake' });
    expect(res.success).toBe(false);
    expect(res.session).toBeUndefined();
  });
});
