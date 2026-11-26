import React from 'react';
import { StyleSheet, View, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { ChevronLeft, Ticket } from 'lucide-react-native';
import { AppText } from '../../../components/typography';
import { theme } from '../../../theme';

export interface BookingHeaderProps {
  title: string;
  subtitle?: string;
  showBack?: boolean;
  onBack?: () => void;
  kicker?: string;
  testID?: string;
}

export const BookingHeader: React.FC<BookingHeaderProps> = ({
  title,
  subtitle,
  showBack = true,
  onBack,
  kicker = 'WAYMARK 2100 TICKETING',
  testID = 'booking-header'
}) => {
  const router = useRouter();

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      router.back();
    }
  };

  return (
    <View style={styles.container} testID={testID}>
      {showBack && (
        <Pressable
          onPress={handleBack}
          style={styles.backButton}
          accessibilityRole="button"
          accessibilityLabel="Go back"
          accessibilityHint="Returns to previous screen"
          testID="booking-header-back-button"
        >
          <ChevronLeft size={22} color={theme.colors.beaconGold} />
          <AppText variant="caption" weight="semibold" style={styles.backText}>
            BACK
          </AppText>
        </Pressable>
      )}

      <View style={styles.kickerRow}>
        <Ticket size={14} color={theme.colors.beaconGold} />
        <AppText variant="caption" weight="bold" style={styles.kickerText}>
          {kicker}
        </AppText>
      </View>

      <AppText
        variant="h1"
        weight="bold"
        style={styles.title}
        accessibilityRole="header"
        testID="booking-header-title"
      >
        {title}
      </AppText>

      {subtitle && (
        <AppText variant="bodySmall" style={styles.subtitle} testID="booking-header-subtitle">
          {subtitle}
        </AppText>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: theme.spacing.spaceXs,
    paddingBottom: theme.spacing.spaceSm
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
    marginBottom: theme.spacing.spaceXs,
    paddingVertical: 6,
    paddingRight: 12
  },
  backText: {
    color: theme.colors.beaconGold,
    letterSpacing: 1
  },
  kickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6
  },
  kickerText: {
    color: theme.colors.beaconGold,
    letterSpacing: 1.2
  },
  title: {
    color: theme.colors.textPrimary,
    letterSpacing: -0.5
  },
  subtitle: {
    color: theme.colors.textSecondary,
    lineHeight: 20
  }
});
