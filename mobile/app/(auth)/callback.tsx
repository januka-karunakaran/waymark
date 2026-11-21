import React, { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import {
  AuthScreenShell,
  AuthBrandHeader,
  AuthStatusNotice,
  useAuth
} from '../../src/features/auth';
import { AppButton } from '../../src/components/buttons/AppButton';
import { theme } from '../../src/theme';

/**
 * AuthCallbackScreen — Route receiving auth callback redirects (email confirmations, magic links, recovery).
 * Interacts with provider redirect configuration safely.
 */
export default function AuthCallbackScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { initialize, serviceReadiness } = useAuth();

  const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const processCallback = async () => {
      // Check for error parameters in redirect
      if (params.error || params.error_description) {
        if (isMounted) {
          setStatus('error');
          setErrorMessage(
            (params.error_description as string) || (params.error as string) || 'Authentication callback failed.'
          );
        }
        return;
      }

      try {
        // Re-initialize auth session to ingest updated provider tokens
        await initialize();
        if (isMounted) {
          setStatus('success');
        }
      } catch (err) {
        if (isMounted) {
          setStatus('error');
          setErrorMessage('Unable to complete authentication revalidation.');
        }
      }
    };

    processCallback();

    return () => {
      isMounted = false;
    };
  }, [initialize, params]);

  const handleContinue = () => {
    router.replace('/(tabs)');
  };

  const handleSignIn = () => {
    router.replace('/(auth)/sign-in');
  };

  return (
    <AuthScreenShell
      testID="auth-callback-screen"
      backButtonAccessibilityLabel="Return to sign-in"
      onBack={handleSignIn}
    >
      <AuthBrandHeader
        title="Account Verification"
        subtitle="Finalizing authentication state with the identity provider."
        badgeText="WAYMARK 2100"
        statusTag={serviceReadiness === 'ready' ? 'SYS.READY' : 'SYS.STANDBY'}
        testID="auth-callback-brand-header"
      />

      {status === 'processing' && (
        <AuthStatusNotice
          variant="info"
          title="Verifying Credentials"
          message="Exchanging credentials with the identity provider. Please wait a moment..."
          testID="auth-callback-processing-notice"
        />
      )}

      {status === 'success' && (
        <AuthStatusNotice
          variant="info"
          title="Verification Successful"
          message="Your account authentication has been verified. You may now continue using Waymark."
          testID="auth-callback-success-notice"
        />
      )}

      {status === 'error' && (
        <AuthStatusNotice
          variant="error"
          title="Verification Failed"
          message={errorMessage ?? 'The authentication link is invalid, expired, or was already used.'}
          testID="auth-callback-error-notice"
        />
      )}

      <View style={styles.actionContainer}>
        {status === 'success' ? (
          <AppButton
            title="Continue to Waymark"
            variant="primary"
            size="lg"
            onPress={handleContinue}
            testID="btn-callback-continue"
          />
        ) : (
          <AppButton
            title="Return to Sign In"
            variant="secondary"
            size="lg"
            onPress={handleSignIn}
            testID="btn-callback-signin"
          />
        )}
      </View>
    </AuthScreenShell>
  );
}

const styles = StyleSheet.create({
  actionContainer: {
    marginTop: theme.spacing.xl,
    gap: theme.spacing.md
  }
});
