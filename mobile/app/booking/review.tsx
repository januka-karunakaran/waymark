import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import {
  ShieldCheck,
  Calendar,
  MapPin,
  Users,
  Compass,
  AlertTriangle
} from 'lucide-react-native';
import {
  BookingScreenShell,
  BookingHeader,
  BookingStatusNotice,
  BookingEmptyState,
  FareDisplay
} from '../../src/features/booking/components';
import { useBookingReview } from '../../src/features/booking/context/BookingReviewContext';
import { AppCard } from '../../src/components/cards';
import { AppText } from '../../src/components/typography';
import { AppButton } from '../../src/components/buttons';
import { theme } from '../../src/theme';

export interface BookingReviewScreenProps {
  testReviewHook?: ReturnType<typeof useBookingReview>;
}

export default function BookingReviewScreen({ testReviewHook }: BookingReviewScreenProps = {}) {
  const router = useRouter();
  const defaultHook = useBookingReview();
  const { reviewState, isReviewValid, clearReviewSelection } = testReviewHook || defaultHook;

  const { departure, passengerCount, fareClass, fareQuote } = reviewState;

  const handleReturnToCatalog = () => {
    clearReviewSelection();
    router.replace('/booking/catalog');
  };

  const handleBack = () => {
    router.back();
  };

  // Direct route access guard: If opened without a valid review state
  if (!isReviewValid || !departure || !fareQuote) {
    return (
      <BookingScreenShell testID="booking-review-empty-screen">
        <BookingHeader
          title="Trip Review"
          subtitle="Pre-booking summary and itinerary verification."
          onBack={handleReturnToCatalog}
          kicker="WAYMARK 2100"
          testID="booking-review-empty-header"
        />
        <BookingEmptyState
          icon={AlertTriangle}
          title="No Active Selection"
          message="No verified departure or valid fare quote is currently selected for review. Please select a scheduled trip from the catalog."
          actionLabel="Browse Catalog"
          onAction={handleReturnToCatalog}
          testID="booking-review-empty-state"
        />
      </BookingScreenShell>
    );
  }

  const formatTime = (isoString: string) => {
    try {
      const d = new Date(isoString);
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return isoString;
    }
  };

  const formatDate = (isoString: string) => {
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString([], {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    } catch {
      return isoString;
    }
  };

  return (
    <BookingScreenShell scrollable={true} testID="booking-review-screen">
      <BookingHeader
        title="Review Your Journey"
        subtitle="Verify itinerary details and authoritative fare quote before reservation."
        onBack={handleBack}
        kicker="TRIP SUMMARY"
        testID="booking-review-header"
      />

      {/* Corridor & Operator Summary Card */}
      <AppCard variant="default" style={styles.summaryCard} testID="booking-review-corridor-card">
        <View style={styles.cardHeader}>
          <View style={styles.operatorRow}>
            <AppText variant="caption" weight="bold" style={styles.operatorText}>
              {departure.operatorId.toUpperCase()}
            </AppText>
            <View style={styles.verifiedBadge}>
              <ShieldCheck size={12} color={theme.colors.success} />
              <AppText variant="caption" style={styles.verifiedText}>
                VERIFIED OPERATOR
              </AppText>
            </View>
          </View>
          <AppText variant="caption" style={styles.serviceIdText}>
            {departure.serviceIdentifier}
          </AppText>
        </View>

        {/* Route Details */}
        <View style={styles.routeRow}>
          <View style={styles.nodeColumn}>
            <AppText variant="h3" weight="bold" style={styles.timeText}>
              {formatTime(departure.departureTime)}
            </AppText>
            <View style={styles.stationRow}>
              <MapPin size={12} color={theme.colors.info} />
              <AppText variant="caption" style={styles.stationName}>
                {departure.originName}
              </AppText>
            </View>
          </View>

          <View style={styles.dividerCol}>
            <View style={styles.line} />
            <AppText variant="caption" style={styles.modeBadge}>
              {(departure.transitMode || 'transit').toUpperCase()}
            </AppText>
          </View>

          <View style={[styles.nodeColumn, styles.alignRight]}>
            <AppText variant="h3" weight="bold" style={styles.timeText}>
              {departure.arrivalTime ? formatTime(departure.arrivalTime) : '—'}
            </AppText>
            <View style={styles.stationRow}>
              <MapPin size={12} color={theme.colors.beaconGold} />
              <AppText variant="caption" style={styles.stationName}>
                {departure.destinationName}
              </AppText>
            </View>
          </View>
        </View>

        {/* Date & Service Metadata */}
        <View style={styles.metaRow}>
          <View style={styles.metaItem}>
            <Calendar size={14} color={theme.colors.textSecondary} />
            <AppText variant="caption" style={styles.metaText}>
              {formatDate(departure.departureTime)}
            </AppText>
          </View>
          <View style={styles.metaItem}>
            <Users size={14} color={theme.colors.beaconGold} />
            <AppText variant="caption" style={styles.metaText}>
              {passengerCount} {passengerCount === 1 ? 'Traveler' : 'Travelers'}
            </AppText>
          </View>
          {fareClass && (
            <View style={styles.metaItem}>
              <Compass size={14} color={theme.colors.trainTeal} />
              <AppText variant="caption" style={styles.metaText}>
                {fareClass.toUpperCase()}
              </AppText>
            </View>
          )}
        </View>
      </AppCard>

      {/* Authoritative Fare Display */}
      <FareDisplay quote={fareQuote} testID="booking-review-fare-display" />

      {/* Prototype Demarcation / Future Phase Notice */}
      <BookingStatusNotice
        variant="info"
        title="Pre-Booking Review Only"
        message="Authoritative fare and itinerary verified. Seat reservation locking, passenger identity collection, and digital payment execution will be introduced in Feature 05.3."
        testID="booking-review-status-notice"
      />

      {/* Action Section: Explicitly Demarcated Prototype Button */}
      <View style={styles.actionContainer}>
        <AppButton
          title="Reservations Coming Soon"
          variant="primary"
          disabled={true}
          accessibilityLabel="Reservations coming soon in future release"
          testID="booking-review-coming-soon-button"
        />
        <AppButton
          title="Back to Departure"
          variant="secondary"
          onPress={handleBack}
          testID="booking-review-back-button"
        />
      </View>
    </BookingScreenShell>
  );
}

const styles = StyleSheet.create({
  summaryCard: {
    backgroundColor: theme.colors.deckInk,
    borderRadius: theme.spacing.radii.card,
    borderColor: theme.colors.hudGhostBorder,
    borderWidth: 1,
    padding: theme.spacing.spaceMd,
    gap: theme.spacing.spaceMd
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  operatorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  operatorText: {
    color: theme.colors.beaconGold,
    letterSpacing: 0.8
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(74, 222, 128, 0.1)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: theme.spacing.radii.sm
  },
  verifiedText: {
    color: theme.colors.statusNominal,
    fontSize: 10,
    fontWeight: 'bold'
  },
  serviceIdText: {
    color: theme.colors.textSecondary
  },
  routeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  nodeColumn: {
    flex: 1,
    gap: 4
  },
  alignRight: {
    alignItems: 'flex-end'
  },
  timeText: {
    color: theme.colors.textPrimary
  },
  stationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4
  },
  stationName: {
    color: theme.colors.textSecondary
  },
  dividerCol: {
    alignItems: 'center',
    paddingHorizontal: theme.spacing.spaceSm,
    gap: 4
  },
  line: {
    width: 40,
    height: 1,
    backgroundColor: theme.colors.hudGhostBorder
  },
  modeBadge: {
    color: theme.colors.beaconGold,
    fontSize: 9,
    letterSpacing: 0.8
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: theme.colors.hudGhostBorder,
    paddingTop: theme.spacing.spaceSm
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6
  },
  metaText: {
    color: theme.colors.textSecondary
  },
  actionContainer: {
    gap: theme.spacing.spaceMd,
    marginTop: theme.spacing.spaceSm,
    marginBottom: theme.spacing.spaceXl
  }
});
