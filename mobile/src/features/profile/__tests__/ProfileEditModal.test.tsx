/**
 * Waymark Mobile — Feature 04.4: ProfileEditModal Unit Tests
 * Verifies form rendering, input validation, save action, and error handling.
 */

import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { ProfileEditModal } from '../components/ProfileEditModal';

describe('ProfileEditModal', () => {
  const defaultProps = {
    visible: true,
    initialDisplayName: 'Navigator Janu',
    initialAvatarUrl: 'https://images.waymark.app/avatar.png',
    isSaving: false,
    onSave: jest.fn().mockResolvedValue(true),
    onClose: jest.fn()
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders modal dialog with initial values', () => {
    const { getByTestId } = render(<ProfileEditModal {...defaultProps} />);

    expect(getByTestId('profile-edit-dialog')).toBeTruthy();
    expect(getByTestId('input-display-name').props.value).toBe('Navigator Janu');
    expect(getByTestId('input-avatar-url').props.value).toBe('https://images.waymark.app/avatar.png');
  });

  it('validates display name and displays error when exceeding length or containing injection characters', async () => {
    const { getByTestId, getByText } = render(<ProfileEditModal {...defaultProps} />);

    // Change display name to invalid script tag
    fireEvent.changeText(getByTestId('input-display-name'), 'Janu<script>');
    fireEvent.press(getByTestId('btn-save-profile'));

    await waitFor(() => {
      expect(getByText('Display name contains invalid characters.')).toBeTruthy();
    });
    expect(defaultProps.onSave).not.toHaveBeenCalled();
  });

  it('validates avatar URL and displays error when non-http protocol is provided', async () => {
    const { getByTestId, getByText } = render(<ProfileEditModal {...defaultProps} />);

    fireEvent.changeText(getByTestId('input-avatar-url'), 'javascript:alert(1)');
    fireEvent.press(getByTestId('btn-save-profile'));

    await waitFor(() => {
      expect(getByText('Avatar URL must start with http:// or https://.')).toBeTruthy();
    });
    expect(defaultProps.onSave).not.toHaveBeenCalled();
  });

  it('calls onSave with trimmed values and closes modal on success', async () => {
    const onSaveMock = jest.fn().mockResolvedValue(true);
    const onCloseMock = jest.fn();

    const { getByTestId } = render(
      <ProfileEditModal
        {...defaultProps}
        onSave={onSaveMock}
        onClose={onCloseMock}
      />
    );

    fireEvent.changeText(getByTestId('input-display-name'), '  Commander Janu  ');
    fireEvent.changeText(getByTestId('input-avatar-url'), 'https://images.waymark.app/new.png');
    fireEvent.press(getByTestId('btn-save-profile'));

    await waitFor(() => {
      expect(onSaveMock).toHaveBeenCalledWith('Commander Janu', 'https://images.waymark.app/new.png');
      expect(onCloseMock).toHaveBeenCalled();
    });
  });

  it('displays submission error banner when onSave returns false', async () => {
    const onSaveMock = jest.fn().mockResolvedValue(false);
    const onCloseMock = jest.fn();

    const { getByTestId, getByText } = render(
      <ProfileEditModal
        {...defaultProps}
        onSave={onSaveMock}
        onClose={onCloseMock}
      />
    );

    fireEvent.press(getByTestId('btn-save-profile'));

    await waitFor(() => {
      expect(getByTestId('profile-submit-error')).toBeTruthy();
      expect(getByText(/Unable to update profile/i)).toBeTruthy();
      expect(onCloseMock).not.toHaveBeenCalled();
    });
  });
});
