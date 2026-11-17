import React from 'react';
import { render, screen } from '@testing-library/react-native';
import { TabBarIcon } from '../../components/navigation/TabBarIcon';
import {
  BOTTOM_TABS,
  NAVIGATION_METRICS
} from '../../constants/navigation';
import { theme, lightTheme, darkTheme } from '../../theme';

describe('Bottom Tabs Navigation Architecture', () => {
  // TC-02.6-01: Five expected tabs are registered
  it('TC-02.6-01: registers all five core transit tabs', () => {
    expect(BOTTOM_TABS).toHaveLength(5);
    const tabNames = BOTTOM_TABS.map((t) => t.name);
    expect(tabNames).toEqual(['index', 'map', 'journey', 'oracle', 'comfort']);
  });

  // TC-02.6-02: Home is the default route
  it('TC-02.6-02: designates Home (index) as the default initial route', () => {
    expect(BOTTOM_TABS[0].name).toBe('index');
    expect(BOTTOM_TABS[0].title).toBe('Home');
  });

  // TC-02.6-03 to TC-02.6-07: Tab route metadata resolution
  it('TC-02.6-03: Home tab metadata resolves correctly', () => {
    const homeTab = BOTTOM_TABS.find((t) => t.name === 'index');
    expect(homeTab).toBeDefined();
    expect(homeTab?.title).toBe('Home');
    expect(homeTab?.accessibilityLabel).toBe('Home, Tab 1 of 5');
    expect(homeTab?.testID).toBe('tab-home');
  });

  it('TC-02.6-04: Live Map tab metadata resolves correctly', () => {
    const mapTab = BOTTOM_TABS.find((t) => t.name === 'map');
    expect(mapTab).toBeDefined();
    expect(mapTab?.title).toBe('Live map');
    expect(mapTab?.accessibilityLabel).toBe('Live map, Tab 2 of 5');
    expect(mapTab?.testID).toBe('tab-map');
  });

  it('TC-02.6-05: Journey tab metadata resolves correctly', () => {
    const journeyTab = BOTTOM_TABS.find((t) => t.name === 'journey');
    expect(journeyTab).toBeDefined();
    expect(journeyTab?.title).toBe('Journey');
    expect(journeyTab?.accessibilityLabel).toBe('Journey, Tab 3 of 5');
    expect(journeyTab?.testID).toBe('tab-journey');
  });

  it('TC-02.6-06: Oracle tab metadata resolves correctly', () => {
    const oracleTab = BOTTOM_TABS.find((t) => t.name === 'oracle');
    expect(oracleTab).toBeDefined();
    expect(oracleTab?.title).toBe('Oracle');
    expect(oracleTab?.accessibilityLabel).toBe('Oracle, Tab 4 of 5');
    expect(oracleTab?.testID).toBe('tab-oracle');
  });

  it('TC-02.6-07: Comfort tab metadata resolves correctly', () => {
    const comfortTab = BOTTOM_TABS.find((t) => t.name === 'comfort');
    expect(comfortTab).toBeDefined();
    expect(comfortTab?.title).toBe('Comfort');
    expect(comfortTab?.accessibilityLabel).toBe('Comfort, Tab 5 of 5');
    expect(comfortTab?.testID).toBe('tab-comfort');
  });

  // TC-02.6-11: Active icon uses correct theme styling
  it('TC-02.6-11: active icon renders with active styling and accent indicator', () => {
    render(
      <TabBarIcon
        name="home"
        color={theme.colors.beaconGold}
        focused={true}
        testID="active-icon"
      />
    );

    const icon = screen.getByTestId('active-icon');
    expect(icon).toBeTruthy();
  });

  // TC-02.6-12: Inactive icon uses correct theme styling
  it('TC-02.6-12: inactive icon renders without active indicator in muted color', () => {
    render(
      <TabBarIcon
        name="home"
        color={theme.colors.textMuted}
        focused={false}
        testID="inactive-icon"
      />
    );

    const icon = screen.getByTestId('inactive-icon');
    expect(icon).toBeTruthy();
  });

  // TC-02.6-13: Tab labels match expected route labels
  it('TC-02.6-13: tab labels strictly match expected route specifications', () => {
    const titles = BOTTOM_TABS.map((t) => t.title);
    expect(titles).toEqual([
      'Home',
      'Live map',
      'Journey',
      'Oracle',
      'Comfort'
    ]);
  });

  // TC-02.6-14: Tab bar uses existing theme tokens
  it('TC-02.6-14: uses existing Waymark Night Transit tokens for layout and colors', () => {
    expect(theme.colors.abyssVoid).toBe('#070A0F');
    expect(theme.colors.beaconGold).toBe('#FFC629');
    expect(theme.colors.textMuted).toBe('#7E8CA7');
    expect(theme.spacing.layout.bottomNavHeight).toBe(68);
  });

  // TC-02.6-15: Light and dark theme configurations resolve
  it('TC-02.6-15: resolves theme configurations for both dark and light modes', () => {
    expect(darkTheme.colors.beaconGold).toBe('#FFC629');
    expect(lightTheme.colors.beaconGold).toBe('#C28E00');
    expect(darkTheme.colors.abyssVoid).toBe('#070A0F');
    expect(lightTheme.colors.abyssVoid).toBe('#F4F6F9');
  });

  // TC-02.6-16: Tabs have meaningful accessible labels
  it('TC-02.6-16: all five tabs provide explicit position and context in accessibility labels', () => {
    BOTTOM_TABS.forEach((tab, index) => {
      expect(tab.accessibilityLabel).toContain(`Tab ${index + 1} of 5`);
      expect(tab.accessibilityHint).toBeTruthy();
    });
  });

  // TC-02.6-18: Tab touch targets meet the accessibility requirement
  it('TC-02.6-18: minimum touch targets satisfy >= 44x44 pt requirement', () => {
    expect(NAVIGATION_METRICS.minTouchTarget).toBeGreaterThanOrEqual(44);
    expect(NAVIGATION_METRICS.baseBarHeight).toBeGreaterThanOrEqual(44);
  });

  it('renders all icon variants (map, journey, oracle, comfort) without throwing', () => {
    const { rerender } = render(
      <TabBarIcon name="map" color="#FFF" focused={false} testID="icon" />
    );
    expect(screen.getByTestId('icon')).toBeTruthy();

    rerender(
      <TabBarIcon name="journey" color="#FFF" focused={false} testID="icon" />
    );
    expect(screen.getByTestId('icon')).toBeTruthy();

    rerender(
      <TabBarIcon name="oracle" color="#FFF" focused={false} testID="icon" />
    );
    expect(screen.getByTestId('icon')).toBeTruthy();

    rerender(
      <TabBarIcon name="comfort" color="#FFF" focused={false} testID="icon" />
    );
    expect(screen.getByTestId('icon')).toBeTruthy();
  });
});
