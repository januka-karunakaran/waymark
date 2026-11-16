import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { AlertOctagon, RotateCcw } from 'lucide-react-native';
import { theme } from '../theme';
import { logger } from '../utils/logger';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: (error: Error, reset: () => void) => ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  testID?: string;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null
    };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      error
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    logger.error('Unhandled component exception caught by ErrorBoundary', error, {
      componentStack: errorInfo.componentStack
    });
    this.props.onError?.(error, errorInfo);
  }

  handleReset = (): void => {
    this.setState({ hasError: false, error: null });
  };

  render(): ReactNode {
    if (this.state.hasError && this.state.error) {
      if (this.props.fallback) {
        return this.props.fallback(this.state.error, this.handleReset);
      }

      return (
        <View style={styles.container} testID={this.props.testID}>
          <View style={styles.content}>
            <View style={styles.iconBadge}>
              <AlertOctagon size={36} color={theme.colors.statusCritical} />
            </View>
            <Text style={styles.title} accessibilityRole="header">
              System Avionics Fault
            </Text>
            <Text style={styles.message} accessibilityRole="alert">
              A runtime error occurred in the Waymark UI system. Telemetry stream has been isolated for commuter safety.
            </Text>
            <Pressable
              style={({ pressed }) => [
                styles.resetButton,
                pressed && styles.resetButtonPressed
              ]}
              onPress={this.handleReset}
              accessibilityRole="button"
              accessibilityLabel="Reboot avionics UI"
              testID={this.props.testID ? `${this.props.testID}-reboot` : undefined}
            >
              <RotateCcw size={16} color={theme.colors.abyssVoid} />
              <Text style={styles.resetButtonText}>Reboot Avionics</Text>
            </Pressable>
          </View>
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.abyssVoid,
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing.spaceLg
  },
  content: {
    backgroundColor: theme.colors.deckInk,
    borderRadius: theme.spacing.radii.card,
    borderWidth: 1,
    borderColor: theme.colors.statusCriticalBorder,
    padding: theme.spacing.spaceLg,
    alignItems: 'center',
    width: '100%',
    maxWidth: 440
  },
  iconBadge: {
    width: 64,
    height: 64,
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
  resetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.spaceSm,
    backgroundColor: theme.colors.beaconGold,
    paddingHorizontal: theme.spacing.spaceLg,
    height: theme.spacing.layout.primaryButtonHeight,
    borderRadius: theme.spacing.radii.button,
    width: '100%'
  },
  resetButtonPressed: {
    opacity: 0.85
  },
  resetButtonText: {
    ...theme.typography.styles.labelMonoMd,
    color: theme.colors.abyssVoid
  }
});
