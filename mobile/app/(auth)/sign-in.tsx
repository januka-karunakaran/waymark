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
const MAX_PASSWORD_LENGTH = 128;

/**
 * SignInScreen — Secure Sign-In interface for Waymark Mobile.
 * Validates credentials on client, communicates truthful provider availability,
 * masks sensitive input, and delegates authorization exclusively to AuthProvider.
 */
export default function SignInScreen() {
  const router = useRouter();
  const { signIn, status, serviceReadiness, error: authError, clearError } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isConfigured = serviceReadiness !== 'not_configured';
  const isAuthenticating = status === 'authenticating' || isSubmitting;

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
      if (authError) clearError();
    },
    [passwordError, authError, clearError]
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

    if (!password) {
      setPasswordError('Password is required.');
      isValid = false;
    } else if (password.length > MAX_PASSWORD_LENGTH) {
      setPasswordError(`Password cannot exceed ${MAX_PASSWORD_LENGTH} characters.`);
      isValid = false;
    } else {
      setPasswordError(null);
    }

    return isValid;
  };

  const handleSignIn = async () => {
    // Prevent duplicate in-flight requests
    if (isAuthenticating) return;

    if (!validateForm()) return;

    // Guard against unconfigured provider
    if (!isConfigured) {
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await signIn({
        email: email.trim(),
        password
      });

      if (result.success) {
        // Successful login transitions cleanly to Home
        router.replace('/(tabs)');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleContinueAsGuest = () => {
    router.replace('/(tabs)');
  };

  return (
    <AuthScreenShell
      testID="sign-in-screen"
      backButtonAccessibilityLabel="Return to account options"
      onBack={() => router.replace('/(auth)/account')}
    >
      <AuthBrandHeader
        title="Welcome back to Waymark"
        subtitle="Sign in to access your Waymark account."
        badgeText="WAYMARK 2100"
        statusTag={isConfigured ? 'SYS.READY' : 'SYS.STANDBY'}
        testID="sign-in-brand-header"
      />

      {/* Provider Unavailability Notice */}
      {!isConfigured && (
        <AuthStatusNotice
          variant="unavailable"
          title="Sign-In Service Standby"
          message="External authentication services are currently unconfigured. Credential submission is disabled. All navigation and radar features remain open in Guest mode."
          testID="sign-in-unconfigured-notice"
        />
      )}

      {/* Domain Authentication Error Notice */}
      {authError && (
        <AuthStatusNotice
          variant="error"
          title="Authentication Failed"
          message={authError.message}
          actionText="Dismiss"
          onAction={clearError}
          testID="sign-in-error-notice"
        />
      )}

      {/* Credentials Form */}
      <View style={styles.formContainer} testID="sign-in-form">
        <AuthFormField
          label="Email Address"
          value={email}
          onChangeText={handleEmailChange}
          type="email"
          placeholder="navigator@waymark.local"
          required={true}
          error={emailError ?? undefined}
          disabled={isAuthenticating}
          maxLength={MAX_EMAIL_LENGTH}
          accessibilityHint="Enter the email address registered with your Waymark account"
          testID="input-sign-in-email"
        />

        <AuthFormField
          label="Password"
          value={password}
          onChangeText={handlePasswordChange}
          type="password"
          placeholder="Enter password"
          required={true}
          error={passwordError ?? undefined}
          disabled={isAuthenticating}
          maxLength={MAX_PASSWORD_LENGTH}
          accessibilityHint="Enter your account password"
          testID="input-sign-in-password"
        />

        {/* Action Triggers */}
        <View style={styles.buttonGroup}>
          <AppButton
            title="Sign In"
            variant="primary"
            size="lg"
            onPress={handleSignIn}
            disabled={!isConfigured || isAuthenticating}
            loading={isAuthenticating}
            loadingText="Authenticating Navigator..."
            accessibilityHint={
              isConfigured
                ? 'Submits credentials to verify your account'
                : 'Authentication service is unconfigured'
            }
            testID="btn-submit-sign-in"
          />

          <AppButton
            title="Forgot Password?"
            variant="secondary"
            size="md"
            onPress={() => router.push('/(auth)/forgot-password')}
            disabled={isAuthenticating}
            accessibilityHint="Navigates to the password recovery screen"
            testID="btn-navigate-forgot-password"
          />

          <AppButton
            title="Create a Waymark ID"
            variant="secondary"
            size="lg"
            onPress={() => router.push('/(auth)/sign-up')}
            disabled={isAuthenticating}
            accessibilityHint="Navigates to the account registration screen"
            testID="btn-navigate-sign-up"
          />

          <AppButton
            title="Continue as Guest"
            variant="secondary"
            size="lg"
            onPress={handleContinueAsGuest}
            disabled={isAuthenticating}
            accessibilityHint="Bypasses account sign-in and returns to planetary transit dashboard"
            testID="btn-sign-in-guest"
          />
        </View>

        {/* Informational Guidance */}
        <View style={styles.footerNote} testID="sign-in-footer-note">
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
