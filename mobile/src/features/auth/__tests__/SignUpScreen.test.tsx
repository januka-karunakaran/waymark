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
  usePathname: () => '/(auth)/sign-up',
  useSegments: () => ['(auth)', 'sign-up'],
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
  SignUpDetails,
  SignInCredentials,
  AuthError,
  unavailableAuthService
} from '../index';
import SignUpScreen from '../../../../app/(auth)/sign-up';

// Mock test-only auth provider double
class MockSignUpAuthService implements AuthService {
  public readiness: ServiceReadiness = 'ready';
  public signUpDelay = 0;
  public signUpOutcome: AuthResult | null = null;
  public signUpCalls = 0;
  public lastSignUpDetails: SignUpDetails | null = null;

  constructor(readiness: ServiceReadiness = 'ready') {
    this.readiness = readiness;
  }

  getServiceReadiness(): ServiceReadiness {
    return this.readiness;
  }

  async getCurrentSession(): Promise<AuthSession | null> {
    return null;
  }

  async signIn(_credentials: SignInCredentials): Promise<AuthResult> {
    return { success: false, error: AuthError.notConfigured() };
  }

  async signUp(details: SignUpDetails): Promise<AuthResult> {
    this.signUpCalls++;
    this.lastSignUpDetails = details;

    if (this.signUpDelay > 0) {
      await new Promise((resolve) => setTimeout(resolve, this.signUpDelay));
    }

    if (this.signUpOutcome) {
      return this.signUpOutcome;
    }

    const session: AuthSession = {
      accessToken: 'mock_jwt_access_token',
      expiresAt: Date.now() + 3600 * 1000,
      user: {
        id: 'usr_mock_new_pilot',
        email: details.email,
        displayName: details.displayName || 'Anonymous Traveler'
      }
    };

    return {
      success: true,
      session,
      user: session.user
    };
  }

  async signOut(): Promise<void> {
    return Promise.resolve();
  }
}

describe('Feature 04.2.3 — Sign-Up Screen & Form Validation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // 1. Rendering of screen elements
  it('TC-04.2.3-01: renders Sign-Up screen with Waymark branding, inputs, and guidance', () => {
    render(
      <AuthProvider authService={new MockSignUpAuthService('ready')} autoInitialize={false}>
        <SignUpScreen />
      </AuthProvider>
    );

    expect(screen.getByTestId('sign-up-screen')).toBeTruthy();
    expect(screen.getByTestId('sign-up-brand-header-title').props.children).toBe('Join Waymark');
    expect(screen.getByTestId('sign-up-brand-header-badge').props.children).toBe('WAYMARK 2100');
    expect(screen.getByTestId('input-sign-up-display-name-field')).toBeTruthy();
    expect(screen.getByTestId('input-sign-up-email-field')).toBeTruthy();
    expect(screen.getByTestId('input-sign-up-password-field')).toBeTruthy();
    expect(screen.getByTestId('input-sign-up-confirm-password-field')).toBeTruthy();
    expect(screen.getByTestId('btn-submit-sign-up')).toBeTruthy();
    expect(screen.getByTestId('btn-navigate-sign-in')).toBeTruthy();
    expect(screen.getByTestId('btn-sign-up-guest')).toBeTruthy();
    expect(screen.getByTestId('sign-up-footer-note')).toBeTruthy();
  });

  // 2. Truthful unconfigured service state
  it('TC-04.2.3-02: renders truthful standby notice and disables submit when unconfigured', () => {
    render(
      <AuthProvider authService={unavailableAuthService} autoInitialize={false}>
        <SignUpScreen />
      </AuthProvider>
    );

    const notice = screen.getByTestId('sign-up-unconfigured-notice');
    expect(notice).toBeTruthy();
    expect(
      screen.getByText(/External registration services are currently unconfigured/i)
    ).toBeTruthy();

    const submitBtn = screen.getByTestId('btn-submit-sign-up');
    expect(submitBtn.props.accessibilityState.disabled).toBe(true);
  });

  // 3. Validation: email required
  it('TC-04.2.3-03: validates that email address is required', async () => {
    render(
      <AuthProvider authService={new MockSignUpAuthService('ready')} autoInitialize={false}>
        <SignUpScreen />
      </AuthProvider>
    );

    const submitBtn = screen.getByTestId('btn-submit-sign-up');
    await act(async () => {
      fireEvent.press(submitBtn);
    });

    expect(screen.getByText('Email address is required.')).toBeTruthy();
  });

  // 4. Validation: email format syntax
  it('TC-04.2.3-04: rejects invalid email formats', async () => {
    render(
      <AuthProvider authService={new MockSignUpAuthService('ready')} autoInitialize={false}>
        <SignUpScreen />
      </AuthProvider>
    );

    const emailInput = screen.getByTestId('input-sign-up-email-input');
    fireEvent.changeText(emailInput, 'invalid-email-string');

    const submitBtn = screen.getByTestId('btn-submit-sign-up');
    await act(async () => {
      fireEvent.press(submitBtn);
    });

    expect(screen.getByText('Please enter a valid email address.')).toBeTruthy();
  });

  // 5. Validation: password minimum length
  it('TC-04.2.3-05: enforces minimum 8 character password constraint', async () => {
    render(
      <AuthProvider authService={new MockSignUpAuthService('ready')} autoInitialize={false}>
        <SignUpScreen />
      </AuthProvider>
    );

    fireEvent.changeText(screen.getByTestId('input-sign-up-email-input'), 'pilot@waymark.local');
    fireEvent.changeText(screen.getByTestId('input-sign-up-password-input'), 'short');
    fireEvent.changeText(screen.getByTestId('input-sign-up-confirm-password-input'), 'short');

    const submitBtn = screen.getByTestId('btn-submit-sign-up');
    await act(async () => {
      fireEvent.press(submitBtn);
    });

    expect(screen.getByText('Password must be at least 8 characters.')).toBeTruthy();
  });

  // 6. Validation: password confirmation match
  it('TC-04.2.3-06: rejects mismatched confirm password input', async () => {
    render(
      <AuthProvider authService={new MockSignUpAuthService('ready')} autoInitialize={false}>
        <SignUpScreen />
      </AuthProvider>
    );

    fireEvent.changeText(screen.getByTestId('input-sign-up-email-input'), 'pilot@waymark.local');
    fireEvent.changeText(screen.getByTestId('input-sign-up-password-input'), 'ValidPass123!');
    fireEvent.changeText(screen.getByTestId('input-sign-up-confirm-password-input'), 'DifferentPass456!');

    const submitBtn = screen.getByTestId('btn-submit-sign-up');
    await act(async () => {
      fireEvent.press(submitBtn);
    });

    expect(screen.getByText('Passwords do not match.')).toBeTruthy();
  });

  // 7. Validation: display name bounds
  it('TC-04.2.3-07: enforces display name length limits', async () => {
    render(
      <AuthProvider authService={new MockSignUpAuthService('ready')} autoInitialize={false}>
        <SignUpScreen />
      </AuthProvider>
    );

    const overlongName = 'A'.repeat(51);
    fireEvent.changeText(screen.getByTestId('input-sign-up-display-name-input'), overlongName);
    fireEvent.changeText(screen.getByTestId('input-sign-up-email-input'), 'pilot@waymark.local');
    fireEvent.changeText(screen.getByTestId('input-sign-up-password-input'), 'ValidPass123!');
    fireEvent.changeText(screen.getByTestId('input-sign-up-confirm-password-input'), 'ValidPass123!');

    const submitBtn = screen.getByTestId('btn-submit-sign-up');
    await act(async () => {
      fireEvent.press(submitBtn);
    });

    expect(screen.getByText('Display name cannot exceed 50 characters.')).toBeTruthy();
  });

  // 8. Successful registration flow
  it('TC-04.2.3-08: registers user and navigates to tabs upon success', async () => {
    const mockService = new MockSignUpAuthService('ready');
    render(
      <AuthProvider authService={mockService} autoInitialize={false}>
        <SignUpScreen />
      </AuthProvider>
    );

    fireEvent.changeText(screen.getByTestId('input-sign-up-display-name-input'), 'Vega Navigator');
    fireEvent.changeText(screen.getByTestId('input-sign-up-email-input'), 'vega@waymark.local');
    fireEvent.changeText(screen.getByTestId('input-sign-up-password-input'), 'Starlight2100!');
    fireEvent.changeText(screen.getByTestId('input-sign-up-confirm-password-input'), 'Starlight2100!');

    const submitBtn = screen.getByTestId('btn-submit-sign-up');
    await act(async () => {
      fireEvent.press(submitBtn);
    });

    expect(mockService.signUpCalls).toBe(1);
    expect(mockService.lastSignUpDetails).toEqual({
      email: 'vega@waymark.local',
      password: 'Starlight2100!',
      displayName: 'Vega Navigator'
    });
    expect(mockReplace).toHaveBeenCalledWith('/(tabs)');
  });

  // 9. Registration domain error notice
  it('TC-04.2.3-09: renders error notice when registration fails', async () => {
    const mockService = new MockSignUpAuthService('ready');
    mockService.signUpOutcome = {
      success: false,
      error: new AuthError('RATE_LIMITED', 'Too many registration requests. Please wait.')
    };

    render(
      <AuthProvider authService={mockService} autoInitialize={false}>
        <SignUpScreen />
      </AuthProvider>
    );

    fireEvent.changeText(screen.getByTestId('input-sign-up-email-input'), 'vega@waymark.local');
    fireEvent.changeText(screen.getByTestId('input-sign-up-password-input'), 'Starlight2100!');
    fireEvent.changeText(screen.getByTestId('input-sign-up-confirm-password-input'), 'Starlight2100!');

    const submitBtn = screen.getByTestId('btn-submit-sign-up');
    await act(async () => {
      fireEvent.press(submitBtn);
    });

    expect(screen.getByTestId('sign-up-error-notice')).toBeTruthy();
    expect(screen.getByText('Too many registration requests. Please wait.')).toBeTruthy();
  });

  // 10. Navigation to Sign In and Guest
  it('TC-04.2.3-10: navigates cleanly to sign-in and guest modes', () => {
    render(
      <AuthProvider authService={new MockSignUpAuthService('ready')} autoInitialize={false}>
        <SignUpScreen />
      </AuthProvider>
    );

    fireEvent.press(screen.getByTestId('btn-navigate-sign-in'));
    expect(mockReplace).toHaveBeenCalledWith('/(auth)/sign-in');

    fireEvent.press(screen.getByTestId('btn-sign-up-guest'));
    expect(mockReplace).toHaveBeenCalledWith('/(tabs)');
  });

  // 11. Password visibility toggle
  it('TC-04.2.3-11: masks password fields by default and toggles visibility upon request', () => {
    render(
      <AuthProvider authService={new MockSignUpAuthService('ready')} autoInitialize={false}>
        <SignUpScreen />
      </AuthProvider>
    );

    const passwordInput = screen.getByTestId('input-sign-up-password-input');
    const confirmInput = screen.getByTestId('input-sign-up-confirm-password-input');

    expect(passwordInput.props.secureTextEntry).toBe(true);
    expect(confirmInput.props.secureTextEntry).toBe(true);

    const togglePasswordBtn = screen.getByTestId('input-sign-up-password-input-toggle-visibility');
    fireEvent.press(togglePasswordBtn);
    expect(passwordInput.props.secureTextEntry).toBe(false);

    const toggleConfirmBtn = screen.getByTestId('input-sign-up-confirm-password-input-toggle-visibility');
    fireEvent.press(toggleConfirmBtn);
    expect(confirmInput.props.secureTextEntry).toBe(false);
  });

  // 12. Sensitive credential safety: no console logging
  it('TC-04.2.3-12: never outputs passwords or credentials to console logs', async () => {
    const logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    const infoSpy = jest.spyOn(console, 'info').mockImplementation(() => {});
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

    const mockService = new MockSignUpAuthService('ready');
    render(
      <AuthProvider authService={mockService} autoInitialize={false}>
        <SignUpScreen />
      </AuthProvider>
    );

    const secretPassword = 'UltraSecretPassword2100!';
    fireEvent.changeText(screen.getByTestId('input-sign-up-email-input'), 'secret@waymark.local');
    fireEvent.changeText(screen.getByTestId('input-sign-up-password-input'), secretPassword);
    fireEvent.changeText(screen.getByTestId('input-sign-up-confirm-password-input'), secretPassword);

    await act(async () => {
      fireEvent.press(screen.getByTestId('btn-submit-sign-up'));
    });

    const checkNoPasswordLeak = (spy: jest.SpyInstance) => {
      spy.mock.calls.forEach((callArgs) => {
        const joined = JSON.stringify(callArgs);
        expect(joined).not.toContain(secretPassword);
      });
    };

    checkNoPasswordLeak(logSpy);
    checkNoPasswordLeak(infoSpy);
    checkNoPasswordLeak(warnSpy);

    logSpy.mockRestore();
    infoSpy.mockRestore();
    warnSpy.mockRestore();
  });
});
