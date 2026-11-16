import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { EmptyState } from '../../src/components/EmptyState';

describe('EmptyState Component', () => {
  it('renders default empty title and message', () => {
    const { getByText } = render(<EmptyState />);
    expect(getByText('No Transit Vectors Found')).toBeTruthy();
  });

  it('renders action button and triggers onAction callback', () => {
    const onActionMock = jest.fn();
    const { getByText, getByRole } = render(
      <EmptyState
        title="No Saved Nodes"
        message="Add a node to your favourites."
        actionLabel="Explore Map"
        onAction={onActionMock}
      />
    );
    expect(getByText('No Saved Nodes')).toBeTruthy();
    const actionBtn = getByRole('button');
    expect(getByText('Explore Map')).toBeTruthy();
    fireEvent.press(actionBtn);
    expect(onActionMock).toHaveBeenCalledTimes(1);
  });

  it('renders action button when actionLabel is provided without onAction and handles press gracefully', () => {
    const { getByText, getByRole } = render(
      <EmptyState actionLabel="Select Destination" />
    );
    const actionBtn = getByRole('button');
    expect(getByText('Select Destination')).toBeTruthy();
    expect(() => fireEvent.press(actionBtn)).not.toThrow();
  });

  it('supports custom testID for component and sub-elements', () => {
    const { getByTestId } = render(
      <EmptyState
        testID="custom-empty"
        title="Offline Grid"
        message="Grid unreachable"
        actionLabel="Re-scan"
      />
    );
    expect(getByTestId('custom-empty')).toBeTruthy();
    expect(getByTestId('custom-empty-title')).toBeTruthy();
    expect(getByTestId('custom-empty-message')).toBeTruthy();
    expect(getByTestId('custom-empty-action')).toBeTruthy();
  });
});
