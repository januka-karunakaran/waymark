/**
 * Waymark Mobile — Feature 04.4: User Profile, Saved Places & Traveler Preferences
 * ProfileContext: State provider for the authenticated traveler profile.
 * Synchronizes with AuthProvider, loads profile data on login, and safely clears state on logout.
 */

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useMemo,
  ReactNode
} from 'react';
import { useAuth } from '../../auth';
import {
  UserProfile,
  ProfileUpdateInput,
  ProfileError,
  ProfileResult
} from '../types';
import { ProfileRepository } from '../services/ProfileRepository';
import { SupabaseProfileRepository } from '../services/SupabaseProfileRepository';
import { logger } from '../../../utils/logger';

export interface ProfileContextValue {
  profile: UserProfile | null;
  isLoading: boolean;
  isSaving: boolean;
  error: ProfileError | null;
  refreshProfile: () => Promise<void>;
  updateProfile: (input: ProfileUpdateInput) => Promise<ProfileResult<UserProfile>>;
  clearError: () => void;
}

const ProfileContext = createContext<ProfileContextValue | null>(null);

export interface ProfileProviderProps {
  children: ReactNode;
  repository?: ProfileRepository;
}

export const ProfileProvider: React.FC<ProfileProviderProps> = ({
  children,
  repository
}) => {
  const { user, isAuthenticated } = useAuth();
  const profileRepo = useMemo(() => repository ?? new SupabaseProfileRepository(), [repository]);

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [error, setError] = useState<ProfileError | null>(null);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const loadProfile = useCallback(
    async (userId: string) => {
      setIsLoading(true);
      setError(null);

      try {
        const result = await profileRepo.getProfile(userId);
        if (result.success) {
          if (result.data) {
            setProfile(result.data);
          } else {
            // Lazy initialization: if row does not exist yet, initialize a local profile
            // using auth user metadata if available
            const initialProfile: UserProfile = {
              id: userId,
              displayName: user?.displayName || null,
              avatarUrl: null,
              createdAt: user?.createdAt || new Date().toISOString(),
              updatedAt: new Date().toISOString()
            };
            setProfile(initialProfile);
          }
        } else {
          logger.warn('Failed to load profile from database', result.error);
          setError(result.error);
        }
      } catch (err: unknown) {
        logger.error('Unexpected exception while loading profile', err);
        setError({
          code: 'UNKNOWN_ERROR',
          message: err instanceof Error ? err.message : 'Failed to load profile.'
        });
      } finally {
        setIsLoading(false);
      }
    },
    [profileRepo, user?.displayName, user?.createdAt]
  );

  // Synchronize with auth state changes
  useEffect(() => {
    if (isAuthenticated && user?.id) {
      loadProfile(user.id);
    } else {
      // User signed out or guest: purge profile state
      setProfile(null);
      setError(null);
      setIsLoading(false);
      setIsSaving(false);
    }
  }, [isAuthenticated, user?.id, loadProfile]);

  const refreshProfile = useCallback(async () => {
    if (user?.id) {
      await loadProfile(user.id);
    }
  }, [user?.id, loadProfile]);

  const updateProfile = useCallback(
    async (input: ProfileUpdateInput): Promise<ProfileResult<UserProfile>> => {
      if (!user?.id) {
        const unauthError: ProfileError = {
          code: 'UNAUTHENTICATED',
          message: 'Cannot update profile without an active authenticated session.'
        };
        setError(unauthError);
        return { success: false, error: unauthError };
      }

      setIsSaving(true);
      setError(null);

      try {
        const result = await profileRepo.upsertProfile(user.id, input);
        if (result.success) {
          setProfile(result.data);
          return result;
        } else {
          setError(result.error);
          return result;
        }
      } catch (err: unknown) {
        const errObj: ProfileError = {
          code: 'UNKNOWN_ERROR',
          message: err instanceof Error ? err.message : 'Failed to update profile.'
        };
        setError(errObj);
        return { success: false, error: errObj };
      } finally {
        setIsSaving(false);
      }
    },
    [user?.id, profileRepo]
  );

  const value = useMemo<ProfileContextValue>(
    () => ({
      profile,
      isLoading,
      isSaving,
      error,
      refreshProfile,
      updateProfile,
      clearError
    }),
    [profile, isLoading, isSaving, error, refreshProfile, updateProfile, clearError]
  );

  return <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>;
};

export function useProfile(): ProfileContextValue {
  const context = useContext(ProfileContext);
  if (!context) {
    return {
      profile: null,
      isLoading: false,
      isSaving: false,
      error: null,
      refreshProfile: async () => {},
      updateProfile: async () => ({
        success: false,
        error: {
          code: 'UNAUTHENTICATED',
          message: 'useProfile must be used within a ProfileProvider'
        }
      }),
      clearError: () => {}
    };
  }
  return context;
}
