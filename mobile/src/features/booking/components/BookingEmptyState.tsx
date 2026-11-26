import React from 'react';
import { StyleSheet, View } from 'react-native';
import { LucideIcon } from 'lucide-react-native';
import { AppText } from '../../../components/typography';
import { AppButton } from '../../../components/buttons';
import { theme } from '../../../theme';

export interface BookingEmptyStateProps {
  icon: LucideIcon;
  title: string;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
  secondaryActionLabel?: string;
  onSecondaryAction?: () => void;
  testID?: string;
}

export const BookingEmptyState: React.FC<BookingEmptyStateProps> = ({
  icon: Icon,
  title,
  message,
  actionLabel,
  onAction,
  secondaryActionLabel,
  onSecondaryAction,
  testID = 'booking-empty-state'
}) => {
  return (
    <View style={styles.container} testID={testID}>
      <View style={styles.iconCircle}>
        <Icon size={32} color={theme.colors.beaconGold} />
      </View>
      <AppText variant="h3" weight="bold" style={styles.title} testID="booking-empty-title">
        {title}
      </AppText>
      <AppText variant="bodySmall" style={styles.message} testID="booking-empty-message">
        {message}
      </AppText>
      {(actionLabel || secondaryActionLabel) && (
        <View style={styles.actionContainer}>
          {actionLabel && onAction && (
            <AppButton
              label={actionLabel}
              onPress={onAction}
              variant="primary"
              testID="booking-empty-primary-action"
            />
          )}
          {secondaryActionLabel && onSecondaryAction && (
            <AppButton
              label={secondaryActionLabel}
              onPress={onSecondaryAction}
              variant="outline"
              testID="booking-empty-secondary-action"
            />
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.spaceXl,
    paddingHorizontal: theme.spacing.spaceMd,
    gap: theme.spacing.spaceMd,
    backgroundColor: theme.colors.deckInk,
    borderRadius: theme.spacing.radii.card,
    borderWidth: 1,
    borderColor: theme.colors.hudGhostBorder
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255, 198, 41, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 198, 41, 0.2)'
  },
  title: {
    color: theme.colors.textPrimary,
    textAlign: 'center'
  },
  message: {
    color: theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: 420
  },
  actionContainer: {
    width: '100%',
    maxWidth: 320,
    gap: theme.spacing.spaceSm,
    marginTop: theme.spacing.spaceSm
  }
});
