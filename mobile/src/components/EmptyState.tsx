import React from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
  ViewStyle
} from 'react-native';
import { Compass } from 'lucide-react-native';
import { theme } from '../theme';

export interface EmptyStateProps {
  title?: string;
  message?: string;
  actionLabel?: string;
  onAction?: () => void;
  style?: ViewStyle;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title = 'No Transit Vectors Found',
  message = 'No active routes match your telemetry filters. Try selecting a different destination node.',
  actionLabel,
  onAction,
  style
}) => {
  return (
    <View style={[styles.container, style]} accessible={true}>
      <View style={styles.iconContainer}>
        <Compass size={32} color={theme.colors.beaconGold} />
      </View>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.message}>{message}</Text>
      {Boolean(actionLabel && onAction) && (
        <Pressable
          style={({ pressed }) => [
            styles.actionButton,
            pressed && styles.actionButtonPressed
          ]}
          onPress={onAction}
          accessibilityRole="button"
          accessibilityLabel={actionLabel}
        >
          <Text style={styles.actionButtonText}>{actionLabel}</Text>
        </Pressable>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: theme.spacing.spaceLg,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.deckInk,
    borderRadius: theme.spacing.radii.card,
    borderWidth: 1,
    borderColor: theme.colors.hudGhostBorder,
    margin: theme.spacing.margin
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: theme.spacing.radii.md,
    backgroundColor: theme.colors.beaconGoldMuted,
    borderWidth: 1,
    borderColor: theme.colors.luminousEdge,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.spaceMd
  },
  title: {
    ...theme.typography.styles.headlineMd,
    color: theme.colors.textPrimary,
    textAlign: 'center',
    marginBottom: theme.spacing.spaceSm
  },
  message: {
    ...theme.typography.styles.bodyMd,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginBottom: theme.spacing.spaceMd
  },
  actionButton: {
    paddingHorizontal: theme.spacing.spaceLg,
    height: theme.spacing.layout.secondaryButtonHeight,
    borderRadius: theme.spacing.radii.button,
    backgroundColor: theme.colors.panelInk,
    borderWidth: 1,
    borderColor: theme.colors.luminousEdge,
    alignItems: 'center',
    justifyContent: 'center'
  },
  actionButtonPressed: {
    opacity: 0.8
  },
  actionButtonText: {
    ...theme.typography.styles.labelMonoMd,
    color: theme.colors.beaconGold
  }
});
