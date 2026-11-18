import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { DiscoveryCard } from '../components/DiscoveryCard';
import {
  SAMPLE_CORRIDOR_ITEMS,
  SAMPLE_HUB_ITEMS,
  SAMPLE_MODE_ITEMS,
  SAMPLE_EXPERIENCE_ITEMS
} from '../data/discoveryContent';
import { DiscoveryItem } from '../types';

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

describe('DiscoveryCard Component & Interactions (Task 3.2.3)', () => {
  const sampleCorridor = SAMPLE_CORRIDOR_ITEMS[0]; // Colombo-Kandy Maglev Corridor
  const sampleHub = SAMPLE_HUB_ITEMS[0]; // Colombo Fort Central

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Card Presentation & Content Rendering', () => {
    it('renders item title, badge, description, and metadata summary', () => {
      render(<DiscoveryCard item={sampleCorridor} testID="corridor-card" />);

      expect(screen.getByTestId('corridor-card-title')).toBeTruthy();
      expect(screen.getByText('Colombo–Kandy Maglev Corridor')).toBeTruthy();
      expect(screen.getByTestId('corridor-card-badge')).toBeTruthy();
      expect(screen.getByText('LINE M4')).toBeTruthy();
      expect(screen.getByTestId('corridor-card-description')).toBeTruthy();
      expect(
        screen.getByText('High-speed magnetic levitation link through the Kadugannawa mountain pass.')
      ).toBeTruthy();
      expect(screen.getByTestId('corridor-card-meta')).toBeTruthy();
      expect(screen.getByText('34 min · Every 8 min · Line M4 · Step-free')).toBeTruthy();
    });

    it('renders action callout row with label and chevron when interactive', () => {
      render(
        <DiscoveryCard
          item={sampleCorridor}
          actionLabel="View corridor details"
          testID="corridor-card"
        />
      );

      expect(screen.getByTestId('corridor-card-action-row')).toBeTruthy();
      expect(screen.getByTestId('corridor-card-action-label')).toBeTruthy();
      expect(screen.getByText('View corridor details')).toBeTruthy();
    });

    it('renders gracefully when optional description is omitted', () => {
      const bareItem: DiscoveryItem = {
        id: 'bare-item',
        title: 'Simple Station',
        category: 'hubs',
        isSample: true,
        dataSource: 'sample_data'
      };

      render(<DiscoveryCard item={bareItem} testID="bare-card" />);

      expect(screen.getByText('Simple Station')).toBeTruthy();
      expect(screen.queryByTestId('bare-card-description')).toBeNull();
      expect(screen.queryByTestId('bare-card-meta')).toBeNull();
    });
  });

  describe('Truthful Telemetry & Sample Badging', () => {
    it('renders SAMPLE pill when item represents sample data', () => {
      render(<DiscoveryCard item={sampleCorridor} testID="corridor-card" />);

      expect(screen.getByTestId('corridor-card-sample-pill')).toBeTruthy();
      expect(screen.getByText('SAMPLE')).toBeTruthy();
    });

    it('hides SAMPLE pill when showSampleBadge is false', () => {
      render(
        <DiscoveryCard
          item={sampleCorridor}
          showSampleBadge={false}
          testID="corridor-card"
        />
      );

      expect(screen.queryByTestId('corridor-card-sample-pill')).toBeNull();
    });

    it('includes sample telemetry notice in accessibility label', () => {
      render(<DiscoveryCard item={sampleCorridor} testID="corridor-card" />);

      const card = screen.getByTestId('corridor-card');
      expect(card.props.accessibilityLabel).toContain('Sample telemetry');
    });
  });

  describe('Touch Interactions & Verified Routing', () => {
    it('invokes custom onPress callback with item model when pressed', () => {
      const handlePress = jest.fn();

      render(
        <DiscoveryCard
          item={sampleCorridor}
          onPress={handlePress}
          testID="interactive-card"
        />
      );

      fireEvent.press(screen.getByTestId('interactive-card'));
      expect(handlePress).toHaveBeenCalledTimes(1);
      expect(handlePress).toHaveBeenCalledWith(sampleCorridor);
    });

    it('navigates via router.push to verified destination when onPress is not provided', () => {
      render(<DiscoveryCard item={sampleCorridor} testID="router-card" />);

      fireEvent.press(screen.getByTestId('router-card'));
      expect(mockRouter.push).toHaveBeenCalledTimes(1);
      expect(mockRouter.push).toHaveBeenCalledWith('/(tabs)/journey');
    });

    it('navigates to verified map destination for hub cards', () => {
      render(<DiscoveryCard item={sampleHub} testID="hub-card" />);

      fireEvent.press(screen.getByTestId('hub-card'));
      expect(mockRouter.push).toHaveBeenCalledTimes(1);
      expect(mockRouter.push).toHaveBeenCalledWith('/(tabs)/map');
    });

    it('navigates to verified comfort destination for low-sensory experience card', () => {
      const lowSensory = SAMPLE_EXPERIENCE_ITEMS[0];
      render(<DiscoveryCard item={lowSensory} testID="comfort-card" />);

      fireEvent.press(screen.getByTestId('comfort-card'));
      expect(mockRouter.push).toHaveBeenCalledTimes(1);
      expect(mockRouter.push).toHaveBeenCalledWith('/(tabs)/comfort');
    });

    it('does not navigate or fire when disabled={true}', () => {
      const handlePress = jest.fn();

      render(
        <DiscoveryCard
          item={sampleCorridor}
          onPress={handlePress}
          disabled={true}
          testID="disabled-card"
        />
      );

      fireEvent.press(screen.getByTestId('disabled-card'));
      expect(handlePress).not.toHaveBeenCalled();
      expect(mockRouter.push).not.toHaveBeenCalled();
    });

    it('does not navigate or fire when item.isEnabled is explicitly false', () => {
      const disabledItem: DiscoveryItem = {
        ...sampleCorridor,
        id: 'disabled-item',
        isEnabled: false
      };

      render(<DiscoveryCard item={disabledItem} testID="disabled-item-card" />);

      fireEvent.press(screen.getByTestId('disabled-item-card'));
      expect(mockRouter.push).not.toHaveBeenCalled();
    });

    it('refuses to navigate to unverified, fake, or external URLs', () => {
      const untrustedItem: DiscoveryItem = {
        id: 'untrusted-route-item',
        title: 'Untrusted Destination',
        category: 'corridors',
        actionDestination: 'https://malicious.example.com/steal-telemetry',
        isSample: true,
        dataSource: 'sample_data'
      };

      render(<DiscoveryCard item={untrustedItem} testID="untrusted-card" />);

      // Non-interactive because destination is invalid
      fireEvent.press(screen.getByTestId('untrusted-card'));
      expect(mockRouter.push).not.toHaveBeenCalled();

      const card = screen.getByTestId('untrusted-card');
      expect(card.props.accessibilityRole).toBe('none');
    });
  });

  describe('Accessibility & Layouts', () => {
    it('sets accessibilityRole to "button" when actionable', () => {
      render(<DiscoveryCard item={sampleCorridor} testID="actionable-card" />);

      const card = screen.getByTestId('actionable-card');
      expect(card.props.accessibilityRole).toBe('button');
    });

    it('sets accessibilityRole to "none" when non-actionable', () => {
      const nonInteractiveItem: DiscoveryItem = {
        id: 'static-item',
        title: 'Informational Mode',
        category: 'modes',
        actionDestination: undefined,
        isSample: true,
        dataSource: 'sample_data'
      };

      render(<DiscoveryCard item={nonInteractiveItem} testID="static-card" />);

      const card = screen.getByTestId('static-card');
      expect(card.props.accessibilityRole).toBe('none');
    });

    it('renders with layout="vertical" without crashing', () => {
      render(
        <DiscoveryCard
          item={SAMPLE_MODE_ITEMS[0]}
          layout="vertical"
          testID="vertical-card"
        />
      );

      expect(screen.getByTestId('vertical-card')).toBeTruthy();
      expect(screen.getByText('Maglev High-Speed Rail')).toBeTruthy();
    });

    it('renders with layout="grid" without crashing', () => {
      render(
        <DiscoveryCard
          item={SAMPLE_MODE_ITEMS[1]}
          layout="grid"
          testID="grid-card"
        />
      );

      expect(screen.getByTestId('grid-card')).toBeTruthy();
      expect(screen.getByText('Autonomous Air Shuttle')).toBeTruthy();
    });

    it('supports light and dark themeMode props', () => {
      render(
        <DiscoveryCard
          item={sampleCorridor}
          themeMode="light"
          testID="light-card"
        />
      );
      expect(screen.getByTestId('light-card')).toBeTruthy();

      render(
        <DiscoveryCard
          item={sampleCorridor}
          themeMode="dark"
          testID="dark-card"
        />
      );
      expect(screen.getByTestId('dark-card')).toBeTruthy();
    });
  });
});
