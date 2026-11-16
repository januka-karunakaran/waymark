import React from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
  ViewStyle
} from 'react-native';
import { AlertTriangle, RotateCcw } from 'lucide-react-native';
import { theme } from '../theme';

export interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  retryLabel?: string;
  style?: ViewStyle;
  testID?: string;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = 'Telemetry Sync Disrupted',
  message = 'An unexpected error occurred while communicating with the transit network.',
  onRetry,
  retryLabel = 'Retry Transmission',
  style,
  testID
}) => {
  return (
    <View style={[styles.container, style]} testID={testID}>
      <View style={styles.iconContainer}>
        <AlertTriangle size={32} color={theme.colors.statusCritical} />
      </View>
      <Text
        style={styles.title}
        accessibilityRole="header"
        testID={testID ? `${testID}-title` : undefined}
      >
        {title}
      </Text>
      <Text
        style={styles.message}
        accessibilityRole="alert"
        testID={testID ? `${testID}-message` : undefined}
      >
        {message}
      </Text>
      {Boolean(onRetry) && (
        <Pressable
          style={({ pressed }) => [
            styles.retryButton,
            pressed && styles.retryButtonPressed
          ]}
          onPress={() => onRetry?.()}
          accessibilityRole="button"
          accessibilityLabel={retryLabel}
          testID={testID ? `${testID}-retry` : undefined}
        >
          <RotateCcw size={16} color={theme.colors.abyssVoid} />
          <Text style={styles.retryButtonText}>{retryLabel}</Text>
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
    borderColor: theme.colors.statusCriticalBorder,
    margin: theme.spacing.margin
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: theme.spacing.radii.md,
    backgroundColor: theme.colors.statusCriticalMuted,
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
    marginBottom: theme.spacing.spaceLg
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.spaceSm,
    backgroundColor: theme.colors.beaconGold,
    paddingHorizontal: theme.spacing.spaceLg,
    height: theme.spacing.layout.secondaryButtonHeight,
    borderRadius: theme.spacing.radii.button,
    minWidth: 160
  },
  retryButtonPressed: {
    opacity: 0.85
  },
  retryButtonText: {
    ...theme.typography.styles.labelMonoMd,
    color: theme.colors.abyssVoid
  }
});
