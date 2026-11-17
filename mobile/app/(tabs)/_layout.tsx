import React from 'react';
import { Platform } from 'react-native';
import { Tabs } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { TabBarIcon } from '../../src/components/navigation';
import { NAVIGATION_METRICS } from '../../src/constants/navigation';
import { theme } from '../../src/theme';

export default function TabLayout() {
  const insets = useSafeAreaInsets();

  const bottomPadding = insets.bottom > 0 ? insets.bottom : theme.spacing.spaceSm;
  const tabHeight =
    NAVIGATION_METRICS.baseBarHeight +
    (insets.bottom > 0 ? Math.max(insets.bottom - 8, 0) : 0);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarHideOnKeyboard: Platform.OS !== 'web',
        tabBarActiveTintColor: theme.colors.beaconGold,
        tabBarInactiveTintColor: theme.colors.textMuted,
        tabBarStyle: {
          backgroundColor: theme.colors.abyssVoid,
          borderTopColor: theme.colors.hudGhostBorder,
          borderTopWidth: 1,
          height: tabHeight,
          paddingBottom: bottomPadding,
          paddingTop: theme.spacing.spaceSm,
          elevation: 8,
          shadowColor: '#000000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.15,
          shadowRadius: 4
        },
        tabBarItemStyle: {
          minHeight: NAVIGATION_METRICS.minTouchTarget,
          paddingVertical: 2
        },
        tabBarLabelStyle: {
          fontSize: NAVIGATION_METRICS.labelFontSize,
          fontWeight: NAVIGATION_METRICS.labelFontWeightActive,
          marginTop: 2,
          letterSpacing: 0.2
        }
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarAccessibilityLabel: 'Home, Tab 1 of 5',
          tabBarButtonTestID: 'tab-home',
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon
              name="home"
              color={color}
              focused={focused}
              testID="tab-icon-home"
            />
          )
        }}
      />
      <Tabs.Screen
        name="map"
        options={{
          title: 'Live map',
          tabBarAccessibilityLabel: 'Live map, Tab 2 of 5',
          tabBarButtonTestID: 'tab-map',
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon
              name="map"
              color={color}
              focused={focused}
              testID="tab-icon-map"
            />
          )
        }}
      />
      <Tabs.Screen
        name="journey"
        options={{
          title: 'Journey',
          tabBarAccessibilityLabel: 'Journey, Tab 3 of 5',
          tabBarButtonTestID: 'tab-journey',
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon
              name="journey"
              color={color}
              focused={focused}
              testID="tab-icon-journey"
            />
          )
        }}
      />
      <Tabs.Screen
        name="oracle"
        options={{
          title: 'Oracle',
          tabBarAccessibilityLabel: 'Oracle, Tab 4 of 5',
          tabBarButtonTestID: 'tab-oracle',
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon
              name="oracle"
              color={color}
              focused={focused}
              testID="tab-icon-oracle"
            />
          )
        }}
      />
      <Tabs.Screen
        name="comfort"
        options={{
          title: 'Comfort',
          tabBarAccessibilityLabel: 'Comfort, Tab 5 of 5',
          tabBarButtonTestID: 'tab-comfort',
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon
              name="comfort"
              color={color}
              focused={focused}
              testID="tab-icon-comfort"
            />
          )
        }}
      />
    </Tabs>
  );
}
