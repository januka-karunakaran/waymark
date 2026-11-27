import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  Clock,
  ShieldCheck,
  AlertCircle,
  Compass
} from 'lucide-react-native';
import {
  BookingScreenShell,
  BookingHeader,
  BookingStatusNotice,
  BookingEmptyState,
  DepartureCard,
  FareDisplay,
  PassengerSelector
} from '../../../src/features/booking/components';
import {
  BookableDeparture,
  DepartureAvailability,
  TransitInventoryProvider,
  UnavailableInventoryProvider,
  FareQuoteProvider,
  UnavailableFareQuoteProvider,
  FareClass
} from '../../../src/features/booking';
import { useFareQuote } from '../../../src/features/booking/hooks/useFareQuote';
import { useBookingReview } from '../../../src/features/booking/context/BookingReviewContext';
import { AppCard } from '../../../src/components/cards';
import { AppText } from '../../../src/components/typography';
import { AppButton } from '../../../src/components/buttons';
import { LoadingIndicator } from '../../../src/components/LoadingIndicator';
import { theme } from '../../../src/theme';

export interface DepartureDetailsScreenProps {
  testInventoryProvider?: TransitInventoryProvider;
  testFareProvider?: FareQuoteProvider;
}

const DEFAULT_INVENTORY_PROVIDER = new UnavailableInventoryProvider();
const DEFAULT_FARE_PROVIDER = new UnavailableFareQuoteProvider();

export default function DepartureDetailsScreen({
  testInventoryProvider,
  testFareProvider
}: DepartureDetailsScreenProps = {}) {
  const router = useRouter();
  const params = useLocalSearchParams<{ departureId?: string }>();
  const departureId = params.departureId;

  const inventoryProvider = testInventoryProvider || DEFAULT_INVENTORY_PROVIDER;
  const fareProvider = testFareProvider || DEFAULT_FARE_PROVIDER;

  const [departure, setDeparture] = useState<BookableDeparture | null>(null);
  const [availability, setAvailability] = useState<DepartureAvailability | null>(null);
  const [isLoadingDeparture, setIsLoadingDeparture] = useState<boolean>(true);
  const [departureError, setDepartureError] = useState<string | null>(null);

  const [passengerCount, setPassengerCount] = useState<number>(1);
  const fareClass: FareClass = 'standard';

  const { setReviewSelection } = useBookingReview();

  // Load departure data
  const loadDepartureData = useCallback(async () => {
    if (!departureId || typeof departureId !== 'string' || !departureId.trim()) {
      setDeparture(null);
      setDepartureError('Invalid or missing departure identifier.');
      setIsLoadingDeparture(false);
      return;
    }

    setIsLoadingDeparture(true);
    setDepartureError(null);

    try {
      const depResult = await inventoryProvider.getDeparture(departureId);

      if (!depResult.success) {
        setDeparture(null);
        setDepartureError(depResult.error.message || 'Unable to retrieve departure details.');
      } else {
        const dep = depResult.data;
        // Strictly reject unverified sample data
        if (dep.inventorySource !== 'operator_verified') {
          setDeparture(null);
          setDepartureError('Unverified sample route data cannot be booked or reserved.');
        } else {
          setDeparture(dep);
          setDepartureError(null);

          // Check seat availability
          const availResult = await inventoryProvider.checkAvailability(departureId);
          if (availResult.success) {
            setAvailability(availResult.data);
          }
        }
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error resolving departure';
      setDeparture(null);
      setDepartureError(message);
    } finally {
      setIsLoadingDeparture(false);
    }
  }, [departureId, inventoryProvider]);

  useEffect(() => {
    loadDepartureData();
  }, [loadDepartureData]);

  // Hook for authoritative fare quotes
  const {
    quote,
    isLoading: isLoadingQuote,
    error: quoteError,
    readiness: fareReadiness
  } = useFareQuote({
    departureId: departure?.id,
    passengerCount,
    fareClass,
    fareProvider
  });

  const handleBack = () => {
    router.back();
  };

  const handleContinueToReview = () => {
    if (!departure || !quote) return;

    // Secure in-memory review state handoff
    setReviewSelection({
      departure,
      passengerCount,
      fareClass,
      fareQuote: quote
    });

    router.push('/booking/review');
  };

  // Expected Journey duration calculation
  const journeyDuration = useMemo(() => {
    if (!departure?.departureTime || !departure?.arrivalTime) return null;
    const depTime = new Date(departure.departureTime).getTime();
    const arrTime = new Date(departure.arrivalTime).getTime();
    if (isNaN(depTime) || isNaN(arrTime) || arrTime <= depTime) return null;
    const diffMinutes = Math.floor((arrTime - depTime) / (1000 * 60));
    const hours = Math.floor(diffMinutes / 60);
    const minutes = diffMinutes % 60;
    return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
  }, [departure]);

  if (isLoadingDeparture) {
    return (
      <BookingScreenShell testID="departure-details-loading-screen">
        <BookingHeader
          title="Trip Telemetry"
          subtitle="Querying verified transit operator..."
          onBack={handleBack}
          testID="departure-details-loading-header"
        />
        <View style={styles.centerContainer} testID="departure-details-loader">
          <LoadingIndicator size="large" />
          <AppText variant="bodySmall" style={styles.loadingText}>
            Validating corridor schedule and capacity...
          </AppText>
        </View>
      </BookingScreenShell>
    );
  }

  if (departureError || !departure) {
    return (
      <BookingScreenShell testID="departure-details-error-screen">
        <BookingHeader
          title="Departure Unavailable"
          subtitle="The requested departure could not be validated."
          onBack={handleBack}
          testID="departure-details-error-header"
        />
        <BookingEmptyState
          icon={AlertCircle}
          title="Unable to Load Departure"
          message={
            departureError ||
            'This departure could not be found or verified by an active transit operator.'
          }
          actionLabel="Return to Catalog"
          onAction={handleBack}
          secondaryActionLabel="Retry"
          onSecondaryAction={loadDepartureData}
          testID="departure-details-error-empty-state"
        />
      </BookingScreenShell>
    );
  }

  const isDepartureAvailable = departure.bookableStatus === 'available';
  const hasSeats = availability ? availability.isAvailable : true;
  const canContinueToReview =
    isDepartureAvailable && hasSeats && quote !== null && !isLoadingQuote;

  return (
    <BookingScreenShell scrollable={true} testID="departure-details-screen">
      <BookingHeader
        title="Trip Overview"
        subtitle={`${departure.originName} to ${departure.destinationName}`}
        onBack={handleBack}
        kicker="DEPARTURE DETAILS"
        testID="departure-details-header"
      />

      {/* Main Departure Card */}
      <DepartureCard
        departure={departure}
        testID="departure-details-main-card"
      />

      {/* Corridor Telemetry Card */}
      <AppCard variant="default" style={styles.telemetryCard} testID="departure-telemetry-card">
        <View style={styles.telemetryRow}>
          <View style={styles.telemetryItem}>
            <View style={styles.telemetryIconRow}>
              <Clock size={14} color={theme.colors.beaconGold} />
              <AppText variant="caption" weight="bold" style={styles.telemetryLabel}>
                TRANSIT TIME
              </AppText>
            </View>
            <AppText variant="h3" weight="bold" style={styles.telemetryValue}>
              {journeyDuration || 'Direct'}
            </AppText>
          </View>

          <View style={styles.telemetryItem}>
            <View style={styles.telemetryIconRow}>
              <Compass size={14} color={theme.colors.trainTeal} />
              <AppText variant="caption" weight="bold" style={styles.telemetryLabel}>
                NETWORK MODE
              </AppText>
            </View>
            <AppText variant="h3" weight="bold" style={styles.telemetryValue}>
              {(departure.transitMode || 'transit').toUpperCase()}
            </AppText>
          </View>

          <View style={styles.telemetryItem}>
            <View style={styles.telemetryIconRow}>
              <ShieldCheck size={14} color={theme.colors.statusNominal} />
              <AppText variant="caption" weight="bold" style={styles.telemetryLabel}>
                PROVENANCE
              </AppText>
            </View>
            <AppText variant="caption" weight="bold" style={styles.telemetryValueVerified}>
              OPERATOR VERIFIED
            </AppText>
          </View>
        </View>

        {availability && (
          <View style={styles.availabilityNoticeRow}>
            <AppText variant="caption" style={styles.availabilityNoticeText}>
              Verified Capacity: {availability.availableSeats !== undefined ? `${availability.availableSeats} seats remaining` : 'Seats available'}
              {availability.operatorNotice ? ` • ${availability.operatorNotice}` : ''}
            </AppText>
          </View>
        )}
      </AppCard>

      {/* Passenger Selection */}
      <PassengerSelector
        count={passengerCount}
        onChange={setPassengerCount}
        testID="departure-passenger-selector"
      />

      {/* Fare Quote Section */}
      <View style={styles.fareSectionContainer}>
        {fareReadiness !== 'ready' ? (
          <BookingStatusNotice
            variant="warning"
            title="Fare Quotes Inactive"
            message={
              quoteError ||
              'Authoritative fare quoting engine is currently not configured for this corridor.'
            }
            testID="departure-fare-status-notice"
          />
        ) : isLoadingQuote ? (
          <View style={styles.quoteLoadingContainer} testID="departure-quote-loading">
            <LoadingIndicator size="small" />
            <AppText variant="caption" style={styles.quoteLoadingText}>
              Calculating authoritative quote for {passengerCount} travelers...
            </AppText>
          </View>
        ) : quote ? (
          <FareDisplay quote={quote} testID="departure-fare-display" />
        ) : (
          <BookingStatusNotice
            variant="error"
            title="Unable to Quote Fare"
            message={quoteError || 'Failed to obtain an authoritative quote from provider.'}
            testID="departure-quote-error-notice"
          />
        )}
      </View>

      {/* Action Button: Continue to Review */}
      <View style={styles.actionContainer}>
        <AppButton
          title="Continue to Review"
          variant="primary"
          onPress={handleContinueToReview}
          disabled={!canContinueToReview}
          testID="departure-continue-review-button"
        />
      </View>
    </BookingScreenShell>
  );
}

const styles = StyleSheet.create({
  centerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.spaceXl * 2,
    gap: theme.spacing.spaceMd
  },
  loadingText: {
    color: theme.colors.textSecondary
  },
  telemetryCard: {
    backgroundColor: theme.colors.deckInk,
    borderRadius: theme.spacing.radii.card,
    borderColor: theme.colors.hudGhostBorder,
    borderWidth: 1,
    padding: theme.spacing.spaceMd,
    gap: theme.spacing.spaceSm
  },
  telemetryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start'
  },
  telemetryItem: {
    gap: 4
  },
  telemetryIconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4
  },
  telemetryLabel: {
    color: theme.colors.textSecondary,
    fontSize: 10
  },
  telemetryValue: {
    color: theme.colors.textPrimary
  },
  telemetryValueVerified: {
    color: theme.colors.statusNominal,
    marginTop: 2
  },
  availabilityNoticeRow: {
    borderTopWidth: 1,
    borderTopColor: theme.colors.hudGhostBorder,
    paddingTop: theme.spacing.spaceXs,
    marginTop: theme.spacing.spaceXs
  },
  availabilityNoticeText: {
    color: theme.colors.textSecondary,
    fontSize: 11
  },
  fareSectionContainer: {
    gap: theme.spacing.spaceSm
  },
  quoteLoadingContainer: {
    padding: theme.spacing.spaceMd,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.deckInk,
    borderRadius: theme.spacing.radii.card,
    borderWidth: 1,
    borderColor: theme.colors.hudGhostBorder,
    gap: theme.spacing.spaceSm
  },
  quoteLoadingText: {
    color: theme.colors.textSecondary
  },
  actionContainer: {
    marginTop: theme.spacing.spaceSm,
    marginBottom: theme.spacing.spaceLg
  }
});
