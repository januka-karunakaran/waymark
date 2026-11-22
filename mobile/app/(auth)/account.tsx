import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Shield, Sparkles, Compass, MapPin } from 'lucide-react-native';
import {
  AuthScreenShell,
  AuthBrandHeader,
  AuthStatusNotice,
  useAuth
} from '../../src/features/auth';
import {
  useProfile,
  ProfileViewCard,
  ProfileEditModal,
  SavedPlacesCard,
  AddSavedPlaceModal,
  TravelerPreferencesCard,
  SavedPlaceKind
} from '../../src/features/profile';
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
  const { serviceReadiness, user, isAuthenticated, signOut } = useAuth();
  const {
    profile,
    savedPlaces,
    preferences,
    updateProfile,
    addSavedPlace,
    deleteSavedPlace,
    updatePreferences,
    isSaving
  } = useProfile();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAddPlaceOpen, setIsAddPlaceOpen] = useState(false);
  const [addPlaceKind, setAddPlaceKind] = useState<SavedPlaceKind>('favorite');

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

  const handleSignOut = async () => {
    await signOut();
  };

  const handleSaveProfile = async (
    displayName: string | null,
    avatarUrl: string | null
  ): Promise<boolean> => {
    const res = await updateProfile({ displayName, avatarUrl });
    return res.success;
  };

  const handleOpenAddPlace = (kind: SavedPlaceKind) => {
    setAddPlaceKind(kind);
    setIsAddPlaceOpen(true);
  };

  const handleSavePlace = async (
    kind: SavedPlaceKind,
    label: string,
    placeText: string
  ): Promise<boolean> => {
    const res = await addSavedPlace({ kind, label, placeText });
    return res.success;
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
        statusTag={isAuthenticated ? 'SYS.AUTH' : isConfigured ? 'SYS.READY' : 'SYS.GUEST'}
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
      ) : isAuthenticated && user ? (
        <AuthStatusNotice
          variant="info"
          title="Account Verified"
          message={`Authenticated session active for ${user.email}. Planetary transit preferences and synchronized route bookmarks enabled.`}
          testID="account-authenticated-notice"
        />
      ) : (
        <AuthStatusNotice
          variant="info"
          title="Service Online"
          message="Authentication services are operational. Identity verification and profile synchronization are available."
          testID="account-configured-notice"
        />
      )}

      {/* Profile Card or Current Navigator Status Card */}
      {isAuthenticated && user ? (
        <>
          <ProfileViewCard
            profile={profile}
            userEmail={user.email}
            isEmailVerified={user.emailVerified}
            onEditPress={() => setIsEditModalOpen(true)}
            testID="account-profile-card"
          />

          <SavedPlacesCard
            savedPlaces={savedPlaces}
            onAddPlacePress={handleOpenAddPlace}
            onDeletePlacePress={deleteSavedPlace}
            testID="account-saved-places-card"
          />

          <TravelerPreferencesCard
            preferences={preferences}
            onUpdatePreferences={async (inp) => {
              const res = await updatePreferences(inp);
              return res.success;
            }}
            isSaving={isSaving}
            testID="account-traveler-preferences-card"
          />
        </>
      ) : (
        <AppCard style={styles.card} testID="account-status-card">
          <View style={styles.cardHeader}>
            <Compass size={20} color={theme.colors.beaconGold} accessible={false} />
            <AppText variant="h3" style={styles.cardTitle}>
              Current Navigation Mode
            </AppText>
          </View>
          <AppText variant="body" style={styles.cardBody}>
            You are currently traveling as an Anonymous Guest Navigator. All planetary transit schedules, vector navigation, and mission corridors are active.
          </AppText>
        </AppCard>
      )}

      {/* Edit Profile Modal */}
      {isAuthenticated && user && (
        <ProfileEditModal
          visible={isEditModalOpen}
          initialDisplayName={profile?.displayName || user.displayName || null}
          initialAvatarUrl={profile?.avatarUrl || null}
          isSaving={isSaving}
          onSave={handleSaveProfile}
          onClose={() => setIsEditModalOpen(false)}
          testID="account-profile-edit-modal"
        />
      )}

      {/* Add / Edit Saved Place Modal */}
      {isAuthenticated && user && (
        <AddSavedPlaceModal
          visible={isAddPlaceOpen}
          initialKind={addPlaceKind}
          isSaving={isSaving}
          onSave={handleSavePlace}
          onClose={() => setIsAddPlaceOpen(false)}
          testID="account-add-place-modal"
        />
      )}

      {/* Capabilities Information Card */}
      <AppCard style={styles.card} testID="account-features-card">
        <View style={styles.cardHeader}>
          <Sparkles size={20} color={theme.colors.beaconGold} accessible={false} />
          <AppText variant="h3" style={styles.cardTitle}>
            {isAuthenticated ? 'Active Capabilities' : 'Upcoming Account Capabilities'}
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
        {!isAuthenticated && (
          <View style={styles.comingSoonBadge} testID="account-coming-soon-badge">
            <AppText variant="caption" weight="semibold" style={styles.comingSoonText}>
              Sign-In & Registration rolling out in System Update 04.2.2 / 04.2.3
            </AppText>
          </View>
        )}
      </AppCard>

      {/* Primary Actions */}
      <View style={styles.actionContainer}>
        {isAuthenticated ? (
          <>
            <AppButton
              title="Sign Out"
              variant="secondary"
              size="lg"
              onPress={handleSignOut}
              accessibilityHint="Signs out of your Waymark account and transitions to guest navigation"
              testID="btn-account-sign-out"
            />
            <AppButton
              title="Return to Planetary Dashboard"
              variant="primary"
              size="lg"
              onPress={handleReturnHome}
              accessibilityHint="Returns to the planetary transit dashboard"
              testID="btn-account-return-dashboard"
            />
            <AppButton
              title="Open Multimodal Radar Map"
              variant="secondary"
              size="lg"
              onPress={handleGoToMap}
              accessibilityHint="Navigates to the live vector transit canvas"
              testID="btn-open-radar-map"
            />
          </>
        ) : (
          <>
            <AppButton
              title="Sign In with Waymark ID"
              variant="primary"
              size="lg"
              onPress={() => router.push('/(auth)/sign-in')}
              accessibilityHint="Navigates to the account sign-in interface"
              testID="btn-navigate-sign-in"
            />
            <AppButton
              title="Create a Waymark ID"
              variant="secondary"
              size="lg"
              onPress={() => router.push('/(auth)/sign-up')}
              accessibilityHint="Navigates to the account registration interface"
              testID="btn-navigate-sign-up"
            />
            <AppButton
              title="Continue as Guest"
              variant="secondary"
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
