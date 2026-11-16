import React from 'react';
import { StyleSheet, View } from 'react-native';
import { ScreenWrapper } from '../../src/components/ScreenWrapper';
import { EmptyState } from '../../src/components/EmptyState';
import { theme } from '../../src/theme';

export default function OracleScreen() {
  return (
    <ScreenWrapper title="ORACLE CONCIERGE" subtitle="AVIONICS AI ASSISTANT">
      <View style={styles.container}>
        <EmptyState
          title="Oracle Transit Concierge"
          message="AI conversational interface scaffolding is initialized. Multimodal transit concierge UI is assigned for Feature 02."
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
