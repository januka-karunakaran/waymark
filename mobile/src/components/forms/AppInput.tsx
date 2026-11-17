import React, { useState, forwardRef } from 'react';
import {
  TextInput,
  TextInputProps,
  View,
  StyleSheet,
  StyleProp,
  ViewStyle,
  TextStyle,
  NativeSyntheticEvent,
  TextInputFocusEventData
} from 'react-native';
import { FormField } from './FormField';
import {
  theme as defaultTheme,
  darkTheme,
  lightTheme,
  spacing,
  radius
} from '../../theme';

export interface AppInputProps extends TextInputProps {
  /**
   * Field label displayed above the input.
   */
  label?: string;

  /**
   * Helper text providing hints below the input.
   */
  helperText?: string;

  /**
   * Validation error message displayed below the input.
   */
  error?: string;

  /**
   * Marks the field as mandatory.
   */
  required?: boolean;

  /**
   * Disables user interaction and dims the field.
   */
  disabled?: boolean;

  /**
   * Renders the input as read-only.
   */
  readOnly?: boolean;

  /**
   * Color theme override.
   */
  themeMode?: 'light' | 'dark';

  /**
   * Custom style for the field container.
   */
  containerStyle?: StyleProp<ViewStyle>;

  /**
   * Custom style for the input box envelope.
   */
  inputBoxStyle?: StyleProp<ViewStyle>;

  /**
   * Custom style for the inner TextInput.
   */
  inputStyle?: StyleProp<TextStyle>;

  /**
   * Component rendered on the leading edge inside the input box.
   */
  leftAccessory?: React.ReactNode;

  /**
   * Component rendered on the trailing edge inside the input box.
   */
  rightAccessory?: React.ReactNode;

  /**
   * Test identifier.
   */
  testID?: string;
}

/**
 * AppInput — High-performance, accessible, theme-aware text input component
 * strictly adhering to Waymark 2100 design system specifications.
 */
export const AppInput = forwardRef<TextInput, AppInputProps>(
  (
    {
      label,
      helperText,
      error,
      required = false,
      disabled = false,
      readOnly = false,
      themeMode,
      containerStyle,
      inputBoxStyle,
      inputStyle,
      leftAccessory,
      rightAccessory,
      testID,
      value,
      placeholder,
      placeholderTextColor,
      onChangeText,
      onFocus,
      onBlur,
      editable,
      allowFontScaling = true,
      maxFontSizeMultiplier = 2,
      accessibilityLabel,
      accessibilityHint,
      accessibilityState,
      style,
      ...restProps
    },
    ref
  ) => {
    const [isFocused, setIsFocused] = useState(false);

    const effectiveMode = themeMode ?? defaultTheme.mode;
    const activeTheme = effectiveMode === 'light' ? lightTheme : darkTheme;

    const isInteractionDisabled = disabled || readOnly || editable === false;

    const handleFocus = (
      e: NativeSyntheticEvent<TextInputFocusEventData>
    ) => {
      setIsFocused(true);
      onFocus?.(e);
    };

    const handleBlur = (
      e: NativeSyntheticEvent<TextInputFocusEventData>
    ) => {
      setIsFocused(false);
      onBlur?.(e);
    };

    const defaultPlaceholderColor =
      placeholderTextColor ??
      (effectiveMode === 'light'
        ? 'rgba(71, 85, 105, 0.60)'
        : 'rgba(184, 194, 217, 0.60)');

    const borderColor = error
      ? activeTheme.colors.error
      : isFocused
        ? activeTheme.colors.primary
        : activeTheme.colors.border;

    const backgroundColor = disabled
      ? activeTheme.colors.deckInk
      : activeTheme.colors.abyssVoid;

    const textColor = disabled
      ? activeTheme.colors.textDim
      : activeTheme.colors.textPrimary;

    return (
      <FormField
        label={label}
        required={required}
        helperText={helperText}
        error={error}
        disabled={disabled}
        themeMode={themeMode}
        testID={testID ? `${testID}-field` : undefined}
        style={containerStyle}
      >
        <View
          style={[
            styles.inputBox,
            {
              borderColor,
              backgroundColor,
              opacity: disabled ? 0.6 : 1
            },
            inputBoxStyle
          ]}
          testID={testID ? `${testID}-box` : undefined}
        >
          {leftAccessory ? (
            <View style={styles.leftAccessory}>{leftAccessory}</View>
          ) : null}

          <TextInput
            ref={ref}
            value={value}
            placeholder={placeholder}
            placeholderTextColor={defaultPlaceholderColor}
            onChangeText={onChangeText}
            onFocus={handleFocus}
            onBlur={handleBlur}
            editable={!isInteractionDisabled}
            allowFontScaling={allowFontScaling}
            maxFontSizeMultiplier={maxFontSizeMultiplier}
            accessibilityLabel={accessibilityLabel || label || placeholder}
            accessibilityHint={accessibilityHint || helperText}
            accessibilityState={{
              disabled: Boolean(disabled),
              ...accessibilityState
            }}
            testID={testID}
            style={[
              styles.input,
              {
                color: textColor,
                fontFamily: activeTheme.typography.fontFamily.regular,
                fontSize: activeTheme.typography.fontSize.lg,
                lineHeight: activeTheme.typography.lineHeight.lg
              },
              inputStyle,
              style
            ]}
            {...restProps}
          />

          {rightAccessory ? (
            <View style={styles.rightAccessory}>{rightAccessory}</View>
          ) : null}
        </View>
      </FormField>
    );
  }
);

AppInput.displayName = 'AppInput';

const styles = StyleSheet.create({
  inputBox: {
    minHeight: spacing.layout.inputHeight, // 52px
    borderRadius: radius.input, // 12px
    borderWidth: 1,
    paddingHorizontal: spacing.spaceMd,
    flexDirection: 'row',
    alignItems: 'center'
  },
  input: {
    flex: 1,
    paddingVertical: spacing.spaceSm,
    paddingHorizontal: 0,
    margin: 0
  },
  leftAccessory: {
    marginRight: spacing.spaceSm,
    justifyContent: 'center',
    alignItems: 'center'
  },
  rightAccessory: {
    marginLeft: spacing.spaceSm,
    justifyContent: 'center',
    alignItems: 'center'
  }
});
