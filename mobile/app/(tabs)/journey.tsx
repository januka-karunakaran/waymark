import React, { useMemo, useState, useEffect, useCallback } from 'react';
import { StyleSheet, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { MapPin, Compass } from 'lucide-react-native';
import { ScreenWrapper } from '../../src/components/ScreenWrapper';
import { EmptyState } from '../../src/components/EmptyState';
import { AppCard } from '../../src/components/cards';
import { AppText } from '../../src/components/typography';
import { AppButton } from '../../src/components/buttons';
import { validateJourneyParams } from '../../src/features/home/actions/journeyParams';
import { theme } from '../../src/theme';

export default function JourneyScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [isDismissed, setIsDismissed] = useState(false);

  const destination = useMemo(() => {
    if (isDismissed) return null;
    return validateJourneyParams(params);
  }, [params, isDismissed]);

  // Reset dismissal state whenever the destination query parameter changes
  useEffect(() => {
    setIsDismissed(false);
  }, [params.destinationId]);

  const handleClearDestination = useCallback(() => {
    setIsDismissed(true);
  }, []);

  const handleReturnHome = useCallback(() => {
    router.push('/(tabs)');
  }, [router]);

  return (
    <ScreenWrapper title="MISSION ROUTE" subtitle="ACTIVE TRANSIT TIMELINE">
      <View style={styles.container}>
        {destination ? (
          <View
            style={styles.contextContainer}
            testID="journey-selected-context-view"
            accessibilityRole="summary"
            accessibilityLabel={`Selected Destination: ${destination.name}. Arrival Hub: ${destination.hubName}`}
          >
            <AppCard
              variant="default"
              style={styles.card}
              testID="journey-selected-destination-card"
            >
              {/* Card Header & Kicker */}
              <View style={styles.cardHeader}>
                <View style={styles.kickerRow}>
                  <Compass size={14} color={theme.colors.beaconGold} />
                  <AppText
                    variant="caption"
                    weight="bold"
                    style={styles.kickerText}
                    testID="journey-destination-kicker"
                  >
                    SELECTED DESTINATION CONTEXT
                  </AppText>
                </View>
                {destination.isSample && (
                  <View style={styles.sampleBadge}>
                    <AppText
                      variant="caption"
                      weight="bold"
                      style={styles.sampleBadgeText}
                      testID="journey-sample-badge"
                    >
                      SAMPLE
                    </AppText>
                  </View>
                )}
              </View>

              {/* Destination Title */}
              <AppText
                variant="h2"
                weight="bold"
                style={styles.destinationTitle}
                testID="journey-destination-title"
              >
                {destination.name}
              </AppText>

              {/* Arrival Hub Information */}
              <View style={styles.hubRow}>
                <MapPin size={14} color={theme.colors.beaconGold} />
                <AppText
                  variant="bodySmall"
                  style={styles.hubText}
                  testID="journey-arrival-hub"
                >
                  ARRIVAL HUB: {destination.hubName}
                </AppText>
              </View>

              {/* Suggested Modes Chips */}
              {destination.suggestedModes && destination.suggestedModes.length > 0 && (
                <View style={styles.modesRow} testID="journey-modes-row">
                  {destination.suggestedModes.map((mode) => (
                    <View key={mode} style={styles.modePill}>
                      <AppText
                        variant="caption"
                        weight="semibold"
                        style={styles.modeText}
                      >
                        {mode.toUpperCase()}
                      </AppText>
                    </View>
                  ))}
                </View>
              )}

              {/* Corridor Advisory Details */}
              {Boolean(destination.corridorAdvisory) && (
                <View style={styles.advisoryBox}>
                  <AppText
                    variant="caption"
                    style={styles.advisoryText}
                    testID="journey-corridor-advisory"
                  >
                    {destination.corridorAdvisory}
                  </AppText>
                </View>
              )}

              {/* Truthful Sample Telemetry Demarcation */}
              <View style={styles.sampleDemarcation} testID="journey-sample-demarcation">
                <AppText variant="caption" style={styles.demarcationText}>
                  SIMULATED DESTINATION CONTEXT · LIVE ITINERARY IN FEATURE 05
                </AppText>
              </View>

              {/* Operational Disclaimer */}
              <AppText
                variant="caption"
                color="dim"
                style={styles.disclaimerText}
                testID="journey-operational-disclaimer"
              >
                Active route telemetry scaffolding is operational. Native turn-by-turn navigation, fare credits, and dynamic rescheduling will be introduced in future telemetry updates.
              </AppText>

              {/* Action Buttons */}
              <View style={styles.actionRow}>
                <AppButton
                  label="Clear Selection"
                  variant="ghost"
                  size="sm"
                  onPress={handleClearDestination}
                  accessibilityHint="Clears the current destination selection and returns to the empty journey planner view"
                  testID="journey-clear-destination"
                />
                <AppButton
                  label="Return to Home"
                  variant="secondary"
                  size="sm"
                  onPress={handleReturnHome}
                  accessibilityHint="Returns to the Home discovery and navigation screen"
                  testID="journey-return-home"
                />
              </View>
            </AppCard>
          </View>
        ) : (
          <EmptyState
            title="Active Journey Timeline"
            message="Active route telemetry scaffolding is operational. Native turn-by-turn navigation will be implemented in Feature 02."
            testID="journey-default-empty-state"
          />
        )}
      </View>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: theme.spacing.margin,
    justifyContent: 'center'
  },
  contextContainer: {
    width: '100%',
    maxWidth: 580,
    alignSelf: 'center'
  },
  card: {
    backgroundColor: theme.colors.deckInk,
    borderRadius: theme.spacing.radii.card,
    borderColor: theme.colors.hudGhostBorder,
    borderWidth: 1,
    padding: theme.spacing.spaceLg,
    gap: theme.spacing.spaceMd
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  kickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6
  },
  kickerText: {
    color: theme.colors.beaconGold,
    letterSpacing: 0.8
  },
  sampleBadge: {
    backgroundColor: 'rgba(255, 198, 41, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4
  },
  sampleBadgeText: {
    fontSize: 9,
    color: theme.colors.beaconGold
  },
  destinationTitle: {
    color: theme.colors.textPrimary
  },
  hubRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6
  },
  hubText: {
    color: theme.colors.textMuted
  },
  modesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6
  },
  modePill: {
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: theme.colors.hudGhostSubtle
  },
  modeText: {
    fontSize: 10,
    color: theme.colors.textMuted,
    letterSpacing: 0.4
  },
  advisoryBox: {
    backgroundColor: 'rgba(255, 198, 41, 0.05)',
    borderLeftWidth: 2,
    borderLeftColor: theme.colors.beaconGold,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 2
  },
  advisoryText: {
    color: theme.colors.beaconGold
  },
  sampleDemarcation: {
    backgroundColor: 'rgba(255, 198, 41, 0.08)',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 4,
    alignSelf: 'flex-start'
  },
  demarcationText: {
    fontSize: 10,
    color: theme.colors.beaconGold,
    letterSpacing: 0.6
  },
  disclaimerText: {
    lineHeight: 16
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: theme.spacing.spaceXs,
    gap: theme.spacing.spaceSm
  }
});
