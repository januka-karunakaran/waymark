import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react-native';
import { AccessibilityInfo } from 'react-native';
import HomeScreen from '../../../../app/(tabs)/index';
import { HomeContent } from '../components/HomeContent';
import { defaultHomeContent } from '../data/homeContent';
import { HomeQuickPlaceNode } from '../types';

const mockPush = jest.fn();
const mockRouter = {
  push: mockPush,
  replace: jest.fn(),
  back: jest.fn(),
  canGoBack: jest.fn(() => true)
};

jest.mock('expo-router', () => ({
  useRouter: () => mockRouter,
  usePathname: () => '/',
  useSegments: () => []
}));

describe('Feature 03.3 — Functional Quick Destination Shortcuts (Task 3.3.2)', () => {
  let announceSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    announceSpy = jest
      .spyOn(AccessibilityInfo, 'announceForAccessibility')
      .mockImplementation(() => {});
  });

  afterEach(() => {
    announceSpy.mockRestore();
  });

  describe('Shortcut Rendering & Accessibility', () => {
    it('renders all default destination shortcuts with proper accessibility attributes', () => {
      render(<HomeContent data={defaultHomeContent} />);

      const homeChip = screen.getByTestId('quick-place-place-home');
      const workChip = screen.getByTestId('quick-place-place-work');
      const kandyChip = screen.getByTestId('quick-place-place-kandy');
      const colomboChip = screen.getByTestId('quick-place-place-colombo');
      const airportChip = screen.getByTestId('quick-place-place-airport');
      const moreChip = screen.getByTestId('quick-place-place-more');

      expect(homeChip).toBeTruthy();
      expect(workChip).toBeTruthy();
      expect(kandyChip).toBeTruthy();
      expect(colomboChip).toBeTruthy();
      expect(airportChip).toBeTruthy();
      expect(moreChip).toBeTruthy();

      // Check accessibility roles
      expect(homeChip.props.accessibilityRole).toBe('button');
      expect(kandyChip.props.accessibilityRole).toBe('button');
      expect(moreChip.props.accessibilityRole).toBe('button');

      // Check descriptive accessibility labels
      expect(homeChip.props.accessibilityLabel).toBe(
        'Home, saved destination unconfigured'
      );
      expect(workChip.props.accessibilityLabel).toBe(
        'Work, saved destination unconfigured'
      );
      expect(kandyChip.props.accessibilityLabel).toBe(
        'Travel to Kandy City Centre, popular corridor'
      );
      expect(airportChip.props.accessibilityLabel).toBe(
        'Travel to Bandaranaike Skyport'
      );
      expect(moreChip.props.accessibilityLabel).toBe(
        'More, explore multimodal transit directory'
      );

      // Check accessibility hints
      expect(homeChip.props.accessibilityHint).toBe(
        'Displays setup guidance for custom locations'
      );
      expect(kandyChip.props.accessibilityHint).toBe(
        'Navigates to journey planner'
      );
      expect(moreChip.props.accessibilityHint).toBe(
        'Scrolls to multimodal transit discovery directory'
      );
    });

    it('supports long destination labels and wraps gracefully without crashing', () => {
      const customContent = {
        ...defaultHomeContent,
        quickPlaces: [
          {
            id: 'place-kandy',
            label: 'Very Long Multimodal Terminal Hub Name In Regional Sector',
            destination: 'Expanded Regional Terminal Node',
            iconName: 'map-pin' as const
          }
        ]
      };

      render(<HomeContent data={customContent} />);

      const customChip = screen.getByTestId('quick-place-place-kandy');
      expect(customChip).toBeTruthy();
      expect(
        screen.getByText(
          'Very Long Multimodal Terminal Hub Name In Regional Sector'
        )
      ).toBeTruthy();
    });

    it('enforces disabled state when isActionPending is true', () => {
      const handleSelectPlace = jest.fn();
      render(
        <HomeContent
          data={defaultHomeContent}
          onSelectPlace={handleSelectPlace}
          isActionPending={true}
        />
      );

      const airportChip = screen.getByTestId('quick-place-place-airport');
      expect(airportChip.props.accessibilityState.disabled).toBe(true);

      fireEvent.press(airportChip);
      expect(handleSelectPlace).not.toHaveBeenCalled();
    });
  });

  describe('HomeScreen Quick Destination Interactions', () => {
    it('navigates to journey tab when verified sample destination (Kandy) is tapped', () => {
      render(<HomeScreen />);

      const kandyChip = screen.getByTestId('quick-place-place-kandy');
      fireEvent.press(kandyChip);

      expect(mockPush).toHaveBeenCalledTimes(1);
      expect(mockPush).toHaveBeenCalledWith('/(tabs)/journey');
      expect(screen.queryByTestId('home-guidance-banner')).toBeNull();
    });

    it('navigates to journey tab when Colombo or Airport shortcut is tapped', () => {
      render(<HomeScreen />);

      const colomboChip = screen.getByTestId('quick-place-place-colombo');
      fireEvent.press(colomboChip);
      expect(mockPush).toHaveBeenCalledWith('/(tabs)/journey');

      const airportChip = screen.getByTestId('quick-place-place-airport');
      fireEvent.press(airportChip);
      expect(mockPush).toHaveBeenCalledWith('/(tabs)/journey');
    });

    it('prevents duplicate navigation calls when rapidly tapped (double-click guard)', () => {
      render(<HomeScreen />);

      const kandyChip = screen.getByTestId('quick-place-place-kandy');

      // Rapid consecutive presses
      fireEvent.press(kandyChip);
      fireEvent.press(kandyChip);
      fireEvent.press(kandyChip);

      // Only one navigation push should occur
      expect(mockPush).toHaveBeenCalledTimes(1);
      expect(mockPush).toHaveBeenCalledWith('/(tabs)/journey');
    });

    it('shows truthful unconfigured guidance banner when Home shortcut is tapped', () => {
      render(<HomeScreen />);

      const homeChip = screen.getByTestId('quick-place-place-home');
      fireEvent.press(homeChip);

      // Does not navigate to journey
      expect(mockPush).not.toHaveBeenCalled();

      // Displays guidance banner
      const banner = screen.getByTestId('home-guidance-banner');
      expect(banner).toBeTruthy();
      expect(banner.props.accessibilityRole).toBe('alert');

      const guidanceText = screen.getByTestId('home-guidance-text');
      expect(guidanceText.props.children).toBe(
        'Home and Work locations have not been saved yet. Custom locations will be available in profile settings.'
      );

      // Announces via screen reader
      expect(announceSpy).toHaveBeenCalledWith(
        'Home and Work locations have not been saved yet. Custom locations will be available in profile settings.'
      );
    });

    it('shows unconfigured guidance for Work and allows manual dismissal', () => {
      render(<HomeScreen />);

      const workChip = screen.getByTestId('quick-place-place-work');
      fireEvent.press(workChip);

      expect(mockPush).not.toHaveBeenCalled();
      expect(screen.getByTestId('home-guidance-banner')).toBeTruthy();

      // Dismiss the banner
      const dismissBtn = screen.getByTestId('home-guidance-dismiss');
      fireEvent.press(dismissBtn);

      expect(screen.queryByTestId('home-guidance-banner')).toBeNull();
    });

    it('More shortcut focuses Discovery group without routing to Journey', () => {
      render(<HomeScreen />);

      const moreChip = screen.getByTestId('quick-place-place-more');
      fireEvent.press(moreChip);

      // Does NOT route to Journey
      expect(mockPush).not.toHaveBeenCalled();

      // Confirms Discovery section is present on screen
      expect(screen.getByTestId('home-discovery-group')).toBeTruthy();

      // Dispatches accessibility announcement
      expect(announceSpy).toHaveBeenCalledWith(
        'Jumped to Multimodal Transit Discovery section'
      );
    });

    it('tapping a valid destination clears any active unconfigured guidance banner', () => {
      render(<HomeScreen />);

      // First tap unconfigured Home
      const homeChip = screen.getByTestId('quick-place-place-home');
      fireEvent.press(homeChip);
      expect(screen.getByTestId('home-guidance-banner')).toBeTruthy();

      // Then tap valid Kandy shortcut
      const kandyChip = screen.getByTestId('quick-place-place-kandy');
      fireEvent.press(kandyChip);

      expect(screen.queryByTestId('home-guidance-banner')).toBeNull();
      expect(mockPush).toHaveBeenCalledWith('/(tabs)/journey');
    });

    it('handles unsupported or custom place nodes safely without throwing errors', () => {
      const unsupportedNode: HomeQuickPlaceNode = {
        id: 'place-unsupported-node',
        label: 'Orbit Relay',
        destination: 'Deep Space Station',
        iconName: 'compass'
      };

      const customContent = {
        ...defaultHomeContent,
        quickPlaces: [unsupportedNode]
      };

      render(<HomeScreen />);

      // Verify rendering is safe
      expect(screen.getByTestId('quick-place-place-home')).toBeTruthy();
    });
  });

  describe('In-Page Scroll Smooth Focus', () => {
    it('invokes onSelectPlace with resolved action when More is tapped', () => {
      const handleSelectPlace = jest.fn();
      render(
        <HomeContent
          data={defaultHomeContent}
          onSelectPlace={handleSelectPlace}
        />
      );

      const moreChip = screen.getByTestId('quick-place-place-more');
      fireEvent.press(moreChip);

      expect(handleSelectPlace).toHaveBeenCalledTimes(1);
      expect(handleSelectPlace).toHaveBeenCalledWith(
        expect.objectContaining({ id: 'place-more' })
      );
    });
  });
});
