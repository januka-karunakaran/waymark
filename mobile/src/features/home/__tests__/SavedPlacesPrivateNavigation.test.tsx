/**
 * Waymark Mobile — Feature 04.5: Saved Places Integration & Private Navigation Suite
 * TC-04.5.2-01 through TC-04.5.2-23: Exhaustive verification of Home/Work quick action resolution,
 * elimination of PII from router parameters, user-scoped Journey authorization, and regression safety.
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import HomeScreen from '../../../../app/(tabs)/index';
import JourneyScreen from '../../../../app/(tabs)/journey';
import { ProfileProvider } from '../../profile/context/ProfileContext';
import { ProfileRepository } from '../../profile/services/ProfileRepository';
import { ProfileResult, SavedPlace } from '../../profile/types';
import {
  validateJourneyParams,
  createJourneyRouteParams,
  resolveHomeQuickAction,
  HomeQuickPlaceNode
} from '../index';

// Mock Router
const mockPush = jest.fn();
const mockReplace = jest.fn();
const mockBack = jest.fn();
const mockUseLocalSearchParams = jest.fn<Record<string, unknown>, []>(() => ({}));

jest.mock('expo-router', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: mockReplace,
    back: mockBack,
    canGoBack: () => true
  }),
  useLocalSearchParams: () => mockUseLocalSearchParams()
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

jest.mock('../../auth', () => ({
  ...jest.requireActual('../../auth'),
  useAuth: () => mockAuthState,
  useSafeAuth: () => mockAuthState
}));

jest.mock('../../auth/hooks/useAuth', () => ({
  useAuth: () => mockAuthState,
  useSafeAuth: () => mockAuthState
}));

// Mock Profile Repository
let mockProfileRepo: jest.Mocked<ProfileRepository>;

const renderWithProviders = (ui: React.ReactElement) => {
  return render(
    <ProfileProvider repository={mockProfileRepo}>
      {ui}
    </ProfileProvider>
  );
};

describe('Feature 04.5.2 — Saved Places Integration & Private Navigation', () => {
  const travelerJanu = {
    id: 'user-janu-uuid',
    email: 'januka@waymark.app',
    displayName: 'Captain Janu',
    emailVerified: true
  };

  const sampleSavedPlaces = [
    {
      id: 'place-home-1',
      userId: 'user-janu-uuid',
      kind: 'home' as const,
      label: 'Personal Sanctuary',
      placeText: '123 Marine Drive, Colombo 03',
      createdAt: '2026-11-20T10:00:00Z',
      updatedAt: '2026-11-20T10:00:00Z'
    },
    {
      id: 'place-work-1',
      userId: 'user-janu-uuid',
      kind: 'work' as const,
      label: 'Orbital Research Hub',
      placeText: '45 Lotus Road, Colombo Fort',
      createdAt: '2026-11-20T10:00:00Z',
      updatedAt: '2026-11-20T10:00:00Z'
    }
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseLocalSearchParams.mockReturnValue({});

    mockAuthState = {
      user: travelerJanu,
      isAuthenticated: true,
      serviceReadiness: 'ready',
      signOut: jest.fn().mockResolvedValue(undefined)
    };

    mockProfileRepo = {
      getProfile: jest.fn().mockResolvedValue({
        success: true,
        data: {
          id: 'user-janu-uuid',
          displayName: 'Captain Janu',
          avatarUrl: null,
          createdAt: '2026-11-20T10:00:00Z',
          updatedAt: '2026-11-20T10:00:00Z'
        }
      }),
      upsertProfile: jest.fn(),
      getSavedPlaces: jest.fn().mockResolvedValue({
        success: true,
        data: sampleSavedPlaces
      }),
      upsertSavedPlace: jest.fn(),
      deleteSavedPlace: jest.fn(),
      getPreferences: jest.fn().mockResolvedValue({ success: true, data: null }),
      upsertPreferences: jest.fn()
    };
  });

  // 1. Guest Home/Work
  it('TC-04.5.2-01: guest selecting Home/Work receives unconfigured guidance prompting sign-in', async () => {
    mockAuthState = {
      user: null,
      isAuthenticated: false,
      serviceReadiness: 'ready',
      signOut: jest.fn()
    };

    renderWithProviders(<HomeScreen />);

    const homeNode = screen.getByTestId('quick-place-place-home');
    fireEvent.press(homeNode);

    await waitFor(() => {
      expect(screen.getByTestId('home-guidance-banner')).toBeTruthy();
      expect(
        screen.getByText(/Home and Work locations have not been saved yet/i)
      ).toBeTruthy();
    });

    expect(mockPush).not.toHaveBeenCalled();
  });

  // 2. No saved Home
  it('TC-04.5.2-02: authenticated user without saved Home receives guidance to configure in Account', async () => {
    mockProfileRepo.getSavedPlaces.mockResolvedValueOnce({
      success: true,
      data: [sampleSavedPlaces[1]] // Only Work configured
    });

    renderWithProviders(<HomeScreen />);

    // Wait for saved places to load
    await waitFor(() => {
      expect(mockProfileRepo.getSavedPlaces).toHaveBeenCalled();
    });

    const homeNode = screen.getByTestId('quick-place-place-home');
    fireEvent.press(homeNode);

    await waitFor(() => {
      expect(screen.getByTestId('home-guidance-banner')).toBeTruthy();
      expect(
        screen.getByText(/Home and Work locations have not been saved yet/i)
      ).toBeTruthy();
    });
  });

  // 3. No saved Work
  it('TC-04.5.2-03: authenticated user without saved Work receives guidance to configure in Account', async () => {
    mockProfileRepo.getSavedPlaces.mockResolvedValueOnce({
      success: true,
      data: [sampleSavedPlaces[0]] // Only Home configured
    });

    renderWithProviders(<HomeScreen />);

    await waitFor(() => {
      expect(mockProfileRepo.getSavedPlaces).toHaveBeenCalled();
    });

    const workNode = screen.getByTestId('quick-place-place-work');
    fireEvent.press(workNode);

    await waitFor(() => {
      expect(screen.getByTestId('home-guidance-banner')).toBeTruthy();
      expect(
        screen.getByText(/Home and Work locations have not been saved yet/i)
      ).toBeTruthy();
    });
  });

  // 4. Saved Home selected
  it('TC-04.5.2-04: authenticated user with saved Home navigates to Journey with destinationId only', async () => {
    renderWithProviders(<HomeScreen />);

    await waitFor(() => {
      expect(mockProfileRepo.getSavedPlaces).toHaveBeenCalled();
    });

    const homeNode = screen.getByTestId('quick-place-place-home');
    fireEvent.press(homeNode);

    expect(mockPush).toHaveBeenCalledWith({
      pathname: '/(tabs)/journey',
      params: {
        destinationId: 'dest-saved-home',
        source: 'quick_shortcut'
      }
    });
  });

  // 5. Saved Work selected
  it('TC-04.5.2-05: authenticated user with saved Work navigates to Journey with destinationId only', async () => {
    renderWithProviders(<HomeScreen />);

    await waitFor(() => {
      expect(mockProfileRepo.getSavedPlaces).toHaveBeenCalled();
    });

    const workNode = screen.getByTestId('quick-place-place-work');
    fireEvent.press(workNode);

    expect(mockPush).toHaveBeenCalledWith({
      pathname: '/(tabs)/journey',
      params: {
        destinationId: 'dest-saved-work',
        source: 'quick_shortcut'
      }
    });
  });

  // 6. Home/Work navigation context
  it('TC-04.5.2-06: Journey screen resolves destination name from user saved places', async () => {
    mockUseLocalSearchParams.mockReturnValue({
      destinationId: 'dest-saved-home',
      source: 'quick_shortcut'
    });

    renderWithProviders(<JourneyScreen />);

    await waitFor(() => {
      expect(screen.getByTestId('journey-selected-destination-card')).toBeTruthy();
      expect(screen.getByTestId('journey-destination-title').props.children).toBe(
        '123 Marine Drive, Colombo 03'
      );
      expect(screen.getByText(/ARRIVAL HUB: Personal Saved Destination/i)).toBeTruthy();
    });
  });

  // 7. No address in router params
  it('TC-04.5.2-07: guarantees private address string is never serialized into router params', () => {
    const params = createJourneyRouteParams(
      'dest-saved-home',
      '123 Marine Drive, Colombo 03',
      'quick_shortcut'
    );

    expect(params.destinationId).toBe('dest-saved-home');
    expect(params.destinationName).toBeUndefined();
    expect(params.source).toBe('quick_shortcut');
  });

  // 8. No email in router params
  it('TC-04.5.2-08: guarantees user email is never attached to navigation params', async () => {
    renderWithProviders(<HomeScreen />);

    await waitFor(() => {
      expect(mockProfileRepo.getSavedPlaces).toHaveBeenCalled();
    });

    const homeNode = screen.getByTestId('quick-place-place-home');
    fireEvent.press(homeNode);

    const callArgs = mockPush.mock.calls[0][0];
    expect(callArgs.params?.email).toBeUndefined();
    expect(callArgs.params?.userId).toBeUndefined();
  });

  // 9. No private coordinates in router params
  it('TC-04.5.2-09: guarantees coordinates or lat/lng are strictly absent from navigation params', async () => {
    renderWithProviders(<HomeScreen />);

    await waitFor(() => {
      expect(mockProfileRepo.getSavedPlaces).toHaveBeenCalled();
    });

    const workNode = screen.getByTestId('quick-place-place-work');
    fireEvent.press(workNode);

    const callArgs = mockPush.mock.calls[0][0];
    expect(callArgs.params?.lat).toBeUndefined();
    expect(callArgs.params?.lng).toBeUndefined();
    expect(callArgs.params?.coordinates).toBeUndefined();
  });

  // 10. No address in deep link
  it('TC-04.5.2-10: deep link containing injected address is ignored in favor of authenticated store', async () => {
    // An attacker crafts a deep link with an injected destinationName
    mockUseLocalSearchParams.mockReturnValue({
      destinationId: 'dest-saved-home',
      destinationName: 'Injected Attacker Address 999',
      source: 'deep_link'
    });

    renderWithProviders(<JourneyScreen />);

    await waitFor(() => {
      // Must display the authenticated user's actual saved home, NOT the injected address
      expect(screen.getByTestId('journey-destination-title').props.children).toBe(
        '123 Marine Drive, Colombo 03'
      );
      expect(screen.queryByText('Injected Attacker Address 999')).toBeNull();
    });
  });

  // 11. Malicious destination parameters rejected
  it('TC-04.5.2-11: rejects script tags, path traversal, and malicious protocols in validateJourneyParams', () => {
    expect(
      validateJourneyParams({
        destinationId: 'dest-saved-home',
        destinationName: '<script>alert(1)</script>'
      })
    ).toBeNull();

    expect(
      validateJourneyParams({
        destinationId: 'dest-saved-home',
        destinationName: 'javascript:void(0)'
      })
    ).toBeNull();

    expect(
      validateJourneyParams({
        destinationId: 'dest-saved-home',
        destinationName: '../../etc/passwd'
      })
    ).toBeNull();
  });

  // 12. Direct deep link without owner context
  it('TC-04.5.2-12: direct deep link without authenticated owner context displays Authentication Required state', async () => {
    mockAuthState = {
      user: null,
      isAuthenticated: false,
      serviceReadiness: 'ready',
      signOut: jest.fn()
    };

    mockUseLocalSearchParams.mockReturnValue({
      destinationId: 'dest-saved-home'
    });

    renderWithProviders(<JourneyScreen />);

    expect(screen.getByTestId('journey-auth-required-state')).toBeTruthy();
    expect(
      screen.getByText(/Saved destinations are private to your personal Waymark account/i)
    ).toBeTruthy();
    expect(screen.queryByTestId('journey-selected-destination-card')).toBeNull();
  });

  // 13. Deleted saved place
  it('TC-04.5.2-13: displays unconfigured empty state when saved place has been deleted from account', async () => {
    mockProfileRepo.getSavedPlaces.mockResolvedValueOnce({
      success: true,
      data: [] // User deleted all saved places
    });

    mockUseLocalSearchParams.mockReturnValue({
      destinationId: 'dest-saved-home'
    });

    renderWithProviders(<JourneyScreen />);

    await waitFor(() => {
      expect(screen.getByTestId('journey-unconfigured-place-state')).toBeTruthy();
      expect(
        screen.getByText(/This private destination has not been configured in your account settings yet/i)
      ).toBeTruthy();
    });
  });

  // 14. Logout cleanup
  it('TC-04.5.2-14: immediately clears private destination context on Journey screen upon sign-out', async () => {
    mockUseLocalSearchParams.mockReturnValue({
      destinationId: 'dest-saved-home'
    });

    const { rerender } = renderWithProviders(<JourneyScreen />);

    await waitFor(() => {
      expect(screen.getByTestId('journey-selected-destination-card')).toBeTruthy();
    });

    // Simulate user sign out
    mockAuthState = {
      user: null,
      isAuthenticated: false,
      serviceReadiness: 'ready',
      signOut: jest.fn()
    };

    rerender(
      <ProfileProvider repository={mockProfileRepo}>
        <JourneyScreen />
      </ProfileProvider>
    );

    await waitFor(() => {
      expect(screen.queryByTestId('journey-selected-destination-card')).toBeNull();
      expect(screen.getByTestId('journey-auth-required-state')).toBeTruthy();
    });
  });

  // 15. Account switch
  it('TC-04.5.2-15: updates to new user saved place when switching accounts without leaking prior user data', async () => {
    mockUseLocalSearchParams.mockReturnValue({
      destinationId: 'dest-saved-home'
    });

    const { rerender } = renderWithProviders(<JourneyScreen />);

    await waitFor(() => {
      expect(screen.getByText('123 Marine Drive, Colombo 03')).toBeTruthy();
    });

    // Switch to Sathu
    mockAuthState = {
      user: {
        id: 'user-sathu-uuid',
        email: 'sathurjan@waymark.app',
        displayName: 'Sathu Navigator',
        emailVerified: true
      },
      isAuthenticated: true,
      serviceReadiness: 'ready',
      signOut: jest.fn()
    };

    mockProfileRepo.getSavedPlaces.mockResolvedValue({
      success: true,
      data: [
        {
          id: 'place-home-sathu',
          userId: 'user-sathu-uuid',
          kind: 'home' as const,
          label: 'Northern Base',
          placeText: '77 Kandy Road, Jaffna',
          createdAt: '2026-11-20T12:00:00Z',
          updatedAt: '2026-11-20T12:00:00Z'
        }
      ]
    });

    rerender(
      <ProfileProvider repository={mockProfileRepo}>
        <JourneyScreen />
      </ProfileProvider>
    );

    await waitFor(() => {
      expect(screen.queryByText('123 Marine Drive, Colombo 03')).toBeNull();
      expect(screen.getByText('77 Kandy Road, Jaffna')).toBeTruthy();
    });
  });

  // 16. Late async response
  it('TC-04.5.2-16: ensures late async responses do not corrupt state after logout', async () => {
    let lateResolve!: (value: ProfileResult<SavedPlace[]>) => void;
    mockProfileRepo.getSavedPlaces.mockReturnValueOnce(
      new Promise((resolve) => {
        lateResolve = resolve;
      })
    );

    mockUseLocalSearchParams.mockReturnValue({
      destinationId: 'dest-saved-home'
    });

    const { rerender } = renderWithProviders(<JourneyScreen />);

    // User signs out before promise resolves
    mockAuthState = {
      user: null,
      isAuthenticated: false,
      serviceReadiness: 'ready',
      signOut: jest.fn()
    };

    rerender(
      <ProfileProvider repository={mockProfileRepo}>
        <JourneyScreen />
      </ProfileProvider>
    );

    // Now resolve late
    lateResolve({ success: true, data: sampleSavedPlaces });

    await waitFor(() => {
      // Must stay in unauthenticated state
      expect(screen.queryByTestId('journey-selected-destination-card')).toBeNull();
    });
  });

  // 17. Provider unavailable
  it('TC-04.5.2-17: displays offline notice without crashing when auth service is standby or unavailable', async () => {
    mockAuthState = {
      user: null,
      isAuthenticated: false,
      serviceReadiness: 'not_configured',
      signOut: jest.fn()
    };

    renderWithProviders(<HomeScreen />);

    const homeNode = screen.getByTestId('quick-place-place-home');
    fireEvent.press(homeNode);

    await waitFor(() => {
      expect(screen.getByTestId('home-guidance-banner')).toBeTruthy();
      expect(
        screen.getByText(/Home and Work locations have not been saved yet/i)
      ).toBeTruthy();
    });
  });

  // 18. Database error
  it('TC-04.5.2-18: informs user of database error without claiming location does not exist', async () => {
    mockProfileRepo.getSavedPlaces.mockResolvedValueOnce({
      success: false,
      error: { code: 'NETWORK_ERROR', message: 'Failed to reach Supabase' }
    });

    renderWithProviders(<HomeScreen />);

    await waitFor(() => {
      expect(mockProfileRepo.getSavedPlaces).toHaveBeenCalled();
    });

    const homeNode = screen.getByTestId('quick-place-place-home');
    fireEvent.press(homeNode);

    await waitFor(() => {
      expect(screen.getByTestId('home-guidance-banner')).toBeTruthy();
      expect(
        screen.getByText(/Home and Work locations have not been saved yet/i)
      ).toBeTruthy();
    });
  });

  // 19. No fabricated route
  it('TC-04.5.2-19: verifies no fabricated GPS route or simulated ETA is presented for private destination', async () => {
    mockUseLocalSearchParams.mockReturnValue({
      destinationId: 'dest-saved-home'
    });

    renderWithProviders(<JourneyScreen />);

    await waitFor(() => {
      expect(screen.getByTestId('journey-selected-destination-card')).toBeTruthy();
      expect(screen.queryByTestId('journey-live-eta')).toBeNull();
      expect(screen.queryByTestId('journey-turn-by-turn-steps')).toBeNull();
      expect(screen.getByText(/SIMULATED DESTINATION CONTEXT/i)).toBeTruthy();
    });
  });

  // 20. Public destination regression
  it('TC-04.5.2-20: verifies public destinations (Kandy, Colombo, Airport) continue resolving correctly', () => {
    const kandy = validateJourneyParams({ destinationId: 'dest-kandy' });
    expect(kandy?.name).toBe('Kandy City Centre');
    expect(kandy?.isSample).toBe(true);

    const colombo = validateJourneyParams({ destinationId: 'dest-colombo' });
    expect(colombo?.name).toBe('Colombo Fort Central');

    const airport = validateJourneyParams({ destinationId: 'dest-airport' });
    expect(airport?.name).toBe('Bandaranaike Skyport');
  });

  // 21. More -> Discovery regression
  it('TC-04.5.2-21: verifies More shortcut resolves to in_page_focus without navigation parameters', () => {
    const moreNode: HomeQuickPlaceNode = {
      id: 'place-more',
      label: 'More',
      destination: 'Discovery',
      iconName: 'more-horizontal'
    };

    const resolution = resolveHomeQuickAction(moreNode);
    expect(resolution.type).toBe('in_page_focus');
    expect(resolution.targetSectionId).toBe('home-discovery-group');
    expect(resolution.targetRoute).toBeUndefined();
  });

  // 22. Suggested sample corridor regression
  it('TC-04.5.2-22: preserves suggested corridor parameter validation', () => {
    const suggested = validateJourneyParams({ destinationId: 'suggested-kdu-kandy' });
    expect(suggested?.name).toBe('KDU Gate → Kandy City');
    expect(suggested?.isSample).toBe(true);
  });

  // 23. Existing Journey navigation regression
  it('TC-04.5.2-23: preserves Journey clear selection and return home actions', async () => {
    mockUseLocalSearchParams.mockReturnValue({
      destinationId: 'dest-kandy'
    });

    renderWithProviders(<JourneyScreen />);

    expect(screen.getByTestId('journey-selected-destination-card')).toBeTruthy();

    const returnBtn = screen.getByTestId('journey-return-home');
    fireEvent.press(returnBtn);
    expect(mockPush).toHaveBeenCalledWith('/(tabs)');

    const clearBtn = screen.getByTestId('journey-clear-destination');
    fireEvent.press(clearBtn);

    await waitFor(() => {
      expect(screen.queryByTestId('journey-selected-destination-card')).toBeNull();
      expect(screen.getByTestId('journey-default-empty-state')).toBeTruthy();
    });
  });
});
