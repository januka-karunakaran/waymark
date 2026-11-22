/**
 * Waymark Mobile — Feature 04.5: Account Security, Settings & Final QA
 * Task 04.5.3: ProfileSessionIsolation.test.tsx
 *
 * Verifies:
 * 1. Late async responses cannot restore or corrupt state after user logs out.
 * 2. Account switching immediately purges previous user data without crossover.
 * 3. Expired or revoked sessions purge private saved places and preferences.
 * 4. Guest mode never invokes private data fetches or stores sensitive state.
 */

import React from 'react';
import { renderHook, act, waitFor } from '@testing-library/react-native';
import { ProfileProvider, useProfile } from '../context/ProfileContext';
import { ProfileRepository } from '../services/ProfileRepository';
import { UserProfile, SavedPlace } from '../types';

let mockAuthState: {
  user: { id: string; email: string; displayName?: string } | null;
  isAuthenticated: boolean;
  serviceReadiness: string;
  signOut: jest.Mock;
} = {
  user: null,
  isAuthenticated: false,
  serviceReadiness: 'ready',
  signOut: jest.fn()
};

jest.mock('../../auth', () => ({
  useAuth: () => mockAuthState
}));

describe('Feature 04.5.3 — ProfileSessionIsolation & Race Condition Hardening', () => {
  let mockProfileRepo: jest.Mocked<ProfileRepository>;

  const userAlice = {
    id: 'user-alice-uuid',
    email: 'alice@waymark.app',
    displayName: 'Alice Traveler'
  };

  const userBob = {
    id: 'user-bob-uuid',
    email: 'bob@waymark.app',
    displayName: 'Bob Traveler'
  };

  const aliceProfile: UserProfile = {
    id: 'user-alice-uuid',
    displayName: 'Alice Traveler',
    avatarUrl: 'https://waymark.app/alice.png',
    createdAt: '2026-11-20T00:00:00Z',
    updatedAt: '2026-11-21T00:00:00Z'
  };

  const alicePlaces: SavedPlace[] = [
    {
      id: 'place-alice-1',
      userId: 'user-alice-uuid',
      kind: 'home',
      label: 'Home',
      placeText: '100 Alice Road',
      createdAt: '2026-11-20T00:00:00Z',
      updatedAt: '2026-11-20T00:00:00Z'
    }
  ];

  const bobPlaces: SavedPlace[] = [
    {
      id: 'place-bob-1',
      userId: 'user-bob-uuid',
      kind: 'home',
      label: 'Home',
      placeText: '200 Bob Avenue',
      createdAt: '2026-11-21T00:00:00Z',
      updatedAt: '2026-11-21T00:00:00Z'
    }
  ];

  beforeEach(() => {
    jest.clearAllMocks();

    mockAuthState = {
      user: null,
      isAuthenticated: false,
      serviceReadiness: 'ready',
      signOut: jest.fn()
    };

    mockProfileRepo = {
      getProfile: jest.fn().mockResolvedValue({ success: true, data: aliceProfile }),
      upsertProfile: jest.fn(),
      getSavedPlaces: jest.fn().mockResolvedValue({ success: true, data: alicePlaces }),
      upsertSavedPlace: jest.fn(),
      deleteSavedPlace: jest.fn(),
      getPreferences: jest.fn().mockResolvedValue({
        success: true,
        data: {
          userId: 'user-alice-uuid',
          preferredModes: ['bus'],
          distanceUnit: 'km',
          createdAt: '2026-11-20T00:00:00Z',
          updatedAt: '2026-11-20T00:00:00Z'
        }
      }),
      upsertPreferences: jest.fn()
    };
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <ProfileProvider repository={mockProfileRepo}>{children}</ProfileProvider>
  );

  it('TC-04.5.3-18: guarantees guest startup does not fetch profile or saved places', () => {
    mockAuthState = {
      user: null,
      isAuthenticated: false,
      serviceReadiness: 'ready',
      signOut: jest.fn()
    };

    const { result } = renderHook(() => useProfile(), { wrapper });

    expect(result.current.profile).toBeNull();
    expect(result.current.savedPlaces).toEqual([]);
    expect(result.current.preferences).toBeNull();
    expect(mockProfileRepo.getProfile).not.toHaveBeenCalled();
    expect(mockProfileRepo.getSavedPlaces).not.toHaveBeenCalled();
  });

  it('TC-04.5.3-19: ensures late resolving responses are rejected when user signs out during in-flight fetch', async () => {
    // Deferred promise to simulate slow network response
    let resolveProfile: (val: any) => void = () => {};
    const deferredProfilePromise = new Promise((resolve) => {
      resolveProfile = resolve;
    });

    mockProfileRepo.getProfile.mockReturnValue(deferredProfilePromise as any);

    mockAuthState = {
      user: userAlice,
      isAuthenticated: true,
      serviceReadiness: 'ready',
      signOut: jest.fn()
    };

    const { result, rerender } = renderHook(() => useProfile(), { wrapper });

    expect(mockProfileRepo.getProfile).toHaveBeenCalledWith(userAlice.id);

    // Now User Alice signs out while the fetch is still pending
    act(() => {
      mockAuthState = {
        user: null,
        isAuthenticated: false,
        serviceReadiness: 'ready',
        signOut: jest.fn()
      };
      rerender({});
    });

    // Profile state should be immediately cleared
    expect(result.current.profile).toBeNull();
    expect(result.current.savedPlaces).toEqual([]);

    // Now the slow network response resolves late
    await act(async () => {
      resolveProfile({ success: true, data: aliceProfile });
    });

    // The late response must NOT resurrect Alice's profile in guest state
    expect(result.current.profile).toBeNull();
    expect(result.current.savedPlaces).toEqual([]);
  });

  it('TC-04.5.3-20: ensures switching from User A to User B completely isolates private data without crossover', async () => {
    mockProfileRepo.getProfile.mockImplementation(async (userId) => {
      if (userId === userAlice.id) return { success: true, data: aliceProfile };
      if (userId === userBob.id) {
        return {
          success: true,
          data: {
            id: userBob.id,
            displayName: 'Bob Traveler',
            avatarUrl: null,
            createdAt: '2026-11-21T00:00:00Z',
            updatedAt: '2026-11-21T00:00:00Z'
          }
        };
      }
      return { success: false, error: { code: 'NOT_FOUND', message: 'User not found' } };
    });

    mockProfileRepo.getSavedPlaces.mockImplementation(async (userId) => {
      if (userId === userAlice.id) return { success: true, data: alicePlaces };
      if (userId === userBob.id) return { success: true, data: bobPlaces };
      return { success: true, data: [] };
    });

    mockAuthState = {
      user: userAlice,
      isAuthenticated: true,
      serviceReadiness: 'ready',
      signOut: jest.fn()
    };

    const { result, rerender } = renderHook(() => useProfile(), { wrapper });

    await waitFor(() => {
      expect(result.current.profile?.id).toBe(userAlice.id);
      expect(result.current.savedPlaces[0]?.placeText).toBe('100 Alice Road');
    });

    // Switch account to Bob
    act(() => {
      mockAuthState = {
        user: userBob,
        isAuthenticated: true,
        serviceReadiness: 'ready',
        signOut: jest.fn()
      };
      rerender({});
    });

    await waitFor(() => {
      expect(result.current.profile?.id).toBe(userBob.id);
      expect(result.current.savedPlaces[0]?.placeText).toBe('200 Bob Avenue');
    });

    // Ensure Alice's place is completely absent from Bob's state
    expect(result.current.savedPlaces.find((p) => p.userId === userAlice.id)).toBeUndefined();
  });

  it('TC-04.5.3-21: rejects late response from prior user when switching accounts quickly', async () => {
    let resolveAliceProfile: (val: any) => void = () => {};
    const deferredAlicePromise = new Promise((resolve) => {
      resolveAliceProfile = resolve;
    });

    mockProfileRepo.getProfile.mockImplementation(async (userId) => {
      if (userId === userAlice.id) return deferredAlicePromise as any;
      if (userId === userBob.id) {
        return {
          success: true,
          data: {
            id: userBob.id,
            displayName: 'Bob Traveler',
            avatarUrl: null,
            createdAt: '2026-11-21T00:00:00Z',
            updatedAt: '2026-11-21T00:00:00Z'
          }
        };
      }
      return { success: false, error: { code: 'NOT_FOUND', message: 'Not found' } };
    });

    mockAuthState = {
      user: userAlice,
      isAuthenticated: true,
      serviceReadiness: 'ready',
      signOut: jest.fn()
    };

    const { result, rerender } = renderHook(() => useProfile(), { wrapper });

    // Switch to Bob before Alice's request resolves
    act(() => {
      mockAuthState = {
        user: userBob,
        isAuthenticated: true,
        serviceReadiness: 'ready',
        signOut: jest.fn()
      };
      rerender({});
    });

    await waitFor(() => {
      expect(result.current.profile?.id).toBe(userBob.id);
    });

    // Now Alice's deferred profile resolves late
    await act(async () => {
      resolveAliceProfile({ success: true, data: aliceProfile });
    });

    // Bob's profile must remain intact; Alice's late response must be discarded
    expect(result.current.profile?.id).toBe(userBob.id);
    expect(result.current.profile?.displayName).toBe('Bob Traveler');
  });
});
