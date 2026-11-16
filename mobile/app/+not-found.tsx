import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Link, Stack } from 'expo-router';
import { theme } from '../src/theme';

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: 'Corridor Not Found' }} />
      <View style={styles.container}>
        <Text style={styles.title}>404 — Transit Vector Missing</Text>
        <Text style={styles.message}>
          The requested navigational node does not exist in the 2100 planetary grid.
        </Text>
        <Link href="/" style={styles.link}>
          <Text style={styles.linkText}>Return to Central Hub</Text>
        </Link>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing.spaceLg,
    backgroundColor: theme.colors.abyssVoid
  },
  title: {
    ...theme.typography.styles.headlineMd,
    color: theme.colors.beaconGold,
    marginBottom: theme.spacing.spaceSm
  },
  message: {
    ...theme.typography.styles.bodyMd,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginBottom: theme.spacing.spaceLg
  },
  link: {
    paddingVertical: theme.spacing.spaceMd,
    paddingHorizontal: theme.spacing.spaceLg,
    backgroundColor: theme.colors.panelInk,
    borderRadius: theme.spacing.radii.button,
    borderWidth: 1,
    borderColor: theme.colors.luminousEdge
  },
  linkText: {
    ...theme.typography.styles.labelMonoMd,
    color: theme.colors.beaconGold
  }
});
