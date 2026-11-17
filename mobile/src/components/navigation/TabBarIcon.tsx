import React from 'react';
import { View, StyleSheet } from 'react-native';
import {
  Home as HomeIcon,
  Map as MapIcon,
  Route as RouteIcon,
  Bot as BotIcon,
  Settings as SettingsIcon
} from 'lucide-react-native';
import { NAVIGATION_METRICS } from '../../constants/navigation';

export type TabIconName = 'home' | 'map' | 'journey' | 'oracle' | 'comfort';

export interface TabBarIconProps {
  name: TabIconName;
  color: string;
  focused: boolean;
  size?: number;
  testID?: string;
}

/**
 * TabBarIcon — Dedicated icon renderer for bottom navigation tabs,
 * featuring active state enhancement and screen reader decorative isolation.
 */
export const TabBarIcon: React.FC<TabBarIconProps> = ({
  name,
  color,
  focused,
  size,
  testID
}) => {
  const iconSize =
    size ??
    (focused
      ? NAVIGATION_METRICS.activeIconSize
      : NAVIGATION_METRICS.iconSize);

  const renderIcon = () => {
    switch (name) {
      case 'map':
        return <MapIcon color={color} size={iconSize} />;
      case 'journey':
        return <RouteIcon color={color} size={iconSize} />;
      case 'oracle':
        return <BotIcon color={color} size={iconSize} />;
      case 'comfort':
        return <SettingsIcon color={color} size={iconSize} />;
      case 'home':
      default:
        return <HomeIcon color={color} size={iconSize} />;
    }
  };

  return (
    <View
      style={[
        styles.iconContainer,
        focused && styles.activeIconContainer
      ]}
      accessible={false}
      testID={testID}
    >
      {renderIcon()}
      {focused ? <View style={[styles.activeIndicator, { backgroundColor: color }]} /> : null}
    </View>
  );
};

const styles = StyleSheet.create({
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: NAVIGATION_METRICS.minTouchTarget,
    minHeight: 28,
    position: 'relative'
  },
  activeIconContainer: {
    transform: [{ scale: 1.05 }]
  },
  activeIndicator: {
    position: 'absolute',
    bottom: -6,
    width: 14,
    height: 2,
    borderRadius: 1
  }
});
