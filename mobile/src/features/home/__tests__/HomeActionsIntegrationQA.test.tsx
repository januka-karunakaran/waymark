import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { AccessibilityInfo } from 'react-native';
import HomeScreen from '../../../../app/(tabs)/index';
import JourneyScreen from '../../../../app/(tabs)/journey';
import { HomeContent } from '../components/HomeContent';
import { defaultHomeContent } from '../data/homeContent';
import {
  validateJourneyParams,
  MAX_PARAM_STRING_LENGTH
} from '../actions/journeyParams';
import {
  isValidHomeNavigationTarget,
  VERIFIED_HOME_NAVIGATION_TARGETS
} from '../actions/navigationTargets';

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
  usePathname: () => '/',
  useSegments: () => []
}));

describe('Feature 03.3 Comprehensive QA — Home Quick Actions & Navigation (Task 3.3.4)', () => {
  let announceSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    mockSearchParams = {};
    announceSpy = jest
      .spyOn(AccessibilityInfo, 'announceForAccessibility')
      .mockImplementation(() => {});
  });

  afterEach(() => {
    announceSpy.mockRestore();
  });

  describe('1. Full Shortcuts Matrix & Accessibility QA', () => {
    it('verifies all 6 shortcuts exist with compliant accessible touch targets (>= 48dp)', () => {
      render(<HomeContent data={defaultHomeContent} />);

      const shortcuts = [
        'place-home',
        'place-work',
        'place-kandy',
        'place-colombo',
        'place-airport',
        'place-more'
      ];

      shortcuts.forEach((id) => {
        const chip = screen.getByTestId(`quick-place-${id}`);
        expect(chip).toBeTruthy();
        expect(chip.props.accessibilityRole).toBe('button');

        // Style checks: minHeight 64dp, minWidth 96dp (exceeds 48dp WCAG mobile guideline)
        const flatStyle = Array.isArray(chip.props.style)
          ? Object.assign({}, ...chip.props.style.filter(Boolean))
          : chip.props.style;

        expect(flatStyle.minHeight).toBeGreaterThanOrEqual(48);
        expect(flatStyle.minWidth).toBeGreaterThanOrEqual(48);
      });
    });

    it('verifies theme resilience in both light and dark modes', () => {
      const { rerender } = render(
        <HomeContent data={defaultHomeContent} themeMode="dark" />
      );
      expect(screen.getByTestId('home-quick-places-grid')).toBeTruthy();

      rerender(<HomeContent data={defaultHomeContent} themeMode="light" />);
      expect(screen.getByTestId('home-quick-places-grid')).toBeTruthy();
    });

    it('handles long text wrapping gracefully without layout truncation', () => {
      const customData = {
        ...defaultHomeContent,
        quickPlaces: [
          {
            id: 'place-kandy',
            label: 'Expanded Regional Maglev Transfer Terminal Station',
            destination: 'Central Province Interchange',
            iconName: 'map-pin' as const
          }
        ]
      };

      render(<HomeContent data={customData} />);
      expect(
        screen.getByText('Expanded Regional Maglev Transfer Terminal Station')
      ).toBeTruthy();
    });
  });

  describe('2. Truthful Location Configuration States QA', () => {
    it('Truthfully handles unconfigured Home location without inventing private addresses', () => {
      render(<HomeScreen />);

      const homeChip = screen.getByTestId('quick-place-place-home');
      fireEvent.press(homeChip);

      // Never routes blindly to Journey
      expect(mockPush).not.toHaveBeenCalled();

      // Displays truthful guidance banner
      expect(screen.getByTestId('home-guidance-banner')).toBeTruthy();
      expect(
        screen.getByText(
          'Home and Work locations have not been saved yet. Custom locations will be available in profile settings.'
        )
      ).toBeTruthy();

      // Screen-reader announcement
      expect(announceSpy).toHaveBeenCalledWith(
        'Home and Work locations have not been saved yet. Custom locations will be available in profile settings.'
      );
    });

    it('Allows manual dismissal of the guidance notice', () => {
      render(<HomeScreen />);

      const workChip = screen.getByTestId('quick-place-place-work');
      fireEvent.press(workChip);
      expect(screen.getByTestId('home-guidance-banner')).toBeTruthy();

      const dismissBtn = screen.getByTestId('home-guidance-dismiss');
      fireEvent.press(dismissBtn);

      expect(screen.queryByTestId('home-guidance-banner')).toBeNull();
    });
  });

  describe('3. In-Page More Shortcut & Discovery Focus QA', () => {
    it('More shortcut focuses the Discovery section without leaving Home or navigating to Journey', () => {
      render(<HomeScreen />);

      const moreChip = screen.getByTestId('quick-place-place-more');
      fireEvent.press(moreChip);

      // Does not push route to Journey
      expect(mockPush).not.toHaveBeenCalled();

      // Confirms discovery section is in DOM
      expect(screen.getByTestId('home-discovery-group')).toBeTruthy();

      // Screen-reader announcement
      expect(announceSpy).toHaveBeenCalledWith(
        'Jumped to Multimodal Transit Discovery section'
      );
    });
  });

  describe('4. Contextual Journey Navigation Handoff QA', () => {
    it('Dispatches structured route parameters when Kandy destination is tapped', () => {
      render(<HomeScreen />);

      const kandyChip = screen.getByTestId('quick-place-place-kandy');
      fireEvent.press(kandyChip);

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

    it('Dispatches structured route parameters when Colombo is tapped', () => {
      render(<HomeScreen />);

      const colomboChip = screen.getByTestId('quick-place-place-colombo');
      fireEvent.press(colomboChip);

      expect(mockPush).toHaveBeenCalledWith(
        expect.objectContaining({
          pathname: '/(tabs)/journey',
          params: expect.objectContaining({
            destinationId: 'dest-colombo',
            destinationName: 'Colombo Fort Central'
          })
        })
      );
    });

    it('Dispatches structured route parameters when Airport is tapped', () => {
      render(<HomeScreen />);

      const airportChip = screen.getByTestId('quick-place-place-airport');
      fireEvent.press(airportChip);

      expect(mockPush).toHaveBeenCalledWith(
        expect.objectContaining({
          pathname: '/(tabs)/journey',
          params: expect.objectContaining({
            destinationId: 'dest-airport',
            destinationName: 'Bandaranaike Skyport'
          })
        })
      );
    });

    it('Dispatches structured route parameters when suggested corridor CTA is tapped', () => {
      render(<HomeScreen />);

      const startRouteBtn = screen.getByTestId('home-suggestion-action');
      fireEvent.press(startRouteBtn);

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

    it('Prevents rapid duplicate clicks from dispatching multiple navigation events', () => {
      render(<HomeScreen />);

      const kandyChip = screen.getByTestId('quick-place-place-kandy');
      fireEvent.press(kandyChip);
      fireEvent.press(kandyChip);
      fireEvent.press(kandyChip);

      expect(mockPush).toHaveBeenCalledTimes(1);
    });
  });

  describe('5. Journey Screen Selected Destination & Fallback QA', () => {
    it('Renders contextual destination card with clear sample data demarcation', () => {
      mockSearchParams = {
        destinationId: 'dest-kandy',
        destinationName: 'Kandy City Centre'
      };

      render(<JourneyScreen />);

      // Selected card rendered
      expect(
        screen.getByTestId('journey-selected-destination-card')
      ).toBeTruthy();
      expect(screen.getByText('Kandy City Centre')).toBeTruthy();
      expect(
        screen.getByText('ARRIVAL HUB: Kandy Central Maglev Terminal')
      ).toBeTruthy();

      // Sample telemetry indicator
      expect(
        screen.getByText(
          'SIMULATED DESTINATION CONTEXT · LIVE ITINERARY IN FEATURE 05'
        )
      ).toBeTruthy();

      // Operational disclaimer
      expect(
        screen.getByTestId('journey-operational-disclaimer')
      ).toBeTruthy();
    });

    it('Allows clearing selected destination to reveal default empty timeline view', () => {
      mockSearchParams = {
        destinationId: 'dest-colombo',
        destinationName: 'Colombo Fort Central'
      };

      render(<JourneyScreen />);

      expect(
        screen.getByTestId('journey-selected-destination-card')
      ).toBeTruthy();

      const clearBtn = screen.getByTestId('journey-clear-destination');
      fireEvent.press(clearBtn);

      expect(
        screen.queryByTestId('journey-selected-destination-card')
      ).toBeNull();
      expect(screen.getByTestId('journey-default-empty-state')).toBeTruthy();
    });

    it('Allows returning to Home via Return to Home button', () => {
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

  describe('6. Security & Parameter Guard Verification', () => {
    it('strictly allowlists verified internal tab routes and blocks external URIs', () => {
      expect(VERIFIED_HOME_NAVIGATION_TARGETS).toContain('/(tabs)');
      expect(VERIFIED_HOME_NAVIGATION_TARGETS).toContain('/(tabs)/journey');
      expect(VERIFIED_HOME_NAVIGATION_TARGETS).toContain('/(tabs)/map');
      expect(VERIFIED_HOME_NAVIGATION_TARGETS).toContain('/(tabs)/oracle');
      expect(VERIFIED_HOME_NAVIGATION_TARGETS).toContain('/(tabs)/comfort');

      // Security rejection
      expect(isValidHomeNavigationTarget('https://malicious.org')).toBe(false);
      expect(isValidHomeNavigationTarget('javascript:alert(1)')).toBe(false);
      expect(isValidHomeNavigationTarget('data:text/html,<script>')).toBe(false);
      expect(isValidHomeNavigationTarget('../system/env')).toBe(false);
    });

    it('defensively sanitizes journey parameters against injection, oversized strings, and unknown IDs', () => {
      // Oversized string
      const oversized = 'dest-kandy'.padEnd(MAX_PARAM_STRING_LENGTH + 20, 'z');
      expect(validateJourneyParams({ destinationId: oversized })).toBeNull();

      // XSS & Scheme injection
      expect(
        validateJourneyParams({ destinationId: '<script>evil()</script>' })
      ).toBeNull();
      expect(
        validateJourneyParams({ destinationId: 'javascript:void(0)' })
      ).toBeNull();
      expect(
        validateJourneyParams({ destinationId: 'https://attacker.site' })
      ).toBeNull();

      // Unknown destination IDs
      expect(
        validateJourneyParams({ destinationId: 'dest-fantasy-island' })
      ).toBeNull();
    });

    it('falls back safely to default empty state on JourneyScreen when receiving malicious input', () => {
      mockSearchParams = {
        destinationId: '<script>alert("hacked")</script>',
        destinationName: 'Malicious Destination'
      };

      render(<JourneyScreen />);

      expect(
        screen.queryByTestId('journey-selected-destination-card')
      ).toBeNull();
      expect(screen.getByTestId('journey-default-empty-state')).toBeTruthy();
    });
  });
});
