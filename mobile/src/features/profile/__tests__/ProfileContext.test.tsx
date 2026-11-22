/**
 * Waymark Mobile — Feature 04.4: ProfileContext Unit Tests
 * Verifies profile lifecycle with auth state, lazy initialization, updates, and logout cleanup.
 */

import React from 'react';
import { renderHook, act } from '@testing-library/react-native';
import { ProfileProvider, useProfile } from '../context/ProfileContext';
import { ProfileRepository } from '../services/ProfileRepository';
import { UserProfile, ProfileResult } from '../types';

// Mock useAuth
const mockUser = {
  id: 'user-001',
  email: 'januka@waymark.app',
  displayName: 'Janu AuthName',
  emailVerified: true,
  createdAt: '2026-11-20T12:00:00Z'
};

let mockAuthState: Record<string, unknown> = {
  user: mockUser,
  isAuthenticated: true,
  serviceReadiness: 'ready' as const
};

jest.mock('../../auth', () => ({
  useAuth: () => mockAuthState
}));

describe('ProfileContext & useProfile', () => {
  let mockRepo: jest.Mocked<ProfileRepository>;

  beforeEach(() => {
    mockAuthState = {
      user: mockUser,
      isAuthenticated: true,
      serviceReadiness: 'ready'
    };

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

  it('loads profile on mount when authenticated and user exists', async () => {
    const existingProfile: UserProfile = {
      id: 'user-001',
      displayName: 'Janu Profile',
      avatarUrl: 'https://images.waymark.app/avatar.png',
      createdAt: '2026-11-20T12:00:00Z',
      updatedAt: '2026-11-21T10:00:00Z'
    };
    mockRepo.getProfile.mockResolvedValue({ success: true, data: existingProfile });

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <ProfileProvider repository={mockRepo}>{children}</ProfileProvider>
    );

    const { result } = renderHook(() => useProfile(), { wrapper });

    expect(mockRepo.getProfile).toHaveBeenCalledWith('user-001');
    // Wait for state update
    await act(async () => {});

    expect(result.current.profile).toEqual(existingProfile);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('lazily initializes local profile from auth user metadata if database row is null', async () => {
    mockRepo.getProfile.mockResolvedValue({ success: true, data: null });

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <ProfileProvider repository={mockRepo}>{children}</ProfileProvider>
    );

    const { result } = renderHook(() => useProfile(), { wrapper });

    await act(async () => {});

    expect(result.current.profile?.id).toBe('user-001');
    expect(result.current.profile?.displayName).toBe('Janu AuthName');
    expect(result.current.profile?.avatarUrl).toBeNull();
  });

  it('updates profile and reflects changes in context state', async () => {
    const initialProfile: UserProfile = {
      id: 'user-001',
      displayName: 'Initial Name',
      avatarUrl: null,
      createdAt: '2026-11-20T12:00:00Z',
      updatedAt: '2026-11-21T10:00:00Z'
    };
    mockRepo.getProfile.mockResolvedValue({ success: true, data: initialProfile });

    const updatedProfile: UserProfile = {
      ...initialProfile,
      displayName: 'Updated Name',
      avatarUrl: 'https://new-avatar.png'
    };
    mockRepo.upsertProfile.mockResolvedValue({ success: true, data: updatedProfile });

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <ProfileProvider repository={mockRepo}>{children}</ProfileProvider>
    );

    const { result } = renderHook(() => useProfile(), { wrapper });
    await act(async () => {});

    let updateRes: ProfileResult<UserProfile> | undefined;
    await act(async () => {
      updateRes = await result.current.updateProfile({
        displayName: 'Updated Name',
        avatarUrl: 'https://new-avatar.png'
      });
    });

    expect(updateRes?.success).toBe(true);
    expect(result.current.profile?.displayName).toBe('Updated Name');
    expect(result.current.profile?.avatarUrl).toBe('https://new-avatar.png');
  });

  it('purges profile when user becomes unauthenticated or guest', async () => {
    const existingProfile: UserProfile = {
      id: 'user-001',
      displayName: 'Janu Profile',
      avatarUrl: null,
      createdAt: '2026-11-20T12:00:00Z',
      updatedAt: '2026-11-21T10:00:00Z'
    };
    mockRepo.getProfile.mockResolvedValue({ success: true, data: existingProfile });

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <ProfileProvider repository={mockRepo}>{children}</ProfileProvider>
    );

    const { result, rerender } = renderHook(() => useProfile(), { wrapper });
    await act(async () => {});
    expect(result.current.profile).toBeTruthy();

    // User logs out
    mockAuthState = {
      user: null,
      isAuthenticated: false,
      serviceReadiness: 'ready'
    };
    rerender({});
    await act(async () => {});

    expect(result.current.profile).toBeNull();
  });
});
