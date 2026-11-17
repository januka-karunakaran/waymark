import React from 'react';
import {
  View,
  StyleSheet,
  StyleProp,
  ViewStyle,
  GestureResponderEvent
} from 'react-native';
import { AppCard, AppCardVariant } from './AppCard';
import { AppText } from '../typography';
import {
  theme as defaultTheme,
  darkTheme,
  lightTheme,
  spacing,
  radius
} from '../../theme';

export type MetricTrend = 'up' | 'down' | 'neutral';

export interface MetricCardProps {
  /**
   * Title or label of the telemetry metric (e.g. 'ESTIMATED TRANSIT', 'SPEED').
   */
  title: string;

  /**
   * Primary metric reading (numeric or string representation).
   */
  value: string | number;

  /**
   * Optional unit of measurement (e.g. 'min', 'KM/H', 'm MSL').
   */
  unit?: string;

  /**
   * Supporting explanatory note or buffer details.
   */
  description?: string;

  /**
   * Explicit trend direction indicator.
   */
  trend?: MetricTrend;

  /**
   * Explicit text label accompanying the trend (e.g. '+0m buffer', '-5 min').
   */
  trendLabel?: string;

  /**
   * Optional leading telemetry icon.
   */
  leadingIcon?: React.ReactNode;

  /**
   * Optional interaction callback.
   */
  onPress?: (event: GestureResponderEvent) => void;

  /**
   * Disables interaction when true.
   */
  disabled?: boolean;

  /**
   * Visual variant controlling background depth.
   * @default 'default'
   */
  variant?: AppCardVariant;

  /**
   * Theme mode override ('light' | 'dark').
   */
  themeMode?: 'light' | 'dark';

  /**
   * Custom style for the card container.
   */
  style?: StyleProp<ViewStyle>;

  /**
   * Unique test identifier.
   */
  testID?: string;
}

/**
 * MetricCard — Telemetry readout card optimized for real-time transit telemetry,
 * speed vectors, and trip metrics with strict tabular numerals.
 */
export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  unit,
  description,
  trend,
  trendLabel,
  leadingIcon,
  onPress,
  disabled = false,
  variant = 'default',
  themeMode,
  style,
  testID = 'metric-card'
}) => {
  const effectiveMode = themeMode ?? defaultTheme.mode;
  const activeTheme = effectiveMode === 'light' ? lightTheme : darkTheme;

  const getTrendColor = (t?: MetricTrend) => {
    switch (t) {
      case 'up':
        return activeTheme.colors.statusNominal;
      case 'down':
        return activeTheme.colors.statusAdvisory;
      case 'neutral':
      default:
        return activeTheme.colors.textMuted;
    }
  };

  const trendColor = getTrendColor(trend);

  const accessibilityValueString = `${value}${unit ? ` ${unit}` : ''}`;
  const computedAccessibilityLabel = `${title}: ${accessibilityValueString}${
    trendLabel ? `, Trend: ${trendLabel}` : ''
  }${description ? `, ${description}` : ''}`;

  return (
    <AppCard
      variant={variant}
      onPress={onPress}
      disabled={disabled}
      themeMode={themeMode}
      style={style}
      testID={testID}
      accessibilityLabel={computedAccessibilityLabel}
    >
      <View style={styles.topRow}>
        <View style={styles.titleContainer}>
          {leadingIcon ? (
            <View style={styles.iconContainer}>{leadingIcon}</View>
          ) : null}
          <AppText
            variant="label"
            weight="semibold"
            color="secondary"
            themeMode={themeMode}
            style={styles.titleText}
            testID={`${testID}-title`}
          >
            {title}
          </AppText>
        </View>

        {trendLabel ? (
          <View
            style={[
              styles.trendBadge,
              {
                borderColor: trend ? trendColor : activeTheme.colors.borderSubtle,
                backgroundColor: trend ? `${trendColor}1A` : 'transparent'
              }
            ]}
            testID={`${testID}-trend`}
          >
            <AppText
              variant="caption"
              weight="medium"
              style={{ color: trend ? trendColor : activeTheme.colors.textMuted }}
              themeMode={themeMode}
            >
              {trendLabel}
            </AppText>
          </View>
        ) : null}
      </View>

      <View style={styles.valueRow}>
        <AppText
          variant="h1"
          weight="bold"
          color="primary"
          tabularNums={true}
          themeMode={themeMode}
          testID={`${testID}-value`}
        >
          {String(value)}
        </AppText>

        {unit ? (
          <AppText
            variant="bodySmall"
            weight="medium"
            color="secondary"
            themeMode={themeMode}
            style={styles.unitText}
            testID={`${testID}-unit`}
          >
            {unit}
          </AppText>
        ) : null}
      </View>

      {description ? (
        <AppText
          variant="caption"
          color="muted"
          themeMode={themeMode}
          style={styles.description}
          testID={`${testID}-description`}
        >
          {description}
        </AppText>
      ) : null}
    </AppCard>
  );
};

const styles = StyleSheet.create({
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: spacing.spaceXs
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1
  },
  iconContainer: {
    marginRight: spacing.spaceXs
  },
  titleText: {
    textTransform: 'uppercase',
    letterSpacing: 0.5
  },
  trendBadge: {
    paddingHorizontal: spacing.spaceXs,
    paddingVertical: 2,
    borderRadius: radius.pill,
    borderWidth: 1,
    marginLeft: spacing.spaceXs
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginTop: spacing.spaceXs
  },
  unitText: {
    marginLeft: spacing.spaceXs
  },
  description: {
    marginTop: spacing.spaceXs
  }
});
