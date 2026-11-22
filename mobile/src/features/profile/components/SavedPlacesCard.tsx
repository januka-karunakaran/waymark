/**
 * Waymark Mobile — Feature 04.4: User Profile, Saved Places & Traveler Preferences
 * SavedPlacesCard: Presentation card displaying Home, Work, and Favorite custom shortcuts.
 */

import React from 'react';
import { StyleSheet, View, Pressable } from 'react-native';
import { Home, Briefcase, MapPin, Trash2 } from 'lucide-react-native';
import { AppCard } from '../../../components/cards/AppCard';
import { AppText } from '../../../components/typography/AppText';
import { AppButton } from '../../../components/buttons/AppButton';
import { SavedPlace, SavedPlaceKind } from '../types';
import { theme } from '../../../theme';

export interface SavedPlacesCardProps {
  savedPlaces: SavedPlace[];
  onAddPlacePress: (kind: SavedPlaceKind) => void;
  onDeletePlacePress: (placeId: string) => void;
  testID?: string;
}

export const SavedPlacesCard: React.FC<SavedPlacesCardProps> = ({
  savedPlaces,
  onAddPlacePress,
  onDeletePlacePress,
  testID = 'saved-places-card'
}) => {
  const homePlace = savedPlaces.find((p) => p.kind === 'home');
  const workPlace = savedPlaces.find((p) => p.kind === 'work');
  const favoritePlaces = savedPlaces.filter((p) => p.kind === 'favorite');

  return (
    <AppCard style={styles.card} testID={testID}>
      <View style={styles.cardHeader}>
        <MapPin size={20} color={theme.colors.beaconGold} accessible={false} />
        <View style={styles.titleContainer}>
          <AppText variant="h3" style={styles.cardTitle}>
            Saved Destination Shortcuts
          </AppText>
          <AppText variant="caption" style={styles.cardSubtitle}>
            Configure Home, Work, and custom rapid corridors
          </AppText>
        </View>
      </View>

      <View style={styles.divider} />

      {/* 1. HOME SHORTCUT */}
      <View style={styles.placeItem} testID="saved-place-home-row">
        <View style={styles.iconContainer}>
          <Home size={18} color={theme.colors.beaconGold} accessible={false} />
        </View>
        <View style={styles.placeDetails}>
          <AppText variant="bodySmall" weight="bold" style={styles.placeLabel}>
            {homePlace ? homePlace.label : 'Home'}
          </AppText>
          <AppText variant="caption" style={styles.placeAddress} numberOfLines={1}>
            {homePlace ? homePlace.placeText : 'Not configured'}
          </AppText>
        </View>
        {homePlace ? (
          <Pressable
            onPress={() => onDeletePlacePress(homePlace.id)}
            accessibilityRole="button"
            accessibilityLabel="Delete Home destination"
            hitSlop={10}
            style={styles.deleteButton}
            testID="btn-delete-home"
          >
            <Trash2 size={16} color={theme.colors.busCoral} />
          </Pressable>
        ) : (
          <AppButton
            title="Set Home"
            variant="secondary"
            size="sm"
            onPress={() => onAddPlacePress('home')}
            accessibilityHint="Configures your Home destination address"
            testID="btn-add-home"
          />
        )}
      </View>

      {/* 2. WORK SHORTCUT */}
      <View style={styles.placeItem} testID="saved-place-work-row">
        <View style={styles.iconContainer}>
          <Briefcase size={18} color={theme.colors.beaconGold} accessible={false} />
        </View>
        <View style={styles.placeDetails}>
          <AppText variant="bodySmall" weight="bold" style={styles.placeLabel}>
            {workPlace ? workPlace.label : 'Work'}
          </AppText>
          <AppText variant="caption" style={styles.placeAddress} numberOfLines={1}>
            {workPlace ? workPlace.placeText : 'Not configured'}
          </AppText>
        </View>
        {workPlace ? (
          <Pressable
            onPress={() => onDeletePlacePress(workPlace.id)}
            accessibilityRole="button"
            accessibilityLabel="Delete Work destination"
            hitSlop={10}
            style={styles.deleteButton}
            testID="btn-delete-work"
          >
            <Trash2 size={16} color={theme.colors.busCoral} />
          </Pressable>
        ) : (
          <AppButton
            title="Set Work"
            variant="secondary"
            size="sm"
            onPress={() => onAddPlacePress('work')}
            accessibilityHint="Configures your Work destination address"
            testID="btn-add-work"
          />
        )}
      </View>

      {/* 3. CUSTOM FAVORITES */}
      {favoritePlaces.length > 0 && (
        <View style={styles.favoritesSection} testID="saved-favorites-list">
          <AppText variant="caption" weight="medium" style={styles.sectionHeader}>
            CUSTOM SHORTCUTS
          </AppText>
          {favoritePlaces.map((place) => (
            <View key={place.id} style={styles.placeItem} testID={`saved-place-favorite-${place.id}`}>
              <View style={styles.iconContainer}>
                <MapPin size={18} color={theme.colors.trainTeal} accessible={false} />
              </View>
              <View style={styles.placeDetails}>
                <AppText variant="bodySmall" weight="bold" style={styles.placeLabel}>
                  {place.label}
                </AppText>
                <AppText variant="caption" style={styles.placeAddress} numberOfLines={1}>
                  {place.placeText}
                </AppText>
              </View>
              <Pressable
                onPress={() => onDeletePlacePress(place.id)}
                accessibilityRole="button"
                accessibilityLabel={`Delete ${place.label}`}
                hitSlop={10}
                style={styles.deleteButton}
                testID={`btn-delete-favorite-${place.id}`}
              >
                <Trash2 size={16} color={theme.colors.busCoral} />
              </Pressable>
            </View>
          ))}
        </View>
      )}

      {/* Add Favorite Action */}
      <View style={styles.actionContainer}>
        <AppButton
          title="Add Custom Shortcut"
          variant="secondary"
          size="md"
          onPress={() => onAddPlacePress('favorite')}
          accessibilityHint="Adds a custom destination shortcut"
          testID="btn-add-favorite"
        />
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
  placeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.spacing.spaceSm,
    gap: theme.spacing.spaceSm,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)'
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: theme.radius.sm,
    backgroundColor: theme.colors.panelInk,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border
  },
  placeDetails: {
    flex: 1,
    gap: 2
  },
  placeLabel: {
    color: theme.colors.textPrimary
  },
  placeAddress: {
    color: theme.colors.textSecondary
  },
  deleteButton: {
    padding: theme.spacing.spaceSm
  },
  favoritesSection: {
    marginTop: theme.spacing.spaceSm,
    gap: 4
  },
  sectionHeader: {
    color: theme.colors.textMuted,
    fontSize: 10,
    letterSpacing: 0.5,
    marginTop: theme.spacing.spaceXs
  },
  actionContainer: {
    marginTop: theme.spacing.spaceMd
  }
});
