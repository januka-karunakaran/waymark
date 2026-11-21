/**
 * Waymark Mobile — Feature 04.4: User Profile, Saved Places & Traveler Preferences
 * Domain types for traveler profiles.
 */

export interface UserProfile {
  id: string;
  displayName: string | null;
  avatarUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ProfileUpdateInput {
  displayName?: string | null;
  avatarUrl?: string | null;
}

export type ProfileErrorCode =
  | 'UNAUTHENTICATED'
  | 'VALIDATION_ERROR'
  | 'NOT_FOUND'
  | 'DATABASE_ERROR'
  | 'NETWORK_ERROR'
  | 'CONFLICT'
  | 'UNKNOWN_ERROR';

export interface ProfileError {
  code: ProfileErrorCode;
  message: string;
  details?: unknown;
}

export type ProfileResult<T> =
  | { success: true; data: T }
  | { success: false; error: ProfileError };
