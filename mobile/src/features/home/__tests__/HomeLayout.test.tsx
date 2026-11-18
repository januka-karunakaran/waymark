import React from 'react';
import { View } from 'react-native';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { HomeSection } from '../components/HomeSection';
import { HomeContent } from '../components/HomeContent';
import { defaultHomeContent } from '../data/homeContent';
import { HomeScreenData } from '../types';
import HomeScreen from '../../../../app/(tabs)/index';

describe('Home Layout & Responsive Architecture (Task 3.1.3)', () => {
  describe('HomeSection Component', () => {
    it('renders section title, eyebrow, and children', () => {
      render(
        <HomeSection
          eyebrow="TELEMETRY"
          title="Active Corridor"
          testID="test-section"
        >
          <View testID="test-child" />
        </HomeSection>
      );

      expect(screen.getByText('TELEMETRY')).toBeTruthy();
      expect(screen.getByText('Active Corridor')).toBeTruthy();
      expect(screen.getByTestId('test-child')).toBeTruthy();
    });

    it('renders optional header action button and handles press events', () => {
      const handleAction = jest.fn();
      render(
        <HomeSection
          title="Corridors"
          actionLabel="View all"
          onAction={handleAction}
          testID="action-section"
        >
          <View />
        </HomeSection>
      );

      const actionButton = screen.getByText('View all');
      expect(actionButton).toBeTruthy();
      fireEvent.press(actionButton);
      expect(handleAction).toHaveBeenCalledTimes(1);
    });

    it('renders accessibility role="header" on section title', () => {
      render(
        <HomeSection title="Heading Semantics" testID="a11y-section">
          <View />
        </HomeSection>
      );

      const title = screen.getByTestId('a11y-section-title');
      expect(title.props.accessibilityRole).toBe('header');
    });
  });

  describe('HomeContent Component & Section Hierarchy', () => {
    it('renders all 5 core Home sections in proper order', () => {
      render(<HomeContent data={defaultHomeContent} testID="home-content-test" />);

      // 1. Hero
      expect(screen.getByTestId('home-hero')).toBeTruthy();
      expect(screen.getByText('Good morning, navigator')).toBeTruthy();

      // 2. Suggestion
      expect(screen.getByTestId('home-suggestion-section')).toBeTruthy();
      expect(screen.getByText('KDU Gate → Kandy City')).toBeTruthy();
      expect(screen.getByText('SUGGESTED ACTIVE ROUTE')).toBeTruthy();
      expect(screen.getByText('LEAVE NOW')).toBeTruthy();

      // 3. Quick Destinations
      expect(screen.getByTestId('home-quick-places-section')).toBeTruthy();
      expect(screen.getByText('Quick Destinations')).toBeTruthy();
      expect(screen.getByTestId('quick-place-place-home')).toBeTruthy();
      expect(screen.getByTestId('quick-place-place-work')).toBeTruthy();

      // 4. Foundation Diagnostics
      expect(screen.getByTestId('home-architecture-section')).toBeTruthy();
      expect(screen.getByText('TELEMETRY FOUNDATION ARCHITECTURE')).toBeTruthy();
      expect(screen.getByText('OPERATIONAL')).toBeTruthy();
      expect(screen.getByText('THEME & TOKENS')).toBeTruthy();

      // 5. Accessibility Banner
      expect(screen.getByTestId('home-accessibility-banner')).toBeTruthy();
      expect(
        screen.getByText('Universal step-free routes guaranteed across all nodes')
      ).toBeTruthy();
    });

    it('safely handles missing optional sections without crashing', () => {
      const partialData: HomeScreenData = {
        hero: defaultHomeContent.hero,
        suggestion: null,
        quickPlaces: [],
        architectureStatus: null,
        accessibilityNotice: {
          message: 'Step-free access active.',
          isVerifiedStepFree: true,
          complianceStatement: '',
          verificationLevel: 'verified'
        },
        availability: 'available',
        dataSource: 'sample_data'
      };

      const { toJSON } = render(<HomeContent data={partialData} />);
      expect(toJSON()).toBeTruthy();
      expect(screen.getByTestId('home-hero')).toBeTruthy();
      expect(screen.queryByTestId('home-suggestion-section')).toBeNull();
      expect(screen.queryByTestId('home-quick-places-section')).toBeNull();
      expect(screen.queryByTestId('home-architecture-section')).toBeNull();
      expect(screen.getByText('Step-free access active.')).toBeTruthy();
    });

    it('dispatches onSelectSuggestion callback when route action is pressed', () => {
      const handleSelectSuggestion = jest.fn();
      render(
        <HomeContent
          data={defaultHomeContent}
          onSelectSuggestion={handleSelectSuggestion}
        />
      );

      const actionButton = screen.getByTestId('home-suggestion-action');
      fireEvent.press(actionButton);
      expect(handleSelectSuggestion).toHaveBeenCalledTimes(1);
      expect(handleSelectSuggestion).toHaveBeenCalledWith(
        defaultHomeContent.suggestion
      );
    });

    it('dispatches onSelectPlace callback when a destination chip is tapped', () => {
      const handleSelectPlace = jest.fn();
      render(
        <HomeContent
          data={defaultHomeContent}
          onSelectPlace={handleSelectPlace}
        />
      );

      const airportChip = screen.getByTestId('quick-place-place-airport');
      fireEvent.press(airportChip);
      expect(handleSelectPlace).toHaveBeenCalledTimes(1);
      expect(handleSelectPlace).toHaveBeenCalledWith(
        expect.objectContaining({ id: 'place-airport', label: 'Airport' })
      );
    });

    it('supports pull-to-refresh when onRefresh is supplied', () => {
      const handleRefresh = jest.fn();
      render(
        <HomeContent
          data={defaultHomeContent}
          onRefresh={handleRefresh}
          refreshing={false}
        />
      );

      const scrollView = screen.getByTestId('home-content');
      const { refreshControl } = scrollView.props;
      expect(refreshControl).toBeDefined();
      expect(refreshControl.props.refreshing).toBe(false);

      refreshControl.props.onRefresh();
      expect(handleRefresh).toHaveBeenCalledTimes(1);
    });
  });

  describe('HomeScreen ScreenWrapper Integration & Navigation Stability', () => {
    it('mounts inside ScreenWrapper preserving top avionics bar and navigation', () => {
      render(<HomeScreen />);

      // Top avionics bar from ScreenWrapper
      expect(screen.getByText('WAYMARK 2100')).toBeTruthy();
      expect(screen.getByText('PLANETARY TRANSIT NETWORK')).toBeTruthy();

      // Home body rendered via HomeContent
      expect(screen.getByText('Good morning, navigator')).toBeTruthy();
      expect(screen.getByText(/Where would you like to/)).toBeTruthy();
      expect(screen.getByText('KDU Gate → Kandy City')).toBeTruthy();
      expect(screen.getByText('Quick Destinations')).toBeTruthy();
      expect(screen.getByText('TELEMETRY FOUNDATION ARCHITECTURE')).toBeTruthy();
    });
  });
});
