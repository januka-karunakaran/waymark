import React, { useState, useCallback } from 'react';
import { useRouter, Href } from 'expo-router';
import { ScreenWrapper } from '../../src/components/ScreenWrapper';
import { NetworkStatusBanner } from '../../src/components/NetworkStatusBanner';
import {
  defaultHomeContent,
  HomeContent,
  HomeQuickPlaceNode,
  HomeSuggestionContent
} from '../../src/features/home';
import {
  DiscoveryCategory,
  DiscoveryItem,
  defaultDiscoveryPayload
} from '../../src/features/discovery';

export default function HomeScreen() {
  const router = useRouter();
  const [content, setContent] = useState(defaultHomeContent);
  const [discoveryPayload] = useState(defaultDiscoveryPayload);
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

  const handleSelectDiscoveryItem = (item: DiscoveryItem) => {
    if (item.actionDestination) {
      router.push(item.actionDestination as Href);
    }
  };

  const handleSelectDiscoveryCategory = (category: DiscoveryCategory) => {
    switch (category) {
      case 'corridors':
      case 'modes':
        router.push('/(tabs)/journey');
        break;
      case 'hubs':
        router.push('/(tabs)/map');
        break;
      case 'experiences':
        router.push('/(tabs)/comfort');
        break;
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
        discoveryPayload={discoveryPayload}
        onSelectSuggestion={handleSelectSuggestion}
        onSelectPlace={handleSelectPlace}
        onSelectDiscoveryItem={handleSelectDiscoveryItem}
        onSelectDiscoveryCategory={handleSelectDiscoveryCategory}
        onRefresh={handleRefresh}
        refreshing={refreshing}
      />
    </ScreenWrapper>
  );
}
