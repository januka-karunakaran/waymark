import React from 'react';
import {
  Pressable,
  PressableProps,
  StyleProp,
  ViewStyle,
  TextStyle,
  StyleSheet,
  GestureResponderEvent,
  ActivityIndicator,
  View
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
   * Loading state: displays ActivityIndicator, prevents interaction, and sets accessibility busy.
   * @default false
   */
  loading?: boolean;

  /**
   * Optional text displayed alongside the ActivityIndicator during loading.
   */
  loadingText?: string;

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
   * Controls whether label text scales with system accessibility font scaling.
   * @default true
   */
  allowFontScaling?: boolean;

  /**
   * Maximum font scale multiplier when accessibility font scaling is enabled.
   */
  maxFontSizeMultiplier?: number;

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
 * supporting Waymark 2100 design token variants, responsive sizes,
 * controlled loading/interaction states, and assistive technology compatibility.
 */
export const AppButton: React.FC<AppButtonProps> = ({
  title,
  label,
  variant = 'primary',
  size = 'md',
  loading = false,
  loadingText,
  onPress,
  disabled = false,
  themeMode,
  allowFontScaling = true,
  maxFontSizeMultiplier,
  style,
  textStyle,
  children,
  accessibilityRole = 'button',
  accessibilityState,
  accessibilityLabel,
  accessibilityHint,
  testID,
  ...restProps
}) => {
  const effectiveMode = themeMode ?? defaultTheme.mode;
  const activeTheme = effectiveMode === 'light' ? lightTheme : darkTheme;

  const buttonText = title ?? label ?? '';
  const sizeConfig = getSizeConfig(size, activeTheme);
  const variantColors = getVariantColors(variant, disabled, activeTheme);

  // Interaction is disabled if either disabled or loading is true
  const isInteractionDisabled = disabled || loading;

  const handlePress = (event: GestureResponderEvent) => {
    if (isInteractionDisabled) {
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
    const feedbackStyle: ViewStyle = pressed && !isInteractionDisabled
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

  const effectiveAccessibilityLabel =
    accessibilityLabel ?? (loading ? (loadingText ?? buttonText) : buttonText);

  return (
    <Pressable
      onPress={handlePress}
      disabled={isInteractionDisabled}
      accessibilityRole={accessibilityRole}
      accessibilityState={{
        ...accessibilityState,
        disabled: isInteractionDisabled,
        busy: loading
      }}
      accessibilityLabel={effectiveAccessibilityLabel}
      accessibilityHint={accessibilityHint}
      accessible={true}
      testID={testID}
      style={({ pressed }) => getContainerStyle(pressed)}
      {...restProps}
    >
      {loading ? (
        <View style={styles.loadingContainer} accessible={false}>
          <ActivityIndicator
            size="small"
            color={variantColors.textColor}
            testID={testID ? `${testID}-loading-indicator` : 'loading-indicator'}
            accessible={false}
          />
          {loadingText ? (
            <AppText
              variant={sizeConfig.textVariant}
              weight="bold"
              allowFontScaling={allowFontScaling}
              maxFontSizeMultiplier={maxFontSizeMultiplier}
              accessible={false}
              style={StyleSheet.flatten([
                {
                  color: variantColors.textColor,
                  textAlign: 'center',
                  marginLeft: activeTheme.spacing.spaceSm
                },
                textStyle
              ])}
            >
              {loadingText}
            </AppText>
          ) : null}
        </View>
      ) : (
        children ?? (
          <AppText
            variant={sizeConfig.textVariant}
            weight="bold"
            allowFontScaling={allowFontScaling}
            maxFontSizeMultiplier={maxFontSizeMultiplier}
            accessible={false}
            style={StyleSheet.flatten([
              { color: variantColors.textColor, textAlign: 'center' },
              textStyle
            ])}
          >
            {buttonText}
          </AppText>
        )
      )}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center'
  }
});
