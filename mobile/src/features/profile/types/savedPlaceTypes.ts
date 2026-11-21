/**
 * Waymark Mobile — Feature 04.4: User Profile, Saved Places & Traveler Preferences
 * Domain types for saved places (Home, Work, and Favorites).
 */

export type SavedPlaceKind = 'home' | 'work' | 'favorite';

export interface SavedPlace {
  id: string;
  userId: string;
  kind: SavedPlaceKind;
  label: string;
  placeText: string;
  createdAt: string;
  updatedAt: string;
}

export interface SavedPlaceInput {
  kind: SavedPlaceKind;
  label: string;
  placeText: string;
}

export interface SavedPlaceUpdateInput {
  label?: string;
  placeText?: string;
}

export interface SavedAddressesMap {
  home?: string | null;
  work?: string | null;
}
