/**
 * Waymark Mobile — Feature 04.4: User Profile, Saved Places & Traveler Preferences
 * SupabaseProfileRepository: Production Supabase data access layer for user profile data.
 * Adheres to strict RLS policies, input validation, and decoupled error mapping.
 */

import { SupabaseClient } from '@supabase/supabase-js';
import { getSupabaseClient } from '../../auth/providers/supabaseClient';
import {
  ProfileRepository
} from './ProfileRepository';
import {
  UserProfile,
  ProfileUpdateInput,
  ProfileResult,
  ProfileError,
  SavedPlace,
  SavedPlaceInput,
  TravelerPreferences,
  PreferencesUpdateInput,
  SupportedTransitMode,
  DistanceUnit
} from '../types';
import {
  validateDisplayName,
  validateAvatarUrl,
  validateSavedPlaceInput,
  validatePreferencesInput
} from '../validation';
import { logger } from '../../../utils/logger';

interface ProfileRow {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

interface SavedPlaceRow {
  id: string;
  user_id: string;
  kind: 'home' | 'work' | 'favorite';
  label: string;
  place_text: string;
  created_at: string;
  updated_at: string;
}

interface PreferencesRow {
  user_id: string;
  preferred_modes: string[];
  distance_unit: 'km' | 'mi';
  created_at: string;
  updated_at: string;
}

export class SupabaseProfileRepository implements ProfileRepository {
  private client: SupabaseClient | null;

  constructor(clientOverride?: SupabaseClient | null) {
    this.client = clientOverride !== undefined ? clientOverride : getSupabaseClient();
  }

  /**
   * Helper to ensure Supabase client is available.
   */
  private getClient(): { client: SupabaseClient } | { error: ProfileError } {
    if (!this.client) {
      return {
        error: {
          code: 'UNAUTHENTICATED',
          message: 'Supabase client is not configured or unavailable.'
        }
      };
    }
    return { client: this.client };
  }

  /**
   * Maps PostgREST / Supabase errors to domain ProfileError.
   */
  private mapPostgrestError(error: { code?: string; message: string; details?: unknown }): ProfileError {
    logger.error('Supabase profile operation failed', error);

    if (error.code === 'PGRST116') {
      // Not found code in single()
      return { code: 'NOT_FOUND', message: 'Requested profile record was not found.', details: error };
    }
    if (error.code === '23505') {
      // Unique violation
      return { code: 'CONFLICT', message: 'A record with these unique constraints already exists.', details: error };
    }
    if (error.code === '42501' || error.message.toLowerCase().includes('permission denied')) {
      return { code: 'UNAUTHENTICATED', message: 'Access denied by Row Level Security policy.', details: error };
    }
    return {
      code: 'DATABASE_ERROR',
      message: error.message || 'Database operation failed.',
      details: error
    };
  }

  /**
   * Fetches the user profile from public.profiles.
   */
  async getProfile(userId: string): Promise<ProfileResult<UserProfile | null>> {
    const clientCheck = this.getClient();
    if ('error' in clientCheck) {
      return { success: false, error: clientCheck.error };
    }

    try {
      const { data, error } = await clientCheck.client
        .from('profiles')
        .select('id, display_name, avatar_url, created_at, updated_at')
        .eq('id', userId)
        .maybeSingle();

      if (error) {
        return { success: false, error: this.mapPostgrestError(error) };
      }

      if (!data) {
        return { success: true, data: null };
      }

      const row = data as ProfileRow;
      return {
        success: true,
        data: {
          id: row.id,
          displayName: row.display_name,
          avatarUrl: row.avatar_url,
          createdAt: row.created_at,
          updatedAt: row.updated_at
        }
      };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown network failure';
      return {
        success: false,
        error: { code: 'NETWORK_ERROR', message, details: err }
      };
    }
  }

  /**
   * Creates or updates the user profile with bounds validation.
   */
  async upsertProfile(userId: string, input: ProfileUpdateInput): Promise<ProfileResult<UserProfile>> {
    const clientCheck = this.getClient();
    if ('error' in clientCheck) {
      return { success: false, error: clientCheck.error };
    }

    // Domain validation
    if (input.displayName !== undefined) {
      const nameValidation = validateDisplayName(input.displayName);
      if (!nameValidation.isValid) {
        return {
          success: false,
          error: { code: 'VALIDATION_ERROR', message: nameValidation.error || 'Invalid display name.' }
        };
      }
    }

    if (input.avatarUrl !== undefined) {
      const avatarValidation = validateAvatarUrl(input.avatarUrl);
      if (!avatarValidation.isValid) {
        return {
          success: false,
          error: { code: 'VALIDATION_ERROR', message: avatarValidation.error || 'Invalid avatar URL.' }
        };
      }
    }

    const payload: Record<string, unknown> = {
      id: userId
    };

    if (input.displayName !== undefined) {
      payload.display_name = validateDisplayName(input.displayName).sanitized;
    }
    if (input.avatarUrl !== undefined) {
      payload.avatar_url = validateAvatarUrl(input.avatarUrl).sanitized;
    }

    try {
      const { data, error } = await clientCheck.client
        .from('profiles')
        .upsert(payload)
        .select('id, display_name, avatar_url, created_at, updated_at')
        .single();

      if (error) {
        return { success: false, error: this.mapPostgrestError(error) };
      }

      const row = data as ProfileRow;
      return {
        success: true,
        data: {
          id: row.id,
          displayName: row.display_name,
          avatarUrl: row.avatar_url,
          createdAt: row.created_at,
          updatedAt: row.updated_at
        }
      };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown network failure';
      return {
        success: false,
        error: { code: 'NETWORK_ERROR', message, details: err }
      };
    }
  }

  /**
   * Retrieves all saved places for the authenticated user.
   */
  async getSavedPlaces(userId: string): Promise<ProfileResult<SavedPlace[]>> {
    const clientCheck = this.getClient();
    if ('error' in clientCheck) {
      return { success: false, error: clientCheck.error };
    }

    try {
      const { data, error } = await clientCheck.client
        .from('saved_places')
        .select('id, user_id, kind, label, place_text, created_at, updated_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: true });

      if (error) {
        return { success: false, error: this.mapPostgrestError(error) };
      }

      const rows = (data || []) as SavedPlaceRow[];
      return {
        success: true,
        data: rows.map((r) => ({
          id: r.id,
          userId: r.user_id,
          kind: r.kind,
          label: r.label,
          placeText: r.place_text,
          createdAt: r.created_at,
          updatedAt: r.updated_at
        }))
      };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown network failure';
      return {
        success: false,
        error: { code: 'NETWORK_ERROR', message, details: err }
      };
    }
  }

  /**
   * Upserts or creates a saved place (Home, Work, or Favorite).
   */
  async upsertSavedPlace(userId: string, input: SavedPlaceInput): Promise<ProfileResult<SavedPlace>> {
    const clientCheck = this.getClient();
    if ('error' in clientCheck) {
      return { success: false, error: clientCheck.error };
    }

    const validation = validateSavedPlaceInput(input);
    if (!validation.isValid || !validation.sanitized) {
      return {
        success: false,
        error: { code: 'VALIDATION_ERROR', message: validation.error || 'Invalid saved place input.' }
      };
    }

    const sanitized = validation.sanitized;
    const payload = {
      user_id: userId,
      kind: sanitized.kind,
      label: sanitized.label,
      place_text: sanitized.placeText
    };

    try {
      // If Home or Work, check if existing record exists for this user to update it
      if (sanitized.kind === 'home' || sanitized.kind === 'work') {
        const { data: existing } = await clientCheck.client
          .from('saved_places')
          .select('id')
          .eq('user_id', userId)
          .eq('kind', sanitized.kind)
          .maybeSingle();

        if (existing) {
          const { data, error } = await clientCheck.client
            .from('saved_places')
            .update({
              label: sanitized.label,
              place_text: sanitized.placeText,
              updated_at: new Date().toISOString()
            })
            .eq('id', (existing as { id: string }).id)
            .select('id, user_id, kind, label, place_text, created_at, updated_at')
            .single();

          if (error) {
            return { success: false, error: this.mapPostgrestError(error) };
          }

          const row = data as SavedPlaceRow;
          return {
            success: true,
            data: {
              id: row.id,
              userId: row.user_id,
              kind: row.kind,
              label: row.label,
              placeText: row.place_text,
              createdAt: row.created_at,
              updatedAt: row.updated_at
            }
          };
        }
      }

      // Insert new place (or first Home/Work)
      const { data, error } = await clientCheck.client
        .from('saved_places')
        .insert(payload)
        .select('id, user_id, kind, label, place_text, created_at, updated_at')
        .single();

      if (error) {
        return { success: false, error: this.mapPostgrestError(error) };
      }

      const row = data as SavedPlaceRow;
      return {
        success: true,
        data: {
          id: row.id,
          userId: row.user_id,
          kind: row.kind,
          label: row.label,
          placeText: row.place_text,
          createdAt: row.created_at,
          updatedAt: row.updated_at
        }
      };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown network failure';
      return {
        success: false,
        error: { code: 'NETWORK_ERROR', message, details: err }
      };
    }
  }

  /**
   * Deletes a saved place by ID.
   */
  async deleteSavedPlace(userId: string, placeId: string): Promise<ProfileResult<void>> {
    const clientCheck = this.getClient();
    if ('error' in clientCheck) {
      return { success: false, error: clientCheck.error };
    }

    try {
      const { error } = await clientCheck.client
        .from('saved_places')
        .delete()
        .eq('id', placeId)
        .eq('user_id', userId);

      if (error) {
        return { success: false, error: this.mapPostgrestError(error) };
      }

      return { success: true, data: undefined };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown network failure';
      return {
        success: false,
        error: { code: 'NETWORK_ERROR', message, details: err }
      };
    }
  }

  /**
   * Retrieves traveler preferences for the user, returning sensible defaults if not yet created.
   */
  async getPreferences(userId: string): Promise<ProfileResult<TravelerPreferences>> {
    const clientCheck = this.getClient();
    if ('error' in clientCheck) {
      return { success: false, error: clientCheck.error };
    }

    try {
      const { data, error } = await clientCheck.client
        .from('traveler_preferences')
        .select('user_id, preferred_modes, distance_unit, created_at, updated_at')
        .eq('user_id', userId)
        .maybeSingle();

      if (error) {
        return { success: false, error: this.mapPostgrestError(error) };
      }

      if (!data) {
        // Return default preferences
        return {
          success: true,
          data: {
            userId,
            preferredModes: [],
            distanceUnit: 'km',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }
        };
      }

      const row = data as PreferencesRow;
      return {
        success: true,
        data: {
          userId: row.user_id,
          preferredModes: (row.preferred_modes || []) as SupportedTransitMode[],
          distanceUnit: row.distance_unit as DistanceUnit,
          createdAt: row.created_at,
          updatedAt: row.updated_at
        }
      };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown network failure';
      return {
        success: false,
        error: { code: 'NETWORK_ERROR', message, details: err }
      };
    }
  }

  /**
   * Upserts traveler preferences with bounds validation.
   */
  async upsertPreferences(
    userId: string,
    input: PreferencesUpdateInput
  ): Promise<ProfileResult<TravelerPreferences>> {
    const clientCheck = this.getClient();
    if ('error' in clientCheck) {
      return { success: false, error: clientCheck.error };
    }

    const validation = validatePreferencesInput(input);
    if (!validation.isValid || !validation.sanitized) {
      return {
        success: false,
        error: { code: 'VALIDATION_ERROR', message: validation.error || 'Invalid preferences input.' }
      };
    }

    const sanitized = validation.sanitized;
    const payload: Record<string, unknown> = {
      user_id: userId
    };
    if (sanitized.preferredModes !== undefined) {
      payload.preferred_modes = sanitized.preferredModes;
    }
    if (sanitized.distanceUnit !== undefined) {
      payload.distance_unit = sanitized.distanceUnit;
    }

    try {
      const { data, error } = await clientCheck.client
        .from('traveler_preferences')
        .upsert(payload)
        .select('user_id, preferred_modes, distance_unit, created_at, updated_at')
        .single();

      if (error) {
        return { success: false, error: this.mapPostgrestError(error) };
      }

      const row = data as PreferencesRow;
      return {
        success: true,
        data: {
          userId: row.user_id,
          preferredModes: (row.preferred_modes || []) as SupportedTransitMode[],
          distanceUnit: row.distance_unit as DistanceUnit,
          createdAt: row.created_at,
          updatedAt: row.updated_at
        }
      };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown network failure';
      return {
        success: false,
        error: { code: 'NETWORK_ERROR', message, details: err }
      };
    }
  }
}
