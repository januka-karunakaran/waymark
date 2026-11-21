import React, { useState, useCallback } from 'react';
import { StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import {
  AuthScreenShell,
  AuthBrandHeader,
  AuthFormField,
  AuthStatusNotice,
  useAuth
} from '../../src/features/auth';
import { AppButton } from '../../src/components/buttons/AppButton';
import { AppText } from '../../src/components/typography/AppText';
import { theme } from '../../src/theme';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_EMAIL_LENGTH = 254;

/**
 * ForgotPasswordScreen — Account recovery interface for Waymark Mobile.
 * Collects recovery email, enforces strict client validation,
 * displays truthful provider availability, and avoids account enumeration.
 */
export default function ForgotPasswordScreen() {
  const router = useRouter();
  const { serviceReadiness, resetPassword } = useAuth();

  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const isConfigured = serviceReadiness !== 'not_configured';

  const handleEmailChange = useCallback(
    (text: string) => {
      setEmail(text);
      if (emailError) setEmailError(null);
      if (isSubmitted) setIsSubmitted(false);
    },
    [emailError, isSubmitted]
  );

  const validateForm = (): boolean => {
    let isValid = true;
    const trimmedEmail = email.trim();

    if (!trimmedEmail) {
      setEmailError('Email address is required.');
      isValid = false;
    } else if (trimmedEmail.length > MAX_EMAIL_LENGTH) {
      setEmailError(`Email address cannot exceed ${MAX_EMAIL_LENGTH} characters.`);
      isValid = false;
    } else if (!EMAIL_REGEX.test(trimmedEmail)) {
      setEmailError('Please enter a valid email address.');
      isValid = false;
    } else {
      setEmailError(null);
    }

    return isValid;
  };

  const handleResetRequest = async () => {
    if (isSubmitting) return;
    if (!validateForm()) return;
    if (!isConfigured) return;

    setIsSubmitting(true);
    try {
      const result = await resetPassword(email);
      if (result.success) {
        setIsSubmitted(true);
      } else {
        setEmailError(result.error?.message ?? 'Failed to request account recovery.');
      }
    } catch {
      setEmailError('An unexpected error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleContinueAsGuest = () => {
    router.replace('/(tabs)');
  };

  const handleNavigateSignIn = () => {
    router.replace('/(auth)/sign-in');
  };

  return (
    <AuthScreenShell
      testID="forgot-password-screen"
      backButtonAccessibilityLabel="Return to sign-in screen"
      onBack={handleNavigateSignIn}
    >
      <AuthBrandHeader
        title="Recover your Waymark account"
        subtitle="Enter your email address to request account recovery when this service is available."
        badgeText="WAYMARK 2100"
        statusTag={isConfigured ? 'SYS.READY' : 'SYS.STANDBY'}
        testID="forgot-password-brand-header"
      />

      {/* Provider Standby Notice */}
      {!isConfigured && (
        <AuthStatusNotice
          variant="unavailable"
          title="Recovery Service Standby"
          message="Account recovery services are currently unconfigured. Password reset submission is disabled. All navigation and radar features remain open in Guest mode."
          testID="forgot-password-unconfigured-notice"
        />
      )}

      {/* Generic Enumeration-Resistant Outcome Notice */}
      {isSubmitted && (
        <AuthStatusNotice
          variant="info"
          title="Recovery Request Dispatched"
          message="If an account exists for this email address, password recovery instructions have been sent. Please check your inbox."
          testID="forgot-password-success-notice"
        />
      )}

      {/* Recovery Form */}
      <View style={styles.formContainer} testID="forgot-password-form">
        <AuthFormField
          label="Email Address"
          value={email}
          onChangeText={handleEmailChange}
          type="email"
          placeholder="navigator@waymark.local"
          required={true}
          error={emailError ?? undefined}
          disabled={isSubmitting || !isConfigured}
          maxLength={MAX_EMAIL_LENGTH}
          accessibilityHint="Enter the email address registered with your Waymark account"
          testID="input-forgot-password-email"
        />

        {/* Action Triggers */}
        <View style={styles.buttonGroup}>
          <AppButton
            title="Send Recovery Instructions"
            variant="primary"
            size="lg"
            onPress={handleResetRequest}
            disabled={!isConfigured || isSubmitting}
            loading={isSubmitting}
            loadingText="Dispatching Instructions..."
            accessibilityHint={
              isConfigured
                ? 'Submits request to dispatch account recovery instructions'
                : 'Account recovery service is unconfigured'
            }
            testID="btn-submit-forgot-password"
          />

          <AppButton
            title="Return to Sign In"
            variant="secondary"
            size="lg"
            onPress={handleNavigateSignIn}
            disabled={isSubmitting}
            accessibilityHint="Returns to the sign-in screen"
            testID="btn-navigate-sign-in"
          />

          <AppButton
            title="Continue as Guest"
            variant="secondary"
            size="lg"
            onPress={handleContinueAsGuest}
            disabled={isSubmitting}
            accessibilityHint="Bypasses recovery and returns to planetary transit dashboard"
            testID="btn-forgot-password-guest"
          />
        </View>

        {/* Informational Guidance */}
        <View style={styles.footerNote} testID="forgot-password-footer-note">
          <AppText variant="caption" style={styles.footerText}>
            Password recovery will never reveal whether an email address is registered.
          </AppText>
        </View>
      </View>
    </AuthScreenShell>
  );
}

const styles = StyleSheet.create({
  formContainer: {
    marginTop: theme.spacing.spaceSm
  },
  buttonGroup: {
    marginTop: theme.spacing.spaceLg,
    gap: theme.spacing.spaceMd
  },
  footerNote: {
    marginTop: theme.spacing.spaceXl,
    paddingTop: theme.spacing.spaceMd,
    borderTopWidth: 1,
    borderTopColor: theme.colors.divider,
    alignItems: 'center'
  },
  footerText: {
    color: theme.colors.textMuted,
    textAlign: 'center',
    lineHeight: 18
  }
});
