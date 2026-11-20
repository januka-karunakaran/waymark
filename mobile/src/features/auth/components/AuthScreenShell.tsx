import React, { ReactNode } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
  ViewStyle
} from 'react-native';
import { SafeAreaView, Edge } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { BackButton } from '../../../components/navigation/BackButton';
import { theme } from '../../../theme';

export interface AuthScreenShellProps {
  /**
   * Screen content placed inside the scrollable layout.
   */
  children: ReactNode;

  /**
   * Whether to display the contextual back button in the top navigation bar.
   * @default true
   */
  showBackButton?: boolean;

  /**
   * Custom back action callback. Defaults to router.back() or router.replace('/(tabs)').
   */
  onBack?: () => void;

  /**
   * Accessible description for the back button.
   * @default 'Return to previous screen'
   */
  backButtonAccessibilityLabel?: string;

  /**
   * Optional custom styling applied to the inner scroll container.
   */
  contentContainerStyle?: ViewStyle;

  /**
   * Optional test identifier.
   */
  testID?: string;

  /**
   * Safe area edges to observe.
   * @default ['top', 'left', 'right', 'bottom']
   */
  safeAreaEdges?: Edge[];
}

/**
 * AuthScreenShell â€” Reusable structural shell for authentication and account screens.
 * Enforces safe-area bounds, keyboard avoidance, responsive maximum width (480pt),
 * Waymark 2100 abyssVoid theming, and accessible back navigation.
 */
export const AuthScreenShell: React.FC<AuthScreenShellProps> = ({
  children,
  showBackButton = true,
  onBack,
  backButtonAccessibilityLabel = 'Return to previous screen',
  contentContainerStyle,
  testID = 'auth-screen-shell',
  safeAreaEdges = ['top', 'left', 'right', 'bottom']
}) => {
  const router = useRouter();

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(tabs)');
    }
  };

  return (
    <SafeAreaView
      edges={safeAreaEdges}
      style={styles.safeArea}
    >
      <View style={styles.safeArea} testID={testID}>
        <StatusBar style="light" />
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.keyboardAvoid}
        >
          {showBackButton && (
            <View style={styles.topBar} testID={`${testID}-top-bar`}>
              <BackButton
                onPress={handleBack}
                accessibilityLabel={backButtonAccessibilityLabel}
                testID={`${testID}-back-btn`}
              />
            </View>
          )}
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={[styles.scrollContent, contentContainerStyle]}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            testID={`${testID}-scroll-view`}
          >
            <View style={styles.responsiveContainer}>
              {children}
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.colors.abyssVoid
  },
  keyboardAvoid: {
    flex: 1
  },
  topBar: {
    height: 48,
    paddingHorizontal: theme.spacing.spaceMd,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start'
  },
  scrollView: {
    flex: 1
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: theme.spacing.spaceLg,
    paddingBottom: theme.spacing.spaceXxl
  },
  responsiveContainer: {
    width: '100%',
    maxWidth: 480,
    alignSelf: 'center'
  }
});
