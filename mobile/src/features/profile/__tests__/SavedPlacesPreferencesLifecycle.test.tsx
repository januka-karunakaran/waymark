/**
 * Waymark Mobile — Feature 04.4: SavedPlacesPreferencesLifecycle Unit Tests
 * Verifies end-to-end context lifecycle for saved places, home/work replacement,
 * preferences updates, and derived savedAddresses mapping for quickActionResolver.
 */

import React from 'react';
import { renderHook, act } from '@testing-library/react-native';
import { ProfileProvider, useProfile, useSavedAddresses } from '../context/ProfileContext';
import { ProfileRepository } from '../services/ProfileRepository';
import { SavedPlace, TravelerPreferences } from '../types';

const mockUser = {
  id: 'user-001',
  email: 'januka@waymark.app',
  displayName: 'Captain Janu',
  emailVerified: true
};

let mockAuthState: Record<string, unknown> = {
  user: mockUser,
  isAuthenticated: true,
  serviceReadiness: 'ready' as const
};

jest.mock('../../auth', () => ({
  useAuth: () => mockAuthState
}));

describe('SavedPlaces & Preferences Lifecycle', () => {
  let mockRepo: jest.Mocked<ProfileRepository>;

  beforeEach(() => {
    mockAuthState = {
      user: mockUser,
      isAuthenticated: true,
      serviceReadiness: 'ready'
    };

    mockRepo = {
      getProfile: jest.fn().mockResolvedValue({ success: true, data: null }),
      upsertProfile: jest.fn(),
      getSavedPlaces: jest.fn().mockResolvedValue({ success: true, data: [] }),
      upsertSavedPlace: jest.fn(),
      deleteSavedPlace: jest.fn().mockResolvedValue({ success: true, data: undefined }),
      getPreferences: jest.fn().mockResolvedValue({
        success: true,
        data: {
          userId: 'user-001',
          preferredModes: ['bus'],
          distanceUnit: 'km',
          createdAt: '2026-11-21T00:00:00Z',
          updatedAt: '2026-11-21T00:00:00Z'
        }
      }),
      upsertPreferences: jest.fn()
    };
  });

  it('loads saved places and preferences on mount', async () => {
    const existingPlaces: SavedPlace[] = [
      {
        id: 'place-home',
        userId: 'user-001',
        kind: 'home',
        label: 'Home Habitat',
        placeText: '123 Galle Rd',
        createdAt: '2026-11-21T00:00:00Z',
        updatedAt: '2026-11-21T00:00:00Z'
      }
    ];
    mockRepo.getSavedPlaces.mockResolvedValue({ success: true, data: existingPlaces });

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <ProfileProvider repository={mockRepo}>{children}</ProfileProvider>
    );

    const { result } = renderHook(() => useProfile(), { wrapper });
    await act(async () => {});

    expect(result.current.savedPlaces).toEqual(existingPlaces);
    expect(result.current.savedAddresses).toEqual({
      home: '123 Galle Rd',
      work: null
    });
    expect(result.current.preferences?.preferredModes).toEqual(['bus']);
  });

  it('adds a new Home place and updates derived savedAddresses', async () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <ProfileProvider repository={mockRepo}>{children}</ProfileProvider>
    );

    const newHomePlace: SavedPlace = {
      id: 'place-new-home',
      userId: 'user-001',
      kind: 'home',
      label: 'Home',
      placeText: '456 Marine Drive',
      createdAt: '2026-11-21T00:00:00Z',
      updatedAt: '2026-11-21T00:00:00Z'
    };
    mockRepo.upsertSavedPlace.mockResolvedValue({ success: true, data: newHomePlace });

    const { result } = renderHook(() => useProfile(), { wrapper });
    await act(async () => {});

    await act(async () => {
      await result.current.addSavedPlace({
        kind: 'home',
        label: 'Home',
        placeText: '456 Marine Drive'
      });
    });

    expect(result.current.savedPlaces.some((p) => p.id === 'place-new-home')).toBe(true);
    expect(result.current.savedAddresses.home).toBe('456 Marine Drive');
  });

  it('replaces existing Home when adding updated Home shortcut', async () => {
    const initialHome: SavedPlace = {
      id: 'place-home-1',
      userId: 'user-001',
      kind: 'home',
      label: 'Home',
      placeText: 'Old Home Address',
      createdAt: '2026-11-21T00:00:00Z',
      updatedAt: '2026-11-21T00:00:00Z'
    };
    mockRepo.getSavedPlaces.mockResolvedValue({ success: true, data: [initialHome] });

    const updatedHome: SavedPlace = {
      id: 'place-home-2',
      userId: 'user-001',
      kind: 'home',
      label: 'Home',
      placeText: 'New Home Address',
      createdAt: '2026-11-21T01:00:00Z',
      updatedAt: '2026-11-21T01:00:00Z'
    };
    mockRepo.upsertSavedPlace.mockResolvedValue({ success: true, data: updatedHome });

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <ProfileProvider repository={mockRepo}>{children}</ProfileProvider>
    );

    const { result } = renderHook(() => useProfile(), { wrapper });
    await act(async () => {});

    await act(async () => {
      await result.current.addSavedPlace({
        kind: 'home',
        label: 'Home',
        placeText: 'New Home Address'
      });
    });

    // Should only have 1 home place in state
    const homePlaces = result.current.savedPlaces.filter((p) => p.kind === 'home');
    expect(homePlaces.length).toBe(1);
    expect(homePlaces[0].placeText).toBe('New Home Address');
    expect(result.current.savedAddresses.home).toBe('New Home Address');
  });

  it('deletes saved place and purges from state and savedAddresses', async () => {
    const initialHome: SavedPlace = {
      id: 'place-home-1',
      userId: 'user-001',
      kind: 'home',
      label: 'Home',
      placeText: '123 Galle Rd',
      createdAt: '2026-11-21T00:00:00Z',
      updatedAt: '2026-11-21T00:00:00Z'
    };
    mockRepo.getSavedPlaces.mockResolvedValue({ success: true, data: [initialHome] });

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <ProfileProvider repository={mockRepo}>{children}</ProfileProvider>
    );

    const { result } = renderHook(() => useProfile(), { wrapper });
    await act(async () => {});
    expect(result.current.savedPlaces.length).toBe(1);

    await act(async () => {
      await result.current.deleteSavedPlace('place-home-1');
    });

    expect(result.current.savedPlaces.length).toBe(0);
    expect(result.current.savedAddresses.home).toBeNull();
  });

  it('updates preferences in context state', async () => {
    const updatedPref: TravelerPreferences = {
      userId: 'user-001',
      preferredModes: ['train', 'metro'],
      distanceUnit: 'mi',
      createdAt: '2026-11-21T00:00:00Z',
      updatedAt: '2026-11-21T02:00:00Z'
    };
    mockRepo.upsertPreferences.mockResolvedValue({ success: true, data: updatedPref });

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <ProfileProvider repository={mockRepo}>{children}</ProfileProvider>
    );

    const { result } = renderHook(() => useProfile(), { wrapper });
    await act(async () => {});

    await act(async () => {
      await result.current.updatePreferences({
        preferredModes: ['train', 'metro'],
        distanceUnit: 'mi'
      });
    });

    expect(result.current.preferences?.preferredModes).toEqual(['train', 'metro']);
    expect(result.current.preferences?.distanceUnit).toBe('mi');
  });

  it('provides dedicated useSavedAddresses hook reflecting reactive address state', async () => {
    const initialPlaces: SavedPlace[] = [
      {
        id: 'place-home',
        userId: 'user-001',
        kind: 'home',
        label: 'Home',
        placeText: 'Home Base',
        createdAt: '2026-11-21T00:00:00Z',
        updatedAt: '2026-11-21T00:00:00Z'
      },
      {
        id: 'place-work',
        userId: 'user-001',
        kind: 'work',
        label: 'Work',
        placeText: 'Work HQ',
        createdAt: '2026-11-21T00:00:00Z',
        updatedAt: '2026-11-21T00:00:00Z'
      }
    ];
    mockRepo.getSavedPlaces.mockResolvedValue({ success: true, data: initialPlaces });

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <ProfileProvider repository={mockRepo}>{children}</ProfileProvider>
    );

    const { result } = renderHook(() => useSavedAddresses(), { wrapper });
    await act(async () => {});

    expect(result.current).toEqual({
      home: 'Home Base',
      work: 'Work HQ'
    });
  });
});
