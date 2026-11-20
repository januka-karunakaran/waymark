import React from 'react';
import { KeyboardTypeOptions, StyleProp, ViewStyle } from 'react-native';
import { FormField } from '../../../components/forms/FormField';
import { AppInput } from '../../../components/forms/AppInput';
import { AppPasswordInput } from '../../../components/forms/AppPasswordInput';

export interface AuthFormFieldProps {
  /**
   * Field label displayed above the input.
   */
  label: string;

  /**
   * Current text value.
   */
  value: string;

  /**
   * Value update callback.
   */
  onChangeText: (text: string) => void;

  /**
   * Input control type: 'text' | 'email' | 'password'.
   * @default 'text'
   */
  type?: 'text' | 'email' | 'password';

  /**
   * Placeholder string shown when empty.
   */
  placeholder?: string;

  /**
   * Validation error message displayed below the input.
   */
  error?: string;

  /**
   * Explanatory helper text displayed below the field when no error exists.
   */
  helperText?: string;

  /**
   * Whether the field is required. Renders an accessible (required) indicator.
   */
  required?: boolean;

  /**
   * Whether the input is disabled.
   */
  disabled?: boolean;

  /**
   * Maximum allowed character length.
   */
  maxLength?: number;

  /**
   * Keyboard type override. Defaults to 'email-address' for type='email'.
   */
  keyboardType?: KeyboardTypeOptions;

  /**
   * Autocapitalization policy. Defaults to 'none' for type='email' and 'password'.
   */
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';

  /**
   * Autocorrect policy. Defaults to false for type='email' and 'password'.
   */
  autoCorrect?: boolean;

  /**
   * Accessible description for assistive technologies.
   */
  accessibilityLabel?: string;

  /**
   * Accessible action hint for assistive technologies.
   */
  accessibilityHint?: string;

  /**
   * Wrapper style.
   */
  style?: StyleProp<ViewStyle>;

  /**
   * Test identifier.
   */
  testID?: string;
}

/**
 * AuthFormField â€” Reusable, accessible form field component for authentication flows.
 * Composes FormField, AppInput, and AppPasswordInput with strict WCAG semantics,
 * password visibility toggling, and input sanitization.
 */
export const AuthFormField: React.FC<AuthFormFieldProps> = ({
  label,
  value,
  onChangeText,
  type = 'text',
  placeholder,
  error,
  helperText,
  required = false,
  disabled = false,
  maxLength,
  keyboardType,
  autoCapitalize,
  autoCorrect,
  accessibilityLabel,
  accessibilityHint,
  style,
  testID
}) => {
  const isEmail = type === 'email';
  const isPassword = type === 'password';

  const resolvedKeyboardType = keyboardType ?? (isEmail ? 'email-address' : 'default');
  const resolvedAutoCapitalize = autoCapitalize ?? (isEmail || isPassword ? 'none' : 'sentences');
  const resolvedAutoCorrect = autoCorrect ?? (isEmail || isPassword ? false : true);
  const resolvedAccessibilityLabel = accessibilityLabel ?? label;

  return (
    <FormField
      label={label}
      required={required}
      error={error}
      helperText={helperText}
      disabled={disabled}
      testID={testID ? `${testID}-field` : undefined}
      style={style}
    >
      {isPassword ? (
        <AppPasswordInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          disabled={disabled}
          maxLength={maxLength}
          testID={testID ? `${testID}-input` : undefined}
          accessibilityLabel={resolvedAccessibilityLabel}
          accessibilityHint={accessibilityHint}
        />
      ) : (
        <AppInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          disabled={disabled}
          keyboardType={resolvedKeyboardType}
          autoCapitalize={resolvedAutoCapitalize}
          autoCorrect={resolvedAutoCorrect}
          maxLength={maxLength}
          testID={testID ? `${testID}-input` : undefined}
          accessibilityLabel={resolvedAccessibilityLabel}
          accessibilityHint={accessibilityHint}
        />
      )}
    </FormField>
  );
};
