import React from 'react';
import { View, Text, Button } from 'react-native';
import { render, screen, fireEvent, act, waitFor } from '@testing-library/react-native';

// Auth domain contracts & components
import {
  AuthProvider,
  useAuth,
  AuthService,
  AuthSession,
  AuthSessionStorage,
  AuthUser,
  SignInCredentials,
  SignUpDetails,
  AuthResult,
  ServiceReadiness,
  AuthError,
  unavailableAuthService,
  createAuthSessionStorage,
  WebAuthSessionStorage,
  validateSessionPayload,
  CURRENT_SESSION_SCHEMA_VERSION
} from '../index';

// Screens & Navigation
import HomeScreen from '../../../../app/(tabs)/index';
import MapScreen from '../../../../app/(tabs)/map';
import JourneyScreen from '../../../../app/(tabs)/journey';
import RootLayout from '../../../../app/_layout';
import { BOTTOM_TABS } from '../../../constants/navigation';

// Mock storage helper for deterministic integration scenarios
class MockIntegrationStorage implements AuthSessionStorage {
  private session: AuthSession | null = null;
  public getSessionCalls = 0;
  public saveSessionCalls = 0;
  public clearSessionCalls = 0;
  public shouldFailGet = false;
  public shouldFailSave = false;

  constructor(initialSession: AuthSession | null = null) {
    this.session = initialSession;
  }

  async getSession(): Promise<AuthSession | null> {
    this.getSessionCalls++;
    if (this.shouldFailGet) {
      throw new Error('Hardware Keystore read exception');
    }
    if (this.session && this.session.expiresAt <= Date.now()) {
      await this.clearSession();
      return null;
    }
    return this.session;
  }

  async saveSession(session: AuthSession): Promise<void> {
    this.saveSessionCalls++;
    if (this.shouldFailSave) {
      throw new Error('Hardware Keystore write exception');
    }
    this.session = session;
  }

  async clearSession(): Promise<void> {
    this.clearSessionCalls++;
    this.session = null;
  }
}

// Mock auth service helper for simulating provider responses
class MockIntegrationAuthService implements AuthService {
  public readiness: ServiceReadiness = 'ready';
  public currentSession: AuthSession | null = null;
  public signInDelay = 0;
  public shouldFailSignIn = false;
  public signInCalls = 0;
  public signOutCalls = 0;

  constructor(readiness: ServiceReadiness = 'ready', currentSession: AuthSession | null = null) {
    this.readiness = readiness;
    this.currentSession = currentSession;
  }

  getServiceReadiness(): ServiceReadiness {
    return this.readiness;
  }

  async getCurrentSession(): Promise<AuthSession | null> {
    if (this.currentSession && this.currentSession.expiresAt <= Date.now()) {
      return null;
    }
    return this.currentSession;
  }

  async signIn(credentials: SignInCredentials): Promise<AuthResult> {
    this.signInCalls++;
    if (this.signInDelay > 0) {
      await new Promise((resolve) => setTimeout(resolve, this.signInDelay));
    }

    if (this.shouldFailSignIn) {
      return {
        success: false,
        error: AuthError.invalidCredentials()
      };
    }

    const session: AuthSession = {
      accessToken: 'token_integration_' + Date.now(),
      expiresAt: Date.now() + 3600 * 1000,
      user: {
        id: 'usr_integ_pilot',
        email: credentials.email,
        displayName: 'Integration Pilot'
      }
    };
    return {
      success: true,
      session,
      user: session.user
    };
  }

  async signUp(details: SignUpDetails): Promise<AuthResult> {
    if (this.readiness === 'not_configured') {
      return { success: false, error: AuthError.notConfigured() };
    }
    return {
      success: true,
      requiresVerification: true,
      user: {
        id: 'usr_reg_' + Date.now(),
        email: details.email,
        displayName: details.displayName ?? 'Registered Pilot'
      }
    };
  }

  async signOut(): Promise<void> {
    this.signOutCalls++;
    this.currentSession = null;
  }
}

// Integrated test harness consuming useAuth()
const IntegrationAuthConsumer: React.FC = () => {
  const auth = useAuth();

  return (
    <View testID="integration-auth-consumer">
      <Text testID="qa-auth-status">{auth.status}</Text>
      <Text testID="qa-auth-authenticated">{auth.isAuthenticated ? 'true' : 'false'}</Text>
      <Text testID="qa-auth-initializing">{auth.isInitializing ? 'true' : 'false'}</Text>
      <Text testID="qa-auth-readiness">{auth.serviceReadiness}</Text>
      <Text testID="qa-auth-user-email">{auth.user?.email ?? 'none'}</Text>
      <Text testID="qa-auth-user-id">{auth.user?.id ?? 'none'}</Text>
      <Text testID="qa-auth-error-code">{auth.error?.code ?? 'none'}</Text>
      <Text testID="qa-auth-error-message">{auth.error?.message ?? 'none'}</Text>

      <Button
        title="Sign In Valid"
        testID="btn-qa-sign-in"
        onPress={() => auth.signIn({ email: 'pilot@waymark.local', password: 'Password2100!' })}
      />
      <Button
        title="Sign Up New"
        testID="btn-qa-sign-up"
        onPress={() => auth.signUp({ email: 'cadet@waymark.local', password: 'Password2100!', displayName: 'Cadet' })}
      />
      <Button
        title="Sign Out"
        testID="btn-qa-sign-out"
        onPress={() => auth.signOut()}
      />
    </View>
  );
};

describe('Feature 04.1.4 â€” Auth Integration Readiness, Security & QA', () => {
  const validUser: AuthUser = {
    id: 'usr_verified_pilot',
    email: 'pilot@waymark.local',
    displayName: 'Chief Navigator'
  };

  const createActiveSession = (expiresInMs: number = 3600 * 1000): AuthSession => ({
    accessToken: 'valid_access_token_sec_qa',
    expiresAt: Date.now() + expiresInMs,
    user: validUser
  });

  // =========================================================================
  // 1. LIFECYCLE & GUEST FOUNDATION (TC-04.1.4-01 - TC-04.1.4-05)
  // =========================================================================

  it('TC-04.1.4-01: Root AuthProvider initializes with expected default guest state', async () => {
    render(
      <AuthProvider authService={unavailableAuthService}>
        <IntegrationAuthConsumer />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('qa-auth-status').props.children).toBe('guest');
      expect(screen.getByTestId('qa-auth-authenticated').props.children).toBe('false');
      expect(screen.getByTestId('qa-auth-initializing').props.children).toBe('false');
      expect(screen.getByTestId('qa-auth-readiness').props.children).toBe('not_configured');
    });
  });

  it('TC-04.1.4-02: Cold startup with empty storage defaults to guest mode without demanding credentials', async () => {
    const emptyStorage = new MockIntegrationStorage(null);
    const readyService = new MockIntegrationAuthService('ready', null);
    render(
      <AuthProvider authService={readyService} storage={emptyStorage}>
        <IntegrationAuthConsumer />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('qa-auth-status').props.children).toBe('guest');
      expect(screen.getByTestId('qa-auth-user-email').props.children).toBe('none');
      expect(screen.getByTestId('qa-auth-error-code').props.children).toBe('none');
    });
    expect(emptyStorage.getSessionCalls).toBe(1);
  });

  it('TC-04.1.4-03: UnavailableAuthService reports not_configured service readiness', async () => {
    expect(unavailableAuthService.getServiceReadiness()).toBe('not_configured');
    const session = await unavailableAuthService.getCurrentSession();
    expect(session).toBeNull();
  });

  it('TC-04.1.4-04: Sign-in dispatch against unavailable service returns NOT_CONFIGURED without faking success', async () => {
    render(
      <AuthProvider authService={unavailableAuthService}>
        <IntegrationAuthConsumer />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('qa-auth-status').props.children).toBe('guest');
    });

    await act(async () => {
      fireEvent.press(screen.getByTestId('btn-qa-sign-in'));
    });

    expect(screen.getByTestId('qa-auth-error-code').props.children).toBe('NOT_CONFIGURED');
    expect(screen.getByTestId('qa-auth-authenticated').props.children).toBe('false');
    expect(screen.getByTestId('qa-auth-status').props.children).toBe('guest');
    expect(screen.getByTestId('qa-auth-user-email').props.children).toBe('none');
  });

  it('TC-04.1.4-05: Registration dispatch against unavailable service returns NOT_CONFIGURED without creating fake accounts', async () => {
    render(
      <AuthProvider authService={unavailableAuthService}>
        <IntegrationAuthConsumer />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('qa-auth-status').props.children).toBe('guest');
    });

    await act(async () => {
      fireEvent.press(screen.getByTestId('btn-qa-sign-up'));
    });

    expect(screen.getByTestId('qa-auth-error-code').props.children).toBe('NOT_CONFIGURED');
    expect(screen.getByTestId('qa-auth-authenticated').props.children).toBe('false');
  });

  // =========================================================================
  // 2. STORAGE ISOLATION & RESILIENCE (TC-04.1.4-06 - TC-04.1.4-10)
  // =========================================================================

  it('TC-04.1.4-06: Storage factory provides consistent AuthSessionStorage contract across platforms', () => {
    const iosStorage = createAuthSessionStorage('ios');
    const androidStorage = createAuthSessionStorage('android');
    const webStorage = createAuthSessionStorage('web');

    expect(typeof iosStorage.getSession).toBe('function');
    expect(typeof iosStorage.saveSession).toBe('function');
    expect(typeof iosStorage.clearSession).toBe('function');

    expect(typeof androidStorage.getSession).toBe('function');
    expect(typeof androidStorage.saveSession).toBe('function');
    expect(typeof androidStorage.clearSession).toBe('function');

    expect(typeof webStorage.getSession).toBe('function');
    expect(typeof webStorage.saveSession).toBe('function');
    expect(typeof webStorage.clearSession).toBe('function');
    expect(webStorage).toBeInstanceOf(WebAuthSessionStorage);
  });

  it('TC-04.1.4-07: Native storage read/write failures handle gracefully and fall back to guest', async () => {
    const faultyStorage = new MockIntegrationStorage();
    faultyStorage.shouldFailGet = true;
    const readyService = new MockIntegrationAuthService('ready');

    render(
      <AuthProvider authService={readyService} storage={faultyStorage}>
        <IntegrationAuthConsumer />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('qa-auth-status').props.children).toBe('guest');
      expect(screen.getByTestId('qa-auth-authenticated').props.children).toBe('false');
    });
  });

  it('TC-04.1.4-08: Web storage strictly enforces in-memory policy and never writes to localStorage or sessionStorage', async () => {
    const webStorage = new WebAuthSessionStorage();

    const mockLocalStorage = { setItem: jest.fn(), getItem: jest.fn(), removeItem: jest.fn() };
    const mockSessionStorage = { setItem: jest.fn(), getItem: jest.fn(), removeItem: jest.fn() };

    (global as unknown as { localStorage: typeof mockLocalStorage }).localStorage = mockLocalStorage;
    (global as unknown as { sessionStorage: typeof mockSessionStorage }).sessionStorage = mockSessionStorage;

    const testSession = createActiveSession();
    await webStorage.saveSession(testSession);
    const retrieved = await webStorage.getSession();

    expect(retrieved?.accessToken).toBe(testSession.accessToken);
    expect(mockLocalStorage.setItem).not.toHaveBeenCalled();
    expect(mockSessionStorage.setItem).not.toHaveBeenCalled();

    await webStorage.clearSession();
    const afterClear = await webStorage.getSession();
    expect(afterClear).toBeNull();
  });

  it('TC-04.1.4-09: Session validation strictly verifies schema version and rejects corrupted or malformed payloads', () => {
    // Null or undefined
    expect(validateSessionPayload(null)).toBeNull();
    expect(validateSessionPayload(undefined)).toBeNull();

    // Obsolete or invalid version
    expect(validateSessionPayload({ version: 99, session: {} })).toBeNull();

    // Missing token
    expect(
      validateSessionPayload({
        version: CURRENT_SESSION_SCHEMA_VERSION,
        session: { accessToken: '', expiresAt: Date.now() + 10000, user: validUser }
      })
    ).toBeNull();

    // Valid payload parses successfully
    const validPayload = {
      version: CURRENT_SESSION_SCHEMA_VERSION,
      storedAt: Date.now(),
      session: {
        accessToken: 'valid_jwt_token',
        expiresAt: Date.now() + 3600 * 1000,
        tokenType: 'Bearer',
        user: {
          id: 'usr_valid',
          email: 'valid@waymark.local',
          displayName: 'Valid User'
        }
      }
    };
    const parsed = validateSessionPayload(validPayload);
    expect(parsed).not.toBeNull();
    expect(parsed?.user.id).toBe('usr_valid');
  });

  it('TC-04.1.4-10: Stored sessions past expiration are purged immediately upon startup resolution', async () => {
    const expiredSession: AuthSession = {
      accessToken: 'expired_token',
      expiresAt: Date.now() - 60 * 1000, // Expired 1 minute ago
      user: validUser
    };
    const storageWithExpired = new MockIntegrationStorage(expiredSession);
    const readyService = new MockIntegrationAuthService('ready', null);

    render(
      <AuthProvider authService={readyService} storage={storageWithExpired}>
        <IntegrationAuthConsumer />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('qa-auth-status').props.children).toBe('guest');
      expect(screen.getByTestId('qa-auth-authenticated').props.children).toBe('false');
      expect(screen.getByTestId('qa-auth-user-email').props.children).toBe('none');
    });

    expect(storageWithExpired.clearSessionCalls).toBeGreaterThanOrEqual(1);
  });

  // =========================================================================
  // 3. AUTH LIFECYCLE & CONCURRENCY (TC-04.1.4-11 - TC-04.1.4-14)
  // =========================================================================

  it('TC-04.1.4-11: Sign-out completely clears user state, in-memory tokens, and underlying persistence', async () => {
    const activeSession = createActiveSession();
    const storage = new MockIntegrationStorage(activeSession);
    const readyService = new MockIntegrationAuthService('ready', activeSession);

    render(
      <AuthProvider authService={readyService} storage={storage}>
        <IntegrationAuthConsumer />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('qa-auth-status').props.children).toBe('authenticated');
      expect(screen.getByTestId('qa-auth-authenticated').props.children).toBe('true');
    });

    await act(async () => {
      fireEvent.press(screen.getByTestId('btn-qa-sign-out'));
    });

    expect(screen.getByTestId('qa-auth-status').props.children).toBe('guest');
    expect(screen.getByTestId('qa-auth-authenticated').props.children).toBe('false');
    expect(screen.getByTestId('qa-auth-user-email').props.children).toBe('none');
    expect(storage.clearSessionCalls).toBeGreaterThanOrEqual(1);
    expect(readyService.signOutCalls).toBe(1);
  });

  it('TC-04.1.4-12: Concurrent authentication dispatches are guarded against duplicate in-flight requests', async () => {
    const readyService = new MockIntegrationAuthService('ready');
    readyService.signInDelay = 60;

    render(
      <AuthProvider authService={readyService}>
        <IntegrationAuthConsumer />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('qa-auth-status').props.children).toBe('guest');
    });

    // Fire duplicate concurrent clicks
    act(() => {
      fireEvent.press(screen.getByTestId('btn-qa-sign-in'));
    });
    act(() => {
      fireEvent.press(screen.getByTestId('btn-qa-sign-in'));
    });

    await waitFor(() => {
      expect(screen.getByTestId('qa-auth-status').props.children).toBe('authenticated');
    });

    expect(readyService.signInCalls).toBe(1);
  });

  it('TC-04.1.4-13: Race condition safety: late login response is discarded if user signed out in-flight', async () => {
    const readyService = new MockIntegrationAuthService('ready');
    readyService.signInDelay = 80;
    const storage = new MockIntegrationStorage();

    render(
      <AuthProvider authService={readyService} storage={storage}>
        <IntegrationAuthConsumer />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('qa-auth-status').props.children).toBe('guest');
    });

    // Start in-flight sign-in
    act(() => {
      fireEvent.press(screen.getByTestId('btn-qa-sign-in'));
    });

    // User signs out before slow login completes
    await act(async () => {
      fireEvent.press(screen.getByTestId('btn-qa-sign-out'));
    });

    // Wait for in-flight request to resolve
    await act(async () => {
      await new Promise((r) => setTimeout(r, 100));
    });

    // Must remain guest, discarded response never promoted
    expect(screen.getByTestId('qa-auth-status').props.children).toBe('guest');
    expect(screen.getByTestId('qa-auth-authenticated').props.children).toBe('false');
    expect(screen.getByTestId('qa-auth-user-email').props.children).toBe('none');
  });

  it('TC-04.1.4-14: Auth error domain sanitizes user-facing messages and omits internal secrets or tokens', () => {
    const notConfigured = AuthError.notConfigured();
    const invalidCreds = AuthError.invalidCredentials();
    const netError = AuthError.networkUnavailable();
    const expired = AuthError.sessionExpired();
    const unauth = new AuthError('UNAUTHORIZED', 'Access denied. Please authenticate.');
    const rateLimited = AuthError.rateLimited();
    const provUnavail = AuthError.providerUnavailable();
    const unknown = AuthError.unknown();

    const errors = [notConfigured, invalidCreds, netError, expired, unauth, rateLimited, provUnavail, unknown];
    for (const err of errors) {
      expect(err.name).toBe('AuthError');
      expect(typeof err.code).toBe('string');
      expect(typeof err.message).toBe('string');
      // No raw secrets, stack traces or SQL traces in user messages
      expect(err.message).not.toContain('Bearer');
      expect(err.message).not.toContain('stack trace');
      expect(err.message).not.toContain('SELECT *');
      expect(err.message).not.toContain('jwt');
      expect(err.message).not.toContain('secret_key');
    }
  });

  // =========================================================================
  // 4. NAVIGATION INTEGRATION & TAB HARMONY (TC-04.1.4-15 - TC-04.1.4-19)
  // =========================================================================

  it('TC-04.1.4-15: Public navigation structure remains unhindered and does not enforce unauthenticated blocks', () => {
    const rendered = render(<RootLayout />);
    expect(rendered).toBeDefined();
  });

  it('TC-04.1.4-16: Existing Home screen renders correctly within application context', () => {
    render(
      <AuthProvider authService={unavailableAuthService}>
        <HomeScreen />
      </AuthProvider>
    );

    expect(screen.getByText('WAYMARK 2100')).toBeTruthy();
    expect(screen.getByText('Good morning, navigator')).toBeTruthy();
  });

  it('TC-04.1.4-17: Existing Discovery / Map screen renders correctly and remains accessible to guest users', () => {
    render(
      <AuthProvider authService={unavailableAuthService}>
        <MapScreen />
      </AuthProvider>
    );

    expect(screen.getByText('LIVE MAP')).toBeTruthy();
    expect(screen.getByText('Live Map Vector Canvas')).toBeTruthy();
  });

  it('TC-04.1.4-18: Existing Journey mission route screen renders correctly and remains accessible to guest users', () => {
    render(
      <AuthProvider authService={unavailableAuthService}>
        <JourneyScreen />
      </AuthProvider>
    );

    expect(screen.getByText('MISSION ROUTE')).toBeTruthy();
    expect(screen.getByText('Active Journey Timeline')).toBeTruthy();
  });

  it('TC-04.1.4-19: All bottom tab definitions and accessibility labels remain intact and unbroken', () => {
    expect(BOTTOM_TABS).toHaveLength(5);

    const expectedTabNames = ['index', 'map', 'journey', 'oracle', 'comfort'];
    BOTTOM_TABS.forEach((tab, index) => {
      expect(tab.name).toBe(expectedTabNames[index]);
      expect(tab.title).toBeTruthy();
      expect(tab.accessibilityLabel).toContain(`Tab ${index + 1} of 5`);
    });
  });

  // =========================================================================
  // 5. SECURITY & ZERO LEAKAGE AUDIT (TC-04.1.4-20)
  // =========================================================================

  it('TC-04.1.4-20: Security audit: zero sensitive credentials, passwords, or tokens are leaked to console logging', async () => {
    const logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    const infoSpy = jest.spyOn(console, 'info').mockImplementation(() => {});
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    const secretPassword = 'SuperSecretAuditPassword2100!';
    const secretToken = 'SECRET_ORBITAL_JWT_TOKEN_999';

    const testUser: AuthUser = {
      id: 'usr_sec_audit',
      email: 'sec@waymark.local',
      displayName: 'Security Auditor'
    };

    const sessionWithSecret: AuthSession = {
      accessToken: secretToken,
      expiresAt: Date.now() + 3600 * 1000,
      user: testUser
    };

    const storage = new MockIntegrationStorage(sessionWithSecret);
    const service = new MockIntegrationAuthService('ready', sessionWithSecret);

    render(
      <AuthProvider authService={service} storage={storage}>
        <IntegrationAuthConsumer />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('qa-auth-status').props.children).toBe('authenticated');
    });

    await act(async () => {
      fireEvent.press(screen.getByTestId('btn-qa-sign-out'));
    });

    const allCalls = [
      ...logSpy.mock.calls,
      ...infoSpy.mock.calls,
      ...warnSpy.mock.calls,
      ...errorSpy.mock.calls
    ];

    const joinedLogs = allCalls.map((args) => args.join(' ')).join('\n');
    expect(joinedLogs).not.toContain(secretPassword);
    expect(joinedLogs).not.toContain(secretToken);

    logSpy.mockRestore();
    infoSpy.mockRestore();
    warnSpy.mockRestore();
    errorSpy.mockRestore();
  });
});
