import React from 'react';
import { StyleSheet, View } from 'react-native';
import { AlertCircle, AlertTriangle, Info, CheckCircle2 } from 'lucide-react-native';
import { AppText } from '../../../components/typography';
import { theme } from '../../../theme';

export type BookingNoticeVariant = 'info' | 'warning' | 'error' | 'success';

export interface BookingStatusNoticeProps {
  variant?: BookingNoticeVariant;
  title: string;
  message: string;
  testID?: string;
}

export const BookingStatusNotice: React.FC<BookingStatusNoticeProps> = ({
  variant = 'info',
  title,
  message,
  testID = 'booking-status-notice'
}) => {
  const getIcon = () => {
    switch (variant) {
      case 'error':
        return <AlertCircle size={18} color={theme.colors.error} />;
      case 'warning':
        return <AlertTriangle size={18} color={theme.colors.warning} />;
      case 'success':
        return <CheckCircle2 size={18} color={theme.colors.success} />;
      case 'info':
      default:
        return <Info size={18} color={theme.colors.info} />;
    }
  };

  const getBorderColor = () => {
    switch (variant) {
      case 'error':
        return 'rgba(255, 93, 93, 0.4)';
      case 'warning':
        return 'rgba(255, 159, 67, 0.4)';
      case 'success':
        return 'rgba(74, 222, 128, 0.4)';
      case 'info':
      default:
        return 'rgba(124, 196, 255, 0.3)';
    }
  };

  return (
    <View
      style={[styles.container, { borderColor: getBorderColor() }]}
      testID={testID}
      accessibilityRole="alert"
    >
      <View style={styles.iconContainer}>{getIcon()}</View>
      <View style={styles.textContainer}>
        <AppText variant="bodySmall" weight="bold" style={styles.title}>
          {title}
        </AppText>
        <AppText variant="caption" style={styles.message}>
          {message}
        </AppText>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: theme.colors.deckInk,
    borderWidth: 1,
    borderRadius: theme.spacing.radii.card,
    padding: theme.spacing.spaceMd,
    gap: theme.spacing.spaceSm
  },
  iconContainer: {
    paddingTop: 2
  },
  textContainer: {
    flex: 1,
    gap: 3
  },
  title: {
    color: theme.colors.textPrimary
  },
  message: {
    color: theme.colors.textSecondary,
    lineHeight: 18
  }
});
