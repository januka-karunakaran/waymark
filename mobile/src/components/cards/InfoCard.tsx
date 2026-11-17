import React from 'react';
import {
  View,
  StyleSheet,
  StyleProp,
  ViewStyle,
  GestureResponderEvent
} from 'react-native';
import { AppCard, AppCardVariant } from './AppCard';
import { CardHeader } from './CardHeader';
import { CardBody } from './CardBody';
import { CardFooter } from './CardFooter';
import { AppText } from '../typography';
import {
  theme as defaultTheme,
  darkTheme,
  lightTheme,
  spacing,
  radius
} from '../../theme';

export type InfoCardStatusVariant =
  | 'nominal'
  | 'advisory'
  | 'critical'
  | 'brand'
  | 'sky'
  | 'teal'
  | 'coral';

export interface InfoCardProps {
  /**
   * Primary title of the information card.
   */
  title: string;

  /**
   * Secondary subtitle displayed below the title.
   */
  subtitle?: string;

  /**
   * Main descriptive content.
   */
  description?: string;

  /**
   * Optional leading visual icon or transit mode badge.
   */
  leadingIcon?: React.ReactNode;

  /**
   * Status label displayed on the trailing edge (e.g. 'ON TIME', 'LIVE HUD').
   */
  status?: string;

  /**
   * Color variant for the status pill.
   * @default 'brand'
   */
  statusVariant?: InfoCardStatusVariant;

  /**
   * Metadata or timestamp displayed in the footer.
   */
  metadata?: string | React.ReactNode;

  /**
   * Supporting micro-copy displayed at the bottom of the body.
   */
  supportingText?: string;

  /**
   * Optional click/tap interaction callback.
   */
  onPress?: (event: GestureResponderEvent) => void;

  /**
   * Disables interaction when true.
   */
  disabled?: boolean;

  /**
   * Visual variant controlling background and border depth.
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
 * InfoCard — Versatile transit information card structured for Waymark
 * multimodal telemetry, route recommendations, and live status readouts.
 */
export const InfoCard: React.FC<InfoCardProps> = ({
  title,
  subtitle,
  description,
  leadingIcon,
  status,
  statusVariant = 'brand',
  metadata,
  supportingText,
  onPress,
  disabled = false,
  variant = 'default',
  themeMode,
  style,
  testID = 'info-card'
}) => {
  const effectiveMode = themeMode ?? defaultTheme.mode;
  const activeTheme = effectiveMode === 'light' ? lightTheme : darkTheme;

  const getStatusColor = (s: InfoCardStatusVariant) => {
    switch (s) {
      case 'nominal':
        return activeTheme.colors.statusNominal;
      case 'advisory':
        return activeTheme.colors.statusAdvisory;
      case 'critical':
        return activeTheme.colors.statusCritical;
      case 'sky':
        return activeTheme.colors.airSky;
      case 'teal':
        return activeTheme.colors.trainTeal;
      case 'coral':
        return activeTheme.colors.busCoral;
      case 'brand':
      default:
        return activeTheme.colors.beaconGold;
    }
  };

  const statusColor = getStatusColor(statusVariant);

  const statusBadge = status ? (
    <View
      style={[
        styles.statusBadge,
        {
          borderColor: statusColor,
          backgroundColor: `${statusColor}1A` // ~10% tint
        }
      ]}
      testID={`${testID}-status`}
    >
      <AppText
        variant="caption"
        weight="semibold"
        style={{ color: statusColor, textTransform: 'uppercase' }}
        themeMode={themeMode}
      >
        {status}
      </AppText>
    </View>
  ) : null;

  return (
    <AppCard
      variant={variant}
      onPress={onPress}
      disabled={disabled}
      themeMode={themeMode}
      style={style}
      testID={testID}
      accessibilityLabel={`${title}${status ? `, Status: ${status}` : ''}`}
    >
      <CardHeader
        title={title}
        subtitle={subtitle}
        leading={leadingIcon}
        trailing={statusBadge}
        themeMode={themeMode}
        testID={`${testID}-header`}
      />

      {description || supportingText ? (
        <CardBody testID={`${testID}-body`}>
          {description ? (
            <AppText
              variant="body"
              color="secondary"
              themeMode={themeMode}
              style={styles.description}
              testID={`${testID}-description`}
            >
              {description}
            </AppText>
          ) : null}

          {supportingText ? (
            <AppText
              variant="caption"
              color="muted"
              themeMode={themeMode}
              style={styles.supportingText}
              testID={`${testID}-supporting-text`}
            >
              {supportingText}
            </AppText>
          ) : null}
        </CardBody>
      ) : null}

      {metadata ? (
        <CardFooter
          metadata={metadata}
          themeMode={themeMode}
          testID={`${testID}-footer`}
        />
      ) : null}
    </AppCard>
  );
};

const styles = StyleSheet.create({
  statusBadge: {
    paddingHorizontal: spacing.spaceSm,
    paddingVertical: spacing.spaceXxs,
    borderRadius: radius.status, // 6px engineered corner
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center'
  },
  description: {
    lineHeight: 20
  },
  supportingText: {
    marginTop: spacing.spaceXs
  }
});
