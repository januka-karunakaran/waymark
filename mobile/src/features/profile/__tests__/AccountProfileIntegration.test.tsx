/**
 * Waymark Mobile — Feature 04.4: Account Screen Profile Integration Tests
 * Verifies AccountScreen rendering with ProfileViewCard and ProfileEditModal in both guest and authenticated modes.
 */

import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import AccountScreen from '../../../../app/(auth)/account';
import { ProfileProvider } from '../context/ProfileContext';
import { ProfileRepository } from '../services/ProfileRepository';
import { UserProfile } from '../types';

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

let mockCurrentAuthState: Record<string, unknown> = {
  user: null,
  isAuthenticated: false,
  serviceReadiness: 'ready',
  signOut: jest.fn()
};

jest.mock('../../auth', () => ({
  ...jest.requireActual('../../auth'),
  useAuth: () => mockCurrentAuthState
}));

describe('AccountScreen Profile Integration', () => {
  let mockRepo: jest.Mocked<ProfileRepository>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockRepo = {
      getProfile: jest.fn(),
      upsertProfile: jest.fn(),
      getSavedPlaces: jest.fn(),
      upsertSavedPlace: jest.fn(),
      deleteSavedPlace: jest.fn(),
      getPreferences: jest.fn(),
      upsertPreferences: jest.fn()
    };
  });

  it('renders guest mode layout with anonymous status card and sign-in actions', () => {
    mockCurrentAuthState = {
      user: null,
      isAuthenticated: false,
      serviceReadiness: 'ready',
      signOut: jest.fn()
    };

    const { getByTestId, queryByTestId } = render(
      <ProfileProvider repository={mockRepo}>
        <AccountScreen />
      </ProfileProvider>
    );

    expect(getByTestId('account-status-card')).toBeTruthy();
    expect(getByTestId('btn-navigate-sign-in')).toBeTruthy();
    expect(getByTestId('btn-navigate-sign-up')).toBeTruthy();
    expect(queryByTestId('account-profile-card')).toBeNull();
  });

  it('renders authenticated profile view card with display name, email, and verified status', async () => {
    const authUser = {
      id: 'user-001',
      email: 'januka@waymark.app',
      displayName: 'Captain Janu',
      emailVerified: true
    };
    mockCurrentAuthState = {
      user: authUser,
      isAuthenticated: true,
      serviceReadiness: 'ready',
      signOut: jest.fn()
    };

    const userProfile: UserProfile = {
      id: 'user-001',
      displayName: 'Captain Janu',
      avatarUrl: null,
      createdAt: '2026-11-20T12:00:00Z',
      updatedAt: '2026-11-21T10:00:00Z'
    };
    mockRepo.getProfile.mockResolvedValue({ success: true, data: userProfile });

    const { getByTestId, getByText } = render(
      <ProfileProvider repository={mockRepo}>
        <AccountScreen />
      </ProfileProvider>
    );

    await waitFor(() => {
      expect(getByTestId('account-profile-card')).toBeTruthy();
      expect(getByText('Captain Janu')).toBeTruthy();
      expect(getByText('januka@waymark.app')).toBeTruthy();
      expect(getByTestId('profile-verified-badge')).toBeTruthy();
      expect(getByTestId('btn-edit-profile')).toBeTruthy();
    });
  });

  it('opens ProfileEditModal when Edit Profile button is clicked', async () => {
    const authUser = {
      id: 'user-001',
      email: 'januka@waymark.app',
      displayName: 'Captain Janu',
      emailVerified: true
    };
    mockCurrentAuthState = {
      user: authUser,
      isAuthenticated: true,
      serviceReadiness: 'ready',
      signOut: jest.fn()
    };

    const userProfile: UserProfile = {
      id: 'user-001',
      displayName: 'Captain Janu',
      avatarUrl: null,
      createdAt: '2026-11-20T12:00:00Z',
      updatedAt: '2026-11-21T10:00:00Z'
    };
    mockRepo.getProfile.mockResolvedValue({ success: true, data: userProfile });

    const { getByTestId } = render(
      <ProfileProvider repository={mockRepo}>
        <AccountScreen />
      </ProfileProvider>
    );

    await waitFor(() => {
      expect(getByTestId('btn-edit-profile')).toBeTruthy();
    });

    fireEvent.press(getByTestId('btn-edit-profile'));

    await waitFor(() => {
      expect(getByTestId('account-profile-edit-modal')).toBeTruthy();
      expect(getByTestId('profile-edit-dialog')).toBeTruthy();
    });
  });
});
