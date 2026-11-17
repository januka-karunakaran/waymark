/**
 * Waymark Mobile Bottom Tab Navigation Specifications & Route Metadata
 */

export interface TabConfig {
  name: 'index' | 'map' | 'journey' | 'oracle' | 'comfort';
  title: string;
  accessibilityLabel: string;
  accessibilityHint: string;
  testID: string;
}

export const BOTTOM_TABS: readonly TabConfig[] = [
  {
    name: 'index',
    title: 'Home',
    accessibilityLabel: 'Home, Tab 1 of 5',
    accessibilityHint: 'Navigates to the Home transit dashboard',
    testID: 'tab-home'
  },
  {
    name: 'map',
    title: 'Live map',
    accessibilityLabel: 'Live map, Tab 2 of 5',
    accessibilityHint: 'Navigates to the multimodal radar vector map',
    testID: 'tab-map'
  },
  {
    name: 'journey',
    title: 'Journey',
    accessibilityLabel: 'Journey, Tab 3 of 5',
    accessibilityHint: 'Navigates to active mission route timeline',
    testID: 'tab-journey'
  },
  {
    name: 'oracle',
    title: 'Oracle',
    accessibilityLabel: 'Oracle, Tab 4 of 5',
    accessibilityHint: 'Navigates to multimodal avionics concierge',
    testID: 'tab-oracle'
  },
  {
    name: 'comfort',
    title: 'Comfort',
    accessibilityLabel: 'Comfort, Tab 5 of 5',
    accessibilityHint: 'Navigates to transit sensory calibration and preferences',
    testID: 'tab-comfort'
  }
] as const;

export const NAVIGATION_METRICS = {
  minTouchTarget: 44,
  baseBarHeight: 68,
  iconSize: 22,
  activeIconSize: 24,
  labelFontSize: 10,
  labelFontWeightActive: '600' as const,
  labelFontWeightInactive: '400' as const
} as const;
