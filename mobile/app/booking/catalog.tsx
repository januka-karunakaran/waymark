import React from 'react';
import {
  StyleSheet,
  View,
  FlatList,
  Pressable,
  ScrollView
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  Search,
  SlidersHorizontal,
  Compass,
  AlertCircle,
  RefreshCw,
  X
} from 'lucide-react-native';
import {
  BookingScreenShell,
  BookingHeader,
  BookingStatusNotice,
  BookingEmptyState,
  DepartureCard
} from '../../src/features/booking/components';
import {
  useTripCatalog,
  TransitModeFilter,
  CatalogSortOption
} from '../../src/features/booking/hooks/useTripCatalog';
import { BookableDeparture } from '../../src/features/booking/types/bookingTypes';
import { AppText } from '../../src/components/typography';
import { AppInput } from '../../src/components/forms';
import { LoadingIndicator } from '../../src/components/LoadingIndicator';
import { theme } from '../../src/theme';

const TRANSIT_MODES: { label: string; value: TransitModeFilter }[] = [
  { label: 'All Modes', value: 'all' },
  { label: 'Maglev', value: 'maglev' },
  { label: 'Hyperloop', value: 'hyperloop' },
  { label: 'Bus', value: 'bus' },
  { label: 'Air', value: 'air' }
];

const SORT_OPTIONS: { label: string; value: CatalogSortOption }[] = [
  { label: 'Earliest', value: 'earliest' },
  { label: 'Latest', value: 'latest' },
  { label: 'Duration', value: 'duration' }
];

export interface TicketCatalogScreenProps {
  testCatalogHook?: ReturnType<typeof useTripCatalog>;
}

export default function TicketCatalogScreen({ testCatalogHook }: TicketCatalogScreenProps = {}) {
  const router = useRouter();
  const hookResult = useTripCatalog();
  const catalog = testCatalogHook || hookResult;

  const {
    departures,
    rawDepartures,
    isLoading,
    error,
    readiness,
    searchQuery,
    setSearchQuery,
    selectedMode,
    setSelectedMode,
    sortOption,
    setSortOption,
    refresh
  } = catalog;

  const handleBack = () => {
    router.back();
  };

  const handleSelectDeparture = (departure: BookableDeparture) => {
    router.push({
      pathname: '/booking/departure/[departureId]',
      params: { departureId: departure.id }
    });
  };

  const renderHeader = () => (
    <View style={styles.headerContainer}>
      <BookingHeader
        title="Available Departures"
        subtitle="Search verified scheduled transit departures across regional corridors."
        onBack={handleBack}
        kicker="TRANSIT CATALOG"
        testID="catalog-header"
      />

      {/* Provider Status Notice */}
      {readiness !== 'ready' && (
        <BookingStatusNotice
          variant="warning"
          title="Live Catalog Inactive"
          message={
            error ||
            'Transit inventory engine is not configured. Live bookable departures are unavailable.'
          }
          testID="catalog-status-notice"
        />
      )}

      {/* Search Input Bar */}
      <View style={styles.searchBarContainer}>
        <AppInput
          label="Search Corridors or Services"
          placeholder="e.g. Colombo, Kandy, EXP-101..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          testID="catalog-search-input"
          accessibilityLabel="Search departures by origin, destination, or service identifier"
        />
        {searchQuery.length > 0 && (
          <Pressable
            onPress={() => setSearchQuery('')}
            style={styles.clearSearchButton}
            accessibilityRole="button"
            accessibilityLabel="Clear search text"
            testID="catalog-clear-search-button"
          >
            <X size={16} color={theme.colors.textSecondary} />
          </Pressable>
        )}
      </View>

      {/* Mode Filter Chips */}
      <View style={styles.filterSection}>
        <AppText variant="caption" weight="bold" style={styles.sectionLabel}>
          TRANSIT MODE
        </AppText>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.modeChipsScroll}
        >
          {TRANSIT_MODES.map((mode) => {
            const isSelected = selectedMode === mode.value;
            return (
              <Pressable
                key={mode.value}
                onPress={() => setSelectedMode(mode.value)}
                style={[
                  styles.filterChip,
                  isSelected && styles.filterChipActive
                ]}
                accessibilityRole="button"
                accessibilityState={{ selected: isSelected }}
                accessibilityLabel={`Filter by ${mode.label}`}
                testID={`catalog-filter-mode-${mode.value}`}
              >
                <AppText
                  variant="caption"
                  weight={isSelected ? 'bold' : 'regular'}
                  style={[
                    styles.filterChipText,
                    isSelected && styles.filterChipTextActive
                  ]}
                >
                  {mode.label}
                </AppText>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {/* Sort Options */}
      <View style={styles.sortSection}>
        <View style={styles.sortHeader}>
          <SlidersHorizontal size={14} color={theme.colors.textSecondary} />
          <AppText variant="caption" weight="bold" style={styles.sectionLabel}>
            SORT BY
          </AppText>
        </View>
        <View style={styles.sortChipsRow}>
          {SORT_OPTIONS.map((sort) => {
            const isSelected = sortOption === sort.value;
            return (
              <Pressable
                key={sort.value}
                onPress={() => setSortOption(sort.value)}
                style={[
                  styles.sortChip,
                  isSelected && styles.sortChipActive
                ]}
                accessibilityRole="button"
                accessibilityState={{ selected: isSelected }}
                accessibilityLabel={`Sort by ${sort.label}`}
                testID={`catalog-sort-${sort.value}`}
              >
                <AppText
                  variant="caption"
                  weight={isSelected ? 'bold' : 'regular'}
                  style={[
                    styles.sortChipText,
                    isSelected && styles.sortChipTextActive
                  ]}
                >
                  {sort.label}
                </AppText>
              </Pressable>
            );
          })}
        </View>
      </View>

      {/* Result Count and Status Header */}
      <View style={styles.resultsInfoRow}>
        <AppText variant="caption" style={styles.resultsCountText} testID="catalog-results-count">
          {isLoading
            ? 'Querying verified inventory...'
            : `${departures.length} ${departures.length === 1 ? 'departure' : 'departures'} found`}
        </AppText>
        {readiness === 'ready' && (
          <Pressable
            onPress={refresh}
            style={styles.refreshButton}
            accessibilityRole="button"
            accessibilityLabel="Refresh departures"
            testID="catalog-refresh-button"
          >
            <RefreshCw size={14} color={theme.colors.beaconGold} />
            <AppText variant="caption" style={styles.refreshButtonText}>
              Refresh
            </AppText>
          </Pressable>
        )}
      </View>
    </View>
  );

  const renderEmptyState = () => {
    if (isLoading) {
      return (
        <View style={styles.loadingContainer} testID="catalog-loading-indicator">
          <LoadingIndicator size="large" />
          <AppText variant="bodySmall" style={styles.loadingText}>
            Connecting to verified transit provider...
          </AppText>
        </View>
      );
    }

    if (readiness !== 'ready') {
      return (
        <BookingEmptyState
          icon={AlertCircle}
          title="Catalog Unavailable"
          message="Live transit inventory engine is currently not configured for this corridor. No fabricated departures are displayed."
          actionLabel="Return to Booking"
          onAction={handleBack}
          testID="catalog-unavailable-empty-state"
        />
      );
    }

    if (rawDepartures.length === 0) {
      return (
        <BookingEmptyState
          icon={Compass}
          title="No Scheduled Departures"
          message="No verified departures are currently scheduled on this transit corridor."
          actionLabel="Refresh Catalog"
          onAction={refresh}
          testID="catalog-no-departures-empty-state"
        />
      );
    }

    return (
      <BookingEmptyState
        icon={Search}
        title="No Matching Departures"
        message="No departures match your active filters or search term. Try adjusting your transit mode or search keyword."
        actionLabel="Clear Filters"
        onAction={() => {
          setSearchQuery('');
          setSelectedMode('all');
        }}
        testID="catalog-no-matches-empty-state"
      />
    );
  };

  return (
    <BookingScreenShell scrollable={false} testID="ticket-catalog-screen">
      <FlatList
        data={isLoading || readiness !== 'ready' ? [] : departures}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <DepartureCard
            departure={item}
            onSelect={handleSelectDeparture}
            testID={`departure-card-${item.id}`}
          />
        )}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmptyState}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />
    </BookingScreenShell>
  );
}

const styles = StyleSheet.create({
  listContent: {
    paddingBottom: theme.spacing.spaceXl,
    gap: theme.spacing.spaceMd
  },
  headerContainer: {
    gap: theme.spacing.spaceMd,
    marginBottom: theme.spacing.spaceSm
  },
  searchBarContainer: {
    position: 'relative'
  },
  clearSearchButton: {
    position: 'absolute',
    right: 12,
    top: 38,
    padding: 6
  },
  filterSection: {
    gap: theme.spacing.spaceXs
  },
  sectionLabel: {
    color: theme.colors.textSecondary,
    letterSpacing: 0.8,
    fontSize: 11
  },
  modeChipsScroll: {
    gap: theme.spacing.spaceSm,
    paddingVertical: theme.spacing.spaceXs
  },
  filterChip: {
    paddingHorizontal: theme.spacing.spaceMd,
    paddingVertical: 8,
    borderRadius: theme.spacing.radii.pill,
    backgroundColor: theme.colors.deckInk,
    borderWidth: 1,
    borderColor: theme.colors.hudGhostBorder
  },
  filterChipActive: {
    backgroundColor: theme.colors.beaconGold,
    borderColor: theme.colors.beaconGold
  },
  filterChipText: {
    color: theme.colors.textSecondary
  },
  filterChipTextActive: {
    color: theme.colors.deckInk
  },
  sortSection: {
    gap: theme.spacing.spaceXs
  },
  sortHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6
  },
  sortChipsRow: {
    flexDirection: 'row',
    gap: theme.spacing.spaceSm
  },
  sortChip: {
    paddingHorizontal: theme.spacing.spaceMd,
    paddingVertical: 6,
    borderRadius: theme.spacing.radii.sm,
    backgroundColor: theme.colors.deckInk,
    borderWidth: 1,
    borderColor: theme.colors.hudGhostBorder
  },
  sortChipActive: {
    borderColor: theme.colors.beaconGold,
    backgroundColor: theme.colors.deckInk
  },
  sortChipText: {
    color: theme.colors.textSecondary
  },
  sortChipTextActive: {
    color: theme.colors.beaconGold
  },
  resultsInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: theme.spacing.spaceXs,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.hudGhostBorder
  },
  resultsCountText: {
    color: theme.colors.textSecondary
  },
  refreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 4,
    paddingHorizontal: 8
  },
  refreshButtonText: {
    color: theme.colors.beaconGold,
    fontWeight: 'bold'
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.spaceXl * 2,
    gap: theme.spacing.spaceMd
  },
  loadingText: {
    color: theme.colors.textSecondary
  }
});
