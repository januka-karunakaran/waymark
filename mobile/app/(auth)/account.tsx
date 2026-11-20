import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Shield, Sparkles, Compass, MapPin } from 'lucide-react-native';
import {
  AuthScreenShell,
  AuthBrandHeader,
  AuthStatusNotice,
  useAuth
} from '../../src/features/auth';
import { AppButton } from '../../src/components/buttons/AppButton';
import { AppCard } from '../../src/components/cards/AppCard';
import { AppText } from '../../src/components/typography/AppText';
import { theme } from '../../src/theme';

/**
 * AccountScreen — Landing screen for account access and identity management.
 * Explains authentication readiness truthfully without fake login forms or dummy credentials.
 * Ensures guest users can seamlessly continue exploring core planetary transit tools.
 */
export default function AccountScreen() {
  const router = useRouter();
  const { serviceReadiness, status, user } = useAuth();

  const handleReturnHome = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(tabs)');
    }
  };

  const handleGoToMap = () => {
    router.replace('/(tabs)/map');
  };

  const isConfigured = serviceReadiness !== 'not_configured';

  return (
    <AuthScreenShell
      testID="account-landing-screen"
      backButtonAccessibilityLabel="Return to previous screen"
    >
      <AuthBrandHeader
        title="ACCOUNT ACCESS"
        subtitle="Manage your multimodal transit identity and preferences."
        badgeText="WAYMARK 2100"
        statusTag={isConfigured ? 'SYS.READY' : 'SYS.GUEST'}
        testID="account-brand-header"
      />

      {/* Truthful Service Readiness Status */}
      {!isConfigured ? (
        <AuthStatusNotice
          variant="unavailable"
          title="Authentication Service Standby"
          message="External identity providers are currently not configured. Full planetary transit routing, vector radar mapping, and AI concierge features are completely accessible in Guest mode."
          testID="account-unconfigured-notice"
        />
      ) : (
        <AuthStatusNotice
          variant="info"
          title="Service Online"
          message="Authentication services are operational. Identity verification and profile synchronization are available."
          testID="account-configured-notice"
        />
      )}

      {/* Current Navigator Status Card */}
      <AppCard style={styles.card} testID="account-status-card">
        <View style={styles.cardHeader}>
          <Compass size={20} color={theme.colors.beaconGold} accessible={false} />
          <AppText variant="h3" style={styles.cardTitle}>
            Current Navigation Mode
          </AppText>
        </View>
        <AppText variant="body" style={styles.cardBody}>
          {status === 'authenticated' && user
            ? `Signed in as ${user.displayName || user.email}`
            : 'You are currently traveling as an Anonymous Guest Navigator. All planetary transit schedules, vector navigation, and mission corridors are active.'}
        </AppText>
      </AppCard>

      {/* Upcoming Capabilities Information Card */}
      <AppCard style={styles.card} testID="account-features-card">
        <View style={styles.cardHeader}>
          <Sparkles size={20} color={theme.colors.beaconGold} accessible={false} />
          <AppText variant="h3" style={styles.cardTitle}>
            Upcoming Account Capabilities
          </AppText>
        </View>
        <View style={styles.featureItem}>
          <Shield size={16} color={theme.colors.textMuted} accessible={false} />
          <AppText variant="caption" style={styles.featureText}>
            Personalized transit passes & synchronized route bookmarks
          </AppText>
        </View>
        <View style={styles.featureItem}>
          <MapPin size={16} color={theme.colors.textMuted} accessible={false} />
          <AppText variant="caption" style={styles.featureText}>
            Frequent corridors & biometric boarding verification
          </AppText>
        </View>
        <View style={styles.comingSoonBadge} testID="account-coming-soon-badge">
          <AppText variant="caption" weight="semibold" style={styles.comingSoonText}>
            Sign-In & Registration rolling out in System Update 04.2.2 / 04.2.3
          </AppText>
        </View>
      </AppCard>

      {/* Primary Actions */}
      <View style={styles.actionContainer}>
        <AppButton
          title="Continue as Guest"
          variant="primary"
          size="lg"
          onPress={handleReturnHome}
          accessibilityHint="Returns to the Planetary Transit Network dashboard"
          testID="btn-continue-as-guest"
        />
        <AppButton
          title="Open Multimodal Radar Map"
          variant="secondary"
          size="lg"
          onPress={handleGoToMap}
          accessibilityHint="Navigates to the live vector transit canvas"
          testID="btn-open-radar-map"
        />
      </View>
    </AuthScreenShell>
  );
}

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
    gap: theme.spacing.spaceSm,
    marginBottom: theme.spacing.spaceSm
  },
  cardTitle: {
    color: theme.colors.textPrimary
  },
  cardBody: {
    color: theme.colors.textSecondary,
    lineHeight: 20
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.spaceSm,
    marginVertical: 4
  },
  featureText: {
    color: theme.colors.textSecondary,
    flex: 1
  },
  comingSoonBadge: {
    marginTop: theme.spacing.spaceMd,
    paddingVertical: theme.spacing.spaceXs,
    paddingHorizontal: theme.spacing.spaceSm,
    borderRadius: theme.radius.sm,
    backgroundColor: theme.colors.panelInk,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignSelf: 'flex-start'
  },
  comingSoonText: {
    color: theme.colors.beaconGold,
    fontSize: 11
  },
  actionContainer: {
    marginTop: theme.spacing.spaceLg,
    gap: theme.spacing.spaceMd
  }
});
