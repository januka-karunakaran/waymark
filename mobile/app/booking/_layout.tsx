import React from 'react';
import { Stack } from 'expo-router';
import { theme } from '../../src/theme';

export default function BookingLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: theme.colors.abyssVoid }
      }}
    >
      <Stack.Screen name="index" options={{ headerShown: false }} />
    </Stack>
  );
}
