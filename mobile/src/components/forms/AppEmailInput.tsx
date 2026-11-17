import React, { forwardRef } from 'react';
import { TextInput } from 'react-native';
import { AppInput, AppInputProps } from './AppInput';

export interface AppEmailInputProps extends AppInputProps {
  /**
   * Optional custom validation handler or automated check on blur.
   */
  validateOnBlur?: boolean;
}

/**
 * AppEmailInput — Specialized, secure email entry component configured with
 * optimized mobile email keyboards, no auto-capitalization, and no auto-correction.
 */
export const AppEmailInput = forwardRef<TextInput, AppEmailInputProps>(
  (
    {
      label = 'Email address',
      autoCapitalize = 'none',
      autoCorrect = false,
      keyboardType = 'email-address',
      autoComplete = 'email',
      textContentType = 'emailAddress',
      accessibilityLabel,
      testID = 'email-input',
      ...restProps
    },
    ref
  ) => {
    return (
      <AppInput
        ref={ref}
        label={label}
        autoCapitalize={autoCapitalize}
        autoCorrect={autoCorrect}
        keyboardType={keyboardType}
        autoComplete={autoComplete}
        textContentType={textContentType}
        accessibilityLabel={accessibilityLabel || label}
        testID={testID}
        {...restProps}
      />
    );
  }
);

AppEmailInput.displayName = 'AppEmailInput';
