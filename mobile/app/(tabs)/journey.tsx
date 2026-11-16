import React from 'react';
import { StyleSheet, View } from 'react-native';
import { ScreenWrapper } from '../../src/components/ScreenWrapper';
import { EmptyState } from '../../src/components/EmptyState';
import { theme } from '../../src/theme';

export default function JourneyScreen() {
  return (
    <ScreenWrapper title="MISSION ROUTE" subtitle="ACTIVE TRANSIT TIMELINE">
      <View style={styles.container}>
        <EmptyState
          title="Active Journey Timeline"
          message="Active route telemetry scaffolding is operational. Native turn-by-turn navigation will be implemented in Feature 02."
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
