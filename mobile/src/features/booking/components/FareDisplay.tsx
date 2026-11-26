import React from 'react';
import { StyleSheet, View } from 'react-native';
import { CreditCard, Shield } from 'lucide-react-native';
import { FareQuote } from '../types/fareTypes';
import { AppText } from '../../../components/typography';
import { theme } from '../../../theme';

export interface FareDisplayProps {
  quote: FareQuote;
  testID?: string;
}

export const FareDisplay: React.FC<FareDisplayProps> = ({
  quote,
  testID = 'fare-display'
}) => {
  // Minor units to major units formatting (e.g. 250000 LKR minor units = 2,500.00)
  const formatMinorUnits = (minorUnits: number, currency: string) => {
    // Zero-decimal currencies
    if (currency === 'JPY') {
      return `${currency} ${minorUnits.toLocaleString()}`;
    }
    const major = (minorUnits / 100).toFixed(2);
    return `${currency} ${Number(major).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  return (
    <View style={styles.container} testID={testID}>
      <View style={styles.headerRow}>
        <View style={styles.kickerGroup}>
          <CreditCard size={14} color={theme.colors.beaconGold} />
          <AppText variant="caption" weight="bold" style={styles.kickerText}>
            AUTHORITATIVE FARE QUOTE
          </AppText>
        </View>
        {quote.issuingSource === 'operator_verified' && (
          <View style={styles.verifiedRow}>
            <Shield size={12} color={theme.colors.success} />
            <AppText variant="caption" style={styles.verifiedText}>
              VERIFIED
            </AppText>
          </View>
        )}
      </View>

      <View style={styles.amountContainer}>
        <AppText variant="h1" weight="bold" style={styles.amountText} testID={`${testID}-amount`}>
          {formatMinorUnits(quote.amountMinorUnits, quote.currency)}
        </AppText>
        <AppText variant="caption" style={styles.passengerNotice}>
          Covers {quote.passengerCount} {quote.passengerCount === 1 ? 'passenger' : 'passengers'}
          {quote.fareClass ? ` • ${quote.fareClass.toUpperCase()}` : ''}
        </AppText>
      </View>

      <View style={styles.footerRow}>
        <AppText variant="caption" style={styles.expiryText}>
          Valid until {new Date(quote.expiresAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </AppText>
        <AppText variant="caption" style={styles.sourceText}>
          Source: {quote.issuingSource}
        </AppText>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.colors.deckInk,
    borderRadius: theme.spacing.radii.card,
    borderWidth: 1,
    borderColor: 'rgba(0, 245, 255, 0.25)',
    padding: theme.spacing.spaceMd,
    gap: theme.spacing.spaceSm
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  kickerGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6
  },
  kickerText: {
    color: theme.colors.beaconGold,
    letterSpacing: 1
  },
  verifiedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(74, 222, 128, 0.1)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4
  },
  verifiedText: {
    color: theme.colors.success,
    fontSize: 9,
    fontWeight: 'bold'
  },
  amountContainer: {
    gap: 2,
    paddingVertical: 4
  },
  amountText: {
    color: theme.colors.textPrimary,
    letterSpacing: -0.5
  },
  passengerNotice: {
    color: theme.colors.textSecondary
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.05)',
    paddingTop: theme.spacing.spaceSm
  },
  expiryText: {
    color: theme.colors.beaconGold,
    fontSize: 10
  },
  sourceText: {
    color: theme.colors.textMuted,
    fontSize: 10
  }
});
