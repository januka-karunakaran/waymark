import React from 'react';
import { render, screen } from '@testing-library/react-native';
import { View } from 'react-native';
import { FormField } from '../FormField';

describe('FormField Component', () => {
  it('renders label and children correctly', () => {
    render(
      <FormField label="Username" testID="test-field">
        <View testID="test-child" />
      </FormField>
    );

    expect(screen.getByText('Username')).toBeTruthy();
    expect(screen.getByTestId('test-child')).toBeTruthy();
  });

  it('renders required indicator with accessible label', () => {
    render(
      <FormField label="Full Name" required testID="test-field">
        <View />
      </FormField>
    );

    expect(screen.getByLabelText('(required)')).toBeTruthy();
    expect(screen.getByText(' *')).toBeTruthy();
  });

  it('renders helper text when no error exists', () => {
    render(
      <FormField helperText="Enter your government issued ID" testID="test-field">
        <View />
      </FormField>
    );

    expect(screen.getByText('Enter your government issued ID')).toBeTruthy();
  });

  it('renders error message with accessibilityRole="alert" and hides helper text', () => {
    render(
      <FormField
        helperText="Enter your ID"
        error="ID is required"
        testID="test-field"
      >
        <View />
      </FormField>
    );

    const errorEl = screen.getByText('ID is required');
    expect(errorEl).toBeTruthy();
    expect(errorEl.props.accessibilityRole).toBe('alert');
    expect(screen.queryByText('Enter your ID')).toBeNull();
  });
});
