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

export type AppButtonVariant =
  | 'primary'
  | 'secondary'
  | 'outline'
  | 'ghost'
  | 'destructive';

export type AppButtonSize = 'sm' | 'md' | 'lg';

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
   * Visual variant controlling background, border, and contrast text colors.
   * @default 'primary'
   */
  variant?: AppButtonVariant;

  /**
   * Button size controlling padding, geometry, and minimum touch envelope.
   * @default 'md'
   */
  size?: AppButtonSize;

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

type ActiveTheme = typeof darkTheme | typeof lightTheme;

interface SizeConfig {
  minHeight: number;
  minWidth: number;
  paddingHorizontal: number;
  paddingVertical: number;
  borderRadius: number;
  textVariant: 'caption' | 'label' | 'body';
}

function getSizeConfig(
  size: AppButtonSize,
  themeConfig: ActiveTheme
): SizeConfig {
  switch (size) {
    case 'sm':
      return {
        minHeight: 44,
        minWidth: 44,
        paddingHorizontal: themeConfig.spacing.spaceMd,
        paddingVertical: themeConfig.spacing.spaceXs,
        borderRadius: themeConfig.radius.md,
        textVariant: 'caption'
      };
    case 'lg':
      return {
        minHeight: 64,
        minWidth: 44,
        paddingHorizontal: themeConfig.spacing.spaceLg,
        paddingVertical: themeConfig.spacing.spaceMd,
        borderRadius: themeConfig.radius.card,
        textVariant: 'body'
      };
    case 'md':
    default:
      return {
        minHeight: Math.max(44, themeConfig.spacing.layout.primaryButtonHeight),
        minWidth: 44,
        paddingHorizontal: themeConfig.spacing.spaceLg,
        paddingVertical: themeConfig.spacing.spaceSm,
        borderRadius: themeConfig.radius.button,
        textVariant: 'label'
      };
  }
}

interface VariantColors {
  backgroundColor: string;
  borderColor: string;
  borderWidth: number;
  textColor: string;
  pressedBackgroundColor?: string;
}

function getVariantColors(
  variant: AppButtonVariant,
  disabled: boolean,
  activeTheme: ActiveTheme
): VariantColors {
  switch (variant) {
    case 'secondary':
      return {
        backgroundColor: disabled
          ? activeTheme.colors.deckInk
          : activeTheme.colors.panelInk,
        borderColor: disabled
          ? activeTheme.colors.hudGhostSubtle
          : activeTheme.colors.hudGhostBorder,
        borderWidth: 1,
        textColor: disabled
          ? activeTheme.colors.textMuted
          : activeTheme.colors.textPrimary
      };
    case 'outline':
      return {
        backgroundColor: 'transparent',
        borderColor: disabled
          ? activeTheme.colors.hudGhostSubtle
          : activeTheme.colors.hudGhostBorder,
        borderWidth: 1,
        textColor: disabled
          ? activeTheme.colors.textMuted
          : activeTheme.colors.textPrimary
      };
    case 'ghost':
      return {
        backgroundColor: 'transparent',
        borderColor: 'transparent',
        borderWidth: 0,
        textColor: disabled
          ? activeTheme.colors.textDim
          : activeTheme.colors.textSecondary,
        pressedBackgroundColor: activeTheme.colors.hudGhostSubtle
      };
    case 'destructive':
      return {
        backgroundColor: disabled
          ? activeTheme.colors.statusCriticalMuted
          : activeTheme.colors.statusCritical,
        borderColor: 'transparent',
        borderWidth: 0,
        textColor: disabled
          ? activeTheme.colors.textMuted
          : activeTheme.colors.textInverse
      };
    case 'primary':
    default:
      return {
        backgroundColor: disabled
          ? activeTheme.colors.beaconGoldMuted
          : activeTheme.colors.beaconGold,
        borderColor: 'transparent',
        borderWidth: 0,
        textColor: disabled
          ? activeTheme.colors.textMuted
          : activeTheme.colors.beaconGoldText
      };
  }
}

/**
 * AppButton — Reusable, accessible, mobile-first button component
 * supporting Waymark 2100 design token variants and responsive sizes.
 *
 * Integrates Waymark design tokens, AppText typography,
 * minimum touch targets (>= 44x44), and screen-reader accessibility.
 */
export const AppButton: React.FC<AppButtonProps> = ({
  title,
  label,
  variant = 'primary',
  size = 'md',
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
  const sizeConfig = getSizeConfig(size, activeTheme);
  const variantColors = getVariantColors(variant, disabled, activeTheme);

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
    minWidth: sizeConfig.minWidth,
    minHeight: sizeConfig.minHeight,
    paddingHorizontal: sizeConfig.paddingHorizontal,
    paddingVertical: sizeConfig.paddingVertical,
    borderRadius: sizeConfig.borderRadius,
    backgroundColor: variantColors.backgroundColor,
    borderWidth: variantColors.borderWidth,
    borderColor: variantColors.borderColor
  };

  const getContainerStyle = (pressed: boolean): StyleProp<ViewStyle> => {
    const feedbackStyle: ViewStyle = pressed && !disabled
      ? {
          opacity: 0.85,
          transform: [{ scale: 0.98 }],
          ...(variantColors.pressedBackgroundColor
            ? { backgroundColor: variantColors.pressedBackgroundColor }
            : {})
        }
      : {};

    const customStyle = typeof style === 'function' ? style({ pressed }) : style;

    return [baseContainerStyle, feedbackStyle, customStyle];
  };

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
          variant={sizeConfig.textVariant}
          weight="bold"
          style={StyleSheet.flatten([
            { color: variantColors.textColor, textAlign: 'center' },
            textStyle
          ])}
        >
          {buttonText}
        </AppText>
      )}
    </Pressable>
  );
};
