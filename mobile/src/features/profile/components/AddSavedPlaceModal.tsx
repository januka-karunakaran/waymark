/**
 * Waymark Mobile — Feature 04.4: User Profile, Saved Places & Traveler Preferences
 * AddSavedPlaceModal: Accessible modal form for adding or updating saved places (Home, Work, Favorite).
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
  validateSavedPlaceInput,
  LABEL_MAX_LENGTH,
  PLACE_TEXT_MAX_LENGTH
} from '../validation';
import { SavedPlaceKind } from '../types';
import { theme } from '../../../theme';

export interface AddSavedPlaceModalProps {
  visible: boolean;
  initialKind?: SavedPlaceKind;
  isSaving: boolean;
  onSave: (kind: SavedPlaceKind, label: string, placeText: string) => Promise<boolean>;
  onClose: () => void;
  testID?: string;
}

export const AddSavedPlaceModal: React.FC<AddSavedPlaceModalProps> = ({
  visible,
  initialKind = 'favorite',
  isSaving,
  onSave,
  onClose,
  testID = 'add-saved-place-modal'
}) => {
  const [kind, setKind] = useState<SavedPlaceKind>(initialKind);
  const [label, setLabel] = useState<string>('');
  const [placeText, setPlaceText] = useState<string>('');
  const [labelError, setLabelError] = useState<string | null>(null);
  const [placeTextError, setPlaceTextError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    if (visible) {
      setKind(initialKind);
      if (initialKind === 'home') setLabel('Home');
      else if (initialKind === 'work') setLabel('Work');
      else setLabel('');
      setPlaceText('');
      setLabelError(null);
      setPlaceTextError(null);
      setSubmitError(null);
    }
  }, [visible, initialKind]);

  const handleKindSelect = (selectedKind: SavedPlaceKind) => {
    setKind(selectedKind);
    if (selectedKind === 'home') setLabel('Home');
    else if (selectedKind === 'work') setLabel('Work');
    else if (label === 'Home' || label === 'Work') setLabel('');
  };

  const handleSave = async () => {
    setSubmitError(null);
    setLabelError(null);
    setPlaceTextError(null);

    const validation = validateSavedPlaceInput({
      kind,
      label,
      placeText
    });

    if (!validation.isValid) {
      if (validation.error?.toLowerCase().includes('label')) {
        setLabelError(validation.error);
      } else if (validation.error?.toLowerCase().includes('place text')) {
        setPlaceTextError(validation.error);
      } else {
        setSubmitError(validation.error || 'Invalid saved place values.');
      }
      return;
    }

    const sanitized = validation.sanitized;
    if (!sanitized) return;

    const success = await onSave(sanitized.kind, sanitized.label, sanitized.placeText);
    if (success) {
      onClose();
    } else {
      setSubmitError('Failed to save destination. Please check your connection and try again.');
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
        <View style={styles.modalContent} testID="add-saved-place-dialog">
          {/* Header */}
          <View style={styles.header}>
            <View>
              <AppText variant="h3" weight="bold" style={styles.title}>
                {kind === 'home' ? 'Configure Home' : kind === 'work' ? 'Configure Work' : 'Add Custom Shortcut'}
              </AppText>
              <AppText variant="caption" style={styles.subtitle}>
                Fast corridor for multimodal journey planning
              </AppText>
            </View>
            <Pressable
              onPress={onClose}
              disabled={isSaving}
              accessibilityRole="button"
              accessibilityLabel="Close destination modal"
              hitSlop={12}
              style={styles.closeButton}
              testID="btn-close-saved-place-modal"
            >
              <X size={20} color={theme.colors.textMuted} />
            </Pressable>
          </View>

          {/* Submission Error Banner */}
          {submitError && (
            <View style={styles.errorBanner} testID="saved-place-submit-error">
              <AlertCircle size={16} color={theme.colors.busCoral} accessible={false} />
              <AppText variant="bodySmall" style={styles.errorBannerText}>
                {submitError}
              </AppText>
            </View>
          )}

          <ScrollView style={styles.formScroll} showsVerticalScrollIndicator={false}>
            {/* Kind Selector */}
            <View style={styles.kindSelectorRow} testID="saved-place-kind-selector">
              {(['home', 'work', 'favorite'] as const).map((k) => {
                const isSelected = kind === k;
                return (
                  <Pressable
                    key={k}
                    onPress={() => handleKindSelect(k)}
                    accessibilityRole="radio"
                    accessibilityState={{ selected: isSelected }}
                    accessibilityLabel={`Destination type: ${k}`}
                    style={[styles.kindChip, isSelected && styles.kindChipSelected]}
                    testID={`kind-chip-${k}`}
                  >
                    <AppText
                      variant="caption"
                      weight={isSelected ? 'bold' : 'regular'}
                      style={[styles.kindChipText, isSelected && styles.kindChipTextSelected]}
                    >
                      {k === 'home' ? 'Home' : k === 'work' ? 'Work' : 'Favorite'}
                    </AppText>
                  </Pressable>
                );
              })}
            </View>

            {/* Label Input */}
            <FormField
              label="Label"
              helperText={`Short name (e.g. Home, Office, Gym). Max ${LABEL_MAX_LENGTH} characters.`}
              error={labelError ?? undefined}
              testID="field-place-label"
            >
              <AppInput
                value={label}
                onChangeText={(text) => {
                  setLabel(text);
                  if (labelError) setLabelError(null);
                }}
                placeholder="e.g. Central Library"
                maxLength={LABEL_MAX_LENGTH}
                editable={!isSaving}
                testID="input-place-label"
              />
            </FormField>

            {/* Place Text / Address Input */}
            <FormField
              label="Destination Address or Corridor"
              helperText={`Destination address or transit query. Max ${PLACE_TEXT_MAX_LENGTH} characters.`}
              error={placeTextError ?? undefined}
              testID="field-place-text"
            >
              <AppInput
                value={placeText}
                onChangeText={(text) => {
                  setPlaceText(text);
                  if (placeTextError) setPlaceTextError(null);
                }}
                placeholder="e.g. 100 Main Street, Colombo"
                maxLength={PLACE_TEXT_MAX_LENGTH}
                editable={!isSaving}
                testID="input-place-text"
              />
            </FormField>
          </ScrollView>

          {/* Actions */}
          <View style={styles.actionRow}>
            <AppButton
              title="Cancel"
              variant="secondary"
              size="md"
              onPress={onClose}
              disabled={isSaving}
              style={styles.actionButton}
              testID="btn-cancel-saved-place"
            />
            <AppButton
              title={isSaving ? 'Saving...' : 'Save Shortcut'}
              variant="primary"
              size="md"
              onPress={handleSave}
              disabled={isSaving}
              style={styles.actionButton}
              testID="btn-save-saved-place"
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
    maxHeight: 340
  },
  kindSelectorRow: {
    flexDirection: 'row',
    gap: theme.spacing.spaceSm,
    marginBottom: theme.spacing.spaceMd
  },
  kindChip: {
    flex: 1,
    paddingVertical: theme.spacing.spaceSm,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: theme.radius.sm,
    backgroundColor: theme.colors.panelInk,
    borderWidth: 1,
    borderColor: theme.colors.border
  },
  kindChipSelected: {
    backgroundColor: 'rgba(255, 198, 41, 0.15)',
    borderColor: theme.colors.beaconGold
  },
  kindChipText: {
    color: theme.colors.textSecondary
  },
  kindChipTextSelected: {
    color: theme.colors.beaconGold
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
