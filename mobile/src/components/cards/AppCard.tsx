import React, { forwardRef } from 'react';
import {
  View,
  Pressable,
  StyleSheet,
  StyleProp,
  ViewStyle,
  GestureResponderEvent,
  AccessibilityRole,
  AccessibilityState
} from 'react-native';
import {
  theme as defaultTheme,
  darkTheme,
  lightTheme,
  spacing,
  radius,
  ShadowToken
} from '../../theme';
import { LoadingIndicator } from '../LoadingIndicator';

export type AppCardVariant = 'default' | 'outlined' | 'elevated' | 'subtle';

export interface AppCardProps {
  /**
   * Children components rendered inside the card container.
   */
  children?: React.ReactNode;

  /**
   * Visual variant controlling background, border, and elevation.
   * @default 'default'
   */
  variant?: AppCardVariant;

  /**
   * Optional click/touch interaction callback.
   * When provided, card renders as an accessible Pressable.
   */
  onPress?: (event: GestureResponderEvent) => void;

  /**
   * Disables card interaction when true.
   */
  disabled?: boolean;

  /**
   * Theme mode override ('light' | 'dark').
   */
  themeMode?: 'light' | 'dark';

  /**
   * Custom style for the outer card container.
   */
  style?: StyleProp<ViewStyle>;

  /**
   * Custom style for the inner card content wrapper.
   */
  contentStyle?: StyleProp<ViewStyle>;

  /**
   * Unique test identifier.
   */
  testID?: string;

  /**
   * Screen reader accessibility label.
   */
  accessibilityLabel?: string;

  /**
   * Accessibility hint explaining interaction outcome.
   */
  accessibilityHint?: string;

  /**
   * Explicit accessibility role. Defaults to 'button' when interactive.
   */
  accessibilityRole?: AccessibilityRole;

  /**
   * Explicit accessibility state.
   */
  accessibilityState?: AccessibilityState;

  /**
   * Renders a centered loading indicator instead of children when true.
   */
  loading?: boolean;

  /**
   * Optional status message during loading state.
   */
  loadingMessage?: string;
}

/**
 * AppCard — Foundation container component strictly complying with
 * Waymark 2100 "Night Transit" card specifications (16px corner radius,
 * engineered optical layering, responsive margins).
 */
export const AppCard = forwardRef<View, AppCardProps>(
  (
    {
      children,
      variant = 'default',
      onPress,
      disabled = false,
      themeMode,
      style,
      contentStyle,
      testID,
      accessibilityLabel,
      accessibilityHint,
      accessibilityRole,
      accessibilityState,
      loading = false,
      loadingMessage,
      ...restProps
    },
    ref
  ) => {
    const effectiveMode = themeMode ?? defaultTheme.mode;
    const activeTheme = effectiveMode === 'light' ? lightTheme : darkTheme;

    const isInteractive = Boolean(onPress);

    const getVariantStyles = (v: AppCardVariant) => {
      switch (v) {
        case 'outlined':
          return {
            backgroundColor:
              effectiveMode === 'light'
                ? activeTheme.colors.abyssVoid
                : activeTheme.colors.abyssVoid,
            borderColor: activeTheme.colors.border,
            borderWidth: 1,
            ...activeTheme.shadows.none
          };
        case 'elevated':
          return {
            backgroundColor:
              effectiveMode === 'light'
                ? activeTheme.colors.surfaceElevated
                : activeTheme.colors.panelInk,
            borderColor: activeTheme.colors.border,
            borderWidth: 1,
            ...(activeTheme.shadows.md as ShadowToken)
          };
        case 'subtle':
          return {
            backgroundColor:
              effectiveMode === 'light'
                ? activeTheme.colors.surfaceModal
                : activeTheme.colors.panelInkElevated,
            borderColor: activeTheme.colors.borderSubtle,
            borderWidth: 1,
            ...activeTheme.shadows.none
          };
        case 'default':
        default:
          return {
            backgroundColor:
              effectiveMode === 'light'
                ? activeTheme.colors.surface
                : activeTheme.colors.deckInk,
            borderColor: activeTheme.colors.borderSubtle,
            borderWidth: 1,
            ...activeTheme.shadows.none
          };
      }
    };

    const variantStyle = getVariantStyles(variant);

    const innerContent = loading ? (
      <View style={styles.loadingContainer}>
        <LoadingIndicator
          message={loadingMessage}
          size="small"
          testID={testID ? `${testID}-loading` : undefined}
        />
      </View>
    ) : (
      children
    );

    if (isInteractive) {
      return (
        <Pressable
          ref={ref as React.Ref<View>}
          onPress={disabled ? undefined : onPress}
          disabled={disabled}
          accessibilityRole={accessibilityRole ?? 'button'}
          accessibilityLabel={accessibilityLabel}
          accessibilityHint={accessibilityHint}
          accessibilityState={{
            disabled: Boolean(disabled),
            ...accessibilityState
          }}
          testID={testID}
          style={({ pressed }) => [
            styles.baseCard,
            variantStyle,
            {
              opacity: disabled ? 0.6 : pressed ? 0.85 : 1
            },
            style
          ]}
          {...restProps}
        >
          <View style={[styles.innerContent, contentStyle]}>{innerContent}</View>
        </Pressable>
      );
    }

    return (
      <View
        ref={ref}
        accessibilityLabel={accessibilityLabel}
        accessibilityHint={accessibilityHint}
        accessibilityRole={accessibilityRole}
        accessibilityState={accessibilityState}
        testID={testID}
        style={[
          styles.baseCard,
          variantStyle,
          {
            opacity: disabled ? 0.6 : 1
          },
          style
        ]}
        {...restProps}
      >
        <View style={[styles.innerContent, contentStyle]}>{innerContent}</View>
      </View>
    );
  }
);

AppCard.displayName = 'AppCard';

const styles = StyleSheet.create({
  baseCard: {
    borderRadius: radius.card, // 16px engineered corner radius
    overflow: 'hidden',
    width: '100%'
  },
  innerContent: {
    padding: spacing.spaceMd, // 16px internal clearance
    width: '100%'
  },
  loadingContainer: {
    paddingVertical: spacing.spaceLg,
    alignItems: 'center',
    justifyContent: 'center'
  }
});
