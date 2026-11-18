import React from 'react';
import { Text, View } from 'react-native';
import { render, screen, fireEvent } from '@testing-library/react-native';
import {
  DiscoverySection,
  DiscoveryCategory,
  DiscoveryCategoryBadge,
  DISCOVERY_CATEGORY_METADATA
} from '../components';
import { DEFAULT_DISCOVERY_SECTIONS } from '../data/discoveryContent';
import { DiscoverySectionData } from '../types';

describe('DiscoverySection & DiscoveryCategory UI Components (Task 3.2.2)', () => {
  const corridorSection = DEFAULT_DISCOVERY_SECTIONS[0]; // Corridors section

  describe('DiscoverySection Rendering & Semantics', () => {
    it('renders section title with accessible header role', () => {
      render(<DiscoverySection section={corridorSection} testID="corridor-section" />);

      const titleElement = screen.getByTestId('corridor-section-title');
      expect(titleElement).toBeTruthy();
      expect(screen.getByText('Featured Corridors')).toBeTruthy();
      expect(titleElement.props.accessibilityRole).toBe('header');
    });

    it('renders category eyebrow and category badge', () => {
      render(<DiscoverySection section={corridorSection} testID="corridor-section" />);

      expect(screen.getByText('TRANSIT NETWORK')).toBeTruthy();
      expect(screen.getByTestId('corridor-section-category-badge')).toBeTruthy();
      expect(screen.getByText('CORRIDORS')).toBeTruthy();
    });

    it('renders optional section description when provided', () => {
      render(<DiscoverySection section={corridorSection} testID="corridor-section" />);

      expect(
        screen.getByText('High-frequency inter-city connections across the island grid.')
      ).toBeTruthy();
    });

    it('omits description cleanly when not provided', () => {
      const sectionNoDesc: DiscoverySectionData = {
        ...corridorSection,
        id: 'sec-no-desc',
        description: undefined
      };

      render(<DiscoverySection section={sectionNoDesc} testID="no-desc-section" />);
      expect(screen.queryByTestId('no-desc-section-description')).toBeNull();
    });

    it('renders container with composite accessibility label', () => {
      render(<DiscoverySection section={corridorSection} testID="corridor-section" />);

      const container = screen.getByTestId('corridor-section');
      expect(container.props.accessibilityLabel).toBe(
        `Featured Corridors, ${corridorSection.items.length} items`
      );
    });
  });

  describe('Truthful Telemetry & Sample Indicators', () => {
    it('displays SIMULATED TELEMETRY badge when items contain sample data', () => {
      render(
        <DiscoverySection
          section={corridorSection}
          showSampleBadge={true}
          testID="sample-section"
        />
      );

      expect(screen.getByTestId('sample-section-sample-badge')).toBeTruthy();
      expect(screen.getByText('SIMULATED TELEMETRY')).toBeTruthy();
    });

    it('hides section sample badge when showSampleBadge is false', () => {
      render(
        <DiscoverySection
          section={corridorSection}
          showSampleBadge={false}
          testID="no-badge-section"
        />
      );

      expect(screen.queryByTestId('no-badge-section-sample-badge')).toBeNull();
    });

    it('renders SAMPLE pill on individual item cards', () => {
      render(<DiscoverySection section={corridorSection} testID="corridor-section" />);

      const samplePills = screen.getAllByText('SAMPLE');
      expect(samplePills.length).toBe(corridorSection.items.length);
    });
  });

  describe('Categorized Content & Layout Modes', () => {
    it('renders items in horizontal ScrollView by default without nested scroll traps', () => {
      render(<DiscoverySection section={corridorSection} testID="corridor-section" />);

      const scrollView = screen.getByTestId('corridor-section-horizontal-scroll');
      expect(scrollView).toBeTruthy();
      expect(scrollView.props.horizontal).toBe(true);
      expect(scrollView.props.nestedScrollEnabled).toBe(true);
      expect(scrollView.props.showsHorizontalScrollIndicator).toBe(false);
    });

    it('renders default item cards with title, badge, description, and metadata', () => {
      render(<DiscoverySection section={corridorSection} testID="corridor-section" />);

      // Maglev item card
      expect(screen.getByText('Colombo–Kandy Maglev Corridor')).toBeTruthy();
      expect(screen.getByText('LINE M4')).toBeTruthy();
      expect(
        screen.getByText('High-speed magnetic levitation link through the Kadugannawa mountain pass.')
      ).toBeTruthy();
      expect(screen.getByText('34 min · Every 8 min · Line M4 · Step-free')).toBeTruthy();
    });

    it('renders items in vertical layout when layout="vertical"', () => {
      render(
        <DiscoverySection
          section={corridorSection}
          layout="vertical"
          testID="vertical-section"
        />
      );

      expect(screen.queryByTestId('vertical-section-horizontal-scroll')).toBeNull();
      expect(screen.getByText('Colombo–Kandy Maglev Corridor')).toBeTruthy();
      expect(screen.getByText('Ratmalana Skyport Feeder')).toBeTruthy();
    });

    it('renders items in grid layout when layout="grid"', () => {
      render(
        <DiscoverySection
          section={corridorSection}
          layout="grid"
          testID="grid-section"
        />
      );

      expect(screen.queryByTestId('grid-section-horizontal-scroll')).toBeNull();
      expect(screen.getByText('Colombo–Kandy Maglev Corridor')).toBeTruthy();
    });

    it('supports custom renderItem to override default card representation', () => {
      render(
        <DiscoverySection
          section={corridorSection}
          renderItem={(item, idx) => (
            <View key={item.id} testID={`custom-item-${idx}`}>
              <Text>{`Custom: ${item.title}`}</Text>
            </View>
          )}
          testID="custom-rendered-section"
        />
      );

      expect(screen.getByTestId('custom-item-0')).toBeTruthy();
      expect(screen.getByText('Custom: Colombo–Kandy Maglev Corridor')).toBeTruthy();
    });

    it('renders children slot beneath section content', () => {
      render(
        <DiscoverySection section={corridorSection} testID="children-section">
          <View testID="extra-footer-element">
            <Text>Accessory Footer</Text>
          </View>
        </DiscoverySection>
      );

      expect(screen.getByTestId('extra-footer-element')).toBeTruthy();
      expect(screen.getByText('Accessory Footer')).toBeTruthy();
    });
  });

  describe('Header Action Handling', () => {
    it('renders action button and fires onAction with category when pressed', () => {
      const handleAction = jest.fn();

      render(
        <DiscoverySection
          section={corridorSection}
          actionLabel="View all corridors"
          onAction={handleAction}
          testID="action-section"
        />
      );

      const actionButton = screen.getByTestId('action-section-action');
      expect(actionButton).toBeTruthy();
      expect(screen.getByText('View all corridors')).toBeTruthy();

      fireEvent.press(actionButton);
      expect(handleAction).toHaveBeenCalledTimes(1);
      expect(handleAction).toHaveBeenCalledWith('corridors');
    });

    it('omits action button when onAction or actionLabel is missing', () => {
      render(<DiscoverySection section={corridorSection} testID="no-action-section" />);
      expect(screen.queryByTestId('no-action-section-action')).toBeNull();
    });
  });

  describe('Empty, Loading, and Error States', () => {
    it('gracefully renders empty state card when items array is empty', () => {
      const emptySection: DiscoverySectionData = {
        ...corridorSection,
        id: 'sec-empty',
        items: []
      };

      render(<DiscoverySection section={emptySection} testID="empty-section" />);

      expect(screen.getByTestId('empty-section-empty')).toBeTruthy();
      expect(screen.getByText('No active transit vectors found in this corridor.')).toBeTruthy();
    });

    it('renders custom empty message when provided', () => {
      const emptySection: DiscoverySectionData = {
        ...corridorSection,
        id: 'sec-empty-custom',
        items: []
      };

      render(
        <DiscoverySection
          section={emptySection}
          emptyMessage="No available skyport connections at this hour."
          testID="empty-custom-section"
        />
      );

      expect(screen.getByText('No available skyport connections at this hour.')).toBeTruthy();
    });

    it('renders loading state when availability is "loading"', () => {
      const loadingSection: DiscoverySectionData = {
        ...corridorSection,
        id: 'sec-loading',
        availability: 'loading'
      };

      render(<DiscoverySection section={loadingSection} testID="loading-section" />);

      expect(screen.getByTestId('loading-section-loading')).toBeTruthy();
      expect(
        screen.getByText('Synchronizing featured corridors telemetry...')
      ).toBeTruthy();
    });

    it('renders error state when availability is "error"', () => {
      const errorSection: DiscoverySectionData = {
        ...corridorSection,
        id: 'sec-error',
        availability: 'error'
      };

      render(<DiscoverySection section={errorSection} testID="error-section" />);

      expect(screen.getByTestId('error-section-error')).toBeTruthy();
      expect(
        screen.getByText('Telemetry synchronization unavailable for this section.')
      ).toBeTruthy();
    });
  });

  describe('DiscoveryCategory & DiscoveryCategoryBadge Components', () => {
    it('DiscoveryCategoryBadge displays category icon and uppercase label', () => {
      render(
        <DiscoveryCategoryBadge category="hubs" testID="hubs-badge" />
      );

      expect(screen.getByTestId('hubs-badge')).toBeTruthy();
      expect(screen.getByText('HUBS')).toBeTruthy();
    });

    it('DiscoveryCategory pill displays category label and optional count', () => {
      render(
        <DiscoveryCategory
          category="modes"
          count={3}
          testID="modes-category-pill"
        />
      );

      expect(screen.getByTestId('modes-category-pill')).toBeTruthy();
      expect(screen.getByText('Modes')).toBeTruthy();
      expect(screen.getByText('3')).toBeTruthy();
    });

    it('interactive DiscoveryCategory responds to onPress with category', () => {
      const handlePress = jest.fn();

      render(
        <DiscoveryCategory
          category="experiences"
          isActive={false}
          onPress={handlePress}
          testID="interactive-exp-pill"
        />
      );

      const pill = screen.getByTestId('interactive-exp-pill');
      expect(pill.props.accessibilityRole).toBe('tab');
      expect(pill.props.accessibilityState.selected).toBe(false);

      fireEvent.press(pill);
      expect(handlePress).toHaveBeenCalledTimes(1);
      expect(handlePress).toHaveBeenCalledWith('experiences');
    });

    it('verifies DISCOVERY_CATEGORY_METADATA coverage for all four categories', () => {
      expect(DISCOVERY_CATEGORY_METADATA.corridors.shortLabel).toBe('Corridors');
      expect(DISCOVERY_CATEGORY_METADATA.hubs.shortLabel).toBe('Hubs');
      expect(DISCOVERY_CATEGORY_METADATA.modes.shortLabel).toBe('Modes');
      expect(DISCOVERY_CATEGORY_METADATA.experiences.shortLabel).toBe('Experiences');
    });
  });

  describe('Theme Mode & Appearance Support', () => {
    it('renders with light theme mode without errors', () => {
      render(
        <DiscoverySection
          section={corridorSection}
          themeMode="light"
          testID="light-section"
        />
      );

      expect(screen.getByTestId('light-section')).toBeTruthy();
      expect(screen.getByText('Featured Corridors')).toBeTruthy();
    });

    it('renders with dark theme mode without errors', () => {
      render(
        <DiscoverySection
          section={corridorSection}
          themeMode="dark"
          testID="dark-section"
        />
      );

      expect(screen.getByTestId('dark-section')).toBeTruthy();
      expect(screen.getByText('Featured Corridors')).toBeTruthy();
    });
  });
});
