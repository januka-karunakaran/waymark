/**
 * Waymark Mobile — Feature 04.4: TravelerPreferencesCard Unit Tests
 * Verifies transit mode chip toggling and distance telemetry unit switching.
 */

import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { TravelerPreferencesCard } from '../components/TravelerPreferencesCard';
import { TravelerPreferences } from '../types';

describe('TravelerPreferencesCard', () => {
  const onUpdatePreferencesMock = jest.fn().mockResolvedValue(true);

  const initialPreferences: TravelerPreferences = {
    userId: 'user-001',
    preferredModes: ['bus', 'train'],
    distanceUnit: 'km',
    createdAt: '2026-11-21T00:00:00Z',
    updatedAt: '2026-11-21T00:00:00Z'
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders transit modes with active checked state on preferred modes', () => {
    const { getByTestId } = render(
      <TravelerPreferencesCard
        preferences={initialPreferences}
        onUpdatePreferences={onUpdatePreferencesMock}
      />
    );

    expect(getByTestId('traveler-preferences-card')).toBeTruthy();
    expect(getByTestId('mode-chip-bus').props.accessibilityState.checked).toBe(true);
    expect(getByTestId('mode-chip-train').props.accessibilityState.checked).toBe(true);
    expect(getByTestId('mode-chip-ferry').props.accessibilityState.checked).toBe(false);
  });

  it('toggles mode when chip is pressed and dispatches onUpdatePreferences', async () => {
    const { getByTestId } = render(
      <TravelerPreferencesCard
        preferences={initialPreferences}
        onUpdatePreferences={onUpdatePreferencesMock}
      />
    );

    // Toggle off 'bus'
    fireEvent.press(getByTestId('mode-chip-bus'));
    await waitFor(() => {
      expect(onUpdatePreferencesMock).toHaveBeenCalledWith({
        preferredModes: ['train']
      });
    });

    // Toggle on 'ferry'
    fireEvent.press(getByTestId('mode-chip-ferry'));
    await waitFor(() => {
      expect(onUpdatePreferencesMock).toHaveBeenCalledWith({
        preferredModes: ['bus', 'train', 'ferry']
      });
    });
  });

  it('renders distance unit selection and dispatches update on change', async () => {
    const { getByTestId } = render(
      <TravelerPreferencesCard
        preferences={initialPreferences}
        onUpdatePreferences={onUpdatePreferencesMock}
      />
    );

    expect(getByTestId('unit-chip-km').props.accessibilityState.selected).toBe(true);
    expect(getByTestId('unit-chip-mi').props.accessibilityState.selected).toBe(false);

    fireEvent.press(getByTestId('unit-chip-mi'));
    await waitFor(() => {
      expect(onUpdatePreferencesMock).toHaveBeenCalledWith({
        distanceUnit: 'mi'
      });
    });
  });
});
