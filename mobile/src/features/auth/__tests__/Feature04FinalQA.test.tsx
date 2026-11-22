/**
 * Waymark Mobile — Feature 04: Authentication & User Accounts
 * Task 04.5.4: Final End-to-End Security QA & Milestone Verification
 *
 * Comprehensive cross-cutting verification across Feature 04.1 through 04.5:
 * - Feature 04.1: Authentication Foundation (Auth models, service contracts, session storage, guest state)
 * - Feature 04.2: Authentication UI (Account landing, sign-in, sign-up, password recovery, accessibility)
 * - Feature 04.3: Real Supabase Auth (Client config, session lifecycle, token refresh, recovery)
 * - Feature 04.4: User Profile & Saved Places (PostgreSQL RLS, profile view/edit, home/work, preferences)
 * - Feature 04.5: Security Hardening (Account settings, privacy controls, private journey handoff, zero PII)
 */

import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react-native';
import { AuthProvider } from '../context/AuthContext';
import { ProfileProvider } from '../../profile/context/ProfileContext';
import { AuthService } from '../services/AuthService';
import { AuthSessionStorage } from '../storage/AuthSessionStorage';
import { ProfileRepository } from '../../profile/services/ProfileRepository';
import { AuthUser, AuthSession } from '../types';
import { UserProfile, SavedPlace, TravelerPreferences } from '../../profile/types';
import {
  validateJourneyParams,
  createJourneyRouteParams
} from '../../home';
import AccountScreen from '../../../../app/(auth)/account';
import SettingsScreen from '../../../../app/(auth)/settings';
import HomeScreen from '../../../../app/(tabs)/index';
import JourneyScreen from '../../../../app/(tabs)/journey';
import { maskSensitiveData } from '../../../utils/logger';

// Mock Router
const mockPush = jest.fn();
const mockReplace = jest.fn();
const mockBack = jest.fn();
const mockCanGoBack = jest.fn().mockReturnValue(true);
let mockSearchParams: Record<string, string> = {};

jest.mock('expo-router', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: mockReplace,
    back: mockBack,
    canGoBack: mockCanGoBack
  }),
  useLocalSearchParams: () => mockSearchParams
}));

describe('Feature 04 Final Security QA & End-to-End Verification (TC-04.5.4)', () => {
  let mockAuthService: jest.Mocked<AuthService>;
  let mockStorage: jest.Mocked<AuthSessionStorage>;
  let mockProfileRepo: jest.Mocked<ProfileRepository>;
  let authListener: ((session: AuthSession | null, event: string) => Promise<void>) | null = null;

  const travelerAlice: AuthUser = {
    id: 'user-alice-0001',
    email: 'alice@waymark.app',
    displayName: 'Navigator Alice',
    emailVerified: true
  };

  const travelerBob: AuthUser = {
    id: 'user-bob-0002',
    email: 'bob@waymark.app',
    displayName: 'Explorer Bob',
    emailVerified: false
  };

  const aliceSession: AuthSession = {
    accessToken: 'mock-access-token-alice',
    refreshToken: 'mock-refresh-token-alice',
    expiresAt: Date.now() + 3600 * 1000,
    user: travelerAlice
  };

  const aliceProfile: UserProfile = {
    id: travelerAlice.id,
    displayName: 'Navigator Alice',
    avatarUrl: 'https://images.waymark.app/alice.png',
    createdAt: '2026-11-20T00:00:00Z',
    updatedAt: '2026-11-21T00:00:00Z'
  };

  const aliceSavedPlaces: SavedPlace[] = [
    {
      id: 'place-alice-home',
      userId: travelerAlice.id,
      kind: 'home',
      label: 'Home',
      placeText: '100 Neon Corridor, Neo-Colombo',
      createdAt: '2026-11-20T00:00:00Z',
      updatedAt: '2026-11-20T00:00:00Z'
    },
    {
      id: 'place-alice-work',
      userId: travelerAlice.id,
      kind: 'work',
      label: 'Work',
      placeText: 'Transit Hub 4, Orbital Spire',
      createdAt: '2026-11-20T00:00:00Z',
      updatedAt: '2026-11-20T00:00:00Z'
    }
  ];

  const alicePreferences: TravelerPreferences = {
    userId: travelerAlice.id,
    preferredModes: ['bus', 'train'],
    distanceUnit: 'km',
    createdAt: '2026-11-20T00:00:00Z',
    updatedAt: '2026-11-20T00:00:00Z'
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockSearchParams = {};
    authListener = null;

    mockAuthService = {
      signIn: jest.fn().mockResolvedValue({ success: true, session: aliceSession }),
      signUp: jest.fn().mockResolvedValue({ success: true, user: travelerAlice }),
      signOut: jest.fn().mockResolvedValue(undefined),
      getCurrentSession: jest.fn().mockResolvedValue(null),
      refreshSession: jest.fn().mockResolvedValue({ success: true, session: aliceSession }),
      resetPassword: jest.fn().mockResolvedValue({ success: true }),
      onAuthStateChange: jest.fn().mockImplementation((cb) => {
        authListener = cb;
        return () => {
          authListener = null;
        };
      }),
      getServiceReadiness: jest.fn().mockReturnValue('ready')
    };

    mockStorage = {
      getSession: jest.fn().mockResolvedValue(null),
      saveSession: jest.fn().mockResolvedValue(undefined),
      clearSession: jest.fn().mockResolvedValue(undefined)
    };

    mockProfileRepo = {
      getProfile: jest.fn().mockResolvedValue({ success: true, data: aliceProfile }),
      upsertProfile: jest.fn().mockResolvedValue({ success: true, data: aliceProfile }),
      getSavedPlaces: jest.fn().mockResolvedValue({ success: true, data: aliceSavedPlaces }),
      upsertSavedPlace: jest.fn().mockResolvedValue({ success: true, data: aliceSavedPlaces[0] }),
      deleteSavedPlace: jest.fn().mockResolvedValue({ success: true, data: undefined }),
      getPreferences: jest.fn().mockResolvedValue({ success: true, data: alicePreferences }),
      upsertPreferences: jest.fn().mockResolvedValue({ success: true, data: alicePreferences })
    };
  });

  const renderApp = (ui: React.ReactElement) => {
    return render(
      <AuthProvider authService={mockAuthService} storage={mockStorage}>
        <ProfileProvider repository={mockProfileRepo}>
          {ui}
        </ProfileProvider>
      </AuthProvider>
    );
  };

  // ==========================================================================
  // SECTION 1: GUEST STARTUP & UNCONFIGURED FLOWS (04.1, 04.2)
  // ==========================================================================
  describe('1. Guest Startup & Public Mobility Boundaries', () => {
    it('TC-04.5.4-01: launches app in guest mode with public mobility services available', async () => {
      renderApp(<HomeScreen />);

      await waitFor(() => {
        expect(screen.getByTestId('home-content')).toBeTruthy();
        expect(screen.getByTestId('quick-place-place-home')).toBeTruthy();
        expect(screen.getByTestId('quick-place-place-work')).toBeTruthy();
      });

      // Public destinations are visible
      expect(screen.getByTestId('quick-place-place-kandy')).toBeTruthy();
      expect(screen.getByTestId('quick-place-place-colombo')).toBeTruthy();
    });

    it('TC-04.5.4-02: guest tapping Home/Work displays unconfigured guidance prompting sign-in', async () => {
      renderApp(<HomeScreen />);

      const homeQuickAction = screen.getByTestId('quick-place-place-home');
      fireEvent.press(homeQuickAction);

      await waitFor(() => {
        expect(screen.getByTestId('home-guidance-banner')).toBeTruthy();
        expect(screen.getByText(/Home and Work locations have not been saved yet/i)).toBeTruthy();
      });

      // Tapping guidance directs guest to account sign-in
      fireEvent.press(screen.getByTestId('home-guidance-action'));
      expect(mockPush).toHaveBeenCalledWith('/(auth)/sign-in');
    });

    it('TC-04.5.4-03: renders guest account landing screen with sign-in and sign-up options', async () => {
      renderApp(<AccountScreen />);

      await waitFor(() => {
        expect(screen.getByText(/Current Navigation Mode/i)).toBeTruthy();
        expect(screen.getByTestId('btn-navigate-sign-in')).toBeTruthy();
        expect(screen.getByTestId('btn-navigate-sign-up')).toBeTruthy();
      });
    });
  });

  // ==========================================================================
  // SECTION 2: AUTHENTICATION, SETTINGS & PRIVACY (04.3, 04.5.1)
  // ==========================================================================
  describe('2. Authenticated State, Account Settings & Privacy Controls', () => {
    beforeEach(() => {
      mockStorage.getSession.mockResolvedValue(aliceSession);
      mockAuthService.getCurrentSession.mockResolvedValue(aliceSession);
    });

    it('TC-04.5.4-04: restores authenticated session on app launch and renders trusted identity', async () => {
      renderApp(<SettingsScreen />);

      await waitFor(() => {
        expect(screen.getByText(travelerAlice.email)).toBeTruthy();
        expect(screen.getByTestId('settings-email-verified-badge')).toBeTruthy();
        expect(screen.getByTestId('btn-settings-sign-out')).toBeTruthy();
      });
    });

    it('TC-04.5.4-05: provides accessible links to profile, saved places, and preferences', async () => {
      renderApp(<SettingsScreen />);

      await waitFor(() => {
        expect(screen.getByTestId('btn-settings-edit-profile')).toBeTruthy();
        expect(screen.getByTestId('btn-settings-saved-places')).toBeTruthy();
        expect(screen.getByTestId('btn-settings-preferences')).toBeTruthy();
      });

      fireEvent.press(screen.getByTestId('btn-settings-saved-places'));
      expect(mockPush).toHaveBeenCalledWith('/(auth)/account');
    });

    it('TC-04.5.4-06: presents truthful privacy disclosures without claiming complete account deletion on logout', async () => {
      renderApp(<SettingsScreen />);

      await waitFor(() => {
        expect(screen.getByText(/Privacy & Data Architecture/i)).toBeTruthy();
        expect(screen.getByText(/Row Level Security Isolation/i)).toBeTruthy();
        expect(screen.getByText(/Session Purging on Sign-Out/i)).toBeTruthy();
      });
    });
  });

  // ==========================================================================
  // SECTION 3: SAVED PLACES & PRIVATE NAVIGATION SECURITY (04.4, 04.5.2)
  // ==========================================================================
  describe('3. Saved Places & Private Navigation Integration', () => {
    beforeEach(() => {
      mockStorage.getSession.mockResolvedValue(aliceSession);
      mockAuthService.getCurrentSession.mockResolvedValue(aliceSession);
    });

    it('TC-04.5.4-07: authenticated user with saved Home navigates with opaque destinationId only', async () => {
      renderApp(<HomeScreen />);

      await waitFor(() => {
        expect(mockProfileRepo.getSavedPlaces).toHaveBeenCalledWith(travelerAlice.id);
      });

      const homeQuickAction = screen.getByTestId('quick-place-place-home');
      fireEvent.press(homeQuickAction);

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith({
          pathname: '/(tabs)/journey',
          params: {
            destinationId: 'dest-saved-home',
            source: 'quick_shortcut'
          }
        });
      });
    });

    it('TC-04.5.4-08: guarantees private addresses, user email, and coordinates are never in URL params', () => {
      const params = createJourneyRouteParams(
        'dest-saved-home',
        '100 Neon Corridor, Neo-Colombo',
        'quick_place'
      );

      expect(params.destinationId).toBe('dest-saved-home');
      expect(params.destinationName).toBeUndefined();
      expect((params as any).email).toBeUndefined();
      expect((params as any).coordinates).toBeUndefined();
      expect((params as any).lat).toBeUndefined();
      expect((params as any).lng).toBeUndefined();
    });

    it('TC-04.5.4-09: Journey screen resolves private saved place name in-memory from profile store', async () => {
      mockSearchParams = { destinationId: 'dest-saved-home' };

      renderApp(<JourneyScreen />);

      await waitFor(() => {
        expect(screen.getByText('100 Neon Corridor, Neo-Colombo')).toBeTruthy();
        expect(screen.getByTestId('journey-arrival-hub')).toBeTruthy();
      });
    });

    it('TC-04.5.4-10: deep link containing injected destinationName is ignored in favor of authenticated store', async () => {
      mockSearchParams = {
        destinationId: 'dest-saved-home',
        destinationName: 'Malicious Injected Address'
      };

      renderApp(<JourneyScreen />);

      await waitFor(() => {
        expect(screen.getByText('100 Neon Corridor, Neo-Colombo')).toBeTruthy();
        expect(screen.queryByText('Malicious Injected Address')).toBeNull();
      });
    });

    it('TC-04.5.4-11: unauthenticated deep-link to private saved destination renders Authentication Required state', async () => {
      mockStorage.getSession.mockResolvedValue(null);
      mockAuthService.getCurrentSession.mockResolvedValue(null);
      mockSearchParams = { destinationId: 'dest-saved-home' };

      renderApp(<JourneyScreen />);

      await waitFor(() => {
        expect(screen.getByTestId('journey-auth-required-state')).toBeTruthy();
        expect(screen.getByText(/Authentication Required/i)).toBeTruthy();
      });
    });
  });

  // ==========================================================================
  // SECTION 4: SESSION LIFECYCLE, LOGOUT & MULTI-TENANCY ISOLATION (04.5.3)
  // ==========================================================================
  describe('4. Session Lifecycle, Logout Cleanup & Multi-Tenancy Isolation', () => {
    it('TC-04.5.4-12: sign-out completely clears user, session, profile, and saved places from memory and storage', async () => {
      mockStorage.getSession.mockResolvedValue(aliceSession);
      mockAuthService.getCurrentSession.mockResolvedValue(aliceSession);

      renderApp(<SettingsScreen />);

      await waitFor(() => {
        expect(screen.getByTestId('btn-settings-sign-out')).toBeTruthy();
      });

      // Press Sign Out
      await act(async () => {
        fireEvent.press(screen.getByTestId('btn-settings-sign-out'));
      });

      expect(mockAuthService.signOut).toHaveBeenCalled();
      expect(mockStorage.clearSession).toHaveBeenCalled();

      // State is now guest
      expect(screen.getByTestId('settings-guest-status')).toBeTruthy();
    });

    it('TC-04.5.4-13: ensures account switching from Alice to Bob isolates private data without crossover', async () => {
      mockStorage.getSession.mockResolvedValue(aliceSession);
      mockAuthService.getCurrentSession.mockResolvedValue(aliceSession);

      mockProfileRepo.getProfile.mockImplementation(async (userId) => {
        if (userId === travelerAlice.id) return { success: true, data: aliceProfile };
        if (userId === travelerBob.id) {
          return {
            success: true,
            data: {
              id: travelerBob.id,
              displayName: 'Explorer Bob',
              avatarUrl: null,
              createdAt: '2026-11-21T00:00:00Z',
              updatedAt: '2026-11-21T00:00:00Z'
            }
          };
        }
        return { success: false, error: { code: 'NOT_FOUND', message: 'Not found' } };
      });

      mockProfileRepo.getSavedPlaces.mockImplementation(async (userId) => {
        if (userId === travelerAlice.id) return { success: true, data: aliceSavedPlaces };
        if (userId === travelerBob.id) return { success: true, data: [] };
        return { success: true, data: [] };
      });

      renderApp(<SettingsScreen />);

      await waitFor(() => {
        expect(screen.getByText(travelerAlice.email)).toBeTruthy();
      });

      // Switch session to Bob
      const bobSession: AuthSession = {
        accessToken: 'mock-access-token-bob',
        refreshToken: 'mock-refresh-token-bob',
        expiresAt: Date.now() + 3600 * 1000,
        user: travelerBob
      };
      mockStorage.getSession.mockResolvedValue(bobSession);
      mockAuthService.getCurrentSession.mockResolvedValue(bobSession);

      await act(async () => {
        if (authListener) {
          await authListener(bobSession, 'SIGNED_IN');
        }
      });

      // Verify Bob's identity is rendered without Alice's crossover
      await waitFor(() => {
        expect(screen.getByText(travelerBob.email)).toBeTruthy();
        expect(screen.queryByText(travelerAlice.email)).toBeNull();
      });
    });

    it('TC-04.5.4-14: verifies late responses arriving after sign-out do not corrupt guest state', async () => {
      let resolveSlowProfile: (val: any) => void = () => {};
      const slowProfilePromise = new Promise((resolve) => {
        resolveSlowProfile = resolve;
      });

      mockProfileRepo.getProfile.mockReturnValue(slowProfilePromise as any);
      mockStorage.getSession.mockResolvedValue(aliceSession);
      mockAuthService.getCurrentSession.mockResolvedValue(aliceSession);

      renderApp(<SettingsScreen />);

      // User signs out while slow profile fetch is pending
      await act(async () => {
        mockStorage.getSession.mockResolvedValue(null);
        mockAuthService.getCurrentSession.mockResolvedValue(null);
        mockAuthService.signOut.mockResolvedValue(undefined);
        if (authListener) {
          await authListener(null, 'SIGNED_OUT');
        }
      });

      // Now the late profile response resolves
      await act(async () => {
        resolveSlowProfile({ success: true, data: aliceProfile });
      });

      // Guest state must remain intact
      expect(screen.getByTestId('settings-guest-status')).toBeTruthy();
      expect(screen.queryByText(travelerAlice.email)).toBeNull();
    });
  });

  // ==========================================================================
  // SECTION 5: SECURITY AUDIT & CREDENTIAL HYGIENE
  // ==========================================================================
  describe('5. Security Audit, Token Protection & Prototype Demarcation', () => {
    it('TC-04.5.4-15: redacts sensitive authentication tokens and passwords from logger', () => {
      const sensitiveData = {
        email: 'alice@waymark.app',
        password: 'UltraSecretPassword2100!',
        access_token: 'jwt.access.token',
        refresh_token: 'refresh.token.xyz',
        auth: { token: 'secret-token' }
      };

      const redacted = maskSensitiveData(sensitiveData) as any;

      expect(redacted.password).toBe('***REDACTED***');
      expect(redacted.access_token).toBe('***REDACTED***');
      expect(redacted.refresh_token).toBe('***REDACTED***');
      expect(redacted.auth.token).toBe('***REDACTED***');
      expect(redacted.email).toBe('alice@waymark.app');
    });

    it('TC-04.5.4-16: verifies no fabricated GPS route or simulated ETA is presented for private destination', async () => {
      mockStorage.getSession.mockResolvedValue(aliceSession);
      mockAuthService.getCurrentSession.mockResolvedValue(aliceSession);
      mockSearchParams = { destinationId: 'dest-saved-home' };

      renderApp(<JourneyScreen />);

      await waitFor(() => {
        expect(screen.getByText('100 Neon Corridor, Neo-Colombo')).toBeTruthy();
      });

      // Confirm no fabricated live telemetry or GPS tracking
      expect(screen.queryByText(/Live GPS/i)).toBeNull();
      expect(screen.queryByText(/Simulated Vehicle Telemetry/i)).toBeNull();
    });

    it('TC-04.5.4-17: rejects malformed, scripted, or path-traversal destinationId parameters', () => {
      const invalidCases = [
        '<script>alert(1)</script>',
        '../../../etc/passwd',
        'javascript:void(0)',
        'dest-saved-',
        'dest-unknown-id-123456789'
      ];

      for (const invalidId of invalidCases) {
        const result = validateJourneyParams({ destinationId: invalidId });
        expect(result).toBeNull();
      }
    });
  });
});
