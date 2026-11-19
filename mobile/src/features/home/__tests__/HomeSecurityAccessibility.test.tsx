/**
 * Waymark 2100 — Feature 03.5 Task 3.5.2 Security, Privacy & Accessibility Hardening
 *
 * Comprehensive verification for:
 * 1. Sanitization of runtime errors against credential, token, path, and stack trace leakage.
 * 2. Strict input validation, path traversal defense, and length boundaries on navigation parameters.
 * 3. Validation and injection mitigation on user-saved addresses.
 * 4. WCAG-aligned accessibility roles, live regions, labels, and hints on Home and Journey components.
 */

import React from 'react';
import { render, screen } from '@testing-library/react-native';
import {
  formatUserFacingError,
  USER_FACING_ERRORS
} from '../hooks/useHomeData';
import {
  resolveHomeQuickAction,
  UNCONFIGURED_LOCATIONS_MESSAGE
} from '../actions/quickActionResolver';
import {
  validateJourneyParams,
  MAX_PARAM_STRING_LENGTH
} from '../actions/journeyParams';
import { HomeQuickPlaceNode } from '../types';
import { HomeContent } from '../components/HomeContent';
import JourneyScreen from '../../../../app/(tabs)/journey';
import { defaultHomeContent } from '../data/homeContent';
import { defaultDiscoveryPayload } from '../../discovery';

// Mock expo-router
const mockPush = jest.fn();
let mockSearchParams: Record<string, string> = {};

jest.mock('expo-router', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: jest.fn(),
    back: jest.fn(),
    canGoBack: jest.fn(() => true)
  }),
  useLocalSearchParams: () => mockSearchParams,
  usePathname: () => '/journey',
  useSegments: () => ['(tabs)', 'journey']
}));

describe('Feature 03.5 Task 3.5.2 — Security, Privacy & Accessibility Hardening', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSearchParams = {};
  });

  describe('1. Error Message Sanitization & Credential Protection', () => {
    it('sanitizes authorization tokens, JWTs, and bearer credentials', () => {
      const jwtError = new Error('Unauthorized request with Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.e30.t-ID');
      const tokenError = new Error('Access denied: auth_token=secret_abc123456789');
      const apiKeyError = new Error('Invalid api_key=sk_live_9988776655');

      expect(formatUserFacingError(jwtError)).toBe(USER_FACING_ERRORS.SERVICE_UNAVAILABLE);
      expect(formatUserFacingError(tokenError)).toBe(USER_FACING_ERRORS.SERVICE_UNAVAILABLE);
      expect(formatUserFacingError(apiKeyError)).toBe(USER_FACING_ERRORS.SERVICE_UNAVAILABLE);
    });

    it('sanitizes database connection URIs, credentials, and host details', () => {
      const postgresError = new Error('Connection failed to postgres://admin:P@ssword123@db.waymark.internal:5432/transit');
      const mongoError = new Error('Timeout connecting to mongodb://cluster0.internal:27017');
      const localError = new Error('Refused connection at http://localhost:8080/v1/telemetry');
      const ipError = new Error('Host 192.168.1.150 unreachable');

      expect(formatUserFacingError(postgresError)).toBe(USER_FACING_ERRORS.SERVICE_UNAVAILABLE);
      expect(formatUserFacingError(mongoError)).toBe(USER_FACING_ERRORS.SERVICE_UNAVAILABLE);
      expect(formatUserFacingError(localError)).toBe(USER_FACING_ERRORS.SERVICE_UNAVAILABLE);
      expect(formatUserFacingError(ipError)).toBe(USER_FACING_ERRORS.SERVICE_UNAVAILABLE);
    });

    it('sanitizes stack traces, filesystem paths, and code execution internals', () => {
      const stackTraceError = new Error(
        'TypeError: Cannot read properties of undefined at Object.<anonymous> (/srv/waymark/src/api/client.ts:88:12)'
      );
      const winPathError = new Error('Failed to read config from C:\\Windows\\System32\\drivers\\etc\\hosts');
      const memoryAddrError = new Error('Segmentation fault at address 0x7ffee4b29010');

      expect(formatUserFacingError(stackTraceError)).toBe(USER_FACING_ERRORS.SERVICE_UNAVAILABLE);
      expect(formatUserFacingError(winPathError)).toBe(USER_FACING_ERRORS.SERVICE_UNAVAILABLE);
      expect(formatUserFacingError(memoryAddrError)).toBe(USER_FACING_ERRORS.SERVICE_UNAVAILABLE);
    });

    it('preserves clean human-readable domain error messages', () => {
      const domainError = new Error('Transit schedule temporarily unavailable');
      const networkError = new Error('Network connection dropped');
      const dispatchError = new Error('Core Dispatch Down');

      expect(formatUserFacingError(domainError)).toBe('Transit schedule temporarily unavailable');
      expect(formatUserFacingError(networkError)).toBe('Network connection dropped');
      expect(formatUserFacingError(dispatchError)).toBe('Core Dispatch Down');
    });

    it('falls back to default safe message for null, undefined, or empty errors', () => {
      expect(formatUserFacingError(null)).toBe(USER_FACING_ERRORS.DEFAULT);
      expect(formatUserFacingError(undefined)).toBe(USER_FACING_ERRORS.DEFAULT);
    });
  });

  describe('2. Navigation Parameter Hardening & Path Traversal Mitigation', () => {
    it('accepts legitimate allowlisted destination identifiers', () => {
      const kandyResult = validateJourneyParams({ destinationId: 'dest-kandy' });
      expect(kandyResult).not.toBeNull();
      expect(kandyResult?.name).toBe('Kandy City Centre');
      expect(kandyResult?.isSample).toBe(true);

      const colomboResult = validateJourneyParams({ destinationId: 'dest-colombo' });
      expect(colomboResult?.name).toBe('Colombo Fort Central');

      const airportResult = validateJourneyParams({ destinationId: 'dest-airport' });
      expect(airportResult?.name).toBe('Bandaranaike Skyport');
    });

    it('rejects forbidden URL schemes (javascript:, data:, file:, blob:, vbscript:, about:)', () => {
      expect(validateJourneyParams({ destinationId: 'dest-saved-home', destinationName: 'javascript:alert(1)' })).toBeNull();
      expect(validateJourneyParams({ destinationId: 'dest-saved-home', destinationName: 'data:text/html;base64,PHNjcmlwdD4=' })).toBeNull();
      expect(validateJourneyParams({ destinationId: 'dest-saved-home', destinationName: 'file:///etc/passwd' })).toBeNull();
      expect(validateJourneyParams({ destinationId: 'dest-saved-home', destinationName: 'blob:https://evil.com/uuid' })).toBeNull();
      expect(validateJourneyParams({ destinationId: 'dest-saved-home', destinationName: 'vbscript:msgbox("pwnd")' })).toBeNull();
      expect(validateJourneyParams({ destinationId: 'dest-saved-home', destinationName: 'about:blank' })).toBeNull();
    });

    it('rejects path traversal tokens, null bytes, and HTML script tags', () => {
      expect(validateJourneyParams({ destinationId: 'dest-saved-home', destinationName: '../../etc/shadow' })).toBeNull();
      expect(validateJourneyParams({ destinationId: 'dest-saved-home', destinationName: '..\\..\\boot.ini' })).toBeNull();
      expect(validateJourneyParams({ destinationId: 'dest-saved-home', destinationName: 'Kandy%00Admin' })).toBeNull();
      expect(validateJourneyParams({ destinationId: 'dest-saved-home', destinationName: 'Kandy\0Admin' })).toBeNull();
      expect(validateJourneyParams({ destinationId: 'dest-saved-home', destinationName: '<script>alert(1)</script>' })).toBeNull();
      expect(validateJourneyParams({ destinationId: 'dest-saved-home', destinationName: 'Kandy/Fort' })).toBeNull();
    });

    it('rejects oversized parameter inputs exceeding maximum allowable length', () => {
      const oversizedName = 'A'.repeat(MAX_PARAM_STRING_LENGTH + 1);
      expect(validateJourneyParams({ destinationId: 'dest-saved-home', destinationName: oversizedName })).toBeNull();
    });

    it('accepts safe user-saved destination names within bounded limits', () => {
      const safeName = 'Peradeniya Safe Station';
      const result = validateJourneyParams({ destinationId: 'dest-saved-home', destinationName: safeName });
      expect(result).not.toBeNull();
      expect(result?.name).toBe(safeName);
      expect(result?.isSample).toBe(false);
    });
  });

  describe('3. Saved Address Validation in Quick Action Resolver', () => {
    const homeNode: HomeQuickPlaceNode = {
      id: 'place-home',
      label: 'Home',
      destination: 'Custom Home',
      iconName: 'home'
    };

    const workNode: HomeQuickPlaceNode = {
      id: 'place-work',
      label: 'Work',
      destination: 'Custom Work',
      iconName: 'briefcase'
    };

    it('resolves valid saved home address to journey target', () => {
      const action = resolveHomeQuickAction(homeNode, {
        savedAddresses: { 'place-home': 'Peradeniya Residency' }
      });

      expect(action.type).toBe('navigate');
      expect(action.targetRoute).toBe('/(tabs)/journey');
      expect(action.destinationContext?.destinationName).toBe('Peradeniya Residency');
    });

    it('rejects malicious URI schemes in saved addresses and returns unconfigured message', () => {
      const action = resolveHomeQuickAction(homeNode, {
        savedAddresses: { 'place-home': 'javascript:alert(document.cookie)' }
      });

      expect(action.type).toBe('unconfigured');
      expect(action.userMessage).toBe(UNCONFIGURED_LOCATIONS_MESSAGE);
    });

    it('rejects path traversal and directory separators in saved addresses', () => {
      const traversalAction = resolveHomeQuickAction(workNode, {
        savedAddresses: { 'place-work': '../../etc/passwd' }
      });
      expect(traversalAction.type).toBe('unconfigured');
      expect(traversalAction.userMessage).toBe(UNCONFIGURED_LOCATIONS_MESSAGE);

      const slashAction = resolveHomeQuickAction(workNode, {
        savedAddresses: { 'place-work': 'Colombo/Fort/Office' }
      });
      expect(slashAction.type).toBe('unconfigured');
      expect(slashAction.userMessage).toBe(UNCONFIGURED_LOCATIONS_MESSAGE);
    });

    it('rejects oversized saved addresses exceeding length threshold', () => {
      const oversized = 'W'.repeat(MAX_PARAM_STRING_LENGTH + 1);
      const action = resolveHomeQuickAction(homeNode, {
        savedAddresses: { 'place-home': oversized }
      });
      expect(action.type).toBe('unconfigured');
      expect(action.userMessage).toBe(UNCONFIGURED_LOCATIONS_MESSAGE);
    });
  });

  describe('4. Accessibility Roles, Live Regions, and Screen Reader Semantics', () => {
    it('renders loading state with summary role and polite live region', () => {
      render(
        <HomeContent
          data={defaultHomeContent}
          discoveryPayload={defaultDiscoveryPayload}
          isLoading={true}
          themeMode="dark"
          testID="home-content"
        />
      );

      const loadingContainer = screen.getByTestId('home-content-loading');
      expect(loadingContainer.props.accessibilityRole).toBe('summary');
      expect(loadingContainer.props.accessibilityLiveRegion).toBe('polite');
    });

    it('renders error state with alert role and assertive live region', () => {
      render(
        <HomeContent
          data={defaultHomeContent}
          discoveryPayload={defaultDiscoveryPayload}
          isError={true}
          errorMessage="Transit network connection unavailable."
          onRetry={jest.fn()}
          themeMode="dark"
          testID="home-content"
        />
      );

      const errorContainer = screen.getByTestId('home-content-error');
      expect(errorContainer.props.accessibilityRole).toBe('alert');
      expect(errorContainer.props.accessibilityLiveRegion).toBe('assertive');
    });

    it('renders empty state with summary role and polite live region', () => {
      render(
        <HomeContent
          data={null}
          discoveryPayload={null}
          isEmpty={true}
          themeMode="dark"
          testID="home-content"
        />
      );

      const emptyContainer = screen.getByTestId('home-content-empty');
      expect(emptyContainer.props.accessibilityRole).toBe('summary');
      expect(emptyContainer.props.accessibilityLiveRegion).toBe('polite');
    });

    it('annotates suggestion card and action button with accessible roles, labels, and hints', () => {
      render(
        <HomeContent
          data={defaultHomeContent}
          discoveryPayload={defaultDiscoveryPayload}
          themeMode="dark"
          testID="home-content"
        />
      );

      const suggestionCard = screen.getByTestId('home-suggestion-card');
      expect(suggestionCard.props.accessibilityRole).toBe('summary');
      expect(suggestionCard.props.accessibilityLabel).toContain('Suggested corridor:');

      const suggestionAction = screen.getByTestId('home-suggestion-action');
      expect(suggestionAction.props.accessibilityHint).toBe(
        'Navigates to Journey planner with suggested route destination context'
      );
    });

    it('annotates system architecture diagnostics card with summary role and status label', () => {
      render(
        <HomeContent
          data={defaultHomeContent}
          discoveryPayload={defaultDiscoveryPayload}
          themeMode="dark"
          testID="home-content"
        />
      );

      const architectureCard = screen.getByTestId('home-architecture-card');
      expect(architectureCard.props.accessibilityRole).toBe('summary');
      expect(architectureCard.props.accessibilityLabel).toContain('System Diagnostics:');
    });

    it('annotates accessibility notice banner with summary role and descriptive label', () => {
      render(
        <HomeContent
          data={defaultHomeContent}
          discoveryPayload={defaultDiscoveryPayload}
          themeMode="dark"
          testID="home-content"
        />
      );

      const banner = screen.getByTestId('home-accessibility-banner');
      expect(banner.props.accessibilityRole).toBe('summary');
      expect(banner.props.accessibilityLabel).toContain('Accessibility Notice:');
    });

    it('annotates journey selected destination context view and action buttons with accessible roles and hints', () => {
      mockSearchParams = {
        destinationId: 'dest-kandy',
        destinationName: 'Kandy City Centre'
      };

      render(<JourneyScreen />);

      const contextView = screen.getByTestId('journey-selected-context-view');
      expect(contextView.props.accessibilityRole).toBe('summary');
      expect(contextView.props.accessibilityLabel).toContain('Selected Destination: Kandy City Centre');

      const clearButton = screen.getByTestId('journey-clear-destination');
      expect(clearButton.props.accessibilityHint).toBe(
        'Clears the current destination selection and returns to the empty journey planner view'
      );

      const returnButton = screen.getByTestId('journey-return-home');
      expect(returnButton.props.accessibilityHint).toBe(
        'Returns to the Home discovery and navigation screen'
      );
    });
  });
});
