import React from 'react';
import { StyleSheet, View } from 'react-native';
import { ShieldCheck, MapPin } from 'lucide-react-native';
import { BookableDeparture } from '../types/bookingTypes';
import { AppCard } from '../../../components/cards';
import { AppText } from '../../../components/typography';
import { AppButton } from '../../../components/buttons';
import { theme } from '../../../theme';

export interface DepartureCardProps {
  departure: BookableDeparture;
  operatorName?: string;
  onSelect?: (departure: BookableDeparture) => void;
  testID?: string;
}

export const DepartureCard: React.FC<DepartureCardProps> = ({
  departure,
  operatorName,
  onSelect,
  testID = 'departure-card'
}) => {
  const formatTime = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return isoString;
    }
  };

  const isAvailable = departure.bookableStatus === 'available';

  return (
    <AppCard variant="default" style={styles.card} testID={testID}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.operatorRow}>
          <AppText variant="caption" weight="bold" style={styles.operatorText}>
            {operatorName || departure.operatorId}
          </AppText>
          {departure.inventorySource === 'operator_verified' && (
            <View style={styles.verifiedBadge}>
              <ShieldCheck size={12} color={theme.colors.success} />
              <AppText variant="caption" style={styles.verifiedText}>
                VERIFIED
              </AppText>
            </View>
          )}
        </View>
        <AppText variant="caption" style={styles.serviceId}>
          {departure.serviceIdentifier}
        </AppText>
      </View>

      {/* Route & Times */}
      <View style={styles.routeContainer}>
        <View style={styles.routeNode}>
          <AppText variant="h3" weight="bold" style={styles.timeText}>
            {formatTime(departure.departureTime)}
          </AppText>
          <View style={styles.nodeLabelRow}>
            <MapPin size={12} color={theme.colors.info} />
            <AppText variant="caption" style={styles.nodeName}>
              {departure.originName}
            </AppText>
          </View>
        </View>

        <View style={styles.routeDivider}>
          <View style={styles.line} />
          {departure.transitMode && (
            <AppText variant="caption" style={styles.transitModeText}>
              {departure.transitMode.toUpperCase()}
            </AppText>
          )}
        </View>

        <View style={[styles.routeNode, styles.alignRight]}>
          <AppText variant="h3" weight="bold" style={styles.timeText}>
            {departure.arrivalTime ? formatTime(departure.arrivalTime) : '—'}
          </AppText>
          <View style={styles.nodeLabelRow}>
            <MapPin size={12} color={theme.colors.beaconGold} />
            <AppText variant="caption" style={styles.nodeName}>
              {departure.destinationName}
            </AppText>
          </View>
        </View>
      </View>

      {/* Footer / Action */}
      <View style={styles.footer}>
        <View style={styles.statusRow}>
          <View
            style={[
              styles.statusDot,
              {
                backgroundColor: isAvailable
                  ? theme.colors.statusNominal
                  : theme.colors.statusCritical
              }
            ]}
          />
          <AppText variant="caption" style={styles.statusText}>
            {departure.bookableStatus.toUpperCase().replace('_', ' ')}
          </AppText>
        </View>

        {onSelect && isAvailable && (
          <AppButton
            label="Select Trip"
            variant="outline"
            size="sm"
            onPress={() => onSelect(departure)}
            testID={`${testID}-select-btn`}
          />
        )}
      </View>
    </AppCard>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.deckInk,
    borderRadius: theme.spacing.radii.card,
    borderColor: theme.colors.hudGhostBorder,
    borderWidth: 1,
    padding: theme.spacing.spaceMd,
    gap: theme.spacing.spaceMd
  },
  header: {
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
    borderRadius: 4
  },
  verifiedText: {
    fontSize: 9,
    color: theme.colors.success,
    fontWeight: 'bold'
  },
  serviceId: {
    color: theme.colors.textMuted
  },
  routeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4
  },
  routeNode: {
    flex: 1,
    gap: 4
  },
  alignRight: {
    alignItems: 'flex-end'
  },
  timeText: {
    color: theme.colors.textPrimary
  },
  nodeLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4
  },
  nodeName: {
    color: theme.colors.textSecondary,
    fontSize: 11
  },
  routeDivider: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8
  },
  line: {
    width: '100%',
    height: 1,
    backgroundColor: theme.colors.hudGhostBorder
  },
  transitModeText: {
    color: theme.colors.textMuted,
    fontSize: 9,
    letterSpacing: 1
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.05)',
    paddingTop: theme.spacing.spaceSm
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3
  },
  statusText: {
    color: theme.colors.textSecondary,
    fontSize: 10,
    letterSpacing: 0.5
  }
});
