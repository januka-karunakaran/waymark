/**
 * Waymark Mobile — Feature 04.4: User Profile, Saved Places & Traveler Preferences
 * Profile repository interface defining data access boundaries for Supabase.
 */

import {
  UserProfile,
  ProfileUpdateInput,
  ProfileResult,
  SavedPlace,
  SavedPlaceInput,
  TravelerPreferences,
  PreferencesUpdateInput
} from '../types';

export interface ProfileRepository {
  /**
   * Fetches the user profile from the database.
   * Returns null if no profile row exists yet.
   */
  getProfile(userId: string): Promise<ProfileResult<UserProfile | null>>;

  /**
   * Creates or updates the user profile.
   */
  upsertProfile(userId: string, input: ProfileUpdateInput): Promise<ProfileResult<UserProfile>>;

  /**
   * Retrieves all saved places for the authenticated user.
   */
  getSavedPlaces(userId: string): Promise<ProfileResult<SavedPlace[]>>;

  /**
   * Upserts or creates a saved place (Home, Work, or Favorite).
   */
  upsertSavedPlace(userId: string, input: SavedPlaceInput): Promise<ProfileResult<SavedPlace>>;

  /**
   * Deletes a saved place by ID.
   */
  deleteSavedPlace(userId: string, placeId: string): Promise<ProfileResult<void>>;

  /**
   * Retrieves traveler preferences for the authenticated user.
   */
  getPreferences(userId: string): Promise<ProfileResult<TravelerPreferences>>;

  /**
   * Updates traveler preferences (preferred modes, distance unit).
   */
  upsertPreferences(
    userId: string,
    input: PreferencesUpdateInput
  ): Promise<ProfileResult<TravelerPreferences>>;
}
