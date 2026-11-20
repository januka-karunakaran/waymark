import React from 'react';
import { StyleSheet, View, Pressable, ViewStyle } from 'react-native';
import {
  Info,
  AlertTriangle,
  AlertCircle,
  ShieldAlert
} from 'lucide-react-native';
import { AppText } from '../../../components/typography/AppText';
import { theme } from '../../../theme';

export type AuthNoticeVariant = 'info' | 'warning' | 'error' | 'unavailable';

export interface AuthStatusNoticeProps {
  /**
   * Explanatory notice message.
   */
  message: string;

  /**
   * Notice visual variant.
   * @default 'info'
   */
  variant?: AuthNoticeVariant;

  /**
   * Optional bold title header above the message.
   */
  title?: string;

  /**
   * Optional inline action trigger text.
   */
  actionText?: string;

  /**
   * Action trigger callback.
   */
  onAction?: () => void;

  /**
   * Custom style applied to the notice container.
   */
  style?: ViewStyle;

  /**
   * Test identifier.
   */
  testID?: string;
}

/**
 * AuthStatusNotice â€” Accessible banner component for communicating authentication
 * status, provider unavailability, validation errors, and domain feedback.
 * Formatted with Waymark 2100 avionics card styling and sanitized user messages.
 */
export const AuthStatusNotice: React.FC<AuthStatusNoticeProps> = ({
  message,
  variant = 'info',
  title,
  actionText,
  onAction,
  style,
  testID = 'auth-status-notice'
}) => {
  const isError = variant === 'error';
  const isWarning = variant === 'warning';
  const isUnavailable = variant === 'unavailable';

  const accentColor = isError
    ? theme.colors.statusCritical
    : isWarning || isUnavailable
    ? theme.colors.beaconGold
    : theme.colors.beaconGold;

  const renderIcon = () => {
    const iconProps = { size: 18, color: accentColor, accessible: false };
    switch (variant) {
      case 'error':
        return <AlertCircle {...iconProps} />;
      case 'warning':
        return <AlertTriangle {...iconProps} />;
      case 'unavailable':
        return <ShieldAlert {...iconProps} />;
      case 'info':
      default:
        return <Info {...iconProps} />;
    }
  };

  const isAlertRole = isError || isWarning || isUnavailable;

  return (
    <View
      style={[
        styles.container,
        {
          borderColor: accentColor,
          backgroundColor: theme.colors.deckInk
        },
        style
      ]}
      accessibilityRole={isAlertRole ? 'alert' : 'summary'}
      accessibilityLiveRegion="polite"
      testID={testID}
    >
      <View style={styles.contentRow}>
        <View style={styles.iconContainer}>{renderIcon()}</View>
        <View style={styles.textContainer}>
          {title && (
            <AppText
              variant="body"
              weight="semibold"
              style={[styles.title, { color: accentColor }]}
              testID={`${testID}-title`}
            >
              {title}
            </AppText>
          )}
          <AppText
            variant="caption"
            style={styles.message}
            testID={`${testID}-message`}
          >
            {message}
          </AppText>

          {actionText && onAction && (
            <Pressable
              onPress={onAction}
              accessibilityRole="button"
              accessibilityLabel={actionText}
              hitSlop={8}
              style={styles.actionButton}
              testID={`${testID}-action-btn`}
            >
              <AppText
                variant="caption"
                weight="bold"
                style={[styles.actionText, { color: accentColor }]}
              >
                {actionText}
              </AppText>
            </Pressable>
          )}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: theme.radius.md,
    borderWidth: 1,
    padding: theme.spacing.spaceMd,
    marginVertical: theme.spacing.spaceSm
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: theme.spacing.spaceSm
  },
  iconContainer: {
    marginTop: 2,
    flexShrink: 0
  },
  textContainer: {
    flex: 1
  },
  title: {
    marginBottom: 2,
    letterSpacing: 0.5
  },
  message: {
    color: theme.colors.textSecondary,
    lineHeight: 18
  },
  actionButton: {
    marginTop: theme.spacing.spaceSm,
    alignSelf: 'flex-start'
  },
  actionText: {
    textDecorationLine: 'underline'
  }
});
