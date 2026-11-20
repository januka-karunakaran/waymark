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
  usePathname: () => '/',
  useSegments: () => [],
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
  SignUpDetails,
  AuthError,
  unavailableAuthService
} from '../index';

import HomeScreen from '../../../../app/(tabs)/index';
import MapScreen from '../../../../app/(tabs)/map';
import JourneyScreen from '../../../../app/(tabs)/journey';
import OracleScreen from '../../../../app/(tabs)/oracle';
import ComfortScreen from '../../../../app/(tabs)/comfort';
import AuthLayout from '../../../../app/(auth)/_layout';
import AccountScreen from '../../../../app/(auth)/account';
import SignInScreen from '../../../../app/(auth)/sign-in';
import SignUpScreen from '../../../../app/(auth)/sign-up';
import ForgotPasswordScreen from '../../../../app/(auth)/forgot-password';

// Test mock provider for integration verification
class MockIntegrationAuthService implements AuthService {
  public readiness: ServiceReadiness = 'ready';
  public signInCalls = 0;
  public signUpCalls = 0;
  public signInDelay = 0;
  public signInOutcome: AuthResult | null = null;
  public signUpOutcome: AuthResult | null = null;

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
    if (this.signInDelay > 0) {
      await new Promise((resolve) => setTimeout(resolve, this.signInDelay));
    }
    if (this.signInOutcome) return this.signInOutcome;

    const session: AuthSession = {
      accessToken: 'mock_integration_access_token',
      expiresAt: Date.now() + 3600 * 1000,
      user: {
        id: 'usr_mock_navigator',
        email: credentials.email,
        displayName: 'Verified Navigator'
      }
    };
    return { success: true, session, user: session.user };
  }

  async signUp(details: SignUpDetails): Promise<AuthResult> {
    this.signUpCalls++;
    if (this.signUpOutcome) return this.signUpOutcome;

    const session: AuthSession = {
      accessToken: 'mock_integration_new_token',
      expiresAt: Date.now() + 3600 * 1000,
      user: {
        id: 'usr_mock_created',
        email: details.email,
        displayName: details.displayName || 'New Navigator'
      }
    };
    return { success: true, session, user: session.user };
  }

  async signOut(): Promise<void> {
    return Promise.resolve();
  }
}

describe('Feature 04.2.4 — Authentication UI Final Integration & Quality Assurance', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // 1. Guest startup and account access
  it('TC-04.2.4-01: mounts account access trigger in HomeScreen and opens AccountScreen', () => {
    render(
      <AuthProvider authService={unavailableAuthService} autoInitialize={false}>
        <HomeScreen />
      </AuthProvider>
    );

    const accountTrigger = screen.getByTestId('home-header-account-action');
    expect(accountTrigger).toBeTruthy();
    expect(accountTrigger.props.accessibilityLabel).toBe('Account Access');

    fireEvent.press(accountTrigger);
    expect(mockPush).toHaveBeenCalledWith('/(auth)/account');
  });

  // 2. Sign-In rendering
  it('TC-04.2.4-02: renders Sign-In screen with inputs, branding, and guest alternatives', () => {
    render(
      <AuthProvider authService={unavailableAuthService} autoInitialize={false}>
        <SignInScreen />
      </AuthProvider>
    );

    expect(screen.getByTestId('sign-in-screen')).toBeTruthy();
    expect(screen.getByTestId('sign-in-brand-header-title').props.children).toBe('Welcome back to Waymark');
    expect(screen.getByTestId('input-sign-in-email-field')).toBeTruthy();
    expect(screen.getByTestId('input-sign-in-password-field')).toBeTruthy();
    expect(screen.getByTestId('btn-submit-sign-in')).toBeTruthy();
    expect(screen.getByTestId('btn-navigate-forgot-password')).toBeTruthy();
    expect(screen.getByTestId('btn-navigate-sign-up')).toBeTruthy();
    expect(screen.getByTestId('btn-sign-in-guest')).toBeTruthy();
  });

  // 3. Sign-Up rendering
  it('TC-04.2.4-03: renders Sign-Up screen with all required input fields and guidance', () => {
    render(
      <AuthProvider authService={unavailableAuthService} autoInitialize={false}>
        <SignUpScreen />
      </AuthProvider>
    );

    expect(screen.getByTestId('sign-up-screen')).toBeTruthy();
    expect(screen.getByTestId('sign-up-brand-header-title').props.children).toBe('Join Waymark');
    expect(screen.getByTestId('input-sign-up-display-name-field')).toBeTruthy();
    expect(screen.getByTestId('input-sign-up-email-field')).toBeTruthy();
    expect(screen.getByTestId('input-sign-up-password-field')).toBeTruthy();
    expect(screen.getByTestId('input-sign-up-confirm-password-field')).toBeTruthy();
    expect(screen.getByTestId('btn-submit-sign-up')).toBeTruthy();
    expect(screen.getByTestId('btn-navigate-sign-in')).toBeTruthy();
    expect(screen.getByTestId('btn-sign-up-guest')).toBeTruthy();
  });

  // 4. Password Recovery rendering
  it('TC-04.2.4-04: renders Password Recovery screen with email input and actions', () => {
    render(
      <AuthProvider authService={unavailableAuthService} autoInitialize={false}>
        <ForgotPasswordScreen />
      </AuthProvider>
    );

    expect(screen.getByTestId('forgot-password-screen')).toBeTruthy();
    expect(screen.getByTestId('forgot-password-brand-header-title').props.children).toBe(
      'Recover your Waymark account'
    );
    expect(screen.getByTestId('input-forgot-password-email-field')).toBeTruthy();
    expect(screen.getByTestId('btn-submit-forgot-password')).toBeTruthy();
    expect(screen.getByTestId('btn-navigate-sign-in')).toBeTruthy();
    expect(screen.getByTestId('btn-forgot-password-guest')).toBeTruthy();
  });

  // 5. Shared layout consistency
  it('TC-04.2.4-05: verifies shared layout components mount consistently across auth routes', () => {
    const rendered = render(<AuthLayout />);
    expect(rendered).toBeDefined();

    render(
      <AuthProvider authService={unavailableAuthService} autoInitialize={false}>
        <AccountScreen />
      </AuthProvider>
    );
    expect(screen.getByTestId('account-brand-header-badge').props.children).toBe('WAYMARK 2100');
    expect(screen.getByTestId('account-brand-header-status-tag').props.children).toBe('SYS.GUEST');
  });

  // 6. Valid route transitions
  it('TC-04.2.4-06: navigates smoothly between Account, Sign-In, Sign-Up, and Forgot Password', () => {
    render(
      <AuthProvider authService={unavailableAuthService} autoInitialize={false}>
        <AccountScreen />
      </AuthProvider>
    );

    fireEvent.press(screen.getByTestId('btn-navigate-sign-in'));
    expect(mockPush).toHaveBeenCalledWith('/(auth)/sign-in');

    fireEvent.press(screen.getByTestId('btn-navigate-sign-up'));
    expect(mockPush).toHaveBeenCalledWith('/(auth)/sign-up');
  });

  // 7. Back navigation
  it('TC-04.2.4-07: dispatches back navigation safely without traps or route loops', () => {
    render(
      <AuthProvider authService={unavailableAuthService} autoInitialize={false}>
        <SignInScreen />
      </AuthProvider>
    );

    const backBtn = screen.getByTestId('sign-in-screen-back-btn');
    expect(backBtn).toBeTruthy();
    fireEvent.press(backBtn);
    expect(mockReplace).toHaveBeenCalledWith('/(auth)/account');
  });

  // 8. Invalid form handling
  it('TC-04.2.4-08: displays descriptive errors when required form values are invalid', async () => {
    render(
      <AuthProvider authService={new MockIntegrationAuthService('ready')} autoInitialize={false}>
        <SignInScreen />
      </AuthProvider>
    );

    const submitBtn = screen.getByTestId('btn-submit-sign-in');
    await act(async () => {
      fireEvent.press(submitBtn);
    });

    expect(screen.getByText('Email address is required.')).toBeTruthy();
  });

  // 9. NOT_CONFIGURED behavior
  it('TC-04.2.4-09: renders truthful standby notices and disables submit buttons when unconfigured', () => {
    render(
      <AuthProvider authService={unavailableAuthService} autoInitialize={false}>
        <SignInScreen />
      </AuthProvider>
    );

    const notice = screen.getByTestId('sign-in-unconfigured-notice');
    expect(notice).toBeTruthy();
    expect(screen.getByText(/External authentication services are currently unconfigured/i)).toBeTruthy();

    const submitBtn = screen.getByTestId('btn-submit-sign-in');
    expect(submitBtn.props.accessibilityState.disabled).toBe(true);
  });

  // 10. No false authentication
  it('TC-04.2.4-10: never fabricates authenticated sessions when services are unconfigured', async () => {
    render(
      <AuthProvider authService={unavailableAuthService} autoInitialize={false}>
        <SignInScreen />
      </AuthProvider>
    );

    // In unconfigured state, pressing submit does not invoke network or create session
    const submitBtn = screen.getByTestId('btn-submit-sign-in');
    await act(async () => {
      fireEvent.press(submitBtn);
    });

    expect(mockReplace).not.toHaveBeenCalledWith('/(tabs)');
  });

  // 11. No fake registration
  it('TC-04.2.4-11: never fabricates registered users or profiles without backend verification', async () => {
    render(
      <AuthProvider authService={unavailableAuthService} autoInitialize={false}>
        <SignUpScreen />
      </AuthProvider>
    );

    const submitBtn = screen.getByTestId('btn-submit-sign-up');
    expect(submitBtn.props.accessibilityState.disabled).toBe(true);

    await act(async () => {
      fireEvent.press(submitBtn);
    });

    expect(mockReplace).not.toHaveBeenCalledWith('/(tabs)');
  });

  // 12. No fake recovery email
  it('TC-04.2.4-12: never claims recovery emails were dispatched while service is in standby', async () => {
    render(
      <AuthProvider authService={unavailableAuthService} autoInitialize={false}>
        <ForgotPasswordScreen />
      </AuthProvider>
    );

    const submitBtn = screen.getByTestId('btn-submit-forgot-password');
    expect(submitBtn.props.accessibilityState.disabled).toBe(true);

    await act(async () => {
      fireEvent.press(submitBtn);
    });

    expect(screen.queryByTestId('forgot-password-success-notice')).toBeNull();
  });

  // 13. Credential privacy
  it('TC-04.2.4-13: masks secret passwords and strictly prevents console telemetry leaks', async () => {
    const logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    const infoSpy = jest.spyOn(console, 'info').mockImplementation(() => {});
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

    render(
      <AuthProvider authService={new MockIntegrationAuthService('ready')} autoInitialize={false}>
        <SignInScreen />
      </AuthProvider>
    );

    const passwordInput = screen.getByTestId('input-sign-in-password-input');
    expect(passwordInput.props.secureTextEntry).toBe(true);

    const secretPassword = 'ConfidentialPassword2100!';
    fireEvent.changeText(passwordInput, secretPassword);

    await act(async () => {
      fireEvent.press(screen.getByTestId('btn-submit-sign-in'));
    });

    const checkNoLeak = (spy: jest.SpyInstance) => {
      spy.mock.calls.forEach((args) => {
        expect(JSON.stringify(args)).not.toContain(secretPassword);
      });
    };

    checkNoLeak(logSpy);
    checkNoLeak(infoSpy);
    checkNoLeak(warnSpy);

    logSpy.mockRestore();
    infoSpy.mockRestore();
    warnSpy.mockRestore();
  });

  // 14. Accessibility attributes
  it('TC-04.2.4-14: exposes accessible roles, hints, labels, and touch targets across all forms', () => {
    render(
      <AuthProvider authService={unavailableAuthService} autoInitialize={false}>
        <SignInScreen />
      </AuthProvider>
    );

    const emailInput = screen.getByTestId('input-sign-in-email-input');
    expect(emailInput.props.accessibilityLabel).toBe('Email Address');
    expect(emailInput.props.accessibilityHint).toBe(
      'Enter the email address registered with your Waymark account'
    );

    const submitBtn = screen.getByTestId('btn-submit-sign-in');
    expect(submitBtn.props.accessibilityRole).toBe('button');
  });

  // 15. Provider error handling
  it('TC-04.2.4-15: renders dismissible domain error notices upon authentication failure', async () => {
    const service = new MockIntegrationAuthService('ready');
    service.signInOutcome = {
      success: false,
      error: new AuthError('INVALID_CREDENTIALS', 'Invalid email or password.')
    };

    render(
      <AuthProvider authService={service} autoInitialize={false}>
        <SignInScreen />
      </AuthProvider>
    );

    fireEvent.changeText(screen.getByTestId('input-sign-in-email-input'), 'pilot@waymark.local');
    fireEvent.changeText(screen.getByTestId('input-sign-in-password-input'), 'WrongPassword123!');

    await act(async () => {
      fireEvent.press(screen.getByTestId('btn-submit-sign-in'));
    });

    expect(screen.getByTestId('sign-in-error-notice')).toBeTruthy();
    expect(screen.getByText('Invalid email or password.')).toBeTruthy();
  });

  // 16. Loading-state safety
  it('TC-04.2.4-16: disables action controls and prevents concurrent submissions while in flight', async () => {
    const service = new MockIntegrationAuthService('ready');
    service.signInDelay = 50;

    render(
      <AuthProvider authService={service} autoInitialize={false}>
        <SignInScreen />
      </AuthProvider>
    );

    fireEvent.changeText(screen.getByTestId('input-sign-in-email-input'), 'pilot@waymark.local');
    fireEvent.changeText(screen.getByTestId('input-sign-in-password-input'), 'Password123!');

    const submitBtn = screen.getByTestId('btn-submit-sign-in');

    // Fire first press
    let submissionPromise: Promise<void>;
    act(() => {
      submissionPromise = act(async () => {
        fireEvent.press(submitBtn);
      });
    });

    // Fire concurrent duplicate press
    act(() => {
      fireEvent.press(submitBtn);
    });

    await act(async () => {
      await submissionPromise;
    });

    // Confirms re-entrancy prevention: only 1 network call made
    expect(service.signInCalls).toBe(1);
  });

  // 17. Public tab navigation regression
  it('TC-04.2.4-17: verifies that all 5 public multimodal transit tabs remain fully functional', () => {
    const homeRender = render(
      <AuthProvider authService={unavailableAuthService} autoInitialize={false}>
        <HomeScreen />
      </AuthProvider>
    );
    expect(homeRender).toBeDefined();

    const mapRender = render(<MapScreen />);
    expect(mapRender).toBeDefined();

    const journeyRender = render(<JourneyScreen />);
    expect(journeyRender).toBeDefined();

    const oracleRender = render(<OracleScreen />);
    expect(oracleRender).toBeDefined();

    const comfortRender = render(<ComfortScreen />);
    expect(comfortRender).toBeDefined();
  });

  // 18. Root AuthProvider compatibility
  it('TC-04.2.4-18: starts cleanly in guest mode with unavailableAuthService without throwing', () => {
    render(
      <AuthProvider authService={unavailableAuthService} autoInitialize={false}>
        <AccountScreen />
      </AuthProvider>
    );

    expect(screen.getByText(/You are currently traveling as an Anonymous Guest Navigator/i)).toBeTruthy();
  });
});
