import React from 'react';
import { StyleSheet, View } from 'react-native';
import { ScreenWrapper } from '../../src/components/ScreenWrapper';
import { EmptyState } from '../../src/components/EmptyState';
import { theme } from '../../src/theme';

export default function MapScreen() {
  return (
    <ScreenWrapper title="LIVE MAP" subtitle="MULTIMODAL RADAR HUD">
      <View style={styles.container}>
        <EmptyState
          title="Live Map Vector Canvas"
          message="Live radar vector map scaffolding is active. Full interactive SVG & map rendering will be integrated in Feature 02."
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
