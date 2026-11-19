/**
 * Waymark 2100 — Feature 03.4 Home Data Integration & Performance QA Suite
 * End-to-end integration verification for provider-driven state architecture,
 * asynchronous loading, pull-to-refresh, offline resilience, and navigation regression.
 */

import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react-native';
import { useRouter } from 'expo-router';
import { defaultHomeContent } from '../data/homeContent';
import { defaultDiscoveryPayload } from '../../discovery';
import { LocalHomeContentProvider } from '../providers';
import HomeScreen from '../../../../app/(tabs)/index';
import * as networkHook from '../../../hooks/useNetworkStatus';

// Mock expo-router
jest.mock('expo-router', () => ({
  useRouter: jest.fn(),
  useLocalSearchParams: jest.fn(() => ({}))
}));

describe('Feature 03.4 — Home Data Integration & State Management QA', () => {
  const mockRouter = {
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn()
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
  });

  describe('1. End-to-End Home Data Initialization & Provider Composition', () => {
    it('mounts HomeScreen and displays all provider-driven sections with verified defaults', async () => {
      render(<HomeScreen />);

      // Hero Greeting Section
      expect(screen.getByText('Good morning, navigator')).toBeTruthy();
      expect(screen.getByText(/Where would you like to/)).toBeTruthy();

      // Suggested Route Recommendation
      expect(screen.getByText('SUGGESTED ACTIVE ROUTE')).toBeTruthy();
      expect(screen.getByText('KDU Gate → Kandy City')).toBeTruthy();
      expect(screen.getByText('Start this route')).toBeTruthy();

      // Quick Destinations Node Shortcuts
      expect(screen.getByText('Quick Destinations')).toBeTruthy();
      expect(screen.getByText('Home')).toBeTruthy();
      expect(screen.getByText('Work')).toBeTruthy();
      expect(screen.getByText('Kandy')).toBeTruthy();
      expect(screen.getByText('Colombo')).toBeTruthy();
      expect(screen.getByText('Airport')).toBeTruthy();
      expect(screen.getByText('More')).toBeTruthy();

      // System Diagnostics Section
      expect(screen.getByText('TELEMETRY FOUNDATION ARCHITECTURE')).toBeTruthy();
      expect(screen.getByText('OPERATIONAL')).toBeTruthy();

      // Universal Accessibility Banner
      expect(
        screen.getByText('Universal step-free routes guaranteed across all nodes')
      ).toBeTruthy();

      // Discovery Multimodal Sections
      expect(screen.getByTestId('home-discovery-group')).toBeTruthy();
      expect(screen.getByText('Featured Corridors')).toBeTruthy();
      expect(screen.getByText('Major Transit Hubs')).toBeTruthy();
    });

    it('LocalHomeContentProvider guarantees deep copy immutability across reads', async () => {
      const provider = new LocalHomeContentProvider();

      const initialRead = await provider.getHomeContent();
      expect(initialRead.hero.title).toBe(defaultHomeContent.hero.title);

      // Attempt mutating nested arrays and properties
      initialRead.quickPlaces.push({
        id: 'place-tampered',
        label: 'Tampered Place',
        destination: 'Malicious Node',
        iconName: 'map-pin'
      });
      initialRead.hero.title = 'CORRUPTED HERO';

      const subsequentRead = await provider.getHomeContent();
      expect(subsequentRead.hero.title).toBe(defaultHomeContent.hero.title);
      expect(subsequentRead.quickPlaces.find((p) => p.id === 'place-tampered')).toBeUndefined();
    });
  });

  describe('2. Pull-to-Refresh & Provider Re-querying', () => {
    it('executes real provider refresh and retains user content upon completion', async () => {
      render(<HomeScreen />);

      // Trigger pull-to-refresh on ScrollView
      const scrollView = screen.getByTestId('home-content');
      expect(scrollView).toBeTruthy();

      const { refreshControl } = scrollView.props;
      expect(refreshControl).toBeDefined();

      await act(async () => {
        await refreshControl.props.onRefresh();
      });

      // Verify content remains intact after refresh
      expect(screen.getByText('Good morning, navigator')).toBeTruthy();
      expect(screen.getByText('KDU Gate → Kandy City')).toBeTruthy();
    });
  });

  describe('3. Offline Resilience & Network Disconnection Handling', () => {
    it('truthfully handles network disconnection with prominent banner and local availability', () => {
      const spy = jest.spyOn(networkHook, 'useNetworkStatus').mockReturnValue({
        isConnected: false,
        isInternetReachable: false,
        connectionType: 'none'
      });

      render(<HomeScreen />);

      // Verify truthful offline banner
      expect(
        screen.getByText('TRANSIT LINK OFFLINE · OPERATING WITH LOCAL DEFAULTS')
      ).toBeTruthy();

      // Local content remains accessible and interactive
      expect(screen.getByText('Good morning, navigator')).toBeTruthy();
      expect(screen.getByText('KDU Gate → Kandy City')).toBeTruthy();
      expect(screen.getByText('Home')).toBeTruthy();

      spy.mockRestore();
    });
  });

  describe('4. Navigation Safety & Contextual Handoff Regression', () => {
    it('navigates to Journey with contextual parameters when suggested route is selected', () => {
      render(<HomeScreen />);

      const startRouteBtn = screen.getByText('Start this route');
      fireEvent.press(startRouteBtn);

      expect(mockRouter.push).toHaveBeenCalledWith({
        pathname: '/(tabs)/journey',
        params: {
          destinationId: 'suggested-kdu-kandy',
          destinationName: 'KDU Gate → Kandy City',
          source: 'suggested_corridor'
        }
      });
    });

    it('navigates to Journey with contextual parameters when Airport shortcut is selected', () => {
      render(<HomeScreen />);

      const airportChip = screen.getByTestId('quick-place-place-airport');
      fireEvent.press(airportChip);

      expect(mockRouter.push).toHaveBeenCalledWith({
        pathname: '/(tabs)/journey',
        params: {
          destinationId: 'dest-airport',
          destinationName: 'Bandaranaike Skyport',
          source: 'quick_shortcut'
        }
      });
    });

    it('displays accessible guidance banner when unconfigured Home or Work location is selected', () => {
      render(<HomeScreen />);

      const homeChip = screen.getByTestId('quick-place-place-home');
      fireEvent.press(homeChip);

      expect(screen.getByTestId('home-guidance-banner')).toBeTruthy();
      expect(
        screen.getByText(/Home and Work locations have not been saved yet/i)
      ).toBeTruthy();

      // Dismiss notice
      const dismissBtn = screen.getByTestId('home-guidance-dismiss');
      fireEvent.press(dismissBtn);
      expect(screen.queryByTestId('home-guidance-banner')).toBeNull();
    });

    it('routes Discovery category header actions to verified application tabs', () => {
      render(<HomeScreen />);

      // Discovery section category navigation
      const corridorsSectionAction = screen.getByTestId(
        'home-discovery-section-corridors-action'
      );
      fireEvent.press(corridorsSectionAction);
      expect(mockRouter.push).toHaveBeenCalledWith('/(tabs)/journey');

      const hubsSectionAction = screen.getByTestId(
        'home-discovery-section-hubs-action'
      );
      fireEvent.press(hubsSectionAction);
      expect(mockRouter.push).toHaveBeenCalledWith('/(tabs)/map');

      const expSectionAction = screen.getByTestId(
        'home-discovery-section-experiences-action'
      );
      fireEvent.press(expSectionAction);
      expect(mockRouter.push).toHaveBeenCalledWith('/(tabs)/comfort');
    });
  });

  describe('5. Data Provenance & Timestamp Integrity Audit', () => {
    it('verifies that all Home and Discovery data models strictly retain sample provenance', () => {
      expect(defaultHomeContent.dataSource).toBe('sample_data');
      expect(defaultHomeContent.suggestion?.isSample).toBe(true);
      expect(defaultHomeContent.architectureStatus?.isDeveloperContent).toBe(true);
      expect(defaultHomeContent.accessibilityNotice.verificationLevel).toBe('informational');

      expect(defaultDiscoveryPayload.dataSource).toBe('sample_data');
      for (const section of defaultDiscoveryPayload.sections) {
        expect(section.items.length).toBeGreaterThan(0);
        for (const item of section.items) {
          expect(item.isSample).toBe(true);
          expect(item.dataSource).toBe('sample_data');
        }
      }
    });

    it('ensures provider source timestamps are never overwritten with fabricated Date.now() values', async () => {
      const fixedTimestamp = 1711111111000;
      const customProvider = new LocalHomeContentProvider({
        ...defaultHomeContent,
        lastUpdatedTimestamp: fixedTimestamp
      });

      const data = await customProvider.getHomeContent();
      expect(data.lastUpdatedTimestamp).toBe(fixedTimestamp);
      expect(data.lastUpdatedTimestamp).not.toBe(Date.now());
    });
  });
});
