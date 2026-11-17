import React from 'react';
import { View, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { AppText } from '../typography';
import { spacing } from '../../theme';

export interface FormFieldProps {
  /**
   * Field label displayed above the input.
   */
  label?: string;

  /**
   * Indicates whether the field is mandatory.
   * Renders an asterisk and accessible indicator.
   */
  required?: boolean;

  /**
   * Explanatory helper text displayed below the field when no error exists.
   */
  helperText?: string;

  /**
   * Validation error message displayed below the field.
   */
  error?: string;

  /**
   * Whether the field is disabled.
   */
  disabled?: boolean;

  /**
   * Explicit theme mode override.
   */
  themeMode?: 'light' | 'dark';

  /**
   * Test identifier for end-to-end and unit testing.
   */
  testID?: string;

  /**
   * Custom style for the wrapper container.
   */
  style?: StyleProp<ViewStyle>;

  /**
   * Input control element(s).
   */
  children: React.ReactNode;
}

/**
 * FormField — Reusable presentation wrapper providing consistent label,
 * required indicator, helper text, and validation error layouts.
 */
export const FormField: React.FC<FormFieldProps> = ({
  label,
  required = false,
  helperText,
  error,
  disabled = false,
  themeMode,
  testID,
  style,
  children
}) => {
  const hasError = Boolean(error);
  const hasHelper = Boolean(helperText);

  return (
    <View style={[styles.container, style]} testID={testID}>
      {label ? (
        <View style={styles.labelRow}>
          <AppText
            variant="label"
            weight="medium"
            color={disabled ? 'dim' : 'secondary'}
            themeMode={themeMode}
            testID={testID ? `${testID}-label` : undefined}
          >
            {label}
          </AppText>
          {required ? (
            <AppText
              variant="label"
              weight="bold"
              color="error"
              accessibilityLabel="(required)"
              themeMode={themeMode}
              testID={testID ? `${testID}-required-indicator` : undefined}
            >
              {' *'}
            </AppText>
          ) : null}
        </View>
      ) : null}

      {children}

      {hasError ? (
        <View style={styles.messageRow}>
          <AppText
            variant="caption"
            color="error"
            accessibilityRole="alert"
            themeMode={themeMode}
            testID={testID ? `${testID}-error` : 'form-field-error'}
          >
            {error}
          </AppText>
        </View>
      ) : hasHelper ? (
        <View style={styles.messageRow}>
          <AppText
            variant="caption"
            color="muted"
            themeMode={themeMode}
            testID={testID ? `${testID}-helper` : 'form-field-helper'}
          >
            {helperText}
          </AppText>
        </View>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginBottom: spacing.spaceMd
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.spaceXs
  },
  messageRow: {
    marginTop: spacing.spaceXs,
    flexDirection: 'row',
    alignItems: 'center'
  }
});
