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
  usePathname: () => '/(auth)/forgot-password',
  useSegments: () => ['(auth)', 'forgot-password'],
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
import ForgotPasswordScreen from '../../../../app/(auth)/forgot-password';

class MockRecoveryAuthService implements AuthService {
  public readiness: ServiceReadiness = 'ready';

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

  async signUp(): Promise<AuthResult> {
    return { success: false, error: AuthError.notConfigured() };
  }

  async signOut(): Promise<void> {
    return Promise.resolve();
  }
}

describe('Feature 04.2.3 — Password Recovery Screen & Flow', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // 1. Rendering of screen elements
  it('TC-04.2.3-13: renders ForgotPasswordScreen with branding, email field, and action buttons', () => {
    render(
      <AuthProvider authService={new MockRecoveryAuthService('ready')} autoInitialize={false}>
        <ForgotPasswordScreen />
      </AuthProvider>
    );

    expect(screen.getByTestId('forgot-password-screen')).toBeTruthy();
    expect(screen.getByTestId('forgot-password-brand-header-title').props.children).toBe(
      'Recover your Waymark account'
    );
    expect(screen.getByTestId('forgot-password-brand-header-badge').props.children).toBe(
      'WAYMARK 2100'
    );
    expect(screen.getByTestId('input-forgot-password-email-field')).toBeTruthy();
    expect(screen.getByTestId('btn-submit-forgot-password')).toBeTruthy();
    expect(screen.getByTestId('btn-navigate-sign-in')).toBeTruthy();
    expect(screen.getByTestId('btn-forgot-password-guest')).toBeTruthy();
    expect(screen.getByTestId('forgot-password-footer-note')).toBeTruthy();
  });

  // 2. Truthful unconfigured service state
  it('TC-04.2.3-14: displays standby notice and disables submit when service is unconfigured', () => {
    render(
      <AuthProvider authService={unavailableAuthService} autoInitialize={false}>
        <ForgotPasswordScreen />
      </AuthProvider>
    );

    const notice = screen.getByTestId('forgot-password-unconfigured-notice');
    expect(notice).toBeTruthy();
    expect(
      screen.getByText(/Account recovery services are currently unconfigured/i)
    ).toBeTruthy();

    const submitBtn = screen.getByTestId('btn-submit-forgot-password');
    expect(submitBtn.props.accessibilityState.disabled).toBe(true);
  });

  // 3. Validation: email required
  it('TC-04.2.3-15: validates that email address is required for recovery', async () => {
    render(
      <AuthProvider authService={new MockRecoveryAuthService('ready')} autoInitialize={false}>
        <ForgotPasswordScreen />
      </AuthProvider>
    );

    const submitBtn = screen.getByTestId('btn-submit-forgot-password');
    await act(async () => {
      fireEvent.press(submitBtn);
    });

    expect(screen.getByText('Email address is required.')).toBeTruthy();
  });

  // 4. Validation: email format syntax
  it('TC-04.2.3-16: rejects invalid email syntax for recovery', async () => {
    render(
      <AuthProvider authService={new MockRecoveryAuthService('ready')} autoInitialize={false}>
        <ForgotPasswordScreen />
      </AuthProvider>
    );

    fireEvent.changeText(screen.getByTestId('input-forgot-password-email-input'), 'not-an-email');

    const submitBtn = screen.getByTestId('btn-submit-forgot-password');
    await act(async () => {
      fireEvent.press(submitBtn);
    });

    expect(screen.getByText('Please enter a valid email address.')).toBeTruthy();
  });

  // 5. Enumeration-resistant recovery submission
  it('TC-04.2.3-17: shows enumeration-resistant confirmation notice upon submission', async () => {
    render(
      <AuthProvider authService={new MockRecoveryAuthService('ready')} autoInitialize={false}>
        <ForgotPasswordScreen />
      </AuthProvider>
    );

    fireEvent.changeText(screen.getByTestId('input-forgot-password-email-input'), 'pilot@waymark.local');

    const submitBtn = screen.getByTestId('btn-submit-forgot-password');
    await act(async () => {
      fireEvent.press(submitBtn);
    });

    const successNotice = screen.getByTestId('forgot-password-success-notice');
    expect(successNotice).toBeTruthy();
    expect(
      screen.getByText(/If an account exists for this email address, password recovery instructions have been sent/i)
    ).toBeTruthy();
  });

  // 6. Navigation: back to sign-in and guest mode
  it('TC-04.2.3-18: navigates cleanly to sign-in and guest modes', () => {
    render(
      <AuthProvider authService={new MockRecoveryAuthService('ready')} autoInitialize={false}>
        <ForgotPasswordScreen />
      </AuthProvider>
    );

    fireEvent.press(screen.getByTestId('btn-navigate-sign-in'));
    expect(mockReplace).toHaveBeenCalledWith('/(auth)/sign-in');

    fireEvent.press(screen.getByTestId('btn-forgot-password-guest'));
    expect(mockReplace).toHaveBeenCalledWith('/(tabs)');
  });
});
