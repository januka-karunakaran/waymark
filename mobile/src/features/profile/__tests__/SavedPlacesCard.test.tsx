/**
 * Waymark Mobile — Feature 04.4: SavedPlacesCard Unit Tests
 * Verifies rendering of Home, Work, and Favorite shortcuts, and callback dispatch.
 */

import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { SavedPlacesCard } from '../components/SavedPlacesCard';
import { SavedPlace } from '../types';

describe('SavedPlacesCard', () => {
  const onAddPlacePressMock = jest.fn();
  const onDeletePlacePressMock = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders unconfigured state when Home and Work are not yet saved', () => {
    const { getByTestId, queryByTestId, getAllByText } = render(
      <SavedPlacesCard
        savedPlaces={[]}
        onAddPlacePress={onAddPlacePressMock}
        onDeletePlacePress={onDeletePlacePressMock}
      />
    );

    expect(getByTestId('saved-places-card')).toBeTruthy();
    expect(getByTestId('btn-add-home')).toBeTruthy();
    expect(getByTestId('btn-add-work')).toBeTruthy();
    expect(getAllByText('Not configured').length).toBe(2);
    expect(queryByTestId('saved-favorites-list')).toBeNull();
  });

  it('triggers onAddPlacePress with "home" and "work" when Add buttons are pressed', () => {
    const { getByTestId } = render(
      <SavedPlacesCard
        savedPlaces={[]}
        onAddPlacePress={onAddPlacePressMock}
        onDeletePlacePress={onDeletePlacePressMock}
      />
    );

    fireEvent.press(getByTestId('btn-add-home'));
    expect(onAddPlacePressMock).toHaveBeenCalledWith('home');

    fireEvent.press(getByTestId('btn-add-work'));
    expect(onAddPlacePressMock).toHaveBeenCalledWith('work');
  });

  it('renders configured Home and Work places and allows deleting them', () => {
    const savedPlaces: SavedPlace[] = [
      {
        id: 'place-home',
        userId: 'user-001',
        kind: 'home',
        label: 'Home Habitat',
        placeText: '123 Galle Rd, Colombo 03',
        createdAt: '2026-11-21T00:00:00Z',
        updatedAt: '2026-11-21T00:00:00Z'
      },
      {
        id: 'place-work',
        userId: 'user-001',
        kind: 'work',
        label: 'Tech Hub Office',
        placeText: 'World Trade Center, Colombo 01',
        createdAt: '2026-11-21T00:00:00Z',
        updatedAt: '2026-11-21T00:00:00Z'
      }
    ];

    const { getByTestId, getByText } = render(
      <SavedPlacesCard
        savedPlaces={savedPlaces}
        onAddPlacePress={onAddPlacePressMock}
        onDeletePlacePress={onDeletePlacePressMock}
      />
    );

    expect(getByText('Home Habitat')).toBeTruthy();
    expect(getByText('123 Galle Rd, Colombo 03')).toBeTruthy();
    expect(getByText('Tech Hub Office')).toBeTruthy();
    expect(getByText('World Trade Center, Colombo 01')).toBeTruthy();

    fireEvent.press(getByTestId('btn-delete-home'));
    expect(onDeletePlacePressMock).toHaveBeenCalledWith('place-home');

    fireEvent.press(getByTestId('btn-delete-work'));
    expect(onDeletePlacePressMock).toHaveBeenCalledWith('place-work');
  });

  it('renders custom favorite shortcuts with delete buttons', () => {
    const savedPlaces: SavedPlace[] = [
      {
        id: 'fav-1',
        userId: 'user-001',
        kind: 'favorite',
        label: 'Fitness Gym',
        placeText: 'Fitness First, Bambalapitiya',
        createdAt: '2026-11-21T00:00:00Z',
        updatedAt: '2026-11-21T00:00:00Z'
      }
    ];

    const { getByTestId, getByText } = render(
      <SavedPlacesCard
        savedPlaces={savedPlaces}
        onAddPlacePress={onAddPlacePressMock}
        onDeletePlacePress={onDeletePlacePressMock}
      />
    );

    expect(getByTestId('saved-favorites-list')).toBeTruthy();
    expect(getByText('Fitness Gym')).toBeTruthy();
    expect(getByText('Fitness First, Bambalapitiya')).toBeTruthy();

    fireEvent.press(getByTestId('btn-delete-favorite-fav-1'));
    expect(onDeletePlacePressMock).toHaveBeenCalledWith('fav-1');
  });
});
