import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import HomeScreen from '../../../../app/(tabs)/index';
import { HomeContent } from '../../home/components/HomeContent';
import { defaultHomeContent } from '../../home/data/homeContent';
import {
  defaultDiscoveryPayload,
  DEFAULT_DISCOVERY_SECTIONS
} from '../data/discoveryContent';
import { DiscoveryPayload, DiscoverySectionData } from '../types';

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

describe('Feature 03.2 Discovery & Home Integration (Task 3.2.4)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Full Home Screen Integration with Discovery', () => {
    it('renders all four multimodal Discovery sections on HomeScreen in proper hierarchy', () => {
      render(<HomeScreen />);

      // 1. Hero
      expect(screen.getByTestId('home-hero')).toBeTruthy();
      expect(screen.getByText('Good morning, navigator')).toBeTruthy();

      // 2. Suggestion
      expect(screen.getByTestId('home-suggestion-section')).toBeTruthy();
      expect(screen.getByText('KDU Gate → Kandy City')).toBeTruthy();

      // 3. Quick Destinations
      expect(screen.getByTestId('home-quick-places-section')).toBeTruthy();
      expect(screen.getByText('Quick Destinations')).toBeTruthy();

      // 4. Discovery Group & Sections
      expect(screen.getByTestId('home-discovery-group')).toBeTruthy();
      expect(screen.getByTestId('home-discovery-section-corridors')).toBeTruthy();
      expect(screen.getByTestId('home-discovery-section-hubs')).toBeTruthy();
      expect(screen.getByTestId('home-discovery-section-modes')).toBeTruthy();
      expect(screen.getByTestId('home-discovery-section-experiences')).toBeTruthy();

      expect(screen.getByText('Featured Corridors')).toBeTruthy();
      expect(screen.getByText('Major Transit Hubs')).toBeTruthy();
      expect(screen.getByText('Multimodal Transit Network')).toBeTruthy();
      expect(screen.getByText('Curated Travel Experiences')).toBeTruthy();

      // 5. Diagnostics
      expect(screen.getByTestId('home-architecture-section')).toBeTruthy();
      expect(screen.getByText('TELEMETRY FOUNDATION ARCHITECTURE')).toBeTruthy();

      // 6. Accessibility Banner
      expect(screen.getByTestId('home-accessibility-banner')).toBeTruthy();
    });

    it('honestly displays SIMULATED TELEMETRY notices for discovery sections', () => {
      render(<HomeScreen />);

      const simBadges = screen.getAllByText('SIMULATED TELEMETRY');
      expect(simBadges.length).toBe(4); // All 4 sample discovery sections
    });
  });

  describe('Interactive Navigation from Home Discovery Cards', () => {
    it('navigates to journey planner when tapping a corridor card on Home', () => {
      render(<HomeScreen />);

      const maglevCard = screen.getByTestId(
        'home-discovery-section-corridors-card-disc-corridor-cmb-kdy'
      );
      fireEvent.press(maglevCard);

      expect(mockRouter.push).toHaveBeenCalledTimes(1);
      expect(mockRouter.push).toHaveBeenCalledWith('/(tabs)/journey');
    });

    it('navigates to live map when tapping a transit hub card on Home', () => {
      render(<HomeScreen />);

      const hubCard = screen.getByTestId(
        'home-discovery-section-hubs-card-disc-hub-cmb-fort'
      );
      fireEvent.press(hubCard);

      expect(mockRouter.push).toHaveBeenCalledTimes(1);
      expect(mockRouter.push).toHaveBeenCalledWith('/(tabs)/map');
    });

    it('navigates to comfort tab when tapping low-sensory experience card on Home', () => {
      render(<HomeScreen />);

      const expCard = screen.getByTestId(
        'home-discovery-section-experiences-card-disc-exp-low-sensory'
      );
      fireEvent.press(expCard);

      expect(mockRouter.push).toHaveBeenCalledTimes(1);
      expect(mockRouter.push).toHaveBeenCalledWith('/(tabs)/comfort');
    });

    it('navigates via category action button for corridors and hubs', () => {
      render(<HomeScreen />);

      const corridorAction = screen.getByTestId('home-discovery-section-corridors-action');
      fireEvent.press(corridorAction);
      expect(mockRouter.push).toHaveBeenCalledWith('/(tabs)/journey');

      const hubAction = screen.getByTestId('home-discovery-section-hubs-action');
      fireEvent.press(hubAction);
      expect(mockRouter.push).toHaveBeenCalledWith('/(tabs)/map');

      const expAction = screen.getByTestId('home-discovery-section-experiences-action');
      fireEvent.press(expAction);
      expect(mockRouter.push).toHaveBeenCalledWith('/(tabs)/comfort');
    });
  });

  describe('Discovery State Handling & Degradation in HomeContent', () => {
    it('gracefully hides discovery group when discoveryPayload is null', () => {
      render(
        <HomeContent
          data={defaultHomeContent}
          discoveryPayload={null}
          testID="no-discovery-home"
        />
      );

      expect(screen.queryByTestId('home-discovery-group')).toBeNull();
      expect(screen.getByTestId('home-hero')).toBeTruthy();
      expect(screen.getByTestId('home-architecture-section')).toBeTruthy();
    });

    it('renders empty section card when a discovery section contains zero items', () => {
      const emptySection: DiscoverySectionData = {
        ...DEFAULT_DISCOVERY_SECTIONS[0],
        id: 'sec-empty-corridor',
        items: []
      };

      const payloadWithEmpty: DiscoveryPayload = {
        ...defaultDiscoveryPayload,
        sections: [emptySection]
      };

      render(
        <HomeContent
          data={defaultHomeContent}
          discoveryPayload={payloadWithEmpty}
          testID="empty-discovery-home"
        />
      );

      expect(
        screen.getByText('No active transit vectors found in this corridor.')
      ).toBeTruthy();
    });

    it('renders loading state for a section when section availability is "loading"', () => {
      const loadingSection: DiscoverySectionData = {
        ...DEFAULT_DISCOVERY_SECTIONS[0],
        id: 'sec-loading-corridor',
        availability: 'loading'
      };

      const payloadWithLoading: DiscoveryPayload = {
        ...defaultDiscoveryPayload,
        sections: [loadingSection]
      };

      render(
        <HomeContent
          data={defaultHomeContent}
          discoveryPayload={payloadWithLoading}
          testID="loading-discovery-home"
        />
      );

      expect(
        screen.getByText('Synchronizing featured corridors telemetry...')
      ).toBeTruthy();
    });

    it('renders error state for a section when section availability is "error"', () => {
      const errorSection: DiscoverySectionData = {
        ...DEFAULT_DISCOVERY_SECTIONS[0],
        id: 'sec-error-corridor',
        availability: 'error'
      };

      const payloadWithError: DiscoveryPayload = {
        ...defaultDiscoveryPayload,
        sections: [errorSection]
      };

      render(
        <HomeContent
          data={defaultHomeContent}
          discoveryPayload={payloadWithError}
          testID="error-discovery-home"
        />
      );

      expect(
        screen.getByText('Telemetry synchronization unavailable for this section.')
      ).toBeTruthy();
    });
  });

  describe('Theme and Layout Verification', () => {
    it('renders Home with light theme mode without errors', () => {
      render(
        <HomeContent
          data={defaultHomeContent}
          discoveryPayload={defaultDiscoveryPayload}
          themeMode="light"
          testID="light-home"
        />
      );

      expect(screen.getByTestId('home-discovery-group')).toBeTruthy();
      expect(screen.getByText('Featured Corridors')).toBeTruthy();
    });

    it('renders Home with dark theme mode without errors', () => {
      render(
        <HomeContent
          data={defaultHomeContent}
          discoveryPayload={defaultDiscoveryPayload}
          themeMode="dark"
          testID="dark-home"
        />
      );

      expect(screen.getByTestId('home-discovery-group')).toBeTruthy();
      expect(screen.getByText('Featured Corridors')).toBeTruthy();
    });
  });
});
