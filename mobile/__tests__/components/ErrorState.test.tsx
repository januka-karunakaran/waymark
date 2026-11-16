import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { ErrorState } from '../../src/components/ErrorState';

describe('ErrorState Component', () => {
  it('renders default title and message', () => {
    const { getByText, getByRole } = render(<ErrorState />);
    expect(getByText('Telemetry Sync Disrupted')).toBeTruthy();
    expect(getByRole('alert')).toBeTruthy();
  });

  it('renders custom title and message', () => {
    const { getByText } = render(
      <ErrorState
        title="Maglev M4 Offline"
        message="Power grid anomaly detected on corridor."
      />
    );
    expect(getByText('Maglev M4 Offline')).toBeTruthy();
    expect(getByText('Power grid anomaly detected on corridor.')).toBeTruthy();
  });

  it('calls onRetry callback when retry button is pressed', () => {
    const onRetryMock = jest.fn();
    const { getByRole } = render(
      <ErrorState onRetry={onRetryMock} retryLabel="Retry Connection" />
    );
    const retryButton = getByRole('button');
    fireEvent.press(retryButton);
    expect(onRetryMock).toHaveBeenCalledTimes(1);
  });
});
