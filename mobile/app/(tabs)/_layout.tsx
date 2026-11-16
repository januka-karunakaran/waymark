import React from 'react';
import { Tabs } from 'expo-router';
import {
  Home as HomeIcon,
  Map as MapIcon,
  Route as RouteIcon,
  Bot as BotIcon,
  Settings as SettingsIcon
} from 'lucide-react-native';
import { theme } from '../../src/theme';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: theme.colors.abyssVoid,
          borderTopColor: theme.colors.hudGhostBorder,
          borderTopWidth: 1,
          height: theme.spacing.layout.bottomNavHeight,
          paddingBottom: theme.spacing.spaceSm,
          paddingTop: theme.spacing.spaceSm
        },
        tabBarActiveTintColor: theme.colors.beaconGold,
        tabBarInactiveTintColor: theme.colors.textMuted,
        tabBarLabelStyle: {
          ...theme.typography.styles.labelMonoSm,
          fontSize: 9,
          marginTop: 2
        }
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size }) => <HomeIcon color={color} size={size} />
        }}
      />
      <Tabs.Screen
        name="map"
        options={{
          title: 'Live map',
          tabBarIcon: ({ color, size }) => <MapIcon color={color} size={size} />
        }}
      />
      <Tabs.Screen
        name="journey"
        options={{
          title: 'Journey',
          tabBarIcon: ({ color, size }) => <RouteIcon color={color} size={size} />
        }}
      />
      <Tabs.Screen
        name="oracle"
        options={{
          title: 'Oracle',
          tabBarIcon: ({ color, size }) => <BotIcon color={color} size={size} />
        }}
      />
      <Tabs.Screen
        name="comfort"
        options={{
          title: 'Comfort',
          tabBarIcon: ({ color, size }) => (
            <SettingsIcon color={color} size={size} />
          )
        }}
      />
    </Tabs>
  );
}
