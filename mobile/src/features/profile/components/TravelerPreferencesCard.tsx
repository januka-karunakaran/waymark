/**
 * Waymark Mobile — Feature 04.4: User Profile, Saved Places & Traveler Preferences
 * TravelerPreferencesCard: Presentation card for managing multimodal transit modes and distance units.
 */

import React from 'react';
import { StyleSheet, View, Pressable } from 'react-native';
import { SlidersHorizontal, Check } from 'lucide-react-native';
import { AppCard } from '../../../components/cards/AppCard';
import { AppText } from '../../../components/typography/AppText';
import {
  TravelerPreferences,
  PreferencesUpdateInput,
  SupportedTransitMode,
  DistanceUnit
} from '../types';
import { VALID_TRANSIT_MODES } from '../validation';
import { theme } from '../../../theme';

export interface TravelerPreferencesCardProps {
  preferences: TravelerPreferences | null;
  onUpdatePreferences: (input: PreferencesUpdateInput) => Promise<boolean>;
  isSaving?: boolean;
  testID?: string;
}

const MODE_LABELS: Record<SupportedTransitMode, string> = {
  bus: 'Bus',
  train: 'Train',
  metro: 'Metro',
  tram: 'Tram',
  ferry: 'Ferry',
  walking: 'Walking',
  cycling: 'Cycling'
};

export const TravelerPreferencesCard: React.FC<TravelerPreferencesCardProps> = ({
  preferences,
  onUpdatePreferences,
  isSaving = false,
  testID = 'traveler-preferences-card'
}) => {
  const preferredModes = preferences?.preferredModes ?? [];
  const distanceUnit = preferences?.distanceUnit ?? 'km';

  const handleToggleMode = async (mode: SupportedTransitMode) => {
    if (isSaving) return;
    const exists = preferredModes.includes(mode);
    const newModes = exists
      ? preferredModes.filter((m) => m !== mode)
      : [...preferredModes, mode];

    await onUpdatePreferences({ preferredModes: newModes });
  };

  const handleSelectDistanceUnit = async (unit: DistanceUnit) => {
    if (isSaving || distanceUnit === unit) return;
    await onUpdatePreferences({ distanceUnit: unit });
  };

  return (
    <AppCard style={styles.card} testID={testID}>
      <View style={styles.cardHeader}>
        <SlidersHorizontal size={20} color={theme.colors.beaconGold} accessible={false} />
        <View style={styles.titleContainer}>
          <AppText variant="h3" style={styles.cardTitle}>
            Traveler Preferences
          </AppText>
          <AppText variant="caption" style={styles.cardSubtitle}>
            Filter transit routing algorithms and display telemetry
          </AppText>
        </View>
      </View>

      <View style={styles.divider} />

      {/* Transit Modes Section */}
      <View style={styles.section} testID="pref-transit-modes-section">
        <AppText variant="bodySmall" weight="bold" style={styles.sectionTitle}>
          PREFERRED TRANSIT MODES
        </AppText>
        <AppText variant="caption" style={styles.sectionSubtitle}>
          Select which multimodal corridors to prioritize during journey calculations
        </AppText>

        <View style={styles.chipsWrap}>
          {VALID_TRANSIT_MODES.map((mode) => {
            const isSelected = preferredModes.includes(mode);
            return (
              <Pressable
                key={mode}
                onPress={() => handleToggleMode(mode)}
                disabled={isSaving}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: isSelected }}
                accessibilityLabel={`${MODE_LABELS[mode]} transit mode`}
                style={[styles.modeChip, isSelected && styles.modeChipSelected]}
                testID={`mode-chip-${mode}`}
              >
                {isSelected && (
                  <Check size={14} color={theme.colors.beaconGold} style={styles.checkIcon} />
                )}
                <AppText
                  variant="caption"
                  weight={isSelected ? 'bold' : 'regular'}
                  style={[styles.modeChipText, isSelected && styles.modeChipTextSelected]}
                >
                  {MODE_LABELS[mode]}
                </AppText>
              </Pressable>
            );
          })}
        </View>
      </View>

      <View style={styles.divider} />

      {/* Distance Units Section */}
      <View style={styles.section} testID="pref-distance-unit-section">
        <AppText variant="bodySmall" weight="bold" style={styles.sectionTitle}>
          DISTANCE TELEMETRY UNIT
        </AppText>
        <AppText variant="caption" style={styles.sectionSubtitle}>
          Planetary distance calculations and corridor ranges
        </AppText>

        <View style={styles.unitRow}>
          {(['km', 'mi'] as const).map((unit) => {
            const isSelected = distanceUnit === unit;
            return (
              <Pressable
                key={unit}
                onPress={() => handleSelectDistanceUnit(unit)}
                disabled={isSaving}
                accessibilityRole="radio"
                accessibilityState={{ selected: isSelected }}
                accessibilityLabel={unit === 'km' ? 'Kilometers' : 'Miles'}
                style={[styles.unitChip, isSelected && styles.unitChipSelected]}
                testID={`unit-chip-${unit}`}
              >
                <AppText
                  variant="bodySmall"
                  weight={isSelected ? 'bold' : 'regular'}
                  style={[styles.unitChipText, isSelected && styles.unitChipTextSelected]}
                >
                  {unit === 'km' ? 'Kilometers (km)' : 'Miles (mi)'}
                </AppText>
              </Pressable>
            );
          })}
        </View>
      </View>
    </AppCard>
  );
};

const styles = StyleSheet.create({
  card: {
    marginVertical: theme.spacing.spaceSm,
    padding: theme.spacing.spaceLg,
    backgroundColor: theme.colors.deckInk,
    borderColor: theme.colors.border
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.spaceSm
  },
  titleContainer: {
    flex: 1
  },
  cardTitle: {
    color: theme.colors.textPrimary
  },
  cardSubtitle: {
    color: theme.colors.textSecondary,
    marginTop: 2
  },
  divider: {
    height: 1,
    backgroundColor: theme.colors.border,
    marginVertical: theme.spacing.spaceMd
  },
  section: {
    gap: 6
  },
  sectionTitle: {
    color: theme.colors.textPrimary,
    letterSpacing: 0.5
  },
  sectionSubtitle: {
    color: theme.colors.textSecondary,
    marginBottom: 6
  },
  chipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.spaceSm
  },
  modeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.panelInk,
    borderWidth: 1,
    borderColor: theme.colors.border,
    gap: 4
  },
  modeChipSelected: {
    backgroundColor: 'rgba(255, 198, 41, 0.15)',
    borderColor: theme.colors.beaconGold
  },
  checkIcon: {
    marginRight: 2
  },
  modeChipText: {
    color: theme.colors.textSecondary
  },
  modeChipTextSelected: {
    color: theme.colors.beaconGold
  },
  unitRow: {
    flexDirection: 'row',
    gap: theme.spacing.spaceMd,
    marginTop: 4
  },
  unitChip: {
    flex: 1,
    paddingVertical: theme.spacing.spaceSm,
    paddingHorizontal: theme.spacing.spaceMd,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: theme.radius.sm,
    backgroundColor: theme.colors.panelInk,
    borderWidth: 1,
    borderColor: theme.colors.border
  },
  unitChipSelected: {
    backgroundColor: 'rgba(45, 212, 191, 0.15)',
    borderColor: theme.colors.trainTeal
  },
  unitChipText: {
    color: theme.colors.textSecondary
  },
  unitChipTextSelected: {
    color: theme.colors.trainTeal
  }
});
