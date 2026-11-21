/**
 * Waymark Mobile — Feature 04.4: User Profile, Saved Places & Traveler Preferences
 * Domain types for traveler preferences (transit modes, distance unit).
 */

export type SupportedTransitMode =
  | 'bus'
  | 'train'
  | 'metro'
  | 'tram'
  | 'ferry'
  | 'walking'
  | 'cycling';

export type DistanceUnit = 'km' | 'mi';

export interface TravelerPreferences {
  userId: string;
  preferredModes: SupportedTransitMode[];
  distanceUnit: DistanceUnit;
  createdAt: string;
  updatedAt: string;
}

export interface PreferencesUpdateInput {
  preferredModes?: SupportedTransitMode[];
  distanceUnit?: DistanceUnit;
}
