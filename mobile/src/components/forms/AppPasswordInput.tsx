import React, { useState, forwardRef } from 'react';
import {
  TextInput,
  Pressable,
  StyleSheet,
  View
} from 'react-native';
import { AppInput, AppInputProps } from './AppInput';
import { AppText } from '../typography';
import { spacing } from '../../theme';

export interface AppPasswordInputProps extends Omit<AppInputProps, 'secureTextEntry'> {
  /**
   * Initial visibility of the password characters.
   * Defaults to false (hidden).
   */
  initialVisibility?: boolean;

  /**
   * Accessibility label override for the toggle action.
   */
  toggleAccessibilityLabel?: string;
}

/**
 * AppPasswordInput — Reusable, secure password entry field featuring
 * accessible toggle visibility controls, strict security hygiene, and
 * WCAG-compliant touch targets.
 */
export const AppPasswordInput = forwardRef<TextInput, AppPasswordInputProps>(
  (
    {
      label = 'Password',
      initialVisibility = false,
      autoCapitalize = 'none',
      autoCorrect = false,
      autoComplete = 'password',
      textContentType = 'password',
      disabled = false,
      testID = 'password-input',
      themeMode,
      ...restProps
    },
    ref
  ) => {
    const [isPasswordVisible, setIsPasswordVisible] = useState(initialVisibility);

    const toggleVisibility = () => {
      if (disabled) return;
      setIsPasswordVisible((prev) => !prev);
    };

    const toggleLabel = isPasswordVisible ? 'Hide password' : 'Show password';

    const rightAccessory = (
      <Pressable
        onPress={toggleVisibility}
        disabled={disabled}
        accessibilityRole="button"
        accessibilityLabel={toggleLabel}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        style={styles.toggleButton}
        testID={testID ? `${testID}-toggle-visibility` : 'password-toggle-visibility'}
      >
        <View style={styles.toggleInner}>
          <AppText
            variant="caption"
            weight="semibold"
            color={disabled ? 'dim' : 'brand'}
            themeMode={themeMode}
            allowFontScaling={false}
          >
            {isPasswordVisible ? 'HIDE' : 'SHOW'}
          </AppText>
        </View>
      </Pressable>
    );

    return (
      <AppInput
        ref={ref}
        label={label}
        secureTextEntry={!isPasswordVisible}
        autoCapitalize={autoCapitalize}
        autoCorrect={autoCorrect}
        autoComplete={autoComplete}
        textContentType={textContentType}
        disabled={disabled}
        themeMode={themeMode}
        testID={testID}
        rightAccessory={rightAccessory}
        {...restProps}
      />
    );
  }
);

AppPasswordInput.displayName = 'AppPasswordInput';

const styles = StyleSheet.create({
  toggleButton: {
    minWidth: spacing.layout.minTouchTarget, // 48px touch boundary
    minHeight: spacing.layout.minTouchTarget, // 48px touch boundary
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.spaceXs
  },
  toggleInner: {
    paddingVertical: spacing.spaceXs,
    paddingHorizontal: spacing.spaceXs
  }
});
