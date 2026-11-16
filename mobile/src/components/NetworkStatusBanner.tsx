import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { WifiOff } from 'lucide-react-native';
import { useNetworkStatus } from '../hooks/useNetworkStatus';
import { theme } from '../theme';

export const NetworkStatusBanner: React.FC = () => {
  const { isConnected } = useNetworkStatus();

  if (isConnected) {
    return null;
  }

  return (
    <View
      style={styles.banner}
      accessibilityRole="alert"
      accessibilityLabel="Planetary transit link offline. Operating in localized cached telemetry mode."
      accessible={true}
    >
      <WifiOff size={16} color={theme.colors.statusAdvisory} />
      <Text style={styles.text}>
        TRANSIT LINK OFFLINE · RUNNING ON LOCAL TELEMETRY CACHE
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  banner: {
    backgroundColor: theme.colors.deckInk,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.statusAdvisory,
    paddingVertical: theme.spacing.spaceSm,
    paddingHorizontal: theme.spacing.spaceMd,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.spaceSm
  },
  text: {
    ...theme.typography.styles.labelMonoSm,
    color: theme.colors.statusAdvisory,
    letterSpacing: 0.8
  }
});
