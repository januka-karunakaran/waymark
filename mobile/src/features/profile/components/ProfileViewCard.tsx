/**
 * Waymark Mobile — Feature 04.4: User Profile, Saved Places & Traveler Preferences
 * ProfileViewCard: Displays the authenticated traveler profile, avatar, credentials info,
 * and trigger for the profile editor.
 */

import React from 'react';
import { StyleSheet, View, Image } from 'react-native';
import { Mail, Calendar, ShieldCheck } from 'lucide-react-native';
import { AppCard } from '../../../components/cards/AppCard';
import { AppText } from '../../../components/typography/AppText';
import { AppButton } from '../../../components/buttons/AppButton';
import { UserProfile } from '../types';
import { theme } from '../../../theme';

export interface ProfileViewCardProps {
  profile: UserProfile | null;
  userEmail?: string;
  isEmailVerified?: boolean;
  onEditPress: () => void;
  testID?: string;
}

export const ProfileViewCard: React.FC<ProfileViewCardProps> = ({
  profile,
  userEmail,
  isEmailVerified = false,
  onEditPress,
  testID = 'profile-view-card'
}) => {
  const displayName = profile?.displayName || 'Planetary Navigator';
  const avatarUrl = profile?.avatarUrl;
  const initial = displayName.trim().charAt(0).toUpperCase() || 'P';

  const memberSince = profile?.createdAt
    ? new Date(profile.createdAt).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      })
    : 'Active Session';

  return (
    <AppCard style={styles.card} testID={testID}>
      <View style={styles.headerRow}>
        {/* Avatar Presentation */}
        <View style={styles.avatarContainer} testID="profile-avatar-container">
          {avatarUrl ? (
            <Image
              source={{ uri: avatarUrl }}
              style={styles.avatarImage}
              accessibilityLabel={`${displayName}'s avatar image`}
              testID="profile-avatar-image"
            />
          ) : (
            <View style={styles.avatarFallback} testID="profile-avatar-fallback">
              <AppText variant="h2" weight="bold" style={styles.avatarInitial}>
                {initial}
              </AppText>
            </View>
          )}
        </View>

        {/* Identity Details */}
        <View style={styles.identityContainer}>
          <AppText
            variant="h3"
            weight="bold"
            style={styles.displayNameText}
            numberOfLines={1}
            testID="profile-display-name"
          >
            {displayName}
          </AppText>
          <View style={styles.roleTag}>
            <AppText variant="caption" weight="medium" style={styles.roleTagText}>
              WAYMARK 2100 TRAVELER
            </AppText>
          </View>
        </View>
      </View>

      <View style={styles.divider} />

      {/* Profile Metadata Details */}
      <View style={styles.metaSection}>
        {userEmail && (
          <View style={styles.metaRow} testID="profile-email-row">
            <Mail size={16} color={theme.colors.textMuted} accessible={false} />
            <AppText variant="bodySmall" style={styles.metaText} numberOfLines={1}>
              {userEmail}
            </AppText>
            {isEmailVerified ? (
              <View style={styles.verifiedBadge} testID="profile-verified-badge">
                <ShieldCheck size={12} color={theme.colors.trainTeal} accessible={false} />
                <AppText variant="caption" weight="semibold" style={styles.verifiedText}>
                  Verified
                </AppText>
              </View>
            ) : (
              <View style={styles.unverifiedBadge} testID="profile-pending-badge">
                <AppText variant="caption" style={styles.unverifiedText}>
                  Unverified
                </AppText>
              </View>
            )}
          </View>
        )}

        <View style={styles.metaRow} testID="profile-created-row">
          <Calendar size={16} color={theme.colors.textMuted} accessible={false} />
          <AppText variant="caption" style={styles.metaText}>
            Member since {memberSince}
          </AppText>
        </View>
      </View>

      {/* Edit Profile Action */}
      <View style={styles.actionContainer}>
        <AppButton
          title="Edit Profile"
          variant="secondary"
          size="md"
          onPress={onEditPress}
          accessibilityHint="Opens editor to modify your display name and avatar URL"
          testID="btn-edit-profile"
        />
      </View>
    </AppCard>
  );
};

const styles = StyleSheet.create({
  card: {
    marginVertical: theme.spacing.spaceSm,
    padding: theme.spacing.spaceLg,
    backgroundColor: theme.colors.deckInk,
    borderColor: theme.colors.border
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.spaceMd
  },
  avatarContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    overflow: 'hidden',
    backgroundColor: theme.colors.panelInk,
    borderWidth: 2,
    borderColor: theme.colors.beaconGold,
    alignItems: 'center',
    justifyContent: 'center'
  },
  avatarImage: {
    width: '100%',
    height: '100%'
  },
  avatarFallback: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.panelInk
  },
  avatarInitial: {
    color: theme.colors.beaconGold
  },
  identityContainer: {
    flex: 1,
    gap: 4
  },
  displayNameText: {
    color: theme.colors.textPrimary
  },
  roleTag: {
    alignSelf: 'flex-start',
    backgroundColor: theme.colors.panelInk,
    paddingHorizontal: theme.spacing.spaceSm,
    paddingVertical: 2,
    borderRadius: theme.radius.sm,
    borderWidth: 1,
    borderColor: theme.colors.border
  },
  roleTagText: {
    color: theme.colors.beaconGold,
    fontSize: 10,
    letterSpacing: 0.5
  },
  divider: {
    height: 1,
    backgroundColor: theme.colors.border,
    marginVertical: theme.spacing.spaceMd
  },
  metaSection: {
    gap: theme.spacing.spaceSm
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.spaceSm
  },
  metaText: {
    color: theme.colors.textSecondary,
    flex: 1
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(45, 212, 191, 0.1)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: theme.radius.sm,
    borderWidth: 1,
    borderColor: theme.colors.trainTeal
  },
  verifiedText: {
    color: theme.colors.trainTeal,
    fontSize: 10
  },
  unverifiedBadge: {
    backgroundColor: theme.colors.panelInk,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: theme.radius.sm,
    borderWidth: 1,
    borderColor: theme.colors.border
  },
  unverifiedText: {
    color: theme.colors.textMuted,
    fontSize: 10
  },
  actionContainer: {
    marginTop: theme.spacing.spaceMd
  }
});
