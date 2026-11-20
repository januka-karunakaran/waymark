import React from 'react';
import { Stack } from 'expo-router';
import { theme } from '../../src/theme';

/**
 * AuthLayout — Layout container for authentication routes.
 * Decouples account flows from the tab bar without creating duplicate headers.
 */
export default function AuthLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: theme.colors.abyssVoid },
        animation: 'fade'
      }}
    >
      <Stack.Screen name="account" options={{ headerShown: false }} />
    </Stack>
  );
}
