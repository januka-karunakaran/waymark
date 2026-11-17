import React, { useState } from 'react';
import { StyleSheet } from 'react-native';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { AppTextArea } from '../AppTextArea';

describe('AppTextArea Component', () => {
  // TC-02.4-18: Multiline input works
  it('TC-02.4-18: enables multiline input and top vertical alignment', () => {
    render(<AppTextArea label="Description" testID="desc-input" />);
    const input = screen.getByTestId('desc-input');

    expect(input.props.multiline).toBe(true);
    expect(input.props.textAlignVertical).toBe('top');
  });

  // TC-02.4-19: Maximum length is respected
  it('TC-02.4-19: forwards maxLength constraint to TextInput', () => {
    render(<AppTextArea maxLength={250} testID="desc-input" />);
    const input = screen.getByTestId('desc-input');

    expect(input.props.maxLength).toBe(250);
  });

  // TC-02.4-20: Character counter updates correctly
  it('TC-02.4-20: renders and updates character count display', () => {
    const TestComponent = () => {
      const [text, setText] = useState('');
      return (
        <AppTextArea
          maxLength={100}
          value={text}
          onChangeText={setText}
          showCharacterCount={true}
          testID="desc-input"
        />
      );
    };

    render(<TestComponent />);
    expect(screen.getByText('0 / 100')).toBeTruthy();

    const input = screen.getByTestId('desc-input');
    fireEvent.changeText(input, 'Station feedback');
    expect(screen.getByText('16 / 100')).toBeTruthy();
  });

  // TC-02.4-21: Error message displays correctly
  it('TC-02.4-21: renders error message with accessibilityRole="alert"', () => {
    render(
      <AppTextArea
        label="Feedback"
        error="Feedback must not contain restricted characters"
        testID="desc-input"
      />
    );

    const errorEl = screen.getByText('Feedback must not contain restricted characters');
    expect(errorEl).toBeTruthy();
    expect(errorEl.props.accessibilityRole).toBe('alert');
  });

  it('supports custom minHeight without clipping text', () => {
    render(<AppTextArea minHeight={160} testID="desc-input" />);
    const box = screen.getByTestId('desc-input-box');
    const flatStyle = StyleSheet.flatten(box.props.style);
    expect(flatStyle.minHeight).toBe(160);
  });
});
