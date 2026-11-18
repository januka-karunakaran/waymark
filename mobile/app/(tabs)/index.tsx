import React from 'react';
import { useRouter } from 'expo-router';
import { ScreenWrapper } from '../../src/components/ScreenWrapper';
import {
  defaultHomeContent,
  HomeContent,
  HomeQuickPlaceNode,
  HomeSuggestionContent
} from '../../src/features/home';

export default function HomeScreen() {
  const router = useRouter();
  const content = defaultHomeContent;

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

  return (
    <ScreenWrapper>
      <HomeContent
        data={content}
        onSelectSuggestion={handleSelectSuggestion}
        onSelectPlace={handleSelectPlace}
      />
    </ScreenWrapper>
  );
}
