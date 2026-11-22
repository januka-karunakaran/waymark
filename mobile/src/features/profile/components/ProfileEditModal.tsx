/**
 * Waymark Mobile — Feature 04.4: User Profile, Saved Places & Traveler Preferences
 * ProfileEditModal: Accessible modal form for updating traveler display name and avatar URL.
 * Features real-time client validation, loading states, and error handling.
 */

import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Modal,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Pressable
} from 'react-native';
import { X, AlertCircle } from 'lucide-react-native';
import { AppText } from '../../../components/typography/AppText';
import { AppButton } from '../../../components/buttons/AppButton';
import { AppInput } from '../../../components/forms/AppInput';
import { FormField } from '../../../components/forms/FormField';
import {
  validateDisplayName,
  validateAvatarUrl,
  DISPLAY_NAME_MAX_LENGTH,
  AVATAR_URL_MAX_LENGTH
} from '../validation';
import { theme } from '../../../theme';

export interface ProfileEditModalProps {
  visible: boolean;
  initialDisplayName: string | null;
  initialAvatarUrl: string | null;
  isSaving: boolean;
  onSave: (displayName: string | null, avatarUrl: string | null) => Promise<boolean>;
  onClose: () => void;
  testID?: string;
}

export const ProfileEditModal: React.FC<ProfileEditModalProps> = ({
  visible,
  initialDisplayName,
  initialAvatarUrl,
  isSaving,
  onSave,
  onClose,
  testID = 'profile-edit-modal'
}) => {
  const [displayName, setDisplayName] = useState<string>('');
  const [avatarUrl, setAvatarUrl] = useState<string>('');
  const [displayNameError, setDisplayNameError] = useState<string | null>(null);
  const [avatarUrlError, setAvatarUrlError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    if (visible) {
      setDisplayName(initialDisplayName || '');
      setAvatarUrl(initialAvatarUrl || '');
      setDisplayNameError(null);
      setAvatarUrlError(null);
      setSubmitError(null);
    }
  }, [visible, initialDisplayName, initialAvatarUrl]);

  const handleDisplayNameChange = (text: string) => {
    setDisplayName(text);
    if (displayNameError) {
      const validation = validateDisplayName(text);
      if (validation.isValid) {
        setDisplayNameError(null);
      }
    }
  };

  const handleAvatarUrlChange = (text: string) => {
    setAvatarUrl(text);
    if (avatarUrlError) {
      const validation = validateAvatarUrl(text);
      if (validation.isValid) {
        setAvatarUrlError(null);
      }
    }
  };

  const handleSave = async () => {
    setSubmitError(null);

    const nameValidation = validateDisplayName(displayName);
    if (!nameValidation.isValid) {
      setDisplayNameError(nameValidation.error || 'Invalid display name.');
      return;
    }

    const avatarValidation = validateAvatarUrl(avatarUrl);
    if (!avatarValidation.isValid) {
      setAvatarUrlError(avatarValidation.error || 'Invalid avatar URL.');
      return;
    }

    const success = await onSave(
      nameValidation.sanitized ?? null,
      avatarValidation.sanitized ?? null
    );

    if (success) {
      onClose();
    } else {
      setSubmitError('Unable to update profile. Please verify your connection and try again.');
    }
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={isSaving ? undefined : onClose}
      testID={testID}
      accessibilityViewIsModal={true}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.modalBackdrop}
      >
        <View style={styles.modalContent} testID="profile-edit-dialog">
          {/* Header */}
          <View style={styles.header}>
            <View>
              <AppText variant="h3" weight="bold" style={styles.title}>
                Edit Profile
              </AppText>
              <AppText variant="caption" style={styles.subtitle}>
                Customize how you appear across the transit network
              </AppText>
            </View>
            <Pressable
              onPress={onClose}
              disabled={isSaving}
              accessibilityRole="button"
              accessibilityLabel="Close profile editor"
              hitSlop={12}
              style={styles.closeButton}
              testID="btn-close-profile-modal"
            >
              <X size={20} color={theme.colors.textMuted} />
            </Pressable>
          </View>

          {/* Submission Error Banner */}
          {submitError && (
            <View style={styles.errorBanner} testID="profile-submit-error">
              <AlertCircle size={16} color={theme.colors.busCoral} accessible={false} />
              <AppText variant="bodySmall" style={styles.errorBannerText}>
                {submitError}
              </AppText>
            </View>
          )}

          <ScrollView style={styles.formScroll} showsVerticalScrollIndicator={false}>
            {/* Display Name Input */}
            <FormField
              label="Display Name"
              helperText={`Max ${DISPLAY_NAME_MAX_LENGTH} characters. Visible to transit navigators.`}
              error={displayNameError ?? undefined}
              testID="field-display-name"
            >
              <AppInput
                value={displayName}
                onChangeText={handleDisplayNameChange}
                placeholder="e.g. Captain Janu"
                maxLength={DISPLAY_NAME_MAX_LENGTH}
                autoCapitalize="words"
                editable={!isSaving}
                testID="input-display-name"
              />
            </FormField>

            {/* Avatar URL Input */}
            <FormField
              label="Avatar Image URL"
              helperText={`Max ${AVATAR_URL_MAX_LENGTH} characters. Must begin with http:// or https://.`}
              error={avatarUrlError ?? undefined}
              testID="field-avatar-url"
            >
              <AppInput
                value={avatarUrl}
                onChangeText={handleAvatarUrlChange}
                placeholder="https://example.com/avatar.png"
                maxLength={AVATAR_URL_MAX_LENGTH}
                autoCapitalize="none"
                keyboardType="url"
                editable={!isSaving}
                testID="input-avatar-url"
              />
            </FormField>
          </ScrollView>

          {/* Action Buttons */}
          <View style={styles.actionRow}>
            <AppButton
              title="Cancel"
              variant="secondary"
              size="md"
              onPress={onClose}
              disabled={isSaving}
              style={styles.actionButton}
              testID="btn-cancel-edit-profile"
            />
            <AppButton
              title={isSaving ? 'Saving...' : 'Save Profile'}
              variant="primary"
              size="md"
              onPress={handleSave}
              disabled={isSaving}
              style={styles.actionButton}
              testID="btn-save-profile"
            />
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(5, 7, 10, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.spaceMd
  },
  modalContent: {
    width: '100%',
    maxWidth: 480,
    maxHeight: '90%',
    backgroundColor: theme.colors.abyssVoid,
    borderRadius: theme.radius.card,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: theme.spacing.spaceLg,
    gap: theme.spacing.spaceMd
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start'
  },
  title: {
    color: theme.colors.textPrimary
  },
  subtitle: {
    color: theme.colors.textSecondary,
    marginTop: 2
  },
  closeButton: {
    padding: 4
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.spaceSm,
    backgroundColor: 'rgba(255, 122, 89, 0.1)',
    padding: theme.spacing.spaceSm,
    borderRadius: theme.radius.sm,
    borderWidth: 1,
    borderColor: theme.colors.busCoral
  },
  errorBannerText: {
    color: theme.colors.busCoral,
    flex: 1
  },
  formScroll: {
    maxHeight: 320
  },
  actionRow: {
    flexDirection: 'row',
    gap: theme.spacing.spaceMd,
    marginTop: theme.spacing.spaceSm
  },
  actionButton: {
    flex: 1
  }
});
