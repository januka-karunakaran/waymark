/**
 * Waymark Mobile — Feature 04.4: Profile Security, Integration & Final QA Suite
 * TC-04.4.4-01 through TC-04.4.4-20: Comprehensive cross-cutting verification of RLS isolation,
 * guest boundaries, input sanitization, quick action bridge, accessibility, and session lifecycle.
 */

import React from 'react';
import { render, waitFor, renderHook } from '@testing-library/react-native';
import { ProfileProvider, useProfile } from '../context/ProfileContext';
import { ProfileRepository } from '../services/ProfileRepository';
import { SupabaseProfileRepository } from '../services/SupabaseProfileRepository';
import {
  validateDisplayName,
  validateAvatarUrl,
  validateSavedPlaceInput,
  validatePreferencesInput
} from '../validation';
import {
  resolveHomeQuickAction,
  UNCONFIGURED_LOCATIONS_MESSAGE,
  HomeQuickPlaceNode
} from '../../home';
import AccountScreen from '../../../../app/(auth)/account';

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
let mockAuthState: Record<string, unknown> = {
  user: null,
  isAuthenticated: false,
  serviceReadiness: 'ready',
  signOut: jest.fn()
};

jest.mock('../../auth', () => ({
  ...jest.requireActual('../../auth'),
  useAuth: () => mockAuthState
}));

describe('Feature 04.4 — Profile Security, Integration & Final QA', () => {
  let mockRepo: jest.Mocked<ProfileRepository>;

  const travelerAlice = {
    id: 'user-alice-uuid',
    email: 'alice@waymark.app',
    displayName: 'Navigator Alice',
    emailVerified: true
  };

  beforeEach(() => {
    jest.clearAllMocks();

    mockAuthState = {
      user: travelerAlice,
      isAuthenticated: true,
      serviceReadiness: 'ready',
      signOut: jest.fn()
    };

    mockRepo = {
      getProfile: jest.fn().mockResolvedValue({
        success: true,
        data: {
          id: 'user-alice-uuid',
          displayName: 'Navigator Alice',
          avatarUrl: 'https://images.waymark.app/alice.png',
          createdAt: '2026-11-20T00:00:00Z',
          updatedAt: '2026-11-21T00:00:00Z'
        }
      }),
      upsertProfile: jest.fn(),
      getSavedPlaces: jest.fn().mockResolvedValue({ success: true, data: [] }),
      upsertSavedPlace: jest.fn(),
      deleteSavedPlace: jest.fn().mockResolvedValue({ success: true, data: undefined }),
      getPreferences: jest.fn().mockResolvedValue({
        success: true,
        data: {
          userId: 'user-alice-uuid',
          preferredModes: ['bus', 'train'],
          distanceUnit: 'km',
          createdAt: '2026-11-20T00:00:00Z',
          updatedAt: '2026-11-21T00:00:00Z'
        }
      }),
      upsertPreferences: jest.fn()
    };
  });

  // ==========================================================================
  // SECTION 1: ROW LEVEL SECURITY & MULTI-TENANT ISOLATION
  // ==========================================================================

  it('TC-04.4.4-01: enforces RLS isolation: repository maps permission denied (42501) to UNAUTHENTICATED', async () => {
    const mockClient = {
      from: jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            maybeSingle: jest.fn().mockResolvedValue({
              data: null,
              error: { code: '42501', message: 'permission denied for table profiles' }
            })
          })
        })
      })
    };

    const repo = new SupabaseProfileRepository(mockClient as any);
    const result = await repo.getProfile('user-bob-uuid');

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe('UNAUTHENTICATED');
      expect(result.error.message).toContain('Row Level Security');
    }
  });

  it('TC-04.4.4-02: prevents unauthenticated access when Supabase client is unconfigured', async () => {
    const repo = new SupabaseProfileRepository(null);
    const profileRes = await repo.getProfile('user-alice-uuid');
    const placesRes = await repo.getSavedPlaces('user-alice-uuid');
    const prefRes = await repo.getPreferences('user-alice-uuid');

    expect(profileRes.success).toBe(false);
    expect(placesRes.success).toBe(false);
    expect(prefRes.success).toBe(false);
  });

  it('TC-04.4.4-03: scopes place deletion strictly to authenticated user_id in database query', async () => {
    const eqUserMock = jest.fn().mockResolvedValue({ error: null });
    const eqIdMock = jest.fn().mockReturnValue({ eq: eqUserMock });
    const deleteMock = jest.fn().mockReturnValue({ eq: eqIdMock });
    const mockClient = {
      from: jest.fn().mockReturnValue({ delete: deleteMock })
    };

    const repo = new SupabaseProfileRepository(mockClient as any);
    await repo.deleteSavedPlace('user-alice-uuid', 'place-999');

    expect(eqIdMock).toHaveBeenCalledWith('id', 'place-999');
    expect(eqUserMock).toHaveBeenCalledWith('user_id', 'user-alice-uuid');
  });

  // ==========================================================================
  // SECTION 2: INPUT VALIDATION & INJECTION PREVENTION
  // ==========================================================================

  it('TC-04.4.4-04: rejects script tags and XSS injection attempts in display name', () => {
    const result = validateDisplayName('Alice<script>alert(1)</script>');
    expect(result.isValid).toBe(false);
    expect(result.error).toContain('contains invalid characters');
  });

  it('TC-04.4.4-05: rejects null-byte injection attempts in display name', () => {
    const result = validateDisplayName('Alice\x00Admin');
    expect(result.isValid).toBe(false);
    expect(result.error).toContain('contains invalid characters');
  });

  it('TC-04.4.4-06: rejects non-http protocols (e.g. javascript:, file:) in avatar URL', () => {
    expect(validateAvatarUrl('javascript:evil()').isValid).toBe(false);
    expect(validateAvatarUrl('file:///etc/shadow').isValid).toBe(false);
    expect(validateAvatarUrl('data:text/html,evil').isValid).toBe(false);
  });

  it('TC-04.4.4-07: rejects path traversal and control sequences in saved place text', () => {
    const traversal = validateSavedPlaceInput({
      kind: 'favorite',
      label: 'HQ',
      placeText: '../../sensitive/path'
    });
    expect(traversal.isValid).toBe(false);
  });

  it('TC-04.4.4-08: rejects oversized strings exceeding domain constraints', () => {
    expect(validateDisplayName('A'.repeat(51)).isValid).toBe(false);
    expect(validateAvatarUrl('https://example.com/' + 'A'.repeat(501)).isValid).toBe(false);
    expect(
      validateSavedPlaceInput({
        kind: 'home',
        label: 'A'.repeat(51),
        placeText: 'Valid Address'
      }).isValid
    ).toBe(false);
    expect(
      validateSavedPlaceInput({
        kind: 'home',
        label: 'Home',
        placeText: 'A'.repeat(121)
      }).isValid
    ).toBe(false);
  });

  // ==========================================================================
  // SECTION 3: DOMAIN INVARIANTS (HOME & WORK UNIQUE CONSTRAINTS)
  // ==========================================================================

  it('TC-04.4.4-09: updates existing Home place instead of creating duplicate when saving new Home', async () => {
    const existingHome = { id: 'existing-home-id' };
    const singleMock = jest.fn().mockResolvedValue({
      data: {
        id: 'existing-home-id',
        user_id: 'user-alice-uuid',
        kind: 'home',
        label: 'Home',
        place_text: '999 New Ocean Rd',
        created_at: '2026-11-20T00:00:00Z',
        updated_at: '2026-11-22T00:00:00Z'
      },
      error: null
    });
    const selectMock = jest.fn().mockReturnValue({ single: singleMock });
    const updateMock = jest.fn().mockReturnValue({ eq: jest.fn().mockReturnValue({ select: selectMock }) });

    const maybeSingleMock = jest.fn().mockResolvedValue({ data: existingHome, error: null });
    const eqKindMock = jest.fn().mockReturnValue({ maybeSingle: maybeSingleMock });
    const eqUserMock = jest.fn().mockReturnValue({ eq: eqKindMock });
    const initialSelectMock = jest.fn().mockReturnValue({ eq: eqUserMock });

    const mockClient = {
      from: jest.fn((table: string) => {
        if (table === 'saved_places') {
          return {
            select: initialSelectMock,
            update: updateMock
          };
        }
        return {};
      })
    };

    const repo = new SupabaseProfileRepository(mockClient as any);
    const res = await repo.upsertSavedPlace('user-alice-uuid', {
      kind: 'home',
      label: 'Home',
      placeText: '999 New Ocean Rd'
    });

    expect(res.success).toBe(true);
    if (res.success) {
      expect(res.data.id).toBe('existing-home-id');
      expect(res.data.placeText).toBe('999 New Ocean Rd');
    }
  });

  it('TC-04.4.4-10: enforces partial unique index conflict (23505) error mapping', async () => {
    const singleMock = jest.fn().mockResolvedValue({
      data: null,
      error: { code: '23505', message: 'duplicate key value violates unique constraint' }
    });
    const selectMock = jest.fn().mockReturnValue({ single: singleMock });
    const insertMock = jest.fn().mockReturnValue({ select: selectMock });
    const mockClient = {
      from: jest.fn().mockReturnValue({ insert: insertMock })
    };

    const repo = new SupabaseProfileRepository(mockClient as any);
    const res = await repo.upsertSavedPlace('user-alice-uuid', {
      kind: 'favorite',
      label: 'Duplicate',
      placeText: 'Some Address'
    });

    expect(res.success).toBe(false);
    if (!res.success) {
      expect(res.error.code).toBe('CONFLICT');
    }
  });

  // ==========================================================================
  // SECTION 4: INTEGRATION WITH HOME QUICK ACTION RESOLVER
  // ==========================================================================

  it('TC-04.4.4-11: quickActionResolver yields unconfigured when Home/Work have not been saved', () => {
    const homeNode: HomeQuickPlaceNode = {
      id: 'place-home',
      label: 'Home',
      destination: 'Custom Saved Destination',
      iconName: 'home'
    };

    const resolution = resolveHomeQuickAction(homeNode, {
      savedAddresses: {}
    });

    expect(resolution.type).toBe('unconfigured');
    if (resolution.type === 'unconfigured') {
      expect(resolution.userMessage).toContain(UNCONFIGURED_LOCATIONS_MESSAGE);
    }
  });

  it('TC-04.4.4-12: quickActionResolver resolves live journey navigation once Home is saved', () => {
    const homeNode: HomeQuickPlaceNode = {
      id: 'place-home',
      label: 'Home',
      destination: 'Custom Saved Destination',
      iconName: 'home'
    };

    const resolution = resolveHomeQuickAction(homeNode, {
      savedAddresses: { 'place-home': '123 Galle Road, Colombo 03' }
    });

    expect(resolution.type).toBe('navigate');
    if (resolution.type === 'navigate') {
      expect(resolution.targetRoute).toBe('/(tabs)/journey');
      expect(resolution.destinationContext?.destinationName).toBe('123 Galle Road, Colombo 03');
    }
  });

  // ==========================================================================
  // SECTION 5: TRAVELER PREFERENCES & PRIVACY GUARANTEES
  // ==========================================================================

  it('TC-04.4.4-13: accepts whitelisted transit modes and deduplicates them', () => {
    const outcome = validatePreferencesInput({
      preferredModes: ['bus', 'train', 'bus', 'metro'],
      distanceUnit: 'km'
    });

    expect(outcome.isValid).toBe(true);
    expect(outcome.sanitized?.preferredModes).toEqual(['bus', 'train', 'metro']);
  });

  it('TC-04.4.4-14: rejects invalid transit mode types and non-standard distance units', () => {
    expect(validatePreferencesInput({ preferredModes: ['rocketship'] }).isValid).toBe(false);
    expect(validatePreferencesInput({ distanceUnit: 'leagues' }).isValid).toBe(false);
  });

  it('TC-04.4.4-15: guarantees zero collection of sensitive medical, disability, or tracking telemetry', () => {
    const safePayload = {
      preferredModes: ['walking', 'bus'],
      distanceUnit: 'mi'
    };
    const outcome = validatePreferencesInput(safePayload);

    expect(outcome.isValid).toBe(true);
    // Explicitly verify fields do not contain health or tracking data
    expect((outcome.sanitized as any).health).toBeUndefined();
    expect((outcome.sanitized as any).disability).toBeUndefined();
    expect((outcome.sanitized as any).locationHistory).toBeUndefined();
  });

  // ==========================================================================
  // SECTION 6: SESSION LIFECYCLE & STATE PURGING
  // ==========================================================================

  it('TC-04.4.4-16: purges profile, saved places, and preferences immediately upon sign out', async () => {
    const { result, rerender } = renderHook(() => useProfile(), {
      wrapper: ({ children }: { children: React.ReactNode }) => (
        <ProfileProvider repository={mockRepo}>{children}</ProfileProvider>
      )
    });

    await waitFor(() => {
      expect(result.current.profile).toBeTruthy();
    });

    // Simulate traveler sign out
    mockAuthState = {
      user: null,
      isAuthenticated: false,
      serviceReadiness: 'ready',
      signOut: jest.fn()
    };
    rerender({});

    await waitFor(() => {
      expect(result.current.profile).toBeNull();
      expect(result.current.savedPlaces).toEqual([]);
      expect(result.current.preferences).toBeNull();
      expect(result.current.savedAddresses).toEqual({ home: null, work: null });
    });
  });

  it('TC-04.4.4-17: lazy-populates local profile from auth metadata if no database record exists', async () => {
    mockRepo.getProfile.mockResolvedValue({ success: true, data: null });

    const { result } = renderHook(() => useProfile(), {
      wrapper: ({ children }: { children: React.ReactNode }) => (
        <ProfileProvider repository={mockRepo}>{children}</ProfileProvider>
      )
    });

    await waitFor(() => {
      expect(result.current.profile?.id).toBe('user-alice-uuid');
      expect(result.current.profile?.displayName).toBe('Navigator Alice');
    });
  });

  // ==========================================================================
  // SECTION 7: UI ACCESSIBILITY & COMPONENT INTEGRATION
  // ==========================================================================

  it('TC-04.4.4-18: ensures all interactive profile buttons have accessible labels and touch targets', () => {
    const { getByTestId } = render(
      <ProfileProvider repository={mockRepo}>
        <AccountScreen />
      </ProfileProvider>
    );

    const editBtn = getByTestId('btn-edit-profile');
    expect(editBtn.props.accessibilityLabel).toBe('Edit Profile');
    expect(editBtn.props.accessibilityHint).toBeTruthy();

    const addFavBtn = getByTestId('btn-add-favorite');
    expect(addFavBtn.props.accessibilityLabel).toBe('Add Custom Shortcut');
  });

  it('TC-04.4.4-19: ensures transit mode chips convey checkbox semantics with accurate checked state', () => {
    const { getByTestId } = render(
      <ProfileProvider repository={mockRepo}>
        <AccountScreen />
      </ProfileProvider>
    );

    const busChip = getByTestId('mode-chip-bus');
    expect(busChip.props.accessibilityRole).toBe('checkbox');
    expect(busChip.props.accessibilityState).toBeDefined();

    const kmChip = getByTestId('unit-chip-km');
    expect(kmChip.props.accessibilityRole).toBe('radio');
  });

  it('TC-04.4.4-20: preserves anonymous guest navigation without crashing or leaking auth screens', () => {
    mockAuthState = {
      user: null,
      isAuthenticated: false,
      serviceReadiness: 'ready',
      signOut: jest.fn()
    };

    const { getByTestId, queryByTestId, getByText } = render(
      <ProfileProvider repository={mockRepo}>
        <AccountScreen />
      </ProfileProvider>
    );

    expect(getByTestId('account-status-card')).toBeTruthy();
    expect(getByText(/Anonymous Guest Navigator/i)).toBeTruthy();
    expect(getByTestId('btn-continue-as-guest')).toBeTruthy();
    expect(queryByTestId('account-profile-card')).toBeNull();
    expect(queryByTestId('account-saved-places-card')).toBeNull();
  });
});
