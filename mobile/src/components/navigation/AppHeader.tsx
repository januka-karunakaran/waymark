import React from 'react';
import {
  View,
  StyleSheet,
  StyleProp,
  ViewStyle
} from 'react-native';
import { Navigation } from 'lucide-react-native';
import { BackButton } from './BackButton';
import { AppText } from '../typography';
import {
  theme as defaultTheme,
  darkTheme,
  lightTheme,
  spacing,
  radius
} from '../../theme';

export type AppHeaderVariant = 'default' | 'compact' | 'detail';

export interface AppHeaderProps {
  /**
   * Main title of the screen header.
   * @default 'WAYMARK 2100'
   */
  title?: string;

  /**
   * Secondary subtitle displayed below the title.
   * @default 'PLANETARY TRANSIT NETWORK'
   */
  subtitle?: string;

  /**
   * Header visual layout variant.
   * @default 'default'
   */
  variant?: AppHeaderVariant;

  /**
   * Whether to display the contextual back button.
   * Automatically defaults to true for 'detail' variant.
   */
  showBackButton?: boolean;

  /**
   * Optional custom back action callback.
   */
  onBack?: () => void;

  /**
   * Accessible description for the back button.
   */
  backButtonAccessibilityLabel?: string;

  /**
   * Whether to display the Waymark brand mark icon.
   * Defaults to true in 'default' variant when no back button is present.
   */
  showBrandMark?: boolean;

  /**
   * Custom leading element overriding the brand mark or back button.
   */
  leading?: React.ReactNode;

  /**
   * Optional action buttons or triggers rendered on the trailing edge.
   */
  trailingActions?: React.ReactNode;

  /**
   * Optional system status tag (e.g. 'SYS.LIVE').
   */
  statusLabel?: string;

  /**
   * Whether to show the status pill badge.
   * Defaults to true in 'default' variant if statusLabel is provided or default.
   */
  showStatusPill?: boolean;

  /**
   * Theme mode override ('light' | 'dark').
   */
  themeMode?: 'light' | 'dark';

  /**
   * Custom style for the header container.
   */
  style?: StyleProp<ViewStyle>;

  /**
   * Test identifier.
   */
  testID?: string;
}

/**
 * AppHeader — Comprehensive screen header component supporting Waymark 2100
 * avionics branding, compact density variants, contextual back navigation,
 * and WCAG-compliant header actions.
 */
export const AppHeader: React.FC<AppHeaderProps> = ({
  title = 'WAYMARK 2100',
  subtitle = 'PLANETARY TRANSIT NETWORK',
  variant = 'default',
  showBackButton,
  onBack,
  backButtonAccessibilityLabel = 'Go back',
  showBrandMark,
  leading,
  trailingActions,
  statusLabel = 'SYS.LIVE',
  showStatusPill,
  themeMode,
  style,
  testID = 'app-header'
}) => {
  const effectiveMode = themeMode ?? defaultTheme.mode;
  const activeTheme = effectiveMode === 'light' ? lightTheme : darkTheme;

  const isDetailVariant = variant === 'detail';
  const isCompactVariant = variant === 'compact';

  const shouldShowBack = showBackButton ?? isDetailVariant;
  const shouldShowBrand =
    showBrandMark ?? (!shouldShowBack && !isCompactVariant);
  const shouldShowStatus =
    showStatusPill ?? (Boolean(statusLabel) && !isDetailVariant && !trailingActions);

  const headerHeight = isCompactVariant
    ? 52
    : spacing.layout.headerHeight; // 64

  const backgroundColor =
    effectiveMode === 'light'
      ? activeTheme.colors.surface
      : activeTheme.colors.abyssVoid;

  const borderColor =
    effectiveMode === 'light'
      ? activeTheme.colors.borderSubtle
      : activeTheme.colors.hudGhostBorder;

  return (
    <View
      style={[
        styles.header,
        {
          height: headerHeight,
          backgroundColor,
          borderBottomColor: borderColor
        },
        style
      ]}
      testID={testID}
    >
      <View style={styles.leftSection}>
        {leading ? (
          leading
        ) : shouldShowBack ? (
          <BackButton
            onPress={onBack}
            accessibilityLabel={backButtonAccessibilityLabel}
            themeMode={themeMode}
            testID={testID ? `${testID}-back-btn` : 'header-back-button'}
          />
        ) : shouldShowBrand ? (
          <View
            style={[
              styles.brandMark,
              {
                backgroundColor: activeTheme.colors.beaconGoldMuted,
                borderColor: activeTheme.colors.luminousEdge
              }
            ]}
            accessible={false}
            testID={`${testID}-brand-mark`}
          >
            <Navigation size={18} color={activeTheme.colors.beaconGold} />
          </View>
        ) : null}

        <View style={styles.titleColumn}>
          <AppText
            variant={isCompactVariant ? 'label' : 'h3'}
            weight="semibold"
            color="brand"
            accessibilityRole="header"
            allowFontScaling={true}
            style={[
              styles.brandTitle,
              isDetailVariant && styles.detailTitle
            ]}
            testID={`${testID}-title`}
          >
            {title}
          </AppText>

          {subtitle && !isCompactVariant ? (
            <AppText
              variant="caption"
              color="muted"
              allowFontScaling={true}
              style={styles.brandSubtitle}
              testID={`${testID}-subtitle`}
            >
              {subtitle}
            </AppText>
          ) : null}
        </View>
      </View>

      <View style={styles.rightSection}>
        {trailingActions ? (
          <View style={styles.trailingActions}>{trailingActions}</View>
        ) : shouldShowStatus && statusLabel ? (
          <View
            style={[
              styles.systemPill,
              {
                backgroundColor: activeTheme.colors.trainTealMuted,
                borderColor: activeTheme.colors.trainTealBorder
              }
            ]}
            testID={`${testID}-status-pill`}
          >
            <View
              style={[
                styles.pulseDot,
                { backgroundColor: activeTheme.colors.trainTeal }
              ]}
            />
            <AppText
              variant="caption"
              weight="semibold"
              style={{
                color: activeTheme.colors.trainTeal,
                fontSize: 9,
                letterSpacing: 0.8
              }}
              themeMode={themeMode}
            >
              {statusLabel}
            </AppText>
          </View>
        ) : null}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: spacing.margin,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    width: '100%'
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: spacing.spaceSm
  },
  brandMark: {
    width: 32,
    height: 32,
    borderRadius: radius.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.spaceSm
  },
  titleColumn: {
    justifyContent: 'center',
    flex: 1
  },
  brandTitle: {
    letterSpacing: 0.8
  },
  detailTitle: {
    marginLeft: spacing.spaceXs
  },
  brandSubtitle: {
    fontSize: 8,
    letterSpacing: 1.0,
    marginTop: 2
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end'
  },
  trailingActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.spaceXs
  },
  systemPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: radius.pill,
    borderWidth: 1
  },
  pulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3
  }
});
