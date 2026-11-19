import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { useLocalSearchParams } from 'expo-router';
import HomeScreen from '../../../../app/(tabs)/index';
import JourneyScreen from '../../../../app/(tabs)/journey';
import {
  validateJourneyParams,
  createJourneyRouteParams,
  ALLOWED_JOURNEY_DESTINATIONS,
  MAX_PARAM_STRING_LENGTH
} from '../actions/journeyParams';

const mockPush = jest.fn();
const mockRouter = {
  push: mockPush,
  replace: jest.fn(),
  back: jest.fn(),
  canGoBack: jest.fn(() => true)
};

let mockSearchParams: Record<string, string> = {};

jest.mock('expo-router', () => ({
  useRouter: () => mockRouter,
  useLocalSearchParams: () => mockSearchParams,
  usePathname: () => '/journey',
  useSegments: () => ['(tabs)', 'journey']
}));

describe('Feature 03.3 — Contextual Journey Navigation (Task 3.3.3)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSearchParams = {};
  });

  describe('Journey Parameter Safety & Allowlist Validation', () => {
    it('validates all allowlisted sample destinations correctly', () => {
      const kandy = validateJourneyParams({ destinationId: 'dest-kandy' });
      expect(kandy).not.toBeNull();
      expect(kandy?.id).toBe('dest-kandy');
      expect(kandy?.name).toBe('Kandy City Centre');
      expect(kandy?.hubId).toBe('hub-kandy-central');
      expect(kandy?.suggestedModes).toEqual(['maglev', 'bus']);
      expect(kandy?.isSample).toBe(true);

      const colombo = validateJourneyParams({ destinationId: 'dest-colombo' });
      expect(colombo?.name).toBe('Colombo Fort Central');
      expect(colombo?.hubId).toBe('hub-colombo-fort');

      const airport = validateJourneyParams({ destinationId: 'dest-airport' });
      expect(airport?.name).toBe('Bandaranaike Skyport');
      expect(airport?.hubId).toBe('hub-bia-skyport');
      expect(airport?.suggestedModes).toContain('air');

      const suggested = validateJourneyParams({
        destinationId: 'suggested-kdu-kandy'
      });
      expect(suggested?.name).toBe('KDU Gate → Kandy City');
      expect(suggested?.suggestedModes).toEqual(['walk', 'bus', 'air']);
    });

    it('validates user-saved destinations with safe names', () => {
      const savedHome = validateJourneyParams({
        destinationId: 'dest-saved-home',
        destinationName: '42, Temple Road, Jaffna'
      });
      expect(savedHome).not.toBeNull();
      expect(savedHome?.id).toBe('dest-saved-home');
      expect(savedHome?.name).toBe('42, Temple Road, Jaffna');
      expect(savedHome?.isSample).toBe(false);
    });

    it('rejects unknown or unlisted destination IDs', () => {
      expect(validateJourneyParams({ destinationId: 'dest-unknown-node' })).toBeNull();
      expect(validateJourneyParams({ destinationId: 'random-string' })).toBeNull();
    });

    it('rejects oversized parameter strings exceeding maximum length', () => {
      const oversizedId = 'dest-kandy'.padEnd(MAX_PARAM_STRING_LENGTH + 10, 'x');
      expect(validateJourneyParams({ destinationId: oversizedId })).toBeNull();

      const oversizedName = 'Valid Home'.padEnd(MAX_PARAM_STRING_LENGTH + 10, 'y');
      expect(
        validateJourneyParams({
          destinationId: 'dest-saved-home',
          destinationName: oversizedName
        })
      ).toBeNull();
    });

    it('rejects malicious injection attempts, XSS patterns, and URL schemes', () => {
      expect(
        validateJourneyParams({ destinationId: '<script>alert(1)</script>' })
      ).toBeNull();
      expect(
        validateJourneyParams({ destinationId: 'javascript:alert(1)' })
      ).toBeNull();
      expect(
        validateJourneyParams({ destinationId: 'https://evil.com/phishing' })
      ).toBeNull();
      expect(
        validateJourneyParams({ destinationId: 'dest-kandy/../secret' })
      ).toBeNull();
      expect(
        validateJourneyParams({
          destinationId: 'dest-saved-home',
          destinationName: '<img src=x onerror=alert(1)>'
        })
      ).toBeNull();
    });

    it('gracefully handles missing, empty, or non-object parameters', () => {
      expect(validateJourneyParams(null)).toBeNull();
      expect(validateJourneyParams(undefined)).toBeNull();
      expect(validateJourneyParams({})).toBeNull();
      expect(validateJourneyParams({ destinationId: '' })).toBeNull();
      expect(validateJourneyParams({ destinationId: '   ' })).toBeNull();
      expect(validateJourneyParams('dest-kandy')).toBeNull();
      expect(validateJourneyParams(12345)).toBeNull();
    });

    it('creates formatted route params with createJourneyRouteParams', () => {
      const params = createJourneyRouteParams('dest-kandy', 'Kandy City Centre');
      expect(params).toEqual({
        destinationId: 'dest-kandy',
        destinationName: 'Kandy City Centre',
        source: 'quick_shortcut'
      });
    });
  });

  describe('JourneyScreen Contextual Presentation', () => {
    it('renders default empty state timeline when no route parameters are present', () => {
      mockSearchParams = {};

      render(<JourneyScreen />);

      expect(screen.getByTestId('journey-default-empty-state')).toBeTruthy();
      expect(screen.getByText('Active Journey Timeline')).toBeTruthy();
      expect(
        screen.queryByTestId('journey-selected-destination-card')
      ).toBeNull();
    });

    it('renders default empty state when route parameters are invalid or unsupported', () => {
      mockSearchParams = {
        destinationId: 'dest-invalid-corridor',
        destinationName: 'Nonexistent Hub'
      };

      render(<JourneyScreen />);

      expect(screen.getByTestId('journey-default-empty-state')).toBeTruthy();
      expect(
        screen.queryByTestId('journey-selected-destination-card')
      ).toBeNull();
    });

    it('renders selected destination summary card when valid destination context is provided', () => {
      mockSearchParams = {
        destinationId: 'dest-kandy',
        destinationName: 'Kandy City Centre'
      };

      render(<JourneyScreen />);

      // Should render the selected destination card
      expect(
        screen.getByTestId('journey-selected-destination-card')
      ).toBeTruthy();
      expect(screen.getByTestId('journey-destination-title')).toBeTruthy();
      expect(screen.getByText('Kandy City Centre')).toBeTruthy();

      // Should render arrival hub
      expect(
        screen.getByText('ARRIVAL HUB: Kandy Central Maglev Terminal')
      ).toBeTruthy();

      // Should render suggested transit modes
      expect(screen.getByText('MAGLEV')).toBeTruthy();
      expect(screen.getByText('BUS')).toBeTruthy();

      // Should render sample telemetry demarcation banner
      expect(
        screen.getByText(
          'SIMULATED DESTINATION CONTEXT · LIVE ITINERARY IN FEATURE 05'
        )
      ).toBeTruthy();

      // Should render operational disclaimer
      expect(
        screen.getByTestId('journey-operational-disclaimer')
      ).toBeTruthy();

      // Default empty state should NOT be rendered
      expect(screen.queryByTestId('journey-default-empty-state')).toBeNull();
    });

    it('allows clearing destination selection to return to default timeline view', () => {
      mockSearchParams = {
        destinationId: 'dest-colombo',
        destinationName: 'Colombo Fort Central'
      };

      render(<JourneyScreen />);

      expect(
        screen.getByTestId('journey-selected-destination-card')
      ).toBeTruthy();

      // Click clear button
      const clearBtn = screen.getByTestId('journey-clear-destination');
      fireEvent.press(clearBtn);

      // Now card is dismissed and default empty state is visible
      expect(
        screen.queryByTestId('journey-selected-destination-card')
      ).toBeNull();
      expect(screen.getByTestId('journey-default-empty-state')).toBeTruthy();
    });

    it('allows navigating back to Home from the destination card', () => {
      mockSearchParams = {
        destinationId: 'dest-airport',
        destinationName: 'Bandaranaike Skyport'
      };

      render(<JourneyScreen />);

      const returnHomeBtn = screen.getByTestId('journey-return-home');
      fireEvent.press(returnHomeBtn);

      expect(mockPush).toHaveBeenCalledWith('/(tabs)');
    });
  });

  describe('Home-to-Journey Navigation Handoff', () => {
    it('passes structured destination parameters when quick destination is tapped', () => {
      render(<HomeScreen />);

      const kandyChip = screen.getByTestId('quick-place-place-kandy');
      fireEvent.press(kandyChip);

      expect(mockPush).toHaveBeenCalledTimes(1);
      expect(mockPush).toHaveBeenCalledWith(
        expect.objectContaining({
          pathname: '/(tabs)/journey',
          params: expect.objectContaining({
            destinationId: 'dest-kandy',
            destinationName: 'Kandy City Centre',
            source: 'quick_shortcut'
          })
        })
      );
    });

    it('passes structured route parameters when suggested corridor CTA is tapped', () => {
      render(<HomeScreen />);

      const suggestionAction = screen.getByTestId('home-suggestion-action');
      fireEvent.press(suggestionAction);

      expect(mockPush).toHaveBeenCalledTimes(1);
      expect(mockPush).toHaveBeenCalledWith(
        expect.objectContaining({
          pathname: '/(tabs)/journey',
          params: expect.objectContaining({
            destinationId: 'suggested-kdu-kandy',
            destinationName: 'KDU Gate → Kandy City',
            source: 'suggested_corridor'
          })
        })
      );
    });
  });
});
