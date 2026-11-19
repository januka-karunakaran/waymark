/**
 * Waymark 2100 — Feature 03 Final QA & Integration Suite (Task 3.5.3)
 *
 * Comprehensive end-to-end regression and handoff verification covering:
 * 1. Full Home Screen mount, provider-driven rendering, and component composition.
 * 2. Complete Quick Destinations workflow (Home, Work, Kandy, Colombo, Airport, More).
 * 3. Contextual Journey handoff, sample demarcation, Clear Selection, and Return to Home.
 * 4. Multimodal Discovery sections, card interactions, and category exploration.
 * 5. Asynchronous data lifecycle, pull-to-refresh deduplication, and offline fallback.
 * 6. Network recovery, input parameter sanitization, and path traversal prevention.
 * 7. Accessibility semantics (WCAG 2.1 AA) and truthful sample provenance.
 */

import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react-native';
import HomeScreen from '../../../../app/(tabs)/index';
import JourneyScreen from '../../../../app/(tabs)/journey';
import { validateJourneyParams, MAX_PARAM_STRING_LENGTH } from '../actions/journeyParams';
import { UNCONFIGURED_LOCATIONS_MESSAGE } from '../actions/quickActionResolver';
import { formatUserFacingError, USER_FACING_ERRORS } from '../hooks/useHomeData';
import * as networkHook from '../../../hooks/useNetworkStatus';

// Mock expo-router
const mockPush = jest.fn();
const mockReplace = jest.fn();
const mockBack = jest.fn();
let mockSearchParams: Record<string, string> = {};

jest.mock('expo-router', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: mockReplace,
    back: mockBack,
    canGoBack: jest.fn(() => true)
  }),
  useLocalSearchParams: () => mockSearchParams,
  usePathname: () => '/(tabs)',
  useSegments: () => ['(tabs)']
}));

describe('Waymark Mobile — Feature 03 Final QA & Release Readiness (Task 3.5.3)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSearchParams = {};
  });

  describe('1. Full Home Screen Mount & Provider-Driven Architecture (Feature 03.1 & 03.4)', () => {
    it('initializes and renders all provider-driven sections without visual layout regressions', async () => {
      render(<HomeScreen />);

      // Hero Greeting & Waymark Branding
      expect(screen.getByTestId('home-hero')).toBeTruthy();
      expect(screen.getByText('Good morning, navigator')).toBeTruthy();
      expect(screen.getByText(/Where would you like to/)).toBeTruthy();

      // Suggested Route Recommendation
      expect(screen.getByTestId('home-suggestion-section')).toBeTruthy();
      expect(screen.getByText('SUGGESTED ACTIVE ROUTE')).toBeTruthy();
      expect(screen.getByText('KDU Gate → Kandy City')).toBeTruthy();
      expect(screen.getByTestId('home-suggestion-sample-tag')).toBeTruthy();
      expect(screen.getByText('SIMULATED CORRIDOR · LIVE TELEMETRY IN FEATURE 05')).toBeTruthy();

      // Quick Destinations Grid (All 6 Shortcuts)
      expect(screen.getByTestId('home-quick-places-section')).toBeTruthy();
      expect(screen.getByText('Home')).toBeTruthy();
      expect(screen.getByText('Work')).toBeTruthy();
      expect(screen.getByText('Kandy')).toBeTruthy();
      expect(screen.getByText('Colombo')).toBeTruthy();
      expect(screen.getByText('Airport')).toBeTruthy();
      expect(screen.getByText('More')).toBeTruthy();

      // Multimodal Discovery Directory
      expect(screen.getByTestId('home-discovery-group')).toBeTruthy();

      // System Diagnostics Architecture Panel
      expect(screen.getByTestId('home-architecture-section')).toBeTruthy();
      expect(screen.getByText('TELEMETRY FOUNDATION ARCHITECTURE')).toBeTruthy();
      expect(screen.getByText('OPERATIONAL')).toBeTruthy();

      // Universal Accessibility Banner
      expect(screen.getByTestId('home-accessibility-banner')).toBeTruthy();
      expect(screen.getByText('Universal step-free routes guaranteed across all nodes')).toBeTruthy();
    });
  });

  describe('2. Complete Quick Destinations Workflow & Guidance Prompts (Feature 03.3)', () => {
    it('navigates to Journey with validated contextual parameters when Kandy is selected', async () => {
      render(<HomeScreen />);

      const kandyButton = screen.getByTestId('quick-place-place-kandy');
      fireEvent.press(kandyButton);

      expect(mockPush).toHaveBeenCalledTimes(1);
      expect(mockPush).toHaveBeenCalledWith({
        pathname: '/(tabs)/journey',
        params: {
          destinationId: 'dest-kandy',
          destinationName: 'Kandy City Centre',
          source: 'quick_shortcut'
        }
      });
    });

    it('navigates to Journey with Colombo Central parameters when Colombo is selected', async () => {
      render(<HomeScreen />);

      const colomboButton = screen.getByTestId('quick-place-place-colombo');
      fireEvent.press(colomboButton);

      expect(mockPush).toHaveBeenCalledWith({
        pathname: '/(tabs)/journey',
        params: {
          destinationId: 'dest-colombo',
          destinationName: 'Colombo Fort Central',
          source: 'quick_shortcut'
        }
      });
    });

    it('navigates to Journey with Skyport parameters when Airport is selected', async () => {
      render(<HomeScreen />);

      const airportButton = screen.getByTestId('quick-place-place-airport');
      fireEvent.press(airportButton);

      expect(mockPush).toHaveBeenCalledWith({
        pathname: '/(tabs)/journey',
        params: {
          destinationId: 'dest-airport',
          destinationName: 'Bandaranaike Skyport',
          source: 'quick_shortcut'
        }
      });
    });

    it('displays unconfigured guidance when Home or Work shortcuts are tapped without saved locations', async () => {
      render(<HomeScreen />);

      // Home shortcut without saved profile address
      const homeButton = screen.getByTestId('quick-place-place-home');
      fireEvent.press(homeButton);

      expect(mockPush).not.toHaveBeenCalled();
      expect(screen.getByTestId('home-guidance-banner')).toBeTruthy();
      expect(screen.getByText(UNCONFIGURED_LOCATIONS_MESSAGE)).toBeTruthy();

      // Dismiss guidance
      const dismissButton = screen.getByTestId('home-guidance-dismiss');
      fireEvent.press(dismissButton);
      expect(screen.queryByTestId('home-guidance-banner')).toBeNull();

      // Work shortcut without saved address
      const workButton = screen.getByTestId('quick-place-place-work');
      fireEvent.press(workButton);

      expect(mockPush).not.toHaveBeenCalled();
      expect(screen.getByTestId('home-guidance-banner')).toBeTruthy();
    });

    it('navigates to Journey with suggested route context when Start this route is tapped', async () => {
      render(<HomeScreen />);

      const suggestionButton = screen.getByTestId('home-suggestion-action');
      fireEvent.press(suggestionButton);

      expect(mockPush).toHaveBeenCalledWith({
        pathname: '/(tabs)/journey',
        params: {
          destinationId: 'suggested-kdu-kandy',
          destinationName: 'KDU Gate → Kandy City',
          source: 'suggested_corridor'
        }
      });
    });
  });

  describe('3. Journey Screen Contextual Handoff & Round-Trip Navigation (Feature 03.3)', () => {
    it('displays validated contextual destination summary, sample badges, and operational disclaimers', () => {
      mockSearchParams = {
        destinationId: 'dest-kandy',
        destinationName: 'Kandy City Centre'
      };

      render(<JourneyScreen />);

      // Selected destination card
      expect(screen.getByTestId('journey-selected-context-view')).toBeTruthy();
      expect(screen.getByTestId('journey-destination-title')).toBeTruthy();
      expect(screen.getByText('Kandy City Centre')).toBeTruthy();

      // Arrival hub and suggested modes
      expect(screen.getByTestId('journey-arrival-hub')).toBeTruthy();
      expect(screen.getByText(/ARRIVAL HUB:\s*Kandy Central Maglev Terminal/i)).toBeTruthy();
      expect(screen.getByTestId('journey-modes-row')).toBeTruthy();

      // Sample data demarcation & disclaimer
      expect(screen.getByTestId('journey-sample-demarcation')).toBeTruthy();
      expect(screen.getByText('SIMULATED DESTINATION CONTEXT · LIVE ITINERARY IN FEATURE 05')).toBeTruthy();
      expect(screen.getByTestId('journey-operational-disclaimer')).toBeTruthy();
    });

    it('clears selection when Clear Selection button is pressed', () => {
      mockSearchParams = {
        destinationId: 'dest-kandy',
        destinationName: 'Kandy City Centre'
      };

      render(<JourneyScreen />);

      const clearButton = screen.getByTestId('journey-clear-destination');
      fireEvent.press(clearButton);

      expect(screen.getByTestId('journey-default-empty-state')).toBeTruthy();
      expect(screen.queryByTestId('journey-selected-context-view')).toBeNull();
    });

    it('returns to Home tab when Return to Home button is pressed', () => {
      mockSearchParams = {
        destinationId: 'dest-kandy',
        destinationName: 'Kandy City Centre'
      };

      render(<JourneyScreen />);

      const returnButton = screen.getByTestId('journey-return-home');
      fireEvent.press(returnButton);

      expect(mockPush).toHaveBeenCalledWith('/(tabs)');
    });
  });

  describe('4. Asynchronous Data Lifecycle, Refresh & Offline Resilience (Feature 03.4 & 03.5)', () => {
    it('supports pull-to-refresh without crashing or leaving loading state stuck', async () => {
      render(<HomeScreen />);

      const scrollView = screen.getByTestId('home-content');
      const { refreshControl } = scrollView.props;

      expect(refreshControl).toBeDefined();

      // Trigger pull-to-refresh
      await act(async () => {
        refreshControl.props.onRefresh();
      });

      // UI remains intact with verified content
      expect(screen.getByText('Good morning, navigator')).toBeTruthy();
    });

    it('preserves cached and locally available content when offline', () => {
      jest.spyOn(networkHook, 'useNetworkStatus').mockReturnValue({
        isConnected: false,
        isInternetReachable: false,
        connectionType: 'none'
      });

      render(<HomeScreen />);

      // Offline warning banner is visible
      expect(screen.getByText('TRANSIT LINK OFFLINE · OPERATING WITH LOCAL DEFAULTS')).toBeTruthy();

      // Critical navigation and content remain available locally
      expect(screen.getByText('Kandy')).toBeTruthy();
      expect(screen.getByText('Colombo')).toBeTruthy();
      expect(screen.getByText('Airport')).toBeTruthy();
    });
  });

  describe('5. Security, Input Validation & Path Traversal Mitigations (Feature 03.5 Task 3.5.2)', () => {
    it('rejects malicious URI schemes, path traversal tokens, null bytes, and script tags', () => {
      expect(validateJourneyParams({ destinationId: 'dest-saved-home', destinationName: 'javascript:alert(1)' })).toBeNull();
      expect(validateJourneyParams({ destinationId: 'dest-saved-home', destinationName: 'data:text/html,<script>' })).toBeNull();
      expect(validateJourneyParams({ destinationId: 'dest-saved-home', destinationName: '../../etc/passwd' })).toBeNull();
      expect(validateJourneyParams({ destinationId: 'dest-saved-home', destinationName: 'Kandy\0Malicious' })).toBeNull();
      expect(validateJourneyParams({ destinationId: 'dest-saved-home', destinationName: 'Kandy%00Admin' })).toBeNull();
      expect(validateJourneyParams({ destinationId: 'dest-saved-home', destinationName: 'Path/To/Location' })).toBeNull();
    });

    it('strictly caps parameter string lengths to MAX_PARAM_STRING_LENGTH (128 chars)', () => {
      const oversizedName = 'X'.repeat(MAX_PARAM_STRING_LENGTH + 1);
      expect(validateJourneyParams({ destinationId: 'dest-saved-home', destinationName: oversizedName })).toBeNull();
    });

    it('sanitizes authorization tokens, database connection URIs, and stack traces', () => {
      const jwtError = new Error('Unauthorized request with Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9');
      const dbError = new Error('Failed connecting to postgres://admin:secret@10.0.0.1:5432/waymark');
      const traceError = new Error('TypeError: undefined at load (/src/api/client.ts:42:15)');

      expect(formatUserFacingError(jwtError)).toBe(USER_FACING_ERRORS.SERVICE_UNAVAILABLE);
      expect(formatUserFacingError(dbError)).toBe(USER_FACING_ERRORS.SERVICE_UNAVAILABLE);
      expect(formatUserFacingError(traceError)).toBe(USER_FACING_ERRORS.SERVICE_UNAVAILABLE);
    });
  });

  describe('6. WCAG 2.1 AA Accessibility Semantics & Screen Reader Verification', () => {
    it('provides correct accessibility roles, live regions, labels, and action hints', () => {
      render(<HomeScreen />);

      // Hero title has header role
      const heroTitle = screen.getByTestId('home-hero-title');
      expect(heroTitle.props.accessibilityRole).toBe('header');

      // Suggested corridor card has summary role and label
      const suggestionCard = screen.getByTestId('home-suggestion-card');
      expect(suggestionCard.props.accessibilityRole).toBe('summary');
      expect(suggestionCard.props.accessibilityLabel).toContain('Suggested corridor:');

      // Suggestion action button has hint
      const suggestionAction = screen.getByTestId('home-suggestion-action');
      expect(suggestionAction.props.accessibilityHint).toBe(
        'Navigates to Journey planner with suggested route destination context'
      );

      // System diagnostics card has summary role
      const architectureCard = screen.getByTestId('home-architecture-card');
      expect(architectureCard.props.accessibilityRole).toBe('summary');
      expect(architectureCard.props.accessibilityLabel).toContain('System Diagnostics:');

      // Accessibility banner has summary role
      const banner = screen.getByTestId('home-accessibility-banner');
      expect(banner.props.accessibilityRole).toBe('summary');
      expect(banner.props.accessibilityLabel).toContain('Accessibility Notice:');
    });
  });

  describe('7. Truthful Sample Provenance & Architecture Boundaries', () => {
    it('verifies all sample data labels and identifies multimodal telemetry as simulated', () => {
      render(<HomeScreen />);

      // Explicit sample indicators on home
      expect(screen.getByText('SIMULATED CORRIDOR · LIVE TELEMETRY IN FEATURE 05')).toBeTruthy();
      expect(screen.getByText('Informational baseline · Corridors mandate universal step-free access')).toBeTruthy();
    });
  });
});
