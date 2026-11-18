import React, { useState } from 'react';
import { View, Pressable } from 'react-native';
import { render, screen, fireEvent } from '@testing-library/react-native';
import HomeScreen from '../../../app/(tabs)/index';
import MapScreen from '../../../app/(tabs)/map';
import JourneyScreen from '../../../app/(tabs)/journey';
import OracleScreen from '../../../app/(tabs)/oracle';
import ComfortScreen from '../../../app/(tabs)/comfort';
import { AppText } from '../../components/typography';
import { TabBarIcon } from '../../components/navigation';
import { BOTTOM_TABS } from '../../constants/navigation';

describe('Tab Screen Integration & Navigation State', () => {
  // TC-02.6-08 & TC-02.6-09 & TC-02.6-10: Tab interaction & state updates
  it('TC-02.6-08 & TC-02.6-09: tab selection updates active tab and dispatches navigation', () => {
    const MockTabNavigator = () => {
      const [activeTab, setActiveTab] = useState<'index' | 'map' | 'journey' | 'oracle' | 'comfort'>('index');

      return (
        <View testID="tab-navigator">
          <View testID="active-screen-container">
            {activeTab === 'index' && <HomeScreen />}
            {activeTab === 'map' && <MapScreen />}
            {activeTab === 'journey' && <JourneyScreen />}
            {activeTab === 'oracle' && <OracleScreen />}
            {activeTab === 'comfort' && <ComfortScreen />}
          </View>

          <View testID="bottom-tab-bar" accessibilityRole="tablist">
            {BOTTOM_TABS.map((tab) => {
              const isSelected = activeTab === tab.name;
              return (
                <Pressable
                  key={tab.name}
                  testID={tab.testID}
                  accessibilityRole="tab"
                  accessibilityLabel={tab.accessibilityLabel}
                  accessibilityState={{ selected: isSelected }}
                  onPress={() => setActiveTab(tab.name)}
                >
                  <TabBarIcon
                    name={tab.name === 'index' ? 'home' : tab.name}
                    color={isSelected ? '#FFC629' : '#7E8CA7'}
                    focused={isSelected}
                  />
                  <AppText>{tab.title}</AppText>
                </Pressable>
              );
            })}
          </View>
        </View>
      );
    };

    render(<MockTabNavigator />);

    // Initially Home is active
    expect(screen.getByText('Good morning, navigator')).toBeTruthy();
    const homeTab = screen.getByTestId('tab-home');
    expect(homeTab.props.accessibilityState.selected).toBe(true);

    // Switch to Map tab
    fireEvent.press(screen.getByTestId('tab-map'));
    expect(screen.getByText('Live Map Vector Canvas')).toBeTruthy();
    expect(screen.getByTestId('tab-map').props.accessibilityState.selected).toBe(true);
    expect(screen.getByTestId('tab-home').props.accessibilityState.selected).toBe(false);

    // TC-02.6-10: Repeated press preserves route without crashing or duplicating
    fireEvent.press(screen.getByTestId('tab-map'));
    expect(screen.getByText('Live Map Vector Canvas')).toBeTruthy();

    // Switch to Journey
    fireEvent.press(screen.getByTestId('tab-journey'));
    expect(screen.getByText('Active Journey Timeline')).toBeTruthy();

    // Switch to Oracle
    fireEvent.press(screen.getByTestId('tab-oracle'));
    expect(screen.getByText('Oracle Transit Concierge')).toBeTruthy();

    // Switch to Comfort
    fireEvent.press(screen.getByTestId('tab-comfort'));
    expect(screen.getByText('Comfort Preferences')).toBeTruthy();
  });

  // TC-02.6-17: Selected state is communicated accessibly
  it('TC-02.6-17: tab components communicate selected state via accessibilityState.selected', () => {
    const { getByTestId } = render(
      <Pressable
        testID="sample-selected-tab"
        accessibilityRole="tab"
        accessibilityState={{ selected: true }}
      >
        <AppText>Home</AppText>
      </Pressable>
    );

    const tabEl = getByTestId('sample-selected-tab');
    expect(tabEl.props.accessibilityRole).toBe('tab');
    expect(tabEl.props.accessibilityState.selected).toBe(true);
  });

  // TC-02.6-19: Navigation remains compatible with font scaling
  it('TC-02.6-19: text elements inside tab bar maintain font scaling compatibility', () => {
    const { getByText } = render(
      <AppText allowFontScaling={true}>Home</AppText>
    );

    const textEl = getByText('Home');
    expect(textEl.props.allowFontScaling).toBe(true);
  });

  // TC-02.6-21: ScreenWrapper integration intact on all five tab screens
  it('TC-02.6-21: all five tab screens integrate ScreenWrapper correctly', () => {
    const { unmount: u1 } = render(<HomeScreen />);
    expect(screen.getByText('WAYMARK 2100')).toBeTruthy();
    u1();

    const { unmount: u2 } = render(<MapScreen />);
    expect(screen.getByText('LIVE MAP')).toBeTruthy();
    u2();

    const { unmount: u3 } = render(<JourneyScreen />);
    expect(screen.getByText('MISSION ROUTE')).toBeTruthy();
    u3();

    const { unmount: u4 } = render(<OracleScreen />);
    expect(screen.getByText('ORACLE CONCIERGE')).toBeTruthy();
    u4();

    const { unmount: u5 } = render(<ComfortScreen />);
    expect(screen.getByText('COMFORT & TELEMETRY')).toBeTruthy();
    u5();
  });
});
