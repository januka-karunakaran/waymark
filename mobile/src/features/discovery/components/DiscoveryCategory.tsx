import React from 'react';
import {
  Pressable,
  StyleProp,
  StyleSheet,
  View,
  ViewStyle
} from 'react-native';
import {
  Bus,
  Compass,
  MapPin,
  Plane,
  Route,
  Shield,
  Sparkles,
  TrainFront
} from 'lucide-react-native';
import { AppText } from '../../../components/typography';
import { theme as defaultTheme, darkTheme, lightTheme } from '../../../theme';
import type {
  DiscoveryCategory as DiscoveryCategoryType,
  DiscoveryIconToken
} from '../types';

/**
 * Verified metadata describing the four transit discovery categories.
 */
export const DISCOVERY_CATEGORY_METADATA: Record<
  DiscoveryCategoryType,
  {
    label: string;
    shortLabel: string;
    description: string;
    icon: DiscoveryIconToken;
  }
> = {
  corridors: {
    label: 'Featured Corridors',
    shortLabel: 'Corridors',
    description: 'High-speed inter-city connections across the island grid.',
    icon: 'train'
  },
  hubs: {
    label: 'Major Transit Hubs',
    shortLabel: 'Hubs',
    description: 'Multimodal transfer stations connecting regional and aerial networks.',
    icon: 'compass'
  },
  modes: {
    label: 'Transit Fleet Modes',
    shortLabel: 'Modes',
    description: 'Seamless transitions between rail, air, and automated road vehicles.',
    icon: 'bus'
  },
  experiences: {
    label: 'Curated Experiences',
    shortLabel: 'Experiences',
    description: 'Personalized transit profiles for quiet, scenic, and express travel.',
    icon: 'sparkles'
  }
};

/**
 * Helper to render semantic Lucide icons matching a discovery icon token.
 */
export const renderDiscoveryIcon = (
  token?: DiscoveryIconToken,
  size: number = 16,
  color: string = defaultTheme.colors.trainTeal
): React.ReactNode => {
  switch (token) {
    case 'route':
      return <Route size={size} color={color} />;
    case 'map-pin':
      return <MapPin size={size} color={color} />;
    case 'plane':
      return <Plane size={size} color={color} />;
    case 'train':
      return <TrainFront size={size} color={color} />;
    case 'bus':
      return <Bus size={size} color={color} />;
    case 'sparkles':
      return <Sparkles size={size} color={color} />;
    case 'shield':
      return <Shield size={size} color={color} />;
    case 'compass':
    default:
      return <Compass size={size} color={color} />;
  }
};

export interface DiscoveryCategoryBadgeProps {
  /** The transit category to display */
  category: DiscoveryCategoryType;
  /** Theme mode override ('light' | 'dark') */
  themeMode?: 'light' | 'dark';
  /** Automation test identifier */
  testID?: string;
  /** Custom container style */
  style?: StyleProp<ViewStyle>;
}

/**
 * DiscoveryCategoryBadge — Compact badge displaying category icon and label.
 */
export const DiscoveryCategoryBadge: React.FC<DiscoveryCategoryBadgeProps> = ({
  category,
  themeMode,
  testID = 'discovery-category-badge',
  style
}) => {
  const activeTheme = themeMode === 'light' ? lightTheme : darkTheme;
  const meta = DISCOVERY_CATEGORY_METADATA[category];

  return (
    <View
      style={[
        styles.badgeContainer,
        {
          backgroundColor:
            themeMode === 'light'
              ? activeTheme.colors.surface
              : 'rgba(45, 212, 191, 0.08)',
          borderColor:
            themeMode === 'light'
              ? activeTheme.colors.border
              : 'rgba(45, 212, 191, 0.25)'
        },
        style
      ]}
      testID={testID}
      accessibilityRole="text"
      accessibilityLabel={`Category: ${meta.label}`}
    >
      <View style={styles.badgeIcon}>
        {renderDiscoveryIcon(meta.icon, 12, activeTheme.colors.trainTeal)}
      </View>
      <AppText
        variant="caption"
        weight="semibold"
        color="brand"
        themeMode={themeMode}
        style={styles.badgeText}
      >
        {meta.shortLabel.toUpperCase()}
      </AppText>
    </View>
  );
};

export interface DiscoveryCategoryProps {
  /** The transit category */
  category: DiscoveryCategoryType;
  /** Whether this category tab/pill is currently selected */
  isActive?: boolean;
  /** Press handler if interactive */
  onPress?: (category: DiscoveryCategoryType) => void;
  /** Optional item count badge */
  count?: number;
  /** Theme mode override */
  themeMode?: 'light' | 'dark';
  /** Automation test identifier */
  testID?: string;
  /** Custom container style */
  style?: StyleProp<ViewStyle>;
  /** Custom accessibility label */
  accessibilityLabel?: string;
}

/**
 * DiscoveryCategory — Accessible category chip/pill supporting interactive selection
 * or static informational display with dynamic font scaling and theme tokens.
 */
export const DiscoveryCategory: React.FC<DiscoveryCategoryProps> = ({
  category,
  isActive = false,
  onPress,
  count,
  themeMode,
  testID = 'discovery-category',
  style,
  accessibilityLabel
}) => {
  const activeTheme = themeMode === 'light' ? lightTheme : darkTheme;
  const meta = DISCOVERY_CATEGORY_METADATA[category];
  const isInteractive = Boolean(onPress);

  const containerContent = (
    <>
      <View style={styles.pillIcon}>
        {renderDiscoveryIcon(
          meta.icon,
          14,
          isActive
            ? activeTheme.colors.textPrimary
            : activeTheme.colors.textSecondary
        )}
      </View>
      <AppText
        variant="label"
        weight={isActive ? 'semibold' : 'medium'}
        color={isActive ? 'primary' : 'secondary'}
        themeMode={themeMode}
      >
        {meta.shortLabel}
      </AppText>
      {typeof count === 'number' && (
        <View
          style={[
            styles.countBadge,
            {
              backgroundColor: isActive
                ? 'rgba(255, 255, 255, 0.2)'
                : 'rgba(255, 255, 255, 0.08)'
            }
          ]}
        >
          <AppText
            variant="caption"
            weight="semibold"
            color={isActive ? 'primary' : 'muted'}
            themeMode={themeMode}
            style={styles.countText}
          >
            {count}
          </AppText>
        </View>
      )}
    </>
  );

  const containerStyle: StyleProp<ViewStyle> = [
    styles.pillContainer,
    {
      backgroundColor: isActive
        ? activeTheme.colors.trainTeal
        : themeMode === 'light'
        ? activeTheme.colors.surface
        : activeTheme.colors.deckInk,
      borderColor: isActive
        ? activeTheme.colors.trainTeal
        : activeTheme.colors.border
    },
    style
  ];

  const effectiveAccessibilityLabel =
    accessibilityLabel ??
    `${meta.label}${typeof count === 'number' ? `, ${count} items` : ''}${
      isActive ? ', selected' : ''
    }`;

  if (isInteractive) {
    return (
      <Pressable
        onPress={() => onPress?.(category)}
        accessibilityRole="tab"
        accessibilityState={{ selected: isActive }}
        accessibilityLabel={effectiveAccessibilityLabel}
        testID={testID}
        style={({ pressed }) => [
          containerStyle,
          pressed && styles.pillPressed
        ]}
      >
        {containerContent}
      </Pressable>
    );
  }

  return (
    <View
      style={containerStyle}
      testID={testID}
      accessibilityRole="text"
      accessibilityLabel={effectiveAccessibilityLabel}
    >
      {containerContent}
    </View>
  );
};

const styles = StyleSheet.create({
  badgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: defaultTheme.radius.pill,
    borderWidth: 1,
    alignSelf: 'flex-start',
    gap: 4
  },
  badgeIcon: {
    justifyContent: 'center',
    alignItems: 'center'
  },
  badgeText: {
    fontSize: 10,
    letterSpacing: 0.8
  },
  pillContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: defaultTheme.spacing.md,
    paddingVertical: defaultTheme.spacing.xs,
    borderRadius: defaultTheme.radius.pill,
    borderWidth: 1,
    minHeight: 36,
    gap: 6
  },
  pillPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }]
  },
  pillIcon: {
    justifyContent: 'center',
    alignItems: 'center'
  },
  countBadge: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: defaultTheme.radius.pill,
    marginLeft: 2
  },
  countText: {
    fontSize: 11
  }
});
