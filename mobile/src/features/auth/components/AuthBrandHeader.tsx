import React from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import { Navigation } from 'lucide-react-native';
import { AppText } from '../../../components/typography/AppText';
import { theme } from '../../../theme';

export interface AuthBrandHeaderProps {
  /**
   * Primary title displayed prominently.
   */
  title: string;

  /**
   * Optional supporting subtitle or descriptive explanation.
   */
  subtitle?: string;

  /**
   * Avionics telemetry tag displayed above the title.
   * @default 'WAYMARK 2100'
   */
  badgeText?: string;

  /**
   * Optional system status tag (e.g. 'SYS.SECURE' or 'SYS.GUEST').
   */
  statusTag?: string;

  /**
   * Custom style for the header container.
   */
  style?: ViewStyle;

  /**
   * Optional test identifier.
   */
  testID?: string;
}

/**
 * AuthBrandHeader â€” Waymark 2100 branded header treatment for authentication screens.
 * Renders the navigational brand mark, system status pill, accessible heading, and subtitle.
 */
export const AuthBrandHeader: React.FC<AuthBrandHeaderProps> = ({
  title,
  subtitle,
  badgeText = 'WAYMARK 2100',
  statusTag,
  style,
  testID = 'auth-brand-header'
}) => {
  return (
    <View style={[styles.container, style]} testID={testID}>
      {/* Top Avionics Brand Ribbon */}
      <View style={styles.ribbon}>
        <View style={styles.brandBadge}>
          <Navigation
            size={14}
            color={theme.colors.beaconGold}
            style={styles.icon}
            accessible={false}
          />
          <AppText
            variant="caption"
            weight="semibold"
            style={styles.badgeLabel}
            testID={`${testID}-badge`}
          >
            {badgeText}
          </AppText>
        </View>

        {statusTag && (
          <View style={styles.statusPill}>
            <View style={styles.statusIndicator} />
            <AppText
              variant="caption"
              weight="medium"
              style={styles.statusText}
              testID={`${testID}-status-tag`}
            >
              {statusTag}
            </AppText>
          </View>
        )}
      </View>

      {/* Primary Heading */}
      <AppText
        variant="h1"
        accessibilityRole="header"
        style={styles.title}
        testID={`${testID}-title`}
      >
        {title}
      </AppText>

      {/* Supporting Subtitle */}
      {subtitle && (
        <AppText
          variant="body"
          style={styles.subtitle}
          testID={`${testID}-subtitle`}
        >
          {subtitle}
        </AppText>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: theme.spacing.spaceXl
  },
  ribbon: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.spaceSm
  },
  brandBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.spaceXs
  },
  icon: {
    transform: [{ rotate: '45deg' }]
  },
  badgeLabel: {
    color: theme.colors.beaconGold,
    letterSpacing: 1.5
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: theme.spacing.spaceSm,
    paddingVertical: 2,
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.deckInk,
    borderWidth: 1,
    borderColor: theme.colors.border
  },
  statusIndicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: theme.colors.beaconGold
  },
  statusText: {
    color: theme.colors.textMuted,
    fontSize: 10,
    letterSpacing: 1
  },
  title: {
    color: theme.colors.textPrimary,
    marginTop: theme.spacing.spaceXs,
    letterSpacing: 0.5
  },
  subtitle: {
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.spaceXs,
    lineHeight: 20
  }
});
