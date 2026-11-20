import React, { useState, useCallback, useRef, useEffect } from 'react';
import { AccessibilityInfo, Pressable, StyleSheet, View } from 'react-native';
import { useRouter, Href } from 'expo-router';
import { Info, User, X } from 'lucide-react-native';
import { ScreenWrapper } from '../../src/components/ScreenWrapper';
import { HeaderAction } from '../../src/components/navigation';
import { NetworkStatusBanner } from '../../src/components/NetworkStatusBanner';
import { AppText } from '../../src/components/typography';
import { theme } from '../../src/theme';
import {
  defaultHomeContent,
  HomeContent,
  HomeQuickPlaceNode,
  HomeSuggestionContent,
  resolveHomeQuickAction,
  useHomeData
} from '../../src/features/home';
import {
  DiscoveryCategory,
  DiscoveryItem
} from '../../src/features/discovery';

export default function HomeScreen() {
  const router = useRouter();
  const {
    homeData,
    discoveryPayload,
    isLoading,
    isRefreshing,
    homeError,
    refresh,
    reload
  } = useHomeData();
  const [guidanceMessage, setGuidanceMessage] = useState<string | null>(null);
  const [isNavigating, setIsNavigating] = useState(false);
  const isNavigatingRef = useRef(false);
  const navTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (navTimerRef.current) {
        clearTimeout(navTimerRef.current);
      }
    };
  }, []);

  const handleSelectSuggestion = useCallback(
    (suggestion: HomeSuggestionContent) => {
      if (isNavigatingRef.current) return;
      if (suggestion.targetScreen === 'journey') {
        isNavigatingRef.current = true;
        setIsNavigating(true);
        router.push({
          pathname: '/(tabs)/journey',
          params: {
            destinationId: suggestion.id,
            destinationName: suggestion.title,
            source: 'suggested_corridor'
          }
        } as unknown as Href);

        if (navTimerRef.current) clearTimeout(navTimerRef.current);
        navTimerRef.current = setTimeout(() => {
          isNavigatingRef.current = false;
          setIsNavigating(false);
        }, 500);
      }
    },
    [router]
  );

  const handleSelectPlace = useCallback(
    (place: HomeQuickPlaceNode) => {
      // Guard against double triggers / rapid clicks
      if (isNavigatingRef.current) return;

      const resolved = resolveHomeQuickAction(place);

      if (resolved.type === 'navigate' && resolved.targetRoute) {
        isNavigatingRef.current = true;
        setIsNavigating(true);
        setGuidanceMessage(null);

        if (resolved.destinationContext) {
          router.push({
            pathname: resolved.targetRoute as unknown as Href,
            params: {
              destinationId: resolved.destinationContext.destinationId,
              destinationName: resolved.destinationContext.destinationName,
              source: 'quick_shortcut'
            }
          } as unknown as Href);
        } else {
          router.push(resolved.targetRoute as Href);
        }

        if (navTimerRef.current) clearTimeout(navTimerRef.current);
        navTimerRef.current = setTimeout(() => {
          isNavigatingRef.current = false;
          setIsNavigating(false);
        }, 500);
      } else if (resolved.type === 'unconfigured') {
        const msg =
          resolved.userMessage ||
          'Home and Work locations have not been saved yet. Custom locations will be available in profile settings.';
        setGuidanceMessage(msg);
        try {
          AccessibilityInfo.announceForAccessibility(msg);
        } catch {
          // Graceful fallback when AccessibilityInfo is not available
        }
      } else if (resolved.type === 'in_page_focus') {
        setGuidanceMessage(null);
        try {
          AccessibilityInfo.announceForAccessibility(
            'Jumped to Multimodal Transit Discovery section'
          );
        } catch {
          // Graceful fallback
        }
      } else {
        if (resolved.userMessage) {
          setGuidanceMessage(resolved.userMessage);
          try {
            AccessibilityInfo.announceForAccessibility(resolved.userMessage);
          } catch {
            // Graceful fallback
          }
        }
      }
    },
    [router]
  );

  const handleSelectDiscoveryItem = useCallback(
    (item: DiscoveryItem) => {
      if (item.actionDestination) {
        router.push(item.actionDestination as Href);
      }
    },
    [router]
  );

  const handleSelectDiscoveryCategory = useCallback(
    (category: DiscoveryCategory) => {
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
    },
    [router]
  );

  const handleRefresh = useCallback(async () => {
    await refresh();
  }, [refresh]);

  return (
    <ScreenWrapper
      headerActions={
        <HeaderAction
          icon={<User size={18} color={theme.colors.beaconGold} />}
          label="Account Access"
          testID="home-header-account-action"
          onPress={() => router.push('/(auth)/account')}
        />
      }
    >
      <NetworkStatusBanner />
      {Boolean(guidanceMessage) && (
        <View
          style={styles.guidanceBanner}
          accessibilityRole="alert"
          accessibilityLiveRegion="polite"
          testID="home-guidance-banner"
        >
          <View style={styles.guidanceContent}>
            <Info
              size={16}
              color={theme.colors.beaconGold}
              style={styles.guidanceIcon}
            />
            <AppText
              variant="caption"
              weight="semibold"
              style={styles.guidanceText}
              testID="home-guidance-text"
            >
              {guidanceMessage}
            </AppText>
          </View>
          <Pressable
            onPress={() => setGuidanceMessage(null)}
            accessibilityRole="button"
            accessibilityLabel="Dismiss guidance notice"
            testID="home-guidance-dismiss"
            hitSlop={8}
            style={styles.guidanceDismissButton}
          >
            <X size={14} color={theme.colors.textMuted} />
          </Pressable>
        </View>
      )}
      <HomeContent
        data={homeData ?? defaultHomeContent}
        discoveryPayload={discoveryPayload}
        isLoading={isLoading && !homeData}
        isError={Boolean(homeError) && !homeData}
        errorMessage={homeError?.message}
        onRetry={reload}
        onSelectSuggestion={handleSelectSuggestion}
        onSelectPlace={handleSelectPlace}
        onSelectDiscoveryItem={handleSelectDiscoveryItem}
        onSelectDiscoveryCategory={handleSelectDiscoveryCategory}
        onRefresh={handleRefresh}
        refreshing={isRefreshing}
        isActionPending={isNavigating}
      />
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  guidanceBanner: {
    backgroundColor: theme.colors.deckInk,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.beaconGold,
    paddingVertical: theme.spacing.spaceSm,
    paddingHorizontal: theme.spacing.spaceMd,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: theme.spacing.spaceSm
  },
  guidanceContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.spaceSm
  },
  guidanceIcon: {
    flexShrink: 0
  },
  guidanceText: {
    flex: 1,
    color: theme.colors.beaconGold
  },
  guidanceDismissButton: {
    padding: 4,
    justifyContent: 'center',
    alignItems: 'center'
  }
});
