import React from 'react';
import { Text } from 'react-native';
import { render, fireEvent } from '@testing-library/react-native';
import { ErrorBoundary } from '../../src/components/ErrorBoundary';

const FaultyComponent: React.FC<{ shouldThrow: boolean }> = ({ shouldThrow }) => {
  if (shouldThrow) {
    throw new Error('Test telemetry breakdown');
  }
  return <Text>System Nominal</Text>;
};

describe('ErrorBoundary Component', () => {
  beforeEach(() => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    (console.error as jest.Mock).mockRestore();
  });

  it('renders children when there is no error', () => {
    const { getByText } = render(
      <ErrorBoundary>
        <FaultyComponent shouldThrow={false} />
      </ErrorBoundary>
    );
    expect(getByText('System Nominal')).toBeTruthy();
  });

  it('catches error and renders default fallback UI', () => {
    const onErrorMock = jest.fn();
    const { getByText, getByRole } = render(
      <ErrorBoundary onError={onErrorMock}>
        <FaultyComponent shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(getByText('System Avionics Fault')).toBeTruthy();
    expect(getByRole('alert')).toBeTruthy();
    expect(onErrorMock).toHaveBeenCalledTimes(1);
  });

  it('resets state when Reboot Avionics button is pressed', () => {
    let shouldThrow = true;
    const { getByText, rerender } = render(
      <ErrorBoundary>
        <FaultyComponent shouldThrow={shouldThrow} />
      </ErrorBoundary>
    );

    expect(getByText('System Avionics Fault')).toBeTruthy();

    shouldThrow = false;
    rerender(
      <ErrorBoundary>
        <FaultyComponent shouldThrow={shouldThrow} />
      </ErrorBoundary>
    );

    const rebootBtn = getByText('Reboot Avionics');
    fireEvent.press(rebootBtn);
    expect(getByText('System Nominal')).toBeTruthy();
  });
});
