import React from 'react';
import {
  Pressable,
  StyleSheet,
  StyleProp,
  ViewStyle,
  GestureResponderEvent
} from 'react-native';

export interface HeaderActionProps {
  /**
   * Action icon component (e.g. Search, Settings, Refresh).
   */
  icon: React.ReactNode;

  /**
   * Mandatory accessible name describing the action for screen readers.
   */
  label: string;

  /**
   * Click/press callback. If omitted, button interaction is disabled.
   */
  onPress?: (event: GestureResponderEvent) => void;

  /**
   * Whether the action button is disabled.
   */
  disabled?: boolean;

  /**
   * Theme mode override.
   */
  themeMode?: 'light' | 'dark';

  /**
   * Custom style for the action wrapper.
   */
  style?: StyleProp<ViewStyle>;

  /**
   * Test identifier.
   */
  testID?: string;
}

/**
 * HeaderAction — Reusable header action trigger with strict WCAG touch target
 * sizing (>= 44x44 pt), accessible labels, and non-deceptive interaction guards.
 */
export const HeaderAction: React.FC<HeaderActionProps> = ({
  icon,
  label,
  onPress,
  disabled = false,
  style,
  testID = 'header-action'
}) => {
  const isInteractive = Boolean(onPress) && !disabled;

  return (
    <Pressable
      onPress={isInteractive ? onPress : undefined}
      disabled={!isInteractive}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: !isInteractive }}
      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      style={({ pressed }) => [
        styles.button,
        {
          opacity: !isInteractive ? 0.4 : pressed ? 0.7 : 1
        },
        style
      ]}
      testID={testID}
    >
      {icon}
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
