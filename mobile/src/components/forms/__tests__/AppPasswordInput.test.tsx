import React, { useState } from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { AppPasswordInput } from '../AppPasswordInput';

describe('AppPasswordInput Component', () => {
  // TC-02.4-13: Password is hidden by default
  it('TC-02.4-13: obscures password entry by default', () => {
    render(<AppPasswordInput testID="pwd-input" />);
    const input = screen.getByTestId('pwd-input');
    expect(input.props.secureTextEntry).toBe(true);
    expect(screen.getByText('SHOW')).toBeTruthy();
  });

  // TC-02.4-14: Visibility toggle reveals password
  it('TC-02.4-14: reveals password when toggle is pressed', () => {
    render(<AppPasswordInput testID="pwd-input" />);
    const toggle = screen.getByTestId('pwd-input-toggle-visibility');

    fireEvent.press(toggle);

    const input = screen.getByTestId('pwd-input');
    expect(input.props.secureTextEntry).toBe(false);
    expect(screen.getByText('HIDE')).toBeTruthy();
  });

  // TC-02.4-15: Second toggle hides password again
  it('TC-02.4-15: hides password again on subsequent toggle press', () => {
    render(<AppPasswordInput testID="pwd-input" />);
    const toggle = screen.getByTestId('pwd-input-toggle-visibility');

    // First toggle: reveal
    fireEvent.press(toggle);
    expect(screen.getByTestId('pwd-input').props.secureTextEntry).toBe(false);

    // Second toggle: hide
    fireEvent.press(toggle);
    expect(screen.getByTestId('pwd-input').props.secureTextEntry).toBe(true);
  });

  // TC-02.4-16: Password value is preserved across toggles
  it('TC-02.4-16: preserves controlled password value across visibility toggles', () => {
    const TestComponent = () => {
      const [pwd, setPwd] = useState('Passw0rdTransit!');
      return (
        <AppPasswordInput
          value={pwd}
          onChangeText={setPwd}
          testID="pwd-input"
        />
      );
    };

    render(<TestComponent />);
    const input = screen.getByTestId('pwd-input');
    const toggle = screen.getByTestId('pwd-input-toggle-visibility');

    expect(input.props.value).toBe('Passw0rdTransit!');

    fireEvent.press(toggle);
    expect(input.props.value).toBe('Passw0rdTransit!');

    fireEvent.press(toggle);
    expect(input.props.value).toBe('Passw0rdTransit!');
  });

  // TC-02.4-17: Toggle has an accessible label
  it('TC-02.4-17: provides accessible role and label for the visibility toggle', () => {
    render(<AppPasswordInput testID="pwd-input" />);
    const toggle = screen.getByTestId('pwd-input-toggle-visibility');

    expect(toggle.props.accessibilityRole).toBe('button');
    expect(toggle.props.accessibilityLabel).toBe('Show password');

    fireEvent.press(toggle);
    expect(toggle.props.accessibilityLabel).toBe('Hide password');
  });

  it('disables visibility toggle when input is disabled', () => {
    render(<AppPasswordInput disabled testID="pwd-input" />);
    const toggle = screen.getByTestId('pwd-input-toggle-visibility');
    const input = screen.getByTestId('pwd-input');

    expect(input.props.secureTextEntry).toBe(true);

    fireEvent.press(toggle);
    // Still obscured because button is disabled
    expect(input.props.secureTextEntry).toBe(true);
  });
});
