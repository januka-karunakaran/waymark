import React, { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ticket, Sparkles } from 'lucide-react-native';
import {
  BookingScreenShell,
  BookingHeader,
  BookingStatusNotice,
  BookingEmptyState
} from '../../src/features/booking/components';
import { UnavailableInventoryProvider } from '../../src/features/booking/providers/UnavailableInventoryProvider';
import { ProviderReadiness } from '../../src/features/booking/providers/TransitInventoryProvider';
import { AppCard } from '../../src/components/cards';
import { AppText } from '../../src/components/typography';
import { theme } from '../../src/theme';

export default function BookingLandingScreen() {
  const router = useRouter();
  const [readiness, setReadiness] = useState<ProviderReadiness>('not_configured');

  useEffect(() => {
    let isMounted = true;
    const provider = new UnavailableInventoryProvider();
    provider.getReadiness().then((status) => {
      if (isMounted) {
        setReadiness(status);
      }
    });
    return () => {
      isMounted = false;
    };
  }, []);

  const handleReturnHome = () => {
    router.replace('/(tabs)');
  };

  const handleReturnJourney = () => {
    router.replace('/(tabs)/journey');
  };

  return (
    <BookingScreenShell testID="booking-landing-screen">
      <BookingHeader
        title="Explore Your Next Journey"
        subtitle="Discover available travel options and check ticketing service availability."
        onBack={handleReturnJourney}
        testID="booking-landing-header"
      />

      {/* Service Status Notice */}
      <BookingStatusNotice
        variant={readiness === 'ready' ? 'success' : 'warning'}
        title={
          readiness === 'ready'
            ? 'Ticketing Service Operational'
            : 'Ticketing Engine Inactive'
        }
        message={
          readiness === 'ready'
            ? 'Real-time verified transit inventory and fare quotes are online.'
            : 'Live inventory reservation is currently not configured. No operator booking engine is available in this corridor.'
        }
        testID="booking-landing-status-notice"
      />

      {/* Prototype Demarcation Card */}
      <AppCard variant="default" style={styles.infoCard} testID="booking-landing-info-card">
        <View style={styles.cardHeader}>
          <Sparkles size={16} color={theme.colors.beaconGold} />
          <AppText variant="caption" weight="bold" style={styles.kickerText}>
            FUTURE TRANSIT ARCHITECTURE
          </AppText>
        </View>
        <AppText variant="bodySmall" style={styles.cardBody}>
          Waymark 2100 provides unified intercity routing. Verified seat reservations, payment processing, and cryptographic boarding pass issuance will be introduced progressively in Features 05.3, 05.4, and 05.5.
        </AppText>
      </AppCard>

      {/* Main Empty / Informational State */}
      <BookingEmptyState
        icon={Ticket}
        title="Reservations Coming Soon"
        message="Live bookable departures are not yet connected for planetary transit corridors. You can continue to explore simulated routes and network maps in Journey."
        actionLabel="Return to Journey"
        onAction={handleReturnJourney}
        secondaryActionLabel="Return to Home"
        onSecondaryAction={handleReturnHome}
        testID="booking-landing-empty-state"
      />
    </BookingScreenShell>
  );
}

const styles = StyleSheet.create({
  infoCard: {
    backgroundColor: theme.colors.deckInk,
    borderRadius: theme.spacing.radii.card,
    borderColor: theme.colors.hudGhostBorder,
    borderWidth: 1,
    padding: theme.spacing.spaceMd,
    gap: theme.spacing.spaceSm
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  kickerText: {
    color: theme.colors.beaconGold,
    letterSpacing: 1
  },
  cardBody: {
    color: theme.colors.textSecondary,
    lineHeight: 20
  }
});
