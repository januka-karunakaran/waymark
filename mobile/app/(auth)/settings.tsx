import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import {
  Shield,
  Lock,
  Database,
  Sliders,
  CheckCircle2,
  Clock,
  LogOut,
  MapPin,
  Compass
} from 'lucide-react-native';
import {
  AuthScreenShell,
  AuthBrandHeader,
  AuthStatusNotice,
  useAuth
} from '../../src/features/auth';
import { useProfile } from '../../src/features/profile';
import { AppButton } from '../../src/components/buttons/AppButton';
import { AppCard } from '../../src/components/cards/AppCard';
import { AppText } from '../../src/components/typography/AppText';
import { theme } from '../../src/theme';

/**
 * AccountSettingsScreen — Truthful, secure account settings and privacy management.
 * Provides authenticated navigators and guests with clear session states, data disclosures,
 * and working navigation actions without decorative or fabricated toggles.
 */
export default function AccountSettingsScreen() {
  const router = useRouter();
  const { user, isAuthenticated, signOut } = useAuth();
  const { profile } = useProfile();

  const [isSigningOut, setIsSigningOut] = useState(false);
  const [signOutError, setSignOutError] = useState<string | null>(null);

  const handleReturn = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(auth)/account');
    }
  };

  const handleReturnHome = () => {
    router.replace('/(tabs)');
  };

  const handleSignOut = async () => {
    if (isSigningOut) return;
    setIsSigningOut(true);
    setSignOutError(null);
    try {
      await signOut();
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : 'Sign out operation could not be completed. Please check your network connection.';
      setSignOutError(message);
    } finally {
      setIsSigningOut(false);
    }
  };

  return (
    <AuthScreenShell
      testID="account-settings-screen"
      backButtonAccessibilityLabel="Return to Account Overview"
    >
      <AuthBrandHeader
        title="ACCOUNT SETTINGS"
        subtitle="Manage security, verified identity, and privacy controls."
        badgeText="WAYMARK 2100"
        statusTag={isAuthenticated ? 'SYS.AUTH_VERIFIED' : 'SYS.GUEST_MODE'}
        testID="settings-brand-header"
      />

      {signOutError && (
        <AuthStatusNotice
          variant="unavailable"
          title="Sign Out Error"
          message={signOutError}
          testID="settings-sign-out-error-notice"
        />
      )}

      {/* 1. Session & Identity Section */}
      <AppCard style={styles.card} testID="settings-session-card">
        <View style={styles.cardHeader}>
          {isAuthenticated ? (
            <Shield size={20} color={theme.colors.beaconGold} accessible={false} />
          ) : (
            <Compass size={20} color={theme.colors.beaconGold} accessible={false} />
          )}
          <AppText variant="h3" style={styles.cardTitle}>
            {isAuthenticated ? 'Session & Identity Status' : 'Guest Navigator Mode'}
          </AppText>
        </View>

        {isAuthenticated && user ? (
          <View style={styles.identityDetails}>
            <View style={styles.infoRow}>
              <AppText variant="caption" weight="medium" style={styles.infoLabel}>
                Authenticated Email:
              </AppText>
              <AppText variant="body" weight="semibold" style={styles.infoValue} testID="settings-user-email">
                {user.email}
              </AppText>
            </View>

            <View style={styles.infoRow}>
              <AppText variant="caption" weight="medium" style={styles.infoLabel}>
                Display Name:
              </AppText>
              <AppText variant="body" style={styles.infoValue} testID="settings-user-name">
                {profile?.displayName || user.displayName || 'Not configured'}
              </AppText>
            </View>

            <View style={styles.infoRow}>
              <AppText variant="caption" weight="medium" style={styles.infoLabel}>
                Verification State:
              </AppText>
              <View style={styles.badgeRow}>
                {user.emailVerified ? (
                  <View style={styles.verifiedBadge} testID="settings-email-verified-badge">
                    <CheckCircle2 size={13} color={theme.colors.success} accessible={false} />
                    <AppText variant="caption" weight="semibold" style={styles.verifiedBadgeText}>
                      Verified Email
                    </AppText>
                  </View>
                ) : (
                  <View style={styles.pendingBadge} testID="settings-email-pending-badge">
                    <Clock size={13} color={theme.colors.beaconGold} accessible={false} />
                    <AppText variant="caption" weight="semibold" style={styles.pendingBadgeText}>
                      Pending Verification
                    </AppText>
                  </View>
                )}
              </View>
            </View>

            <View style={styles.infoRow}>
              <AppText variant="caption" weight="medium" style={styles.infoLabel}>
                Token Storage:
              </AppText>
              <AppText variant="caption" style={styles.storageNote} testID="settings-keystore-status">
                Hardware-backed Keystore / Keychain (expo-secure-store)
              </AppText>
            </View>
          </View>
        ) : (
          <View style={styles.guestDetails}>
            <AppText variant="body" style={styles.cardBody} testID="settings-guest-status">
              You are currently navigating as an Anonymous Guest. No authenticated session tokens are stored on this device.
            </AppText>
            <AppText variant="caption" style={styles.guestNote}>
              Planetary discovery, vector radar maps, and multimodal journey search remain fully accessible without sign-in.
            </AppText>
          </View>
        )}
      </AppCard>

      {/* 2. Personalization & Corridor Shortcuts */}
      <AppCard style={styles.card} testID="settings-personalization-card">
        <View style={styles.cardHeader}>
          <Sliders size={20} color={theme.colors.beaconGold} accessible={false} />
          <AppText variant="h3" style={styles.cardTitle}>
            Personalization & Corridors
          </AppText>
        </View>

        <AppText variant="body" style={styles.cardBody}>
          Configure private transit corridors and customize multimodal transit preferences.
        </AppText>

        <View style={styles.personalizationActions}>
          <AppButton
            title="Manage Saved Places"
            variant="secondary"
            size="md"
            onPress={() => router.push('/(auth)/account')}
            accessibilityLabel="Manage Saved Places"
            accessibilityHint="Navigates to the Account screen to configure Home, Work, and Favorite shortcuts"
            testID="btn-settings-saved-places"
          />

          <AppButton
            title="Adjust Traveler Preferences"
            variant="secondary"
            size="md"
            onPress={() => router.push('/(auth)/account')}
            accessibilityLabel="Adjust Traveler Preferences"
            accessibilityHint="Navigates to the Account screen to modify multimodal transit modes and distance units"
            testID="btn-settings-preferences"
          />

          {isAuthenticated && (
            <AppButton
              title="Edit Profile Identity"
              variant="secondary"
              size="md"
              onPress={() => router.push('/(auth)/account')}
              accessibilityLabel="Edit Profile Identity"
              accessibilityHint="Navigates to the Account screen to update your public display name and avatar"
              testID="btn-settings-edit-profile"
            />
          )}
        </View>
      </AppCard>

      {/* 3. Privacy & Data Storage Policy */}
      <AppCard style={styles.card} testID="settings-privacy-card">
        <View style={styles.cardHeader}>
          <Lock size={20} color={theme.colors.beaconGold} accessible={false} />
          <AppText variant="h3" style={styles.cardTitle}>
            Privacy & Data Architecture
          </AppText>
        </View>

        <View style={styles.disclosureItem}>
          <Shield size={16} color={theme.colors.beaconGold} accessible={false} />
          <View style={styles.disclosureTextContainer}>
            <AppText variant="caption" weight="semibold" style={styles.disclosureTitle}>
              Row Level Security Isolation
            </AppText>
            <AppText variant="caption" style={styles.disclosureBody}>
              Profile, saved places, and preferences are secured by Supabase PostgreSQL RLS. Cross-user access is blocked at the database tier.
            </AppText>
          </View>
        </View>

        <View style={styles.disclosureItem}>
          <Lock size={16} color={theme.colors.beaconGold} accessible={false} />
          <View style={styles.disclosureTextContainer}>
            <AppText variant="caption" weight="semibold" style={styles.disclosureTitle}>
              Hardware-Encrypted Tokens
            </AppText>
            <AppText variant="caption" style={styles.disclosureBody}>
              Authentication tokens reside strictly in hardware-backed secure storage. Plaintext session data is never stored in unencrypted AsyncStorage.
            </AppText>
          </View>
        </View>

        <View style={styles.disclosureItem}>
          <MapPin size={16} color={theme.colors.beaconGold} accessible={false} />
          <View style={styles.disclosureTextContainer}>
            <AppText variant="caption" weight="semibold" style={styles.disclosureTitle}>
              Zero Continuous Tracking
            </AppText>
            <AppText variant="caption" style={styles.disclosureBody}>
              Waymark does not log persistent location breadcrumbs or collect health, disability, or tracking telemetry. Routing runs client-side.
            </AppText>
          </View>
        </View>

        <View style={styles.disclosureItem}>
          <LogOut size={16} color={theme.colors.beaconGold} accessible={false} />
          <View style={styles.disclosureTextContainer}>
            <AppText variant="caption" weight="semibold" style={styles.disclosureTitle}>
              Session Purging on Sign-Out
            </AppText>
            <AppText variant="caption" style={styles.disclosureBody}>
              Signing out purges in-memory profile and saved place state from the device. Remote account records remain protected in Supabase.
            </AppText>
          </View>
        </View>
      </AppCard>

      {/* 4. Data Rights & Future Account Capabilities */}
      <AppCard style={styles.card} testID="settings-data-management-card">
        <View style={styles.cardHeader}>
          <Database size={20} color={theme.colors.beaconGold} accessible={false} />
          <AppText variant="h3" style={styles.cardTitle}>
            Data Rights & Management
          </AppText>
        </View>

        <AppText variant="body" style={styles.cardBody}>
          Waymark supports traveler data rights under modern privacy frameworks. Self-service export and account deletion are actively in engineering.
        </AppText>

        <View style={styles.futureBadge} testID="badge-future-capabilities">
          <AppText variant="caption" weight="semibold" style={styles.futureBadgeText}>
            Automated Account Deletion & Bulk Export: Milestone 05
          </AppText>
        </View>

        <AppText variant="caption" style={styles.supportNote}>
          For manual data deletion or subject access inquiries, contact privacy@waymark.app.
        </AppText>
      </AppCard>

      {/* 5. Primary Actions */}
      <View style={styles.actionsContainer} testID="settings-actions-container">
        {isAuthenticated ? (
          <>
            <AppButton
              title="Sign Out"
              variant="secondary"
              size="lg"
              onPress={handleSignOut}
              loading={isSigningOut}
              accessibilityLabel="Sign Out of Waymark"
              accessibilityHint="Signs out of your account and purges local memory state"
              testID="btn-settings-sign-out"
            />
            <AppButton
              title="Return to Account"
              variant="primary"
              size="lg"
              onPress={handleReturn}
              accessibilityLabel="Return to Account"
              accessibilityHint="Navigates back to the Account screen"
              testID="btn-settings-return-account"
            />
            <AppButton
              title="Planetary Dashboard"
              variant="secondary"
              size="lg"
              onPress={handleReturnHome}
              accessibilityLabel="Return to Planetary Dashboard"
              accessibilityHint="Returns to the main planetary transit dashboard"
              testID="btn-settings-return-home"
            />
          </>
        ) : (
          <>
            <AppButton
              title="Sign In with Waymark ID"
              variant="primary"
              size="lg"
              onPress={() => router.push('/(auth)/sign-in')}
              accessibilityLabel="Sign In with Waymark ID"
              accessibilityHint="Navigates to the sign-in screen"
              testID="btn-settings-sign-in"
            />
            <AppButton
              title="Create a Waymark ID"
              variant="secondary"
              size="lg"
              onPress={() => router.push('/(auth)/sign-up')}
              accessibilityLabel="Create a Waymark ID"
              accessibilityHint="Navigates to the registration screen"
              testID="btn-settings-sign-up"
            />
            <AppButton
              title="Return to Dashboard"
              variant="secondary"
              size="lg"
              onPress={handleReturnHome}
              accessibilityLabel="Return to Dashboard"
              accessibilityHint="Returns to the planetary transit dashboard in Guest mode"
              testID="btn-settings-return-home"
            />
          </>
        )}
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
    lineHeight: 20,
    marginBottom: theme.spacing.spaceSm
  },
  identityDetails: {
    gap: theme.spacing.spaceSm,
    marginTop: theme.spacing.spaceXs
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4
  },
  infoLabel: {
    color: theme.colors.textMuted
  },
  infoValue: {
    color: theme.colors.textPrimary
  },
  storageNote: {
    color: theme.colors.beaconGold,
    fontSize: 11
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: theme.spacing.spaceSm,
    paddingVertical: 2,
    borderRadius: theme.radius.sm,
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
    borderWidth: 1,
    borderColor: theme.colors.success
  },
  verifiedBadgeText: {
    color: theme.colors.success,
    fontSize: 11
  },
  pendingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: theme.spacing.spaceSm,
    paddingVertical: 2,
    borderRadius: theme.radius.sm,
    backgroundColor: 'rgba(234, 179, 8, 0.1)',
    borderWidth: 1,
    borderColor: theme.colors.beaconGold
  },
  pendingBadgeText: {
    color: theme.colors.beaconGold,
    fontSize: 11
  },
  guestDetails: {
    gap: theme.spacing.spaceXs
  },
  guestNote: {
    color: theme.colors.textMuted,
    lineHeight: 18
  },
  personalizationActions: {
    gap: theme.spacing.spaceSm,
    marginTop: theme.spacing.spaceSm
  },
  disclosureItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: theme.spacing.spaceSm,
    marginVertical: theme.spacing.spaceXs
  },
  disclosureTextContainer: {
    flex: 1
  },
  disclosureTitle: {
    color: theme.colors.textPrimary,
    marginBottom: 2
  },
  disclosureBody: {
    color: theme.colors.textMuted,
    lineHeight: 16
  },
  futureBadge: {
    marginTop: theme.spacing.spaceSm,
    paddingVertical: theme.spacing.spaceXs,
    paddingHorizontal: theme.spacing.spaceSm,
    borderRadius: theme.radius.sm,
    backgroundColor: theme.colors.panelInk,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignSelf: 'flex-start'
  },
  futureBadgeText: {
    color: theme.colors.beaconGold,
    fontSize: 11
  },
  supportNote: {
    color: theme.colors.textMuted,
    fontSize: 11,
    marginTop: theme.spacing.spaceSm
  },
  actionsContainer: {
    marginTop: theme.spacing.spaceLg,
    gap: theme.spacing.spaceMd,
    marginBottom: theme.spacing.spaceXl
  }
});
