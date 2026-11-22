/**
 * Waymark Mobile — Feature 04.5: Account Security & Settings Suite
 * TC-04.5.1-01 through TC-04.5.1-16: Comprehensive testing of AccountSettingsScreen,
 * privacy disclosures, session boundaries, guest behavior, and regression safety.
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import AccountSettingsScreen from '../../../../app/(auth)/settings';
import AccountScreen from '../../../../app/(auth)/account';
import { ProfileProvider } from '../../profile/context/ProfileContext';
import { ProfileRepository } from '../../profile/services/ProfileRepository';

// Mock Router
const mockPush = jest.fn();
const mockReplace = jest.fn();
const mockBack = jest.fn();
const mockCanGoBack = jest.fn().mockReturnValue(true);

jest.mock('expo-router', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: mockReplace,
    back: mockBack,
    canGoBack: mockCanGoBack
  })
}));

// Mock Auth
let mockAuthState: {
  user: {
    id: string;
    email: string;
    displayName: string | null;
    emailVerified: boolean;
  } | null;
  isAuthenticated: boolean;
  serviceReadiness: 'ready' | 'not_configured' | 'standby';
  signOut: jest.Mock;
} = {
  user: null,
  isAuthenticated: false,
  serviceReadiness: 'ready',
  signOut: jest.fn()
};

jest.mock('../hooks/useAuth', () => ({
  useAuth: () => mockAuthState
}));

// Mock Profile Repository
const mockProfileRepo: jest.Mocked<ProfileRepository> = {
  getProfile: jest.fn().mockResolvedValue({
    success: true,
    data: {
      id: 'usr-100-alpha',
      displayName: 'Captain Janu',
      avatarUrl: 'https://cdn.waymark.app/avatar.png',
      createdAt: '2026-11-20T10:00:00Z',
      updatedAt: '2026-11-20T10:00:00Z'
    }
  }),
  upsertProfile: jest.fn(),
  getSavedPlaces: jest.fn().mockResolvedValue({ success: true, data: [] }),
  upsertSavedPlace: jest.fn(),
  deleteSavedPlace: jest.fn(),
  getPreferences: jest.fn().mockResolvedValue({ success: true, data: null }),
  upsertPreferences: jest.fn()
};

const renderWithProviders = (ui: React.ReactElement) => {
  return render(
    <ProfileProvider repository={mockProfileRepo}>
      {ui}
    </ProfileProvider>
  );
};

describe('Feature 04.5.1 — Account Settings & Privacy Controls', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAuthState = {
      user: {
        id: 'usr-100-alpha',
        email: 'januka@waymark.app',
        displayName: 'Captain Janu',
        emailVerified: true
      },
      isAuthenticated: true,
      serviceReadiness: 'ready',
      signOut: jest.fn().mockResolvedValue(undefined)
    };
  });

  // 1. Authenticated settings screen
  it('TC-04.5.1-01: renders authenticated settings screen with full security & privacy cards', () => {
    renderWithProviders(<AccountSettingsScreen />);

    expect(screen.getByTestId('account-settings-screen')).toBeTruthy();
    expect(screen.getByTestId('settings-brand-header')).toBeTruthy();
    expect(screen.getByTestId('settings-session-card')).toBeTruthy();
    expect(screen.getByTestId('settings-personalization-card')).toBeTruthy();
    expect(screen.getByTestId('settings-privacy-card')).toBeTruthy();
    expect(screen.getByTestId('settings-data-management-card')).toBeTruthy();
    expect(screen.getByTestId('btn-settings-sign-out')).toBeTruthy();
  });

  // 2. Guest settings screen
  it('TC-04.5.1-02: renders guest settings mode with appropriate call-to-action buttons', () => {
    mockAuthState = {
      user: null,
      isAuthenticated: false,
      serviceReadiness: 'ready',
      signOut: jest.fn()
    };

    renderWithProviders(<AccountSettingsScreen />);

    expect(screen.getByTestId('settings-guest-status')).toBeTruthy();
    expect(screen.getByTestId('btn-settings-sign-in')).toBeTruthy();
    expect(screen.getByTestId('btn-settings-sign-up')).toBeTruthy();
    expect(screen.getByTestId('btn-settings-return-home')).toBeTruthy();
    expect(screen.queryByTestId('btn-settings-sign-out')).toBeNull();
    expect(screen.queryByTestId('settings-user-email')).toBeNull();
  });

  // 3. Trusted email display
  it('TC-04.5.1-03: displays authenticated email from trusted AuthProvider', () => {
    renderWithProviders(<AccountSettingsScreen />);

    const emailNode = screen.getByTestId('settings-user-email');
    expect(emailNode.props.children).toBe('januka@waymark.app');
  });

  // 4. Verified account status
  it('TC-04.5.1-04: distinguishes verified vs pending email identity status accurately', () => {
    // Verified user
    const { rerender } = renderWithProviders(<AccountSettingsScreen />);
    expect(screen.getByTestId('settings-email-verified-badge')).toBeTruthy();
    expect(screen.queryByTestId('settings-email-pending-badge')).toBeNull();

    // Pending verification user
    mockAuthState = {
      ...mockAuthState,
      user: {
        ...mockAuthState.user!,
        emailVerified: false
      }
    };
    rerender(
      <ProfileProvider repository={mockProfileRepo}>
        <AccountSettingsScreen />
      </ProfileProvider>
    );

    expect(screen.getByTestId('settings-email-pending-badge')).toBeTruthy();
    expect(screen.queryByTestId('settings-email-verified-badge')).toBeNull();
  });

  // 5. Profile navigation
  it('TC-04.5.1-05: navigates to Account screen when Edit Profile is selected', () => {
    renderWithProviders(<AccountSettingsScreen />);

    const editProfileBtn = screen.getByTestId('btn-settings-edit-profile');
    fireEvent.press(editProfileBtn);
    expect(mockPush).toHaveBeenCalledWith('/(auth)/account');
  });

  // 6. Saved Places navigation
  it('TC-04.5.1-06: navigates to Saved Places on Account screen', () => {
    renderWithProviders(<AccountSettingsScreen />);

    const savedPlacesBtn = screen.getByTestId('btn-settings-saved-places');
    fireEvent.press(savedPlacesBtn);
    expect(mockPush).toHaveBeenCalledWith('/(auth)/account');
  });

  // 7. Preferences navigation
  it('TC-04.5.1-07: navigates to Traveler Preferences on Account screen', () => {
    renderWithProviders(<AccountSettingsScreen />);

    const preferencesBtn = screen.getByTestId('btn-settings-preferences');
    fireEvent.press(preferencesBtn);
    expect(mockPush).toHaveBeenCalledWith('/(auth)/account');
  });

  // 8. Sign Out action
  it('TC-04.5.1-08: invokes signOut handler when Sign Out button is pressed', async () => {
    renderWithProviders(<AccountSettingsScreen />);

    const signOutBtn = screen.getByTestId('btn-settings-sign-out');
    fireEvent.press(signOutBtn);

    await waitFor(() => {
      expect(mockAuthState.signOut).toHaveBeenCalledTimes(1);
    });
  });

  // 9. Duplicate sign-out prevention
  it('TC-04.5.1-09: prevents duplicate concurrent sign-out invocations while pending', async () => {
    let resolveSignOut!: () => void;
    mockAuthState.signOut = jest.fn().mockImplementation(
      () => new Promise<void>((res) => { resolveSignOut = res; })
    );

    renderWithProviders(<AccountSettingsScreen />);

    const signOutBtn = screen.getByTestId('btn-settings-sign-out');
    fireEvent.press(signOutBtn);
    fireEvent.press(signOutBtn); // Second rapid press

    expect(mockAuthState.signOut).toHaveBeenCalledTimes(1);
    resolveSignOut();
  });

  // 10. Session-expired behavior
  it('TC-04.5.1-10: reacts safely when session expires and user becomes null', async () => {
    const { rerender } = renderWithProviders(<AccountSettingsScreen />);

    expect(screen.getByTestId('settings-user-email')).toBeTruthy();

    // Session revoked / expired
    mockAuthState = {
      user: null,
      isAuthenticated: false,
      serviceReadiness: 'ready',
      signOut: jest.fn()
    };

    rerender(
      <ProfileProvider repository={mockProfileRepo}>
        <AccountSettingsScreen />
      </ProfileProvider>
    );

    expect(screen.queryByTestId('settings-user-email')).toBeNull();
    expect(screen.getByTestId('settings-guest-status')).toBeTruthy();
    expect(screen.getByTestId('btn-settings-sign-in')).toBeTruthy();
  });

  // 11. Account switch handling
  it('TC-04.5.1-11: updates email and profile correctly when switching accounts', () => {
    const { rerender } = renderWithProviders(<AccountSettingsScreen />);
    expect(screen.getByText('januka@waymark.app')).toBeTruthy();

    // User switches to Sathu
    mockAuthState = {
      ...mockAuthState,
      user: {
        id: 'usr-200-beta',
        email: 'sathurjan@waymark.app',
        displayName: 'Navigator Sathu',
        emailVerified: true
      }
    };

    rerender(
      <ProfileProvider repository={mockProfileRepo}>
        <AccountSettingsScreen />
      </ProfileProvider>
    );

    expect(screen.queryByText('januka@waymark.app')).toBeNull();
    expect(screen.getByText('sathurjan@waymark.app')).toBeTruthy();
  });

  // 12. No previous-user data leakage
  it('TC-04.5.1-12: ensures no prior user data persists into guest view', () => {
    const { rerender } = renderWithProviders(<AccountSettingsScreen />);
    expect(screen.getByText('januka@waymark.app')).toBeTruthy();

    mockAuthState = {
      user: null,
      isAuthenticated: false,
      serviceReadiness: 'ready',
      signOut: jest.fn()
    };

    rerender(
      <ProfileProvider repository={mockProfileRepo}>
        <AccountSettingsScreen />
      </ProfileProvider>
    );

    expect(screen.queryByText('januka@waymark.app')).toBeNull();
    expect(screen.queryByText('Captain Janu')).toBeNull();
    expect(screen.getByTestId('settings-guest-status')).toBeTruthy();
  });

  // 13. No fake deletion/export actions
  it('TC-04.5.1-13: discloses automated deletion and export as future capabilities without fake buttons', () => {
    renderWithProviders(<AccountSettingsScreen />);

    expect(screen.getByTestId('badge-future-capabilities')).toBeTruthy();
    expect(screen.getByText(/Automated Account Deletion & Bulk Export: Milestone 05/i)).toBeTruthy();

    // Assert that no misleading immediate deletion button exists
    expect(screen.queryByTestId('btn-delete-account-now')).toBeNull();
    expect(screen.queryByTestId('btn-export-data-now')).toBeNull();
  });

  // 14. No misleading tracking/notification controls
  it('TC-04.5.1-14: confirms absence of fabricated tracking toggles or unbacked notification switches', () => {
    renderWithProviders(<AccountSettingsScreen />);

    expect(screen.queryByTestId('toggle-location-tracking')).toBeNull();
    expect(screen.queryByTestId('toggle-biometric-auth')).toBeNull();
    expect(screen.queryByTestId('toggle-push-notifications')).toBeNull();
  });

  // 15. Accessibility semantics
  it('TC-04.5.1-15: verifies accessible touch targets, labels, and hints on settings buttons', () => {
    renderWithProviders(<AccountSettingsScreen />);

    const signOutBtn = screen.getByTestId('btn-settings-sign-out');
    expect(signOutBtn.props.accessibilityLabel).toBe('Sign Out of Waymark');
    expect(signOutBtn.props.accessibilityHint).toBeTruthy();

    const returnBtn = screen.getByTestId('btn-settings-return-account');
    expect(returnBtn.props.accessibilityLabel).toBe('Return to Account');
  });

  // 16. Existing Home and Account navigation regression
  it('TC-04.5.1-16: verifies Account screen provides working navigation to settings and back', () => {
    renderWithProviders(<AccountScreen />);

    const settingsBtn = screen.getByTestId('btn-account-settings');
    expect(settingsBtn).toBeTruthy();
    fireEvent.press(settingsBtn);
    expect(mockPush).toHaveBeenCalledWith('/(auth)/settings');
  });
});
