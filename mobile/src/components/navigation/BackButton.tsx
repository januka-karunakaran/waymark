import React from 'react';
import {
  Pressable,
  StyleSheet,
  StyleProp,
  ViewStyle,
  GestureResponderEvent
} from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import {
  theme as defaultTheme,
  darkTheme,
  lightTheme
} from '../../theme';

export interface BackButtonProps {
  /**
   * Custom back action callback. If omitted, uses router.back() when history exists.
   */
  onPress?: (event: GestureResponderEvent) => void;

  /**
   * Disables back button interaction.
   */
  disabled?: boolean;

  /**
   * Accessible description for screen readers.
   * @default 'Go back'
   */
  accessibilityLabel?: string;

  /**
   * Theme mode override.
   */
  themeMode?: 'light' | 'dark';

  /**
   * Custom button style.
   */
  style?: StyleProp<ViewStyle>;

  /**
   * Test identifier.
   */
  testID?: string;
}

/**
 * BackButton — Contextual navigation back button providing safe router integration,
 * touch-target compliance (>= 44x44), and VoiceOver/TalkBack announcements.
 */
export const BackButton: React.FC<BackButtonProps> = ({
  onPress,
  disabled = false,
  accessibilityLabel = 'Go back',
  themeMode,
  style,
  testID = 'header-back-button'
}) => {
  const router = useRouter();

  const effectiveMode = themeMode ?? defaultTheme.mode;
  const activeTheme = effectiveMode === 'light' ? lightTheme : darkTheme;

  const handlePress = (e: GestureResponderEvent) => {
    if (disabled) return;
    if (onPress) {
      onPress(e);
    } else if (typeof router?.canGoBack === 'function' && router.canGoBack()) {
      router.back();
    }
  };

  return (
    <Pressable
      onPress={handlePress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled }}
      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      style={({ pressed }) => [
        styles.button,
        {
          opacity: disabled ? 0.4 : pressed ? 0.7 : 1
        },
        style
      ]}
      testID={testID}
    >
      <ArrowLeft
        size={20}
        color={activeTheme.colors.beaconGold}
        strokeWidth={2.2}
      />
    </Pressable>
  );
};

const styles = StyleSheet.create({
  button: {
    minWidth: 44,
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8
  }
});
