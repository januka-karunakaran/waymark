import React from 'react';
import {
  Pressable,
  PressableProps,
  StyleProp,
  ViewStyle,
  TextStyle,
  StyleSheet,
  GestureResponderEvent
} from 'react-native';
import { AppText } from '../typography';
import {
  theme as defaultTheme,
  darkTheme,
  lightTheme
} from '../../theme';

export interface AppButtonProps extends Omit<PressableProps, 'style' | 'children'> {
  /**
   * Button title text.
   */
  title?: string;

  /**
   * Alias for title prop, adhering to project label conventions.
   */
  label?: string;

  /**
   * Callback fired on button press.
   */
  onPress?: (event: GestureResponderEvent) => void;

  /**
   * Disabled state: prevents press interactions and reflects state for accessibility.
   * @default false
   */
  disabled?: boolean;

  /**
   * Explicit theme mode override ('light' | 'dark').
   * If omitted, defaults to Waymark Night Transit theme.
   */
  themeMode?: 'light' | 'dark';

  /**
   * Custom style overrides for button container.
   */
  style?: StyleProp<ViewStyle> | ((state: { pressed: boolean }) => StyleProp<ViewStyle>);

  /**
   * Custom style overrides for button label text.
   */
  textStyle?: StyleProp<TextStyle>;

  /**
   * Custom children. If omitted, renders AppText with title/label.
   */
  children?: React.ReactNode;
}

/**
 * AppButton — Reusable, accessible, mobile-first Base Button component
 * for Waymark Android and iOS mobile applications.
 *
 * Integrates Waymark 2100 design tokens, AppText typography,
 * minimum touch targets (>= 44x44), and screen-reader accessibility.
 */
export const AppButton: React.FC<AppButtonProps> = ({
  title,
  label,
  onPress,
  disabled = false,
  themeMode,
  style,
  textStyle,
  children,
  accessibilityRole = 'button',
  accessibilityState,
  accessibilityLabel,
  testID,
  ...restProps
}) => {
  const effectiveMode = themeMode ?? defaultTheme.mode;
  const activeTheme = effectiveMode === 'light' ? lightTheme : darkTheme;

  const buttonText = title ?? label ?? '';

  const handlePress = (event: GestureResponderEvent) => {
    if (disabled) {
      return;
    }
    onPress?.(event);
  };

  const baseContainerStyle: ViewStyle = {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 44,
    minHeight: Math.max(44, activeTheme.spacing.layout.primaryButtonHeight),
    paddingHorizontal: activeTheme.spacing.spaceLg,
    paddingVertical: activeTheme.spacing.spaceSm,
    borderRadius: activeTheme.radius.button,
    backgroundColor: disabled
      ? activeTheme.colors.beaconGoldMuted
      : activeTheme.colors.beaconGold
  };

  const getContainerStyle = (pressed: boolean): StyleProp<ViewStyle> => {
    const feedbackStyle: ViewStyle = pressed && !disabled
      ? { opacity: 0.85, transform: [{ scale: 0.98 }] }
      : {};

    const customStyle = typeof style === 'function' ? style({ pressed }) : style;

    return [baseContainerStyle, feedbackStyle, customStyle];
  };

  const defaultTextColor = disabled
    ? activeTheme.colors.textMuted
    : activeTheme.colors.beaconGoldText;

  return (
    <Pressable
      onPress={handlePress}
      disabled={disabled}
      accessibilityRole={accessibilityRole}
      accessibilityState={{ disabled: Boolean(disabled), ...accessibilityState }}
      accessibilityLabel={accessibilityLabel ?? buttonText}
      testID={testID}
      style={({ pressed }) => getContainerStyle(pressed)}
      {...restProps}
    >
      {children ?? (
        <AppText
          variant="label"
          weight="bold"
          style={StyleSheet.flatten([
            { color: defaultTextColor, textAlign: 'center' },
            textStyle
          ])}
        >
          {buttonText}
        </AppText>
      )}
    </Pressable>
  );
};
