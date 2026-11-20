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
const MIN_PASSWORD_LENGTH = 8;
const MAX_PASSWORD_LENGTH = 128;
const MAX_NAME_LENGTH = 50;

/**
 * SignUpScreen — Registration interface for Waymark Mobile.
 * Collects traveler credentials, validates constraints on the client,
 * masks sensitive inputs, displays truthful provider availability,
 * and delegates registration exclusively to AuthProvider.
 */
export default function SignUpScreen() {
  const router = useRouter();
  const { signUp, status, serviceReadiness, error: authError, clearError } = useAuth();

  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [displayNameError, setDisplayNameError] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [confirmPasswordError, setConfirmPasswordError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isConfigured = serviceReadiness !== 'not_configured';
  const isRegistering = status === 'authenticating' || isSubmitting;

  const handleDisplayNameChange = useCallback(
    (text: string) => {
      setDisplayName(text);
      if (displayNameError) setDisplayNameError(null);
      if (authError) clearError();
    },
    [displayNameError, authError, clearError]
  );

  const handleEmailChange = useCallback(
    (text: string) => {
      setEmail(text);
      if (emailError) setEmailError(null);
      if (authError) clearError();
    },
    [emailError, authError, clearError]
  );

  const handlePasswordChange = useCallback(
    (text: string) => {
      setPassword(text);
      if (passwordError) setPasswordError(null);
      if (confirmPasswordError && confirmPassword && text === confirmPassword) {
        setConfirmPasswordError(null);
      }
      if (authError) clearError();
    },
    [passwordError, confirmPasswordError, confirmPassword, authError, clearError]
  );

  const handleConfirmPasswordChange = useCallback(
    (text: string) => {
      setConfirmPassword(text);
      if (confirmPasswordError) setConfirmPasswordError(null);
      if (authError) clearError();
    },
    [confirmPasswordError, authError, clearError]
  );

  const validateForm = (): boolean => {
    let isValid = true;
    const trimmedName = displayName.trim();
    const trimmedEmail = email.trim();

    if (trimmedName.length > MAX_NAME_LENGTH) {
      setDisplayNameError(`Display name cannot exceed ${MAX_NAME_LENGTH} characters.`);
      isValid = false;
    } else {
      setDisplayNameError(null);
    }

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

    if (!password) {
      setPasswordError('Password is required.');
      isValid = false;
    } else if (password.length < MIN_PASSWORD_LENGTH) {
      setPasswordError(`Password must be at least ${MIN_PASSWORD_LENGTH} characters.`);
      isValid = false;
    } else if (password.length > MAX_PASSWORD_LENGTH) {
      setPasswordError(`Password cannot exceed ${MAX_PASSWORD_LENGTH} characters.`);
      isValid = false;
    } else {
      setPasswordError(null);
    }

    if (!confirmPassword) {
      setConfirmPasswordError('Please confirm your password.');
      isValid = false;
    } else if (confirmPassword !== password) {
      setConfirmPasswordError('Passwords do not match.');
      isValid = false;
    } else {
      setConfirmPasswordError(null);
    }

    return isValid;
  };

  const handleSignUp = async () => {
    if (isRegistering) return;
    if (!validateForm()) return;
    if (!isConfigured) return;

    setIsSubmitting(true);
    try {
      const result = await signUp({
        email: email.trim(),
        password,
        displayName: displayName.trim() || undefined
      });

      if (result.success) {
        router.replace('/(tabs)');
      }
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
      testID="sign-up-screen"
      backButtonAccessibilityLabel="Return to account options"
      onBack={() => router.replace('/(auth)/account')}
    >
      <AuthBrandHeader
        title="Join Waymark"
        subtitle="Create an account to personalize your future journeys."
        badgeText="WAYMARK 2100"
        statusTag={isConfigured ? 'SYS.READY' : 'SYS.STANDBY'}
        testID="sign-up-brand-header"
      />

      {/* Provider Standby Notice */}
      {!isConfigured && (
        <AuthStatusNotice
          variant="unavailable"
          title="Registration Service Standby"
          message="External registration services are currently unconfigured. Account creation is disabled. All navigation and radar features remain open in Guest mode."
          testID="sign-up-unconfigured-notice"
        />
      )}

      {/* Authentication Domain Error Notice */}
      {authError && (
        <AuthStatusNotice
          variant="error"
          title="Registration Failed"
          message={authError.message}
          actionText="Dismiss"
          onAction={clearError}
          testID="sign-up-error-notice"
        />
      )}

      {/* Registration Form */}
      <View style={styles.formContainer} testID="sign-up-form">
        <AuthFormField
          label="Display Name"
          value={displayName}
          onChangeText={handleDisplayNameChange}
          type="text"
          placeholder="e.g. Orion Pilot"
          helperText="Optional handle for personalized travel bookmarks."
          error={displayNameError ?? undefined}
          disabled={isRegistering}
          maxLength={MAX_NAME_LENGTH}
          accessibilityHint="Optionally enter your preferred public navigator name"
          testID="input-sign-up-display-name"
        />

        <AuthFormField
          label="Email Address"
          value={email}
          onChangeText={handleEmailChange}
          type="email"
          placeholder="navigator@waymark.local"
          required={true}
          error={emailError ?? undefined}
          disabled={isRegistering}
          maxLength={MAX_EMAIL_LENGTH}
          accessibilityHint="Enter the email address for your new Waymark account"
          testID="input-sign-up-email"
        />

        <AuthFormField
          label="Password"
          value={password}
          onChangeText={handlePasswordChange}
          type="password"
          placeholder="Create password (min 8 characters)"
          required={true}
          error={passwordError ?? undefined}
          disabled={isRegistering}
          maxLength={MAX_PASSWORD_LENGTH}
          accessibilityHint="Enter a secure password of at least 8 characters"
          testID="input-sign-up-password"
        />

        <AuthFormField
          label="Confirm Password"
          value={confirmPassword}
          onChangeText={handleConfirmPasswordChange}
          type="password"
          placeholder="Re-enter your password"
          required={true}
          error={confirmPasswordError ?? undefined}
          disabled={isRegistering}
          maxLength={MAX_PASSWORD_LENGTH}
          accessibilityHint="Re-enter the password exactly as above to confirm"
          testID="input-sign-up-confirm-password"
        />

        {/* Action Triggers */}
        <View style={styles.buttonGroup}>
          <AppButton
            title="Create Account"
            variant="primary"
            size="lg"
            onPress={handleSignUp}
            disabled={!isConfigured || isRegistering}
            loading={isRegistering}
            loadingText="Creating Account..."
            accessibilityHint={
              isConfigured
                ? 'Submits registration details to create your account'
                : 'Registration service is unconfigured'
            }
            testID="btn-submit-sign-up"
          />

          <AppButton
            title="Sign In with Existing ID"
            variant="secondary"
            size="lg"
            onPress={handleNavigateSignIn}
            disabled={isRegistering}
            accessibilityHint="Navigates to the sign-in screen if you already have an account"
            testID="btn-navigate-sign-in"
          />

          <AppButton
            title="Continue as Guest"
            variant="secondary"
            size="lg"
            onPress={handleContinueAsGuest}
            disabled={isRegistering}
            accessibilityHint="Bypasses account creation and returns to planetary transit dashboard"
            testID="btn-sign-up-guest"
          />
        </View>

        {/* Informational Guidance */}
        <View style={styles.footerNote} testID="sign-up-footer-note">
          <AppText variant="caption" style={styles.footerText}>
            Waymark never stores credentials in unencrypted memory or persistent browser caches.
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
