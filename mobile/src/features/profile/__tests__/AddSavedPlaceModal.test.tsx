/**
 * Waymark Mobile — Feature 04.4: AddSavedPlaceModal Unit Tests
 * Verifies form controls, validation bounds, kind selection, and persistence callbacks.
 */

import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { AddSavedPlaceModal } from '../components/AddSavedPlaceModal';

describe('AddSavedPlaceModal', () => {
  const defaultProps = {
    visible: true,
    initialKind: 'favorite' as const,
    isSaving: false,
    onSave: jest.fn().mockResolvedValue(true),
    onClose: jest.fn()
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders modal dialog with kind chips and text inputs', () => {
    const { getByTestId } = render(<AddSavedPlaceModal {...defaultProps} />);

    expect(getByTestId('add-saved-place-dialog')).toBeTruthy();
    expect(getByTestId('kind-chip-home')).toBeTruthy();
    expect(getByTestId('kind-chip-work')).toBeTruthy();
    expect(getByTestId('kind-chip-favorite')).toBeTruthy();
    expect(getByTestId('input-place-label')).toBeTruthy();
    expect(getByTestId('input-place-text')).toBeTruthy();
  });

  it('defaults label to "Home" when Home kind is selected', () => {
    const { getByTestId } = render(
      <AddSavedPlaceModal {...defaultProps} initialKind="home" />
    );

    expect(getByTestId('input-place-label').props.value).toBe('Home');
  });

  it('validates place text and displays error on empty or invalid input', async () => {
    const { getByTestId, getByText } = render(<AddSavedPlaceModal {...defaultProps} />);

    fireEvent.changeText(getByTestId('input-place-label'), 'My Spot');
    fireEvent.changeText(getByTestId('input-place-text'), ''); // empty place text
    fireEvent.press(getByTestId('btn-save-saved-place'));

    await waitFor(() => {
      expect(getByText(/Place text must be between/i)).toBeTruthy();
    });
    expect(defaultProps.onSave).not.toHaveBeenCalled();
  });

  it('submits valid saved place and invokes onSave with sanitized inputs', async () => {
    const onSaveMock = jest.fn().mockResolvedValue(true);
    const onCloseMock = jest.fn();

    const { getByTestId } = render(
      <AddSavedPlaceModal
        {...defaultProps}
        onSave={onSaveMock}
        onClose={onCloseMock}
      />
    );

    fireEvent.changeText(getByTestId('input-place-label'), '  Central Park  ');
    fireEvent.changeText(getByTestId('input-place-text'), '  59th St, New York  ');
    fireEvent.press(getByTestId('btn-save-saved-place'));

    await waitFor(() => {
      expect(onSaveMock).toHaveBeenCalledWith('favorite', 'Central Park', '59th St, New York');
      expect(onCloseMock).toHaveBeenCalled();
    });
  });

  it('shows error banner when onSave resolves with false', async () => {
    const onSaveMock = jest.fn().mockResolvedValue(false);
    const onCloseMock = jest.fn();

    const { getByTestId, getByText } = render(
      <AddSavedPlaceModal
        {...defaultProps}
        onSave={onSaveMock}
        onClose={onCloseMock}
      />
    );

    fireEvent.changeText(getByTestId('input-place-label'), 'Central Park');
    fireEvent.changeText(getByTestId('input-place-text'), '59th St, New York');
    fireEvent.press(getByTestId('btn-save-saved-place'));

    await waitFor(() => {
      expect(getByTestId('saved-place-submit-error')).toBeTruthy();
      expect(getByText(/Failed to save destination/i)).toBeTruthy();
      expect(onCloseMock).not.toHaveBeenCalled();
    });
  });
});
