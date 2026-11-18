import React, { useState, useCallback } from 'react';
import { useRouter } from 'expo-router';
import { ScreenWrapper } from '../../src/components/ScreenWrapper';
import { NetworkStatusBanner } from '../../src/components/NetworkStatusBanner';
import {
  defaultHomeContent,
  HomeContent,
  HomeQuickPlaceNode,
  HomeSuggestionContent
} from '../../src/features/home';

export default function HomeScreen() {
  const router = useRouter();
  const [content, setContent] = useState(defaultHomeContent);
  const [refreshing, setRefreshing] = useState(false);

  const handleSelectSuggestion = (suggestion: HomeSuggestionContent) => {
    if (suggestion.targetScreen === 'journey') {
      router.push('/(tabs)/journey');
    }
  };

  const handleSelectPlace = (place: HomeQuickPlaceNode) => {
    if (place.id === 'place-airport' || place.destination) {
      router.push('/(tabs)/journey');
    }
  };

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    // Local simulation: preserves offline resilience without faking live API responses
    setTimeout(() => {
      setContent((prev) => ({
        ...prev,
        lastUpdatedTimestamp: Date.now()
      }));
      setRefreshing(false);
    }, 300);
  }, []);

  return (
    <ScreenWrapper>
      <NetworkStatusBanner />
      <HomeContent
        data={content}
        onSelectSuggestion={handleSelectSuggestion}
        onSelectPlace={handleSelectPlace}
        onRefresh={handleRefresh}
        refreshing={refreshing}
      />
    </ScreenWrapper>
  );
}
