import React, { useState } from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { AppInput } from '../AppInput';
import { FormExample } from '../FormExample';

describe('AppInput Component', () => {
  // TC-02.4-01: Renders a visible label
  it('TC-02.4-01: renders a visible label', () => {
    render(<AppInput label="Station Name" testID="station-input" />);
    expect(screen.getByText('Station Name')).toBeTruthy();
  });

  // TC-02.4-02: Renders placeholder correctly
  it('TC-02.4-02: renders placeholder correctly', () => {
    render(
      <AppInput
        placeholder="Enter destination"
        testID="dest-input"
      />
    );
    expect(screen.getByPlaceholderText('Enter destination')).toBeTruthy();
  });

  // TC-02.4-03: Calls onChangeText with entered text
  it('TC-02.4-03: calls onChangeText with entered text', () => {
    const handleChange = jest.fn();
    render(
      <AppInput
        label="Route Code"
        onChangeText={handleChange}
        testID="route-input"
      />
    );

    fireEvent.changeText(screen.getByTestId('route-input'), 'EX-101');
    expect(handleChange).toHaveBeenCalledWith('EX-101');
  });

  // TC-02.4-04: Supports controlled value updates
  it('TC-02.4-04: supports controlled value updates', () => {
    const ControlledComponent = () => {
      const [val, setVal] = useState('Initial');
      return (
        <AppInput
          label="Field"
          value={val}
          onChangeText={setVal}
          testID="controlled-input"
        />
      );
    };

    render(<ControlledComponent />);
    const input = screen.getByTestId('controlled-input');
    expect(input.props.value).toBe('Initial');

    fireEvent.changeText(input, 'Updated Value');
    expect(input.props.value).toBe('Updated Value');
  });

  // TC-02.4-05: Displays helper text
  it('TC-02.4-05: displays helper text when provided', () => {
    render(
      <AppInput
        label="Terminal"
        helperText="Select a platform between 1 and 12"
        testID="terminal-input"
      />
    );
    expect(screen.getByText('Select a platform between 1 and 12')).toBeTruthy();
  });

  // TC-02.4-06: Displays validation errors
  it('TC-02.4-06: displays validation errors with alert role', () => {
    render(
      <AppInput
        label="Terminal"
        error="Terminal is out of service"
        testID="terminal-input"
      />
    );
    const errorEl = screen.getByText('Terminal is out of service');
    expect(errorEl).toBeTruthy();
    expect(errorEl.props.accessibilityRole).toBe('alert');
  });

  // TC-02.4-07: Disabled input prevents editing
  it('TC-02.4-07: disabled input prevents editing and updates accessibility state', () => {
    render(
      <AppInput
        label="Locked Node"
        disabled
        testID="locked-input"
      />
    );
    const input = screen.getByTestId('locked-input');
    expect(input.props.editable).toBe(false);
    expect(input.props.accessibilityState.disabled).toBe(true);
  });

  // TC-02.4-08: Focus and blur callbacks work
  it('TC-02.4-08: focus and blur callbacks are triggered properly', () => {
    const handleFocus = jest.fn();
    const handleBlur = jest.fn();

    render(
      <AppInput
        label="Interactive"
        onFocus={handleFocus}
        onBlur={handleBlur}
        testID="focus-input"
      />
    );

    const input = screen.getByTestId('focus-input');
    fireEvent(input, 'focus');
    expect(handleFocus).toHaveBeenCalled();

    fireEvent(input, 'blur');
    expect(handleBlur).toHaveBeenCalled();
  });

  // TC-02.4-28: Inputs expose meaningful accessibility labels
  it('TC-02.4-28: inputs expose meaningful accessibility labels', () => {
    render(
      <AppInput
        label="Platform"
        accessibilityLabel="Transit Platform Number"
        testID="platform-input"
      />
    );
    const input = screen.getByTestId('platform-input');
    expect(input.props.accessibilityLabel).toBe('Transit Platform Number');
  });

  // TC-02.4-29: Required and invalid states are communicated accessibly
  it('TC-02.4-29: communicates required state with asterisk and accessible label', () => {
    render(
      <AppInput
        label="Passport ID"
        required
        error="Invalid Passport Number"
        testID="passport-input"
      />
    );
    expect(screen.getByLabelText('(required)')).toBeTruthy();
    expect(screen.getByText('Invalid Passport Number')).toBeTruthy();
  });

  // TC-02.4-30: Font scaling is supported
  it('TC-02.4-30: supports font scaling and maxFontSizeMultiplier', () => {
    render(
      <AppInput
        label="Scaled Input"
        allowFontScaling={true}
        maxFontSizeMultiplier={2.5}
        testID="scaled-input"
      />
    );
    const input = screen.getByTestId('scaled-input');
    expect(input.props.allowFontScaling).toBe(true);
    expect(input.props.maxFontSizeMultiplier).toBe(2.5);
  });

  // TC-02.4-31: Light and dark theme styles resolve
  it('TC-02.4-31: resolves dark and light theme styles appropriately', () => {
    const { rerender } = render(
      <AppInput
        label="Themed Field"
        themeMode="dark"
        testID="themed-input"
      />
    );
    let box = screen.getByTestId('themed-input-box');
    expect(box.props.style).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ backgroundColor: '#070A0F' })
      ])
    );

    rerender(
      <AppInput
        label="Themed Field"
        themeMode="light"
        testID="themed-input"
      />
    );
    box = screen.getByTestId('themed-input-box');
    expect(box.props.style).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ backgroundColor: '#F4F6F9' })
      ])
    );
  });

  // Section 12: Form submission example integration test
  describe('Form Submission Example Workflow', () => {
    it('validates on submit, prevents invalid submission, and succeeds when fields are valid', () => {
      const handleSubmitSuccess = jest.fn();
      render(<FormExample onSubmitSuccess={handleSubmitSuccess} testID="test-form" />);

      const submitBtn = screen.getByTestId('test-form-submit-btn');

      // Attempt to submit empty form
      fireEvent.press(submitBtn);
      expect(handleSubmitSuccess).not.toHaveBeenCalled();

      // Errors should appear
      expect(screen.getByText('Name is required.')).toBeTruthy();
      expect(screen.getByText('Email address is required.')).toBeTruthy();
      expect(screen.getByText('Password is required.')).toBeTruthy();

      // Fill in valid data
      fireEvent.changeText(screen.getByTestId('test-form-name'), 'Janu Karu');
      fireEvent.changeText(screen.getByTestId('test-form-email'), 'janu@waymark.app');
      fireEvent.changeText(screen.getByTestId('test-form-password'), 'SecurePass123');
      fireEvent.changeText(screen.getByTestId('test-form-notes'), 'Regular commute');

      // Resubmit
      fireEvent.press(submitBtn);
      expect(handleSubmitSuccess).toHaveBeenCalledWith({
        name: 'Janu Karu',
        email: 'janu@waymark.app',
        description: 'Regular commute'
      });
    });
  });
});
