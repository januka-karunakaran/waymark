import React, { ReactNode } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ViewStyle
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Navigation } from 'lucide-react-native';
import { theme } from '../theme';

export interface ScreenWrapperProps {
  children: ReactNode;
  title?: string;
  subtitle?: string;
  showTelemetryStrip?: boolean;
  telemetryStatus?: string;
  telemetryLatency?: string;
  style?: ViewStyle;
}

export const ScreenWrapper: React.FC<ScreenWrapperProps> = ({
  children,
  title = 'WAYMARK 2100',
  subtitle = 'PLANETARY TRANSIT NETWORK',
  showTelemetryStrip = true,
  telemetryStatus = 'City network: running normally',
  telemetryLatency = 'LATENCY 4ms',
  style
}) => {
  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <StatusBar style="light" backgroundColor={theme.colors.abyssVoid} />

      {/* Top Header */}
      <View style={styles.header}>
        <View style={styles.brandLockup}>
          <View style={styles.brandMark}>
            <Navigation size={18} color={theme.colors.beaconGold} />
          </View>
          <View>
            <Text style={styles.brandTitle}>{title}</Text>
            <Text style={styles.brandSubtitle}>{subtitle}</Text>
          </View>
        </View>

        <View style={styles.systemPill}>
          <View style={styles.pulseDot} />
          <Text style={styles.systemPillText}>SYS.LIVE</Text>
        </View>
      </View>

      {/* Real-time Telemetry Strip */}
      {showTelemetryStrip && (
        <View style={styles.telemetryStrip}>
          <View style={styles.telemetryStatusGroup}>
            <View style={styles.telemetryDot} />
            <Text style={styles.telemetryStatusText}>{telemetryStatus}</Text>
          </View>
          <Text style={styles.telemetryLatencyText}>{telemetryLatency}</Text>
        </View>
      )}

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
  header: {
    height: theme.spacing.layout.headerHeight,
    paddingHorizontal: theme.spacing.margin,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.colors.abyssVoid,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.hudGhostBorder
  },
  brandLockup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.spaceSm
  },
  brandMark: {
    width: 32,
    height: 32,
    borderRadius: theme.spacing.radii.md,
    backgroundColor: theme.colors.beaconGoldMuted,
    borderWidth: 1,
    borderColor: theme.colors.luminousEdge,
    alignItems: 'center',
    justifyContent: 'center'
  },
  brandTitle: {
    ...theme.typography.styles.labelMonoMd,
    color: theme.colors.beaconGold,
    letterSpacing: 0.8
  },
  brandSubtitle: {
    ...theme.typography.styles.labelMonoSm,
    fontSize: 8,
    color: theme.colors.textMuted,
    letterSpacing: 1.0,
    marginTop: 2
  },
  systemPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: theme.spacing.radii.pill,
    backgroundColor: theme.colors.trainTealMuted,
    borderWidth: 1,
    borderColor: theme.colors.trainTealBorder
  },
  pulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: theme.colors.trainTeal
  },
  systemPillText: {
    ...theme.typography.styles.labelMonoSm,
    fontSize: 9,
    color: theme.colors.trainTeal,
    letterSpacing: 0.8
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
