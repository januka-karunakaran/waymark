import React from 'react';
import { render } from '@testing-library/react-native';
import { LoadingIndicator } from '../../src/components/LoadingIndicator';

describe('LoadingIndicator Component', () => {
  it('renders with default message', () => {
    const { getByText, getByRole } = render(<LoadingIndicator />);
    expect(getByText('Synchronizing transit telemetry...')).toBeTruthy();
    expect(getByRole('progressbar')).toBeTruthy();
  });

  it('renders custom message and applies accessibilityLabel', () => {
    const customMessage = 'Calibrating orbital shuttle vector...';
    const { getByText, getByRole } = render(
      <LoadingIndicator message={customMessage} />
    );
    expect(getByText(customMessage)).toBeTruthy();
    const progressbar = getByRole('progressbar');
    expect(progressbar.props.accessibilityLabel).toBe(customMessage);
  });
});
