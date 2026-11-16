import React from 'react';
import { StyleSheet, View } from 'react-native';
import { ScreenWrapper } from '../../src/components/ScreenWrapper';
import { EmptyState } from '../../src/components/EmptyState';
import { theme } from '../../src/theme';

export default function ComfortScreen() {
  return (
    <ScreenWrapper title="COMFORT & TELEMETRY" subtitle="SENSORY CALIBRATION">
      <View style={styles.container}>
        <EmptyState
          title="Comfort Preferences"
          message="Sensory preferences and accessibility settings scaffolding is loaded. Interactive toggles will be integrated in Feature 02."
        />
      </View>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: theme.spacing.margin,
    justifyContent: 'center'
  }
});
