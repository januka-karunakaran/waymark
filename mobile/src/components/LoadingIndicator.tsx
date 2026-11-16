import React from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  View,
  ViewStyle
} from 'react-native';
import { theme } from '../theme';

export interface LoadingIndicatorProps {
  message?: string;
  size?: 'small' | 'large';
  fullscreen?: boolean;
  style?: ViewStyle;
  testID?: string;
}

export const LoadingIndicator: React.FC<LoadingIndicatorProps> = ({
  message = 'Synchronizing transit telemetry...',
  size = 'large',
  fullscreen = false,
  style,
  testID
}) => {
  return (
    <View
      style={[
        styles.container,
        fullscreen && styles.fullscreen,
        style
      ]}
      accessibilityRole="progressbar"
      accessibilityLabel={message}
      accessible={true}
      testID={testID}
    >
      <ActivityIndicator size={size} color={theme.colors.beaconGold} />
      {Boolean(message) && (
        <Text style={styles.message} testID={testID ? `${testID}-message` : undefined}>
          {message}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: theme.spacing.spaceLg,
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.spaceMd
  },
  fullscreen: {
    flex: 1,
    backgroundColor: theme.colors.abyssVoid
  },
  message: {
    ...theme.typography.styles.labelMonoSm,
    color: theme.colors.textSecondary,
    textAlign: 'center'
  }
});
