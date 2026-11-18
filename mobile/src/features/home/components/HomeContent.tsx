import React from 'react';
import {
  Pressable,
  RefreshControl,
  ScrollView,
  StyleProp,
  StyleSheet,
  View,
  ViewStyle,
  useWindowDimensions
} from 'react-native';
import {
  Briefcase,
  Compass,
  Home as HomeIcon,
  MapPin,
  MoreHorizontal,
  Plane,
  ShieldCheck,
  Zap
} from 'lucide-react-native';
import { AppText } from '../../../components/typography';
import { AppButton } from '../../../components/buttons';
import { AppCard } from '../../../components/cards';
import { LoadingIndicator } from '../../../components/LoadingIndicator';
import { ErrorState } from '../../../components/ErrorState';
import { EmptyState } from '../../../components/EmptyState';
import { theme as defaultTheme, darkTheme, lightTheme } from '../../../theme';
import {
  HomeScreenData,
  HomeQuickPlaceNode,
  HomeSuggestionContent
} from '../types';
import { defaultHomeContent } from '../data/homeContent';
import { sanitizeHomeScreenData } from '../utils/homePresentation';
import { HomeHero } from './HomeHero';
import { HomeSection } from './HomeSection';
import {
  DiscoveryCategory,
  DiscoveryCard,
  DiscoveryItem,
  DiscoveryPayload,
  DiscoverySection,
  defaultDiscoveryPayload
} from '../../discovery';

export interface HomeContentProps {
  /**
   * Strongly typed Home screen dataset.
   * If omitted or null, gracefully falls back to default verified content.
   */
  data?: HomeScreenData | null;

  /**
   * Explicit loading state override.
   */
  isLoading?: boolean;

  /**
   * Accessible status message displayed during loading state.
   */
  loadingMessage?: string;

  /**
   * Explicit error state override.
   */
  isError?: boolean;

  /**
   * User-friendly error message. Prevents exposure of internal error details.
   */
  errorMessage?: string;

  /**
   * Retry callback for error recovery. When supplied, displays retry button.
   */
  onRetry?: () => void;

  /**
   * Explicit empty state override.
   */
  isEmpty?: boolean;

  /**
   * Custom title displayed during empty state.
   */
  emptyTitle?: string;

  /**
   * Custom message displayed during empty state.
   */
  emptyMessage?: string;

  /**
   * Action callback triggered when user taps "Start this route" or suggestion card.
   */
  onSelectSuggestion?: (suggestion: HomeSuggestionContent) => void;

  /**
   * Action callback triggered when user taps a quick place node.
   */
  onSelectPlace?: (place: HomeQuickPlaceNode) => void;

  /**
   * Optional Discovery dataset containing multimodal transit corridors, hubs, modes, and experiences.
   * If omitted, falls back to default verified discovery dataset.
   * Pass null to explicitly disable discovery sections.
   */
  discoveryPayload?: DiscoveryPayload | null;

  /**
   * Action callback triggered when user taps an interactive discovery card.
   */
  onSelectDiscoveryItem?: (item: DiscoveryItem) => void;

  /**
   * Action callback triggered when user taps a discovery section header action.
   */
  onSelectDiscoveryCategory?: (category: DiscoveryCategory) => void;

  /**
   * Optional pull-to-refresh callback.
   */
  onRefresh?: () => void;

  /**
   * Whether pull-to-refresh is currently active.
   * @default false
   */
  refreshing?: boolean;

  /**
   * Custom style for the inner scroll container.
   */
  contentContainerStyle?: StyleProp<ViewStyle>;

  /**
   * Root test identifier for the content layout.
   * @default 'home-content'
   */
  testID?: string;

  /**
   * Theme mode override ('light' | 'dark').
   */
  themeMode?: 'light' | 'dark';
}

function renderPlaceIcon(iconName: string, color: string) {
  switch (iconName) {
    case 'home':
      return <HomeIcon size={18} color={color} />;
    case 'briefcase':
      return <Briefcase size={18} color={color} />;
    case 'map-pin':
      return <MapPin size={18} color={color} />;
    case 'compass':
      return <Compass size={18} color={color} />;
    case 'plane':
      return <Plane size={18} color={color} />;
    case 'more-horizontal':
    default:
      return <MoreHorizontal size={18} color={color} />;
  }
}

/**
 * HomeContent — Responsive, native layout container for Waymark Home.
 *
 * Implements smooth vertical scrolling, loading/empty/error states, tablet centering,
 * bottom-tab buffer margins, and explicit sample data demarcation.
 */
export const HomeContent: React.FC<HomeContentProps> = ({
  data = defaultHomeContent,
  isLoading = false,
  loadingMessage,
  isError = false,
  errorMessage,
  onRetry,
  isEmpty = false,
  emptyTitle,
  emptyMessage,
  onSelectSuggestion,
  onSelectPlace,
  discoveryPayload,
  onSelectDiscoveryItem,
  onSelectDiscoveryCategory,
  onRefresh,
  refreshing = false,
  contentContainerStyle,
  testID = 'home-content',
  themeMode
}) => {
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;
  const isCompact = width > 0 && width < 360;

  const effectiveMode = themeMode ?? defaultTheme.mode;
  const activeTheme = effectiveMode === 'light' ? lightTheme : darkTheme;

  const effectiveDiscoveryPayload =
    discoveryPayload === null
      ? null
      : discoveryPayload ?? defaultDiscoveryPayload;

  // 1. Sanitize incoming data to guard against malformed or corrupted payloads
  const sanitizedData = React.useMemo(() => {
    try {
      if (!data) return defaultHomeContent;
      return sanitizeHomeScreenData(data);
    } catch {
      return defaultHomeContent;
    }
  }, [data]);

  // 2. Evaluate state flags
  const isCurrentlyLoading =
    isLoading || data?.availability === 'loading';
  const isCurrentlyError =
    isError || data?.availability === 'error';
  const isCurrentlyEmpty =
    isEmpty ||
    data?.availability === 'empty' ||
    (sanitizedData &&
      !sanitizedData.hero &&
      !sanitizedData.suggestion &&
      (!sanitizedData.quickPlaces || sanitizedData.quickPlaces.length === 0));

  // 3. Render loading state
  if (isCurrentlyLoading) {
    return (
      <View
        style={[
          styles.stateWrapper,
          { backgroundColor: activeTheme.colors.abyssVoid }
        ]}
        testID={`${testID}-loading`}
      >
        <LoadingIndicator
          message={loadingMessage ?? 'Synchronizing transit telemetry...'}
          fullscreen={false}
          testID={`${testID}-loading-indicator`}
        />
      </View>
    );
  }

  // 4. Render error state
  if (isCurrentlyError) {
    return (
      <View
        style={[
          styles.stateWrapper,
          { backgroundColor: activeTheme.colors.abyssVoid }
        ]}
        testID={`${testID}-error`}
      >
        <ErrorState
          title="Telemetry Sync Disrupted"
          message={
            errorMessage ??
            'Unable to synchronize transit telemetry. Operating with local system defaults.'
          }
          onRetry={onRetry}
          retryLabel={onRetry ? 'Retry Transmission' : undefined}
          testID={`${testID}-error-state`}
        />
      </View>
    );
  }

  // 5. Render empty state
  if (isCurrentlyEmpty) {
    return (
      <View
        style={[
          styles.stateWrapper,
          { backgroundColor: activeTheme.colors.abyssVoid }
        ]}
        testID={`${testID}-empty`}
      >
        <EmptyState
          title={emptyTitle ?? 'No Transit Vectors Found'}
          message={
            emptyMessage ??
            'No active transit corridors or departure nodes are currently registered.'
          }
          actionLabel={onRetry ? 'Refresh Network' : undefined}
          onAction={onRetry}
          testID={`${testID}-empty-state`}
        />
      </View>
    );
  }

  const activeContent = sanitizedData;

  const responsiveInnerStyle: ViewStyle = {
    maxWidth: isTablet ? 680 : '100%',
    alignSelf: isTablet ? 'center' : 'stretch',
    width: '100%'
  };

  return (
    <ScrollView
      style={styles.scrollView}
      contentContainerStyle={[
        styles.scrollContent,
        {
          paddingHorizontal: isCompact
            ? activeTheme.spacing.gutterMobile
            : activeTheme.spacing.margin,
          paddingTop: activeTheme.spacing.spaceMd,
          paddingBottom:
            activeTheme.spacing.layout.bottomNavHeight +
            activeTheme.spacing.spaceXl
        },
        responsiveInnerStyle,
        contentContainerStyle
      ]}
      showsVerticalScrollIndicator={false}
      refreshControl={
        onRefresh ? (
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={activeTheme.colors.beaconGold}
            colors={[activeTheme.colors.beaconGold]}
          />
        ) : undefined
      }
      testID={testID}
      accessibilityRole="none"
    >
      {/* 1. Introductory Hero Section */}
      {Boolean(activeContent.hero) && (
        <HomeHero
          content={activeContent.hero}
          themeMode={themeMode}
          testID="home-hero"
        />
      )}

      {/* 2. Suggested Route Recommendation Card */}
      {Boolean(activeContent.suggestion) && (
        <HomeSection
          eyebrow="ACTIVE ROUTING"
          title="Suggested Corridor"
          testID="home-suggestion-section"
          themeMode={themeMode}
        >
          <AppCard
            variant="default"
            style={styles.suggestionCard}
            testID="home-suggestion-card"
            themeMode={themeMode}
          >
            <View style={styles.cardHeader}>
              <View style={styles.cardKickerGroup}>
                <Zap size={14} color={activeTheme.colors.abyssVoid} />
                <AppText
                  variant="caption"
                  weight="bold"
                  style={styles.cardKickerText}
                  testID="home-suggestion-kicker"
                >
                  {activeContent.suggestion!.kicker}
                </AppText>
              </View>
              <View style={styles.badge}>
                <AppText
                  variant="caption"
                  weight="bold"
                  style={styles.badgeText}
                  testID="home-suggestion-badge"
                >
                  {activeContent.suggestion!.badgeText}
                </AppText>
              </View>
            </View>

            <AppText
              variant="h2"
              weight="bold"
              style={styles.cardTitle}
              testID="home-suggestion-title"
            >
              {activeContent.suggestion!.title}
            </AppText>

            <AppText
              variant="bodySmall"
              style={styles.cardDescription}
              testID="home-suggestion-description"
            >
              {activeContent.suggestion!.description}
            </AppText>

            {/* Explicit Sample Data Demarcation */}
            {Boolean(activeContent.suggestion!.isSample) && (
              <View style={styles.sampleTagRow}>
                <AppText
                  variant="caption"
                  color="dim"
                  style={styles.sampleTagText}
                  testID="home-suggestion-sample-tag"
                >
                  SIMULATED CORRIDOR · LIVE TELEMETRY IN FEATURE 05
                </AppText>
              </View>
            )}

            {Boolean(activeContent.suggestion!.actionLabel) && (
              <View style={styles.cardActionRow}>
                <AppButton
                  label={activeContent.suggestion!.actionLabel}
                  variant="secondary"
                  size="md"
                  onPress={() =>
                    onSelectSuggestion?.(activeContent.suggestion!)
                  }
                  testID="home-suggestion-action"
                />
              </View>
            )}
          </AppCard>
        </HomeSection>
      )}

      {/* 3. Quick Destinations / Places Shortcuts */}
      {Array.isArray(activeContent.quickPlaces) &&
        activeContent.quickPlaces.length > 0 && (
          <HomeSection
            eyebrow="TRANSIT DIRECTORY"
            title="Quick Destinations"
            testID="home-quick-places-section"
            themeMode={themeMode}
          >
            <View
              style={styles.quickPlacesGrid}
              testID="home-quick-places-grid"
            >
              {activeContent.quickPlaces.map((place) => (
                <Pressable
                  key={place.id}
                  onPress={() => onSelectPlace?.(place)}
                  accessibilityRole="button"
                  accessibilityLabel={`Travel to ${place.destination}`}
                  testID={`quick-place-${place.id}`}
                  style={({ pressed }) => [
                    styles.placeChip,
                    pressed && styles.placeChipPressed
                  ]}
                >
                  <View style={styles.placeIconWrapper}>
                    {renderPlaceIcon(
                      place.iconName,
                      activeTheme.colors.beaconGold
                    )}
                  </View>
                  <AppText
                    variant="caption"
                    weight="semibold"
                    color="primary"
                    themeMode={themeMode}
                    numberOfLines={1}
                    style={styles.placeLabel}
                  >
                    {place.label}
                  </AppText>
                </Pressable>
              ))}
            </View>
          </HomeSection>
        )}

      {/* 4. Multimodal Transit Discovery Sections (Corridors, Hubs, Modes, Experiences) */}
      {Boolean(effectiveDiscoveryPayload?.sections?.length) && (
        <View style={styles.discoveryGroup} testID="home-discovery-group">
          {effectiveDiscoveryPayload!.sections.map((section) => (
            <DiscoverySection
              key={section.id}
              section={section}
              layout="horizontal"
              themeMode={themeMode}
              testID={`home-discovery-${section.id}`}
              actionLabel={section.category === 'corridors' ? 'View all' : 'Explore'}
              onAction={onSelectDiscoveryCategory}
              renderItem={
                onSelectDiscoveryItem
                  ? (item) => (
                      <DiscoveryCard
                        key={item.id}
                        item={item}
                        layout="horizontal"
                        themeMode={themeMode}
                        testID={`home-discovery-${section.id}-card-${item.id}`}
                        onPress={onSelectDiscoveryItem}
                      />
                    )
                  : undefined
              }
            />
          ))}
        </View>
      )}

      {/* 5. Telemetry Foundation Architecture Diagnostics */}
      {Boolean(activeContent.architectureStatus) && (
        <HomeSection
          eyebrow="AVIONICS STATUS"
          title="System Diagnostics"
          testID="home-architecture-section"
          themeMode={themeMode}
        >
          <AppCard
            variant="outlined"
            style={styles.panel}
            testID="home-architecture-card"
            themeMode={themeMode}
          >
            <View style={styles.panelTitleRow}>
              <AppText
                variant="caption"
                color="brand"
                weight="bold"
                themeMode={themeMode}
                style={styles.panelTitle}
                testID="home-architecture-title"
              >
                {activeContent.architectureStatus!.title}
              </AppText>
              <AppText
                variant="caption"
                color="success"
                weight="bold"
                themeMode={themeMode}
                style={styles.panelStatus}
                testID="home-architecture-status"
              >
                {activeContent.architectureStatus!.statusLabel}
              </AppText>
            </View>

            <View style={styles.moduleGrid}>
              {activeContent.architectureStatus!.modules.map((item) => (
                <View
                  style={styles.moduleItem}
                  key={item.id}
                  testID={`home-module-${item.id}`}
                >
                  <AppText
                    variant="caption"
                    color="muted"
                    themeMode={themeMode}
                    style={styles.moduleLabel}
                  >
                    {item.label}
                  </AppText>
                  <AppText
                    variant="bodySmall"
                    weight="medium"
                    color="primary"
                    tabularNums
                    themeMode={themeMode}
                    style={styles.moduleValue}
                  >
                    {item.value}
                  </AppText>
                </View>
              ))}
            </View>
          </AppCard>
        </HomeSection>
      )}

      {/* 5. Universal Accessibility Banner */}
      {Boolean(activeContent.accessibilityNotice?.message) && (
        <View
          style={styles.accessibilityRow}
          testID="home-accessibility-banner"
          accessibilityRole="summary"
        >
          <ShieldCheck size={18} color={activeTheme.colors.trainTeal} />
          <View style={styles.accessibilityTextGroup}>
            <AppText
              variant="bodySmall"
              color="secondary"
              themeMode={themeMode}
              style={styles.accessibilityText}
              testID="home-accessibility-text"
            >
              {activeContent.accessibilityNotice.message}
            </AppText>
            {activeContent.accessibilityNotice.verificationLevel ===
              'informational' && (
              <AppText
                variant="caption"
                color="muted"
                style={styles.accessibilityNoteText}
                testID="home-accessibility-level"
              >
                Informational baseline · Corridors mandate universal step-free access
              </AppText>
            )}
          </View>
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
    width: '100%'
  },
  scrollContent: {
    gap: defaultTheme.spacing.spaceLg
  },
  discoveryGroup: {
    gap: defaultTheme.spacing.spaceMd
  },
  stateWrapper: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    padding: defaultTheme.spacing.spaceLg
  },
  suggestionCard: {
    backgroundColor: defaultTheme.colors.beaconGold,
    borderRadius: defaultTheme.spacing.radii.card,
    padding: defaultTheme.spacing.spaceLg
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: defaultTheme.spacing.spaceSm
  },
  cardKickerGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6
  },
  cardKickerText: {
    color: defaultTheme.colors.beaconGoldText
  },
  badge: {
    backgroundColor: 'rgba(36, 26, 0, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4
  },
  badgeText: {
    fontSize: 9,
    color: defaultTheme.colors.beaconGoldText
  },
  cardTitle: {
    color: defaultTheme.colors.beaconGoldText,
    marginVertical: defaultTheme.spacing.spaceXs
  },
  cardDescription: {
    color: '#614900',
    marginBottom: defaultTheme.spacing.spaceSm
  },
  sampleTagRow: {
    marginBottom: defaultTheme.spacing.spaceMd,
    paddingVertical: 2,
    paddingHorizontal: 6,
    backgroundColor: 'rgba(36, 26, 0, 0.08)',
    borderRadius: 4,
    alignSelf: 'flex-start'
  },
  sampleTagText: {
    fontSize: 10,
    color: '#614900',
    letterSpacing: 0.6
  },
  cardActionRow: {
    marginTop: defaultTheme.spacing.spaceXs,
    alignSelf: 'flex-start'
  },
  quickPlacesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: defaultTheme.spacing.spaceSm
  },
  placeChip: {
    flexBasis: '31%',
    flexGrow: 1,
    minWidth: 96,
    minHeight: 64,
    backgroundColor: defaultTheme.colors.deckInk,
    borderRadius: defaultTheme.spacing.radii.md,
    borderWidth: 1,
    borderColor: defaultTheme.colors.hudGhostBorder,
    padding: defaultTheme.spacing.spaceSm,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 4
  },
  placeChipPressed: {
    backgroundColor: defaultTheme.colors.hudGhostSubtle,
    borderColor: defaultTheme.colors.beaconGold
  },
  placeIconWrapper: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 198, 41, 0.1)',
    justifyContent: 'center',
    alignItems: 'center'
  },
  placeLabel: {
    textAlign: 'center'
  },
  panel: {
    backgroundColor: defaultTheme.colors.deckInk,
    borderRadius: defaultTheme.spacing.radii.card,
    borderWidth: 1,
    borderColor: defaultTheme.colors.hudGhostBorder,
    padding: defaultTheme.spacing.spaceLg
  },
  panelTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: defaultTheme.colors.hudGhostSubtle,
    paddingBottom: defaultTheme.spacing.spaceSm,
    marginBottom: defaultTheme.spacing.spaceMd
  },
  panelTitle: {
    color: defaultTheme.colors.beaconGoldContainer
  },
  panelStatus: {
    fontSize: 9
  },
  moduleGrid: {
    gap: defaultTheme.spacing.spaceSm
  },
  moduleItem: {
    backgroundColor: defaultTheme.colors.abyssVoid,
    borderRadius: defaultTheme.spacing.radii.md,
    borderWidth: 1,
    borderColor: defaultTheme.colors.hudGhostSubtle,
    padding: defaultTheme.spacing.spaceMd,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  moduleLabel: {
    color: defaultTheme.colors.textMuted
  },
  moduleValue: {
    color: defaultTheme.colors.textPrimary
  },
  accessibilityRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: defaultTheme.spacing.spaceSm,
    padding: defaultTheme.spacing.spaceMd,
    borderRadius: defaultTheme.spacing.radii.md,
    borderWidth: 1,
    borderColor: defaultTheme.colors.trainTealBorder,
    backgroundColor: defaultTheme.colors.trainTealMuted
  },
  accessibilityTextGroup: {
    flex: 1,
    gap: 2
  },
  accessibilityText: {
    flex: 1
  },
  accessibilityNoteText: {
    fontSize: 11
  }
});
