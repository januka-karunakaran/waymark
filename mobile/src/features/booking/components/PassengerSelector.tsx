import React from 'react';
import { StyleSheet, View, Pressable } from 'react-native';
import { Minus, Plus, Users } from 'lucide-react-native';
import { AppText } from '../../../components/typography';
import { AppCard } from '../../../components/cards';
import { theme } from '../../../theme';
import {
  MIN_PASSENGER_COUNT,
  MAX_PASSENGER_COUNT,
  validatePassengerCount
} from '../validation/bookingValidation';

export interface PassengerSelectorProps {
  count: number;
  onChange: (count: number) => void;
  min?: number;
  max?: number;
  disabled?: boolean;
  testID?: string;
}

export const PassengerSelector: React.FC<PassengerSelectorProps> = ({
  count,
  onChange,
  min = MIN_PASSENGER_COUNT,
  max = MAX_PASSENGER_COUNT,
  disabled = false,
  testID = 'passenger-selector'
}) => {
  const canDecrement = !disabled && count > min;
  const canIncrement = !disabled && count < max;

  const handleDecrement = () => {
    if (!canDecrement) return;
    const next = count - 1;
    const validation = validatePassengerCount(next);
    if (validation.isValid && validation.sanitized !== undefined) {
      onChange(validation.sanitized);
    }
  };

  const handleIncrement = () => {
    if (!canIncrement) return;
    const next = count + 1;
    const validation = validatePassengerCount(next);
    if (validation.isValid && validation.sanitized !== undefined) {
      onChange(validation.sanitized);
    }
  };

  return (
    <AppCard variant="default" style={styles.card} testID={testID}>
      <View style={styles.headerRow}>
        <View style={styles.titleGroup}>
          <Users size={16} color={theme.colors.beaconGold} />
          <AppText variant="caption" weight="bold" style={styles.kickerText}>
            PASSENGERS
          </AppText>
        </View>
        <AppText variant="caption" style={styles.limitText}>
          {min}–{max} max per booking
        </AppText>
      </View>

      <View style={styles.contentRow}>
        <View style={styles.labelCol}>
          <AppText variant="body" weight="bold" style={styles.label}>
            Transit Travelers
          </AppText>
          <AppText variant="caption" style={styles.description}>
            Standard seats across planetary corridors
          </AppText>
        </View>

        <View style={styles.stepperContainer}>
          <Pressable
            onPress={handleDecrement}
            disabled={!canDecrement}
            accessibilityRole="button"
            accessibilityLabel="Decrease passenger count"
            accessibilityState={{ disabled: !canDecrement }}
            style={[
              styles.stepButton,
              !canDecrement && styles.stepButtonDisabled
            ]}
            testID={`${testID}-decrement`}
          >
            <Minus
              size={18}
              color={canDecrement ? theme.colors.beaconGold : theme.colors.textMuted}
            />
          </Pressable>

          <View style={styles.countWrapper}>
            <AppText
              variant="h2"
              weight="bold"
              style={styles.countText}
              accessibilityLabel={`${count} ${count === 1 ? 'passenger' : 'passengers'} selected`}
              testID={`${testID}-count`}
            >
              {count}
            </AppText>
          </View>

          <Pressable
            onPress={handleIncrement}
            disabled={!canIncrement}
            accessibilityRole="button"
            accessibilityLabel="Increase passenger count"
            accessibilityState={{ disabled: !canIncrement }}
            style={[
              styles.stepButton,
              !canIncrement && styles.stepButtonDisabled
            ]}
            testID={`${testID}-increment`}
          >
            <Plus
              size={18}
              color={canIncrement ? theme.colors.beaconGold : theme.colors.textMuted}
            />
          </Pressable>
        </View>
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
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  titleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  kickerText: {
    color: theme.colors.beaconGold,
    letterSpacing: 1
  },
  limitText: {
    color: theme.colors.textSecondary
  },
  contentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  labelCol: {
    flex: 1,
    gap: 2
  },
  label: {
    color: theme.colors.textPrimary
  },
  description: {
    color: theme.colors.textSecondary
  },
  stepperContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.spaceSm
  },
  stepButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: theme.colors.panelInk,
    borderWidth: 1,
    borderColor: theme.colors.beaconGold,
    alignItems: 'center',
    justifyContent: 'center'
  },
  stepButtonDisabled: {
    borderColor: theme.colors.hudGhostBorder,
    backgroundColor: theme.colors.deckInk,
    opacity: 0.5
  },
  countWrapper: {
    minWidth: 32,
    alignItems: 'center',
    justifyContent: 'center'
  },
  countText: {
    color: theme.colors.textPrimary
  }
});
