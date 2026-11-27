import React from 'react';
import { Stack } from 'expo-router';
import { BookingReviewProvider } from '../../src/features/booking/context/BookingReviewContext';
import { theme } from '../../src/theme';

export default function BookingLayout() {
  return (
    <BookingReviewProvider>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: theme.colors.abyssVoid }
        }}
      >
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="catalog" options={{ headerShown: false }} />
        <Stack.Screen name="departure/[departureId]" options={{ headerShown: false }} />
        <Stack.Screen name="review" options={{ headerShown: false }} />
      </Stack>
    </BookingReviewProvider>
  );
}
