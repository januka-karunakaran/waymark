import React, { useEffect } from 'react';
import { Text, Button, View } from 'react-native';
import { render, screen, fireEvent, act, waitFor } from '@testing-library/react-native';
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
  unavailableAuthService
} from '../index';
import RootLayout from '../../../../app/_layout';

// Helper mock storage implementation
class MockAuthSessionStorage implements AuthSessionStorage {
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
      throw new Error('Storage read failure');
    }
    return this.session;
  }

  async saveSession(session: AuthSession): Promise<void> {
    this.saveSessionCalls++;
    if (this.shouldFailSave) {
      throw new Error('Storage write failure');
    }
    this.session = session;
  }

  async clearSession(): Promise<void> {
    this.clearSessionCalls++;
    this.session = null;
  }
}

// Helper mock auth service implementation
class MockAuthService implements AuthService {
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
      accessToken: 'mock_access_token_' + Date.now(),
      expiresAt: Date.now() + 3600 * 1000,
      user: {
        id: 'usr_mock_1',
        email: credentials.email,
        displayName: 'Mock Pilot'
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
        id: 'usr_registered_1',
        email: details.email,
        displayName: details.displayName ?? 'New User'
      }
    };
  }

  async signOut(): Promise<void> {
    this.signOutCalls++;
    this.currentSession = null;
  }
}

// Consumer test harness
const AuthConsumerTestHarness: React.FC<{ onMount?: () => void }> = ({ onMount }) => {
  const auth = useAuth();

  useEffect(() => {
    onMount?.();
  }, [onMount]);

  return (
    <View testID="auth-consumer">
      <Text testID="auth-status">{auth.status}</Text>
      <Text testID="auth-user-email">{auth.user?.email ?? 'none'}</Text>
      <Text testID="auth-is-authenticated">{auth.isAuthenticated ? 'true' : 'false'}</Text>
      <Text testID="auth-is-initializing">{auth.isInitializing ? 'true' : 'false'}</Text>
      <Text testID="auth-readiness">{auth.serviceReadiness}</Text>
      <Text testID="auth-error">{auth.error?.code ?? 'none'}</Text>

      <Button
        title="Sign In"
        testID="btn-sign-in"
        onPress={() => auth.signIn({ email: 'rider@waymark.local', password: 'Password123!' })}
      />
      <Button
        title="Sign In Empty"
        testID="btn-sign-in-empty"
        onPress={() => auth.signIn({ email: '', password: '' })}
      />
      <Button
        title="Sign Up"
        testID="btn-sign-up"
        onPress={() => auth.signUp({ email: 'new@waymark.local', password: 'Password123!', displayName: 'Rider' })}
      />
      <Button title="Sign Out" testID="btn-sign-out" onPress={() => auth.signOut()} />
      <Button title="Clear Error" testID="btn-clear-error" onPress={() => auth.clearError()} />
    </View>
  );
};

describe('Feature 04.1.3 — Auth State & Session Context', () => {
  const mockValidUser: AuthUser = {
    id: 'usr_valid_pilot',
    email: 'pilot@waymark.local',
    displayName: 'Chief Pilot'
  };

  const createValidSession = (expiresInMs: number = 3600 * 1000): AuthSession => ({
    accessToken: 'valid_access_token_abc',
    expiresAt: Date.now() + expiresInMs,
    user: mockValidUser
  });

  // 1. Initializing and Guest State with default unavailable service
  it('initializes to guest state when no provider is configured', async () => {
    render(
      <AuthProvider authService={unavailableAuthService}>
        <AuthConsumerTestHarness />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('auth-status').props.children).toBe('guest');
      expect(screen.getByTestId('auth-is-authenticated').props.children).toBe('false');
      expect(screen.getByTestId('auth-is-initializing').props.children).toBe('false');
      expect(screen.getByTestId('auth-readiness').props.children).toBe('not_configured');
    });
  });

  // 2. Not-configured sign-in returns NOT_CONFIGURED error
  it('returns NOT_CONFIGURED error when sign-in is dispatched without configured provider', async () => {
    render(
      <AuthProvider authService={unavailableAuthService}>
        <AuthConsumerTestHarness />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('auth-status').props.children).toBe('guest');
    });

    await act(async () => {
      fireEvent.press(screen.getByTestId('btn-sign-in'));
    });

    expect(screen.getByTestId('auth-error').props.children).toBe('NOT_CONFIGURED');
    expect(screen.getByTestId('auth-is-authenticated').props.children).toBe('false');
  });

  // 3. Not-configured registration returns NOT_CONFIGURED error
  it('returns NOT_CONFIGURED error when sign-up is dispatched without configured provider', async () => {
    render(
      <AuthProvider authService={unavailableAuthService}>
        <AuthConsumerTestHarness />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('auth-status').props.children).toBe('guest');
    });

    await act(async () => {
      fireEvent.press(screen.getByTestId('btn-sign-up'));
    });

    expect(screen.getByTestId('auth-error').props.children).toBe('NOT_CONFIGURED');
  });

  // 4. Storage initialization failure handles gracefully and defaults to guest
  it('handles storage initialization rejection gracefully and defaults to guest', async () => {
    const mockStorage = new MockAuthSessionStorage();
    mockStorage.shouldFailGet = true;
    const mockService = new MockAuthService('ready');

    render(
      <AuthProvider authService={mockService} storage={mockStorage}>
        <AuthConsumerTestHarness />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('auth-status').props.children).toBe('guest');
      expect(screen.getByTestId('auth-is-authenticated').props.children).toBe('false');
    });
  });

  // 5. Valid provider response restores authenticated state on startup
  it('restores authenticated state on startup when valid session exists in storage and provider confirms', async () => {
    const session = createValidSession();
    const mockStorage = new MockAuthSessionStorage(session);
    const mockService = new MockAuthService('ready', session);

    render(
      <AuthProvider authService={mockService} storage={mockStorage}>
        <AuthConsumerTestHarness />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('auth-status').props.children).toBe('authenticated');
      expect(screen.getByTestId('auth-is-authenticated').props.children).toBe('true');
      expect(screen.getByTestId('auth-user-email').props.children).toBe('pilot@waymark.local');
    });
  });

  // 6. Provider rejects stored session: purges storage and defaults to guest
  it('purges storage and transitions to guest if provider rejects candidate stored session', async () => {
    const storedSession = createValidSession();
    const mockStorage = new MockAuthSessionStorage(storedSession);
    const mockService = new MockAuthService('ready', null); // Provider returns null (e.g. revoked)

    render(
      <AuthProvider authService={mockService} storage={mockStorage}>
        <AuthConsumerTestHarness />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('auth-status').props.children).toBe('guest');
      expect(screen.getByTestId('auth-is-authenticated').props.children).toBe('false');
      expect(mockStorage.clearSessionCalls).toBeGreaterThanOrEqual(1);
    });
  });

  // 7. Successful sign-in transitions to authenticated and persists session
  it('transitions to authenticated and writes session to storage on successful sign-in', async () => {
    const mockStorage = new MockAuthSessionStorage();
    const mockService = new MockAuthService('ready');

    render(
      <AuthProvider authService={mockService} storage={mockStorage}>
        <AuthConsumerTestHarness />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('auth-status').props.children).toBe('guest');
    });

    await act(async () => {
      fireEvent.press(screen.getByTestId('btn-sign-in'));
    });

    expect(screen.getByTestId('auth-status').props.children).toBe('authenticated');
    expect(screen.getByTestId('auth-is-authenticated').props.children).toBe('true');
    expect(screen.getByTestId('auth-user-email').props.children).toBe('rider@waymark.local');
    expect(mockStorage.saveSessionCalls).toBe(1);
  });

  // 8. Sign-in validation error on empty credentials
  it('rejects empty credentials with INVALID_CREDENTIALS error without calling provider', async () => {
    const mockService = new MockAuthService('ready');

    render(
      <AuthProvider authService={mockService}>
        <AuthConsumerTestHarness />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('auth-status').props.children).toBe('guest');
    });

    await act(async () => {
      fireEvent.press(screen.getByTestId('btn-sign-in-empty'));
    });

    expect(screen.getByTestId('auth-error').props.children).toBe('INVALID_CREDENTIALS');
    expect(mockService.signInCalls).toBe(0);
  });

  // 9. Sign-out wipes session, clears storage, and reverts to guest
  it('clears user, session, storage, and transitions to guest on signOut', async () => {
    const session = createValidSession();
    const mockStorage = new MockAuthSessionStorage(session);
    const mockService = new MockAuthService('ready', session);

    render(
      <AuthProvider authService={mockService} storage={mockStorage}>
        <AuthConsumerTestHarness />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('auth-status').props.children).toBe('authenticated');
    });

    await act(async () => {
      fireEvent.press(screen.getByTestId('btn-sign-out'));
    });

    expect(screen.getByTestId('auth-status').props.children).toBe('guest');
    expect(screen.getByTestId('auth-is-authenticated').props.children).toBe('false');
    expect(screen.getByTestId('auth-user-email').props.children).toBe('none');
    expect(mockStorage.clearSessionCalls).toBeGreaterThanOrEqual(1);
    expect(mockService.signOutCalls).toBe(1);
  });

  // 10. Duplicate request handling (guards against concurrent sign-in)
  it('guards against concurrent duplicate sign-in requests', async () => {
    const mockService = new MockAuthService('ready');
    mockService.signInDelay = 50;

    render(
      <AuthProvider authService={mockService}>
        <AuthConsumerTestHarness />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('auth-status').props.children).toBe('guest');
    });

    // Fire first press
    act(() => {
      fireEvent.press(screen.getByTestId('btn-sign-in'));
    });

    // Fire second press while authenticating
    act(() => {
      fireEvent.press(screen.getByTestId('btn-sign-in'));
    });

    await waitFor(() => {
      expect(screen.getByTestId('auth-status').props.children).toBe('authenticated');
    });

    expect(mockService.signInCalls).toBe(1);
  });

  // 11. Logout versus pending sign-in race: late sign-in is discarded
  it('discards late sign-in result if user signs out while request is in-flight', async () => {
    const mockStorage = new MockAuthSessionStorage();
    const mockService = new MockAuthService('ready');
    mockService.signInDelay = 60;

    render(
      <AuthProvider authService={mockService} storage={mockStorage}>
        <AuthConsumerTestHarness />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('auth-status').props.children).toBe('guest');
    });

    // Initiate slow sign-in
    act(() => {
      fireEvent.press(screen.getByTestId('btn-sign-in'));
    });

    // User immediately clicks sign out before sign in completes
    await act(async () => {
      fireEvent.press(screen.getByTestId('btn-sign-out'));
    });

    // Wait for in-flight sign-in to conclude
    await act(async () => {
      await new Promise((r) => setTimeout(r, 80));
    });

    // State MUST remain guest, never overridden by late login response
    expect(screen.getByTestId('auth-status').props.children).toBe('guest');
    expect(screen.getByTestId('auth-is-authenticated').props.children).toBe('false');
    expect(screen.getByTestId('auth-user-email').props.children).toBe('none');
  });

  // 12. Error clearing
  it('clears active domain error on clearError', async () => {
    render(
      <AuthProvider authService={unavailableAuthService}>
        <AuthConsumerTestHarness />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('auth-status').props.children).toBe('guest');
    });

    await act(async () => {
      fireEvent.press(screen.getByTestId('btn-sign-in-empty'));
    });

    expect(screen.getByTestId('auth-error').props.children).toBe('INVALID_CREDENTIALS');

    await act(async () => {
      fireEvent.press(screen.getByTestId('btn-clear-error'));
    });

    expect(screen.getByTestId('auth-error').props.children).toBe('none');
  });

  // 13. useAuth throws when rendered outside AuthProvider
  it('throws descriptive error if useAuth is invoked outside AuthProvider', () => {
    const RogueComponent = () => {
      useAuth();
      return null;
    };

    // Suppress react console.error boundary noise
    const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => render(<RogueComponent />)).toThrow(/useAuth must be used within an AuthProvider/);
    spy.mockRestore();
  });

  // 14. RootLayout integration
  it('renders RootLayout wrapped with AuthProvider without crashing', () => {
    const rendered = render(<RootLayout />);
    expect(rendered).toBeDefined();
  });
});
