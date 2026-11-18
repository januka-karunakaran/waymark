import React, { ReactNode } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ViewStyle
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { AppHeader, AppHeaderVariant } from './navigation/AppHeader';
import { theme } from '../theme';

export interface ScreenWrapperProps {
  /**
   * Screen body content rendered inside safe area boundaries.
   */
  children: ReactNode;

  /**
   * Main title rendered in the screen header.
   * @default 'WAYMARK 2100'
   */
  title?: string;

  /**
   * Subtitle rendered in the screen header.
   * @default 'PLANETARY TRANSIT NETWORK'
   */
  subtitle?: string;

  /**
   * Whether to render the telemetry status strip below the header.
   * @default true
   */
  showTelemetryStrip?: boolean;

  /**
   * Telemetry status message.
   * @default 'City network: running normally'
   */
  telemetryStatus?: string;

  /**
   * Telemetry latency readout.
   * @default 'LATENCY 4ms'
   */
  telemetryLatency?: string;

  /**
   * Header layout variant ('default' | 'compact' | 'detail').
   * @default 'default'
   */
  headerVariant?: AppHeaderVariant;

  /**
   * Whether to display contextual back navigation in the header.
   * @default false
   */
  showBackButton?: boolean;

  /**
   * Custom back action callback.
   */
  onBack?: () => void;

  /**
   * Optional trailing action triggers.
   */
  headerActions?: ReactNode;

  /**
   * Controls top header visibility.
   * @default true
   */
  showHeader?: boolean;

  /**
   * Custom container style applied to the inner body view.
   */
  style?: ViewStyle;
}

/**
 * ScreenWrapper — Primary structural scaffolding for Waymark mobile screens.
 * Integrates SafeAreaView, StatusBar, AppHeader, and telemetry status strips
 * without creating duplicate headers.
 */
export const ScreenWrapper: React.FC<ScreenWrapperProps> = ({
  children,
  title = 'WAYMARK 2100',
  subtitle = 'PLANETARY TRANSIT NETWORK',
  showTelemetryStrip = true,
  telemetryStatus = 'City network: running normally',
  telemetryLatency = 'LATENCY 4ms',
  headerVariant = 'default',
  showBackButton = false,
  onBack,
  headerActions,
  showHeader = true,
  style
}) => {
  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <StatusBar style="light" backgroundColor={theme.colors.abyssVoid} />

      {/* Top Header */}
      {showHeader ? (
        <AppHeader
          title={title}
          subtitle={subtitle}
          variant={headerVariant}
          showBackButton={showBackButton}
          onBack={onBack}
          trailingActions={headerActions}
          testID="screen-header"
        />
      ) : null}

      {/* Real-time Telemetry Strip */}
      {showTelemetryStrip && (telemetryStatus || telemetryLatency) ? (
        <View style={styles.telemetryStrip} testID="screen-telemetry-strip">
          {telemetryStatus ? (
            <View style={styles.telemetryStatusGroup}>
              <View style={styles.telemetryDot} />
              <Text style={styles.telemetryStatusText}>{telemetryStatus}</Text>
            </View>
          ) : (
            <View />
          )}
          {telemetryLatency ? (
            <Text style={styles.telemetryLatencyText}>{telemetryLatency}</Text>
          ) : null}
        </View>
      ) : null}

      {/* Screen Body */}
      <View style={[styles.body, style]}>{children}</View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.colors.abyssVoid
  },
  telemetryStrip: {
    paddingHorizontal: theme.spacing.margin,
    paddingVertical: 6,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.hudGhostSubtle,
    backgroundColor: theme.colors.deckInk
  },
  telemetryStatusGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6
  },
  telemetryDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: theme.colors.statusNominal
  },
  telemetryStatusText: {
    ...theme.typography.styles.labelMonoSm,
    fontSize: 10,
    color: theme.colors.textMuted
  },
  telemetryLatencyText: {
    ...theme.typography.styles.labelMonoSm,
    fontSize: 10,
    color: theme.colors.trainTeal
  },
  body: {
    flex: 1,
    backgroundColor: theme.colors.abyssVoid
  }
});
