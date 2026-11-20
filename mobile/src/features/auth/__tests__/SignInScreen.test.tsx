import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react-native';

const mockPush = jest.fn();
const mockReplace = jest.fn();
const mockBack = jest.fn();
const mockCanGoBack = jest.fn(() => true);

jest.mock('expo-router', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: mockReplace,
    back: mockBack,
    canGoBack: mockCanGoBack
  }),
  useLocalSearchParams: () => ({}),
  usePathname: () => '/(auth)/sign-in',
  useSegments: () => ['(auth)', 'sign-in'],
  Tabs: Object.assign(({ children }: { children?: React.ReactNode }) => children, { Screen: () => null }),
  Stack: Object.assign(({ children }: { children?: React.ReactNode }) => children, { Screen: () => null }),
  Link: ({ children }: { children?: React.ReactNode }) => children
}));

import {
  AuthProvider,
  AuthService,
  AuthSession,
  AuthResult,
  ServiceReadiness,
  SignInCredentials,
  AuthError,
  unavailableAuthService
} from '../index';
import SignInScreen from '../../../../app/(auth)/sign-in';

// Mock test-only auth provider double
class MockSignInAuthService implements AuthService {
  public readiness: ServiceReadiness = 'ready';
  public signInDelay = 0;
  public signInOutcome: AuthResult | null = null;
  public signInCalls = 0;
  public lastCredentials: SignInCredentials | null = null;

  constructor(readiness: ServiceReadiness = 'ready') {
    this.readiness = readiness;
  }

  getServiceReadiness(): ServiceReadiness {
    return this.readiness;
  }

  async getCurrentSession(): Promise<AuthSession | null> {
    return null;
  }

  async signIn(credentials: SignInCredentials): Promise<AuthResult> {
    this.signInCalls++;
    this.lastCredentials = credentials;

    if (this.signInDelay > 0) {
      await new Promise((resolve) => setTimeout(resolve, this.signInDelay));
    }

    if (this.signInOutcome) {
      return this.signInOutcome;
    }

    const session: AuthSession = {
      accessToken: 'mock_jwt_access_token',
      expiresAt: Date.now() + 3600 * 1000,
      user: {
        id: 'usr_mock_pilot',
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

  async signUp(): Promise<AuthResult> {
    return { success: false, error: AuthError.notConfigured() };
  }

  async signOut(): Promise<void> {
    return Promise.resolve();
  }
}

describe('Feature 04.2.2 — Sign-In Screen & Form Validation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // 1. Screen rendering
  it('TC-04.2.2-01: renders Sign-In screen with Waymark branding and inputs', () => {
    render(
      <AuthProvider authService={unavailableAuthService}>
        <SignInScreen />
      </AuthProvider>
    );

    expect(screen.getByTestId('sign-in-screen')).toBeTruthy();
    expect(screen.getByTestId('sign-in-brand-header-title').props.children).toBe('Welcome back to Waymark');
    expect(screen.getByTestId('input-sign-in-email-field')).toBeTruthy();
    expect(screen.getByTestId('input-sign-in-password-field')).toBeTruthy();
    expect(screen.getByTestId('btn-submit-sign-in')).toBeTruthy();
  });

  // 2. Email input behavior
  it('TC-04.2.2-02: accepts email text entry and updates input value', () => {
    render(
      <AuthProvider authService={unavailableAuthService}>
        <SignInScreen />
      </AuthProvider>
    );

    const emailInput = screen.getByTestId('input-sign-in-email-input');
    fireEvent.changeText(emailInput, 'pilot@waymark.local');
    expect(emailInput.props.value).toBe('pilot@waymark.local');
  });

  // 3. Password masking
  it('TC-04.2.2-03: masks password input by default with secureTextEntry', () => {
    render(
      <AuthProvider authService={unavailableAuthService}>
        <SignInScreen />
      </AuthProvider>
    );

    const passwordInput = screen.getByTestId('input-sign-in-password-input');
    expect(passwordInput.props.secureTextEntry).toBe(true);
  });

  // 4. Show/hide password toggle
  it('TC-04.2.2-04: toggles password visibility when toggle button is pressed', () => {
    render(
      <AuthProvider authService={unavailableAuthService}>
        <SignInScreen />
      </AuthProvider>
    );

    const passwordInput = screen.getByTestId('input-sign-in-password-input');
    const toggleBtn = screen.getByTestId('input-sign-in-password-input-toggle-visibility');

    expect(passwordInput.props.secureTextEntry).toBe(true);
    expect(toggleBtn.props.accessibilityLabel).toBe('Show password');

    fireEvent.press(toggleBtn);
    expect(passwordInput.props.secureTextEntry).toBe(false);
    expect(toggleBtn.props.accessibilityLabel).toBe('Hide password');
  });

  // 5. Required email validation
  it('TC-04.2.2-05: validates that email address is required', async () => {
    const service = new MockSignInAuthService('ready');
    render(
      <AuthProvider authService={service}>
        <SignInScreen />
      </AuthProvider>
    );

    const submitBtn = screen.getByTestId('btn-submit-sign-in');
    fireEvent.press(submitBtn);

    expect(screen.getByText('Email address is required.')).toBeTruthy();
    expect(service.signInCalls).toBe(0);
  });

  // 6. Invalid email validation
  it('TC-04.2.2-06: rejects invalid email syntax and whitespace-only addresses', async () => {
    const service = new MockSignInAuthService('ready');
    render(
      <AuthProvider authService={service}>
        <SignInScreen />
      </AuthProvider>
    );

    const emailInput = screen.getByTestId('input-sign-in-email-input');
    const submitBtn = screen.getByTestId('btn-submit-sign-in');

    fireEvent.changeText(emailInput, 'invalid-email-address');
    fireEvent.press(submitBtn);
    expect(screen.getByText('Please enter a valid email address.')).toBeTruthy();

    fireEvent.changeText(emailInput, '   ');
    fireEvent.press(submitBtn);
    expect(screen.getByText('Email address is required.')).toBeTruthy();
    expect(service.signInCalls).toBe(0);
  });

  // 7. Required password validation
  it('TC-04.2.2-07: validates that password is required', async () => {
    const service = new MockSignInAuthService('ready');
    render(
      <AuthProvider authService={service}>
        <SignInScreen />
      </AuthProvider>
    );

    const emailInput = screen.getByTestId('input-sign-in-email-input');
    fireEvent.changeText(emailInput, 'pilot@waymark.local');

    const submitBtn = screen.getByTestId('btn-submit-sign-in');
    fireEvent.press(submitBtn);

    expect(screen.getByText('Password is required.')).toBeTruthy();
    expect(service.signInCalls).toBe(0);
  });

  // 8. Input-length boundaries
  it('TC-04.2.2-08: rejects input values that exceed maximum length boundaries', () => {
    const service = new MockSignInAuthService('ready');
    render(
      <AuthProvider authService={service}>
        <SignInScreen />
      </AuthProvider>
    );

    const emailInput = screen.getByTestId('input-sign-in-email-input');
    const passwordInput = screen.getByTestId('input-sign-in-password-input');
    const submitBtn = screen.getByTestId('btn-submit-sign-in');

    // 255 character email
    const longEmail = 'a'.repeat(245) + '@waymark.local';
    fireEvent.changeText(emailInput, longEmail);
    fireEvent.changeText(passwordInput, 'validPass123!');
    fireEvent.press(submitBtn);

    expect(screen.getByText(/Email address cannot exceed 254 characters/i)).toBeTruthy();
  });

  // 9. Disabled submission while unavailable
  it('TC-04.2.2-09: disables sign-in submission when provider is not configured', () => {
    render(
      <AuthProvider authService={unavailableAuthService}>
        <SignInScreen />
      </AuthProvider>
    );

    const submitBtn = screen.getByTestId('btn-submit-sign-in');
    expect(submitBtn.props.accessibilityState.disabled).toBe(true);
  });

  // 10. NOT_CONFIGURED messaging
  it('TC-04.2.2-10: displays truthful standby notice when provider is not configured', () => {
    render(
      <AuthProvider authService={unavailableAuthService}>
        <SignInScreen />
      </AuthProvider>
    );

    const notice = screen.getByTestId('sign-in-unconfigured-notice');
    expect(notice).toBeTruthy();
    expect(
      screen.getByText(/External authentication services are currently unconfigured/i)
    ).toBeTruthy();
  });

  // 11. Valid sign-in delegation through test provider
  it('TC-04.2.2-11: delegates valid credentials to AuthProvider signIn', async () => {
    const service = new MockSignInAuthService('ready');
    render(
      <AuthProvider authService={service}>
        <SignInScreen />
      </AuthProvider>
    );

    const emailInput = screen.getByTestId('input-sign-in-email-input');
    const passwordInput = screen.getByTestId('input-sign-in-password-input');
    const submitBtn = screen.getByTestId('btn-submit-sign-in');

    fireEvent.changeText(emailInput, '  navigator@waymark.local  ');
    fireEvent.changeText(passwordInput, 'ValidPassword123!');

    await act(async () => {
      fireEvent.press(submitBtn);
    });

    expect(service.signInCalls).toBe(1);
    expect(service.lastCredentials?.email).toBe('navigator@waymark.local');
    expect(service.lastCredentials?.password).toBe('ValidPassword123!');
  });

  // 12. Successful test-provider response handling
  it('TC-04.2.2-12: navigates to tabs on successful authentication response', async () => {
    const service = new MockSignInAuthService('ready');
    render(
      <AuthProvider authService={service}>
        <SignInScreen />
      </AuthProvider>
    );

    const emailInput = screen.getByTestId('input-sign-in-email-input');
    const passwordInput = screen.getByTestId('input-sign-in-password-input');
    const submitBtn = screen.getByTestId('btn-submit-sign-in');

    fireEvent.changeText(emailInput, 'navigator@waymark.local');
    fireEvent.changeText(passwordInput, 'ValidPassword123!');

    await act(async () => {
      fireEvent.press(submitBtn);
    });

    expect(mockReplace).toHaveBeenCalledWith('/(tabs)');
  });

  // 13. Invalid credentials error handling
  it('TC-04.2.2-13: displays domain error notice when invalid credentials are provided', async () => {
    const service = new MockSignInAuthService('ready');
    service.signInOutcome = {
      success: false,
      error: AuthError.invalidCredentials('Invalid email or password.')
    };

    render(
      <AuthProvider authService={service}>
        <SignInScreen />
      </AuthProvider>
    );

    const emailInput = screen.getByTestId('input-sign-in-email-input');
    const passwordInput = screen.getByTestId('input-sign-in-password-input');
    const submitBtn = screen.getByTestId('btn-submit-sign-in');

    fireEvent.changeText(emailInput, 'wrong@waymark.local');
    fireEvent.changeText(passwordInput, 'WrongPass123!');

    await act(async () => {
      fireEvent.press(submitBtn);
    });

    expect(screen.getByTestId('sign-in-error-notice')).toBeTruthy();
    expect(screen.getByText('Invalid email or password.')).toBeTruthy();
  });

  // 14. Network failure error handling
  it('TC-04.2.2-14: displays sanitized error message on network failure', async () => {
    const service = new MockSignInAuthService('ready');
    service.signInOutcome = {
      success: false,
      error: AuthError.networkUnavailable()
    };

    render(
      <AuthProvider authService={service}>
        <SignInScreen />
      </AuthProvider>
    );

    const emailInput = screen.getByTestId('input-sign-in-email-input');
    const passwordInput = screen.getByTestId('input-sign-in-password-input');
    const submitBtn = screen.getByTestId('btn-submit-sign-in');

    fireEvent.changeText(emailInput, 'pilot@waymark.local');
    fireEvent.changeText(passwordInput, 'ValidPass123!');

    await act(async () => {
      fireEvent.press(submitBtn);
    });

    expect(screen.getByTestId('sign-in-error-notice')).toBeTruthy();
    expect(screen.getByText(/Network connection unavailable/i)).toBeTruthy();
  });

  // 15. Rate-limit error handling
  it('TC-04.2.2-15: displays rate-limit error message when throttled', async () => {
    const service = new MockSignInAuthService('ready');
    service.signInOutcome = {
      success: false,
      error: AuthError.rateLimited()
    };

    render(
      <AuthProvider authService={service}>
        <SignInScreen />
      </AuthProvider>
    );

    const emailInput = screen.getByTestId('input-sign-in-email-input');
    const passwordInput = screen.getByTestId('input-sign-in-password-input');
    const submitBtn = screen.getByTestId('btn-submit-sign-in');

    fireEvent.changeText(emailInput, 'pilot@waymark.local');
    fireEvent.changeText(passwordInput, 'ValidPass123!');

    await act(async () => {
      fireEvent.press(submitBtn);
    });

    expect(screen.getByTestId('sign-in-error-notice')).toBeTruthy();
    expect(screen.getByText(/Too many authentication attempts/i)).toBeTruthy();
  });

  // 16. Pending loading state
  it('TC-04.2.2-16: reflects loading state on submit button while request is in-flight', async () => {
    const service = new MockSignInAuthService('ready');
    service.signInDelay = 80;

    render(
      <AuthProvider authService={service}>
        <SignInScreen />
      </AuthProvider>
    );

    const emailInput = screen.getByTestId('input-sign-in-email-input');
    const passwordInput = screen.getByTestId('input-sign-in-password-input');
    const submitBtn = screen.getByTestId('btn-submit-sign-in');

    fireEvent.changeText(emailInput, 'pilot@waymark.local');
    fireEvent.changeText(passwordInput, 'ValidPass123!');

    act(() => {
      fireEvent.press(submitBtn);
    });

    expect(submitBtn.props.accessibilityState.busy).toBe(true);
    expect(submitBtn.props.accessibilityLabel).toBe('Authenticating Navigator...');

    await act(async () => {
      await new Promise((r) => setTimeout(r, 100));
    });

    expect(mockReplace).toHaveBeenCalledWith('/(tabs)');
  });

  // 17. Duplicate submission prevention
  it('TC-04.2.2-17: suppresses duplicate submissions while sign-in request is in-flight', async () => {
    const service = new MockSignInAuthService('ready');
    service.signInDelay = 80;

    render(
      <AuthProvider authService={service}>
        <SignInScreen />
      </AuthProvider>
    );

    const emailInput = screen.getByTestId('input-sign-in-email-input');
    const passwordInput = screen.getByTestId('input-sign-in-password-input');
    const submitBtn = screen.getByTestId('btn-submit-sign-in');

    fireEvent.changeText(emailInput, 'pilot@waymark.local');
    fireEvent.changeText(passwordInput, 'ValidPass123!');

    // Dispatch two rapid presses
    act(() => {
      fireEvent.press(submitBtn);
    });
    act(() => {
      fireEvent.press(submitBtn);
    });

    await act(async () => {
      await new Promise((r) => setTimeout(r, 100));
    });

    expect(service.signInCalls).toBe(1);
  });

  // 18. Safe guest navigation
  it('TC-04.2.2-18: provides functional Continue as Guest action returning to tabs', () => {
    render(
      <AuthProvider authService={unavailableAuthService}>
        <SignInScreen />
      </AuthProvider>
    );

    const guestBtn = screen.getByTestId('btn-sign-in-guest');
    fireEvent.press(guestBtn);
    expect(mockReplace).toHaveBeenCalledWith('/(tabs)');
  });

  // 19. No password logging
  it('TC-04.2.2-19: ensures password text is never leaked into console logging', async () => {
    const logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    const infoSpy = jest.spyOn(console, 'info').mockImplementation(() => {});
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    const secretPassword = 'MySuperSecretPassword#2100';

    const service = new MockSignInAuthService('ready');
    render(
      <AuthProvider authService={service}>
        <SignInScreen />
      </AuthProvider>
    );

    const emailInput = screen.getByTestId('input-sign-in-email-input');
    const passwordInput = screen.getByTestId('input-sign-in-password-input');
    const submitBtn = screen.getByTestId('btn-submit-sign-in');

    fireEvent.changeText(emailInput, 'pilot@waymark.local');
    fireEvent.changeText(passwordInput, secretPassword);

    await act(async () => {
      fireEvent.press(submitBtn);
    });

    const allCalls = [
      ...logSpy.mock.calls,
      ...infoSpy.mock.calls,
      ...warnSpy.mock.calls,
      ...errorSpy.mock.calls
    ];

    const joinedLogs = allCalls.map((args) => args.join(' ')).join('\n');
    expect(joinedLogs).not.toContain(secretPassword);

    logSpy.mockRestore();
    infoSpy.mockRestore();
    warnSpy.mockRestore();
    errorSpy.mockRestore();
  });

  // 20. No fake production login success
  it('TC-04.2.2-20: strictly prevents fake login success with unavailable production service', async () => {
    render(
      <AuthProvider authService={unavailableAuthService}>
        <SignInScreen />
      </AuthProvider>
    );

    const emailInput = screen.getByTestId('input-sign-in-email-input');
    const passwordInput = screen.getByTestId('input-sign-in-password-input');
    const submitBtn = screen.getByTestId('btn-submit-sign-in');

    fireEvent.changeText(emailInput, 'pilot@waymark.local');
    fireEvent.changeText(passwordInput, 'AnyPassword123!');

    // Since button is disabled, press should not trigger submission
    await act(async () => {
      fireEvent.press(submitBtn);
    });

    expect(mockReplace).not.toHaveBeenCalled();
    expect(screen.getByTestId('sign-in-unconfigured-notice')).toBeTruthy();
  });
});
