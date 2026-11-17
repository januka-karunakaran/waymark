import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { AppEmailInput } from '../AppEmailInput';
import { validateEmail } from '../../../utils/validation';

describe('AppEmailInput Component', () => {
  // TC-02.4-09: Uses the correct email keyboard configuration
  it('TC-02.4-09: uses the correct email keyboard configuration and textContentType', () => {
    render(<AppEmailInput testID="email-input" />);
    const input = screen.getByTestId('email-input');

    expect(input.props.keyboardType).toBe('email-address');
    expect(input.props.autoComplete).toBe('email');
    expect(input.props.textContentType).toBe('emailAddress');
  });

  // TC-02.4-10: Accepts valid email values
  it('TC-02.4-10: accepts and preserves valid email values', () => {
    const handleChange = jest.fn();
    render(
      <AppEmailInput
        value="commuter@waymark.app"
        onChangeText={handleChange}
        testID="email-input"
      />
    );

    const input = screen.getByTestId('email-input');
    expect(input.props.value).toBe('commuter@waymark.app');

    fireEvent.changeText(input, 'janu@waymark.app');
    expect(handleChange).toHaveBeenCalledWith('janu@waymark.app');
    expect(validateEmail('janu@waymark.app').isValid).toBe(true);
  });

  // TC-02.4-11: Rejects malformed email values in validation
  it('TC-02.4-11: rejects malformed email values in validation', () => {
    expect(validateEmail('invalid-email').isValid).toBe(false);
    expect(validateEmail('invalid@').isValid).toBe(false);
    expect(validateEmail('@domain.com').isValid).toBe(false);
    expect(validateEmail('user@domain').isValid).toBe(false);

    render(
      <AppEmailInput
        value="bad-email"
        error="Please enter a valid email address."
        testID="email-input"
      />
    );

    expect(screen.getByText('Please enter a valid email address.')).toBeTruthy();
  });

  // TC-02.4-12: Supports appropriate keyboard capitalization settings
  it('TC-02.4-12: disables automatic capitalization and auto-correction', () => {
    render(<AppEmailInput testID="email-input" />);
    const input = screen.getByTestId('email-input');

    expect(input.props.autoCapitalize).toBe('none');
    expect(input.props.autoCorrect).toBe(false);
  });
});
