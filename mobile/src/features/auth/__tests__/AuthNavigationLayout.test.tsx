import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';

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

// Auth Components & Screens
import {
  AuthScreenShell,
  AuthBrandHeader,
  AuthFormField,
  AuthStatusNotice,
  AuthProvider,
  unavailableAuthService
} from '../index';
import AccountScreen from '../../../../app/(auth)/account';
import AuthLayout from '../../../../app/(auth)/_layout';
import HomeScreen from '../../../../app/(tabs)/index';
import { theme } from '../../../theme';

// Helper wrapper providing AuthProvider
const renderWithAuth = (ui: React.ReactElement) => {
  return render(
    <AuthProvider authService={unavailableAuthService}>
      {ui}
    </AuthProvider>
  );
};

describe('Feature 04.2.1 â€” Auth Navigation & Shared UI Layout', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // 1. Account route rendering with Waymark branding
  it('TC-04.2.1-01: renders AccountScreen with Waymark branding and header elements', () => {
    renderWithAuth(<AccountScreen />);

    expect(screen.getByTestId('account-landing-screen')).toBeTruthy();
    expect(screen.getByTestId('account-brand-header-title').props.children).toBe('ACCOUNT ACCESS');
    expect(screen.getByTestId('account-brand-header-badge').props.children).toBe('WAYMARK 2100');
    expect(screen.getByTestId('account-status-card')).toBeTruthy();
  });

  // 2. Shared layout rendering (AuthScreenShell, BrandHeader, Notice, FormField)
  it('TC-04.2.1-02: renders shared layout components with expected children and structures', () => {
    render(
      <AuthScreenShell testID="test-shell">
        <AuthBrandHeader
          title="TEST HEADER"
          subtitle="Test Subtitle Description"
          testID="test-header"
        />
        <AuthStatusNotice
          title="System Notice"
          message="Notice content body"
          variant="info"
          testID="test-notice"
        />
        <AuthFormField
          label="Passcode"
          value="secret"
          onChangeText={jest.fn()}
          type="password"
          testID="test-form-field"
        />
      </AuthScreenShell>
    );

    expect(screen.getByTestId('test-shell')).toBeTruthy();
    expect(screen.getByTestId('test-header-title').props.children).toBe('TEST HEADER');
    expect(screen.getByTestId('test-notice-message').props.children).toBe('Notice content body');
    expect(screen.getByTestId('test-form-field-field')).toBeTruthy();
  });

  // 3. Guest access without requiring authentication
  it('TC-04.2.1-03: grants seamless guest access and confirms anonymous traveling status', () => {
    renderWithAuth(<AccountScreen />);

    expect(
      screen.getByText(/You are currently traveling as an Anonymous Guest Navigator/i)
    ).toBeTruthy();
    expect(screen.getByTestId('account-brand-header-status-tag').props.children).toBe('SYS.GUEST');
  });

  // 4. Continue-as-guest navigation returns to Home
  it('TC-04.2.1-04: dispatches return navigation when "Continue as Guest" is pressed', () => {
    renderWithAuth(<AccountScreen />);

    const continueBtn = screen.getByTestId('btn-continue-as-guest');
    expect(continueBtn).toBeTruthy();

    fireEvent.press(continueBtn);
    expect(mockBack).toHaveBeenCalledTimes(1);
  });

  // 5. Safe-area configuration and responsive constraints
  it('TC-04.2.1-05: enforces safe-area edges and back button behavior in AuthScreenShell', () => {
    render(
      <AuthScreenShell showBackButton={true} testID="safe-shell">
        <></>
      </AuthScreenShell>
    );

    const topBar = screen.getByTestId('safe-shell-top-bar');
    expect(topBar).toBeTruthy();

    const backBtn = screen.getByTestId('safe-shell-back-btn');
    expect(backBtn).toBeTruthy();
    fireEvent.press(backBtn);
    expect(mockBack).toHaveBeenCalledTimes(1);
  });

  // 6. Theme token integration and dark mode contrast
  it('TC-04.2.1-06: applies correct theme token styles across shared auth components', () => {
    render(
      <AuthStatusNotice
        message="Critical fault"
        variant="error"
        testID="error-notice"
      />
    );

    const notice = screen.getByTestId('error-notice');
    expect(notice.props.style).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          backgroundColor: theme.colors.deckInk,
          borderColor: theme.colors.statusCritical
        })
      ])
    );
  });

  // 7. Heading semantics and accessibility hierarchy
  it('TC-04.2.1-07: exposes header accessibility semantics for screen readers', () => {
    render(
      <AuthBrandHeader
        title="HEADING ACCESSIBILITY"
        testID="semantic-header"
      />
    );

    const titleText = screen.getByTestId('semantic-header-title');
    expect(titleText.props.accessibilityRole).toBe('header');
  });

  // 8. Missing-route prevention (no broken active links)
  it('TC-04.2.1-08: does not expose unfinished routes as active links and shows coming soon badge', () => {
    renderWithAuth(<AccountScreen />);

    expect(screen.getByTestId('account-coming-soon-badge')).toBeTruthy();
    expect(
      screen.getByText(/Sign-In & Registration rolling out in System Update 04.2.2 \/ 04.2.3/i)
    ).toBeTruthy();

    // Verify there is no active sign-in button or broken link yet
    expect(screen.queryByTestId('btn-sign-in')).toBeNull();
    expect(screen.queryByTestId('btn-sign-up')).toBeNull();
  });

  // 9. Truthful NOT_CONFIGURED status notice display
  it('TC-04.2.1-09: renders truthful notice when authentication service is not configured', () => {
    renderWithAuth(<AccountScreen />);

    const notice = screen.getByTestId('account-unconfigured-notice');
    expect(notice).toBeTruthy();
    expect(
      screen.getByText(/External identity providers are currently not configured/i)
    ).toBeTruthy();
  });

  // 10. Existing tab navigation regression safety (Home screen entry point)
  it('TC-04.2.1-10: mounts account entry point in HomeScreen header and navigates to /(auth)/account', () => {
    renderWithAuth(<HomeScreen />);

    const accountAction = screen.getByTestId('home-header-account-action');
    expect(accountAction).toBeTruthy();
    expect(accountAction.props.accessibilityLabel).toBe('Account Access');

    fireEvent.press(accountAction);
    expect(mockPush).toHaveBeenCalledWith('/(auth)/account');
  });

  // 11. AuthLayout renders stack cleanly
  it('TC-04.2.1-11: renders AuthLayout Stack without throwing', () => {
    const rendered = render(<AuthLayout />);
    expect(rendered).toBeDefined();
  });
});
