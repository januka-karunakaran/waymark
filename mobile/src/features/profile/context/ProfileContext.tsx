/**
 * Waymark Mobile — Feature 04.4: User Profile, Saved Places & Traveler Preferences
 * ProfileContext: State provider for the authenticated traveler profile, saved places, and preferences.
 * Synchronizes with AuthProvider, loads data on login, and safely clears state on logout.
 */

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useMemo,
  useRef,
  ReactNode
} from 'react';
import { useAuth } from '../../auth';
import {
  UserProfile,
  ProfileUpdateInput,
  ProfileError,
  ProfileResult,
  SavedPlace,
  SavedPlaceInput,
  SavedAddressesMap,
  TravelerPreferences,
  PreferencesUpdateInput
} from '../types';
import { ProfileRepository } from '../services/ProfileRepository';
import { SupabaseProfileRepository } from '../services/SupabaseProfileRepository';
import { logger } from '../../../utils/logger';

export interface ProfileContextValue {
  profile: UserProfile | null;
  savedPlaces: SavedPlace[];
  savedAddresses: SavedAddressesMap;
  preferences: TravelerPreferences | null;
  isLoading: boolean;
  isLoadingPlaces: boolean;
  isLoadingPreferences: boolean;
  isSaving: boolean;
  error: ProfileError | null;
  refreshProfile: () => Promise<void>;
  refreshSavedPlaces: () => Promise<void>;
  refreshPreferences: () => Promise<void>;
  updateProfile: (input: ProfileUpdateInput) => Promise<ProfileResult<UserProfile>>;
  addSavedPlace: (input: SavedPlaceInput) => Promise<ProfileResult<SavedPlace>>;
  deleteSavedPlace: (placeId: string) => Promise<ProfileResult<void>>;
  updatePreferences: (input: PreferencesUpdateInput) => Promise<ProfileResult<TravelerPreferences>>;
  clearError: () => void;
}

const ProfileContext = createContext<ProfileContextValue | null>(null);

export interface ProfileProviderProps {
  children: ReactNode;
  repository?: ProfileRepository;
  profileRepo?: ProfileRepository;
}

export const ProfileProvider: React.FC<ProfileProviderProps> = ({
  children,
  repository,
  profileRepo: profileRepoProp
}) => {
  const { user, isAuthenticated } = useAuth();
  const profileRepo = useMemo(
    () => repository ?? profileRepoProp ?? new SupabaseProfileRepository(),
    [repository, profileRepoProp]
  );

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [savedPlaces, setSavedPlaces] = useState<SavedPlace[]>([]);
  const [preferences, setPreferences] = useState<TravelerPreferences | null>(null);

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isLoadingPlaces, setIsLoadingPlaces] = useState<boolean>(false);
  const [isLoadingPreferences, setIsLoadingPreferences] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [error, setError] = useState<ProfileError | null>(null);

  const activeUserIdRef = useRef<string | null>(null);
  const profileSeqRef = useRef<number>(0);
  const placesSeqRef = useRef<number>(0);
  const preferencesSeqRef = useRef<number>(0);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const loadProfile = useCallback(
    async (userId: string) => {
      const seq = ++profileSeqRef.current;
      setIsLoading(true);
      try {
        const result = await profileRepo.getProfile(userId);
        if (seq !== profileSeqRef.current || activeUserIdRef.current !== userId) {
          return;
        }
        if (result.success) {
          if (result.data) {
            setProfile(result.data);
          } else {
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
        if (seq !== profileSeqRef.current || activeUserIdRef.current !== userId) {
          return;
        }
        logger.error('Unexpected exception while loading profile', err);
        setError({
          code: 'UNKNOWN_ERROR',
          message: err instanceof Error ? err.message : 'Failed to load profile.'
        });
      } finally {
        if (seq === profileSeqRef.current && activeUserIdRef.current === userId) {
          setIsLoading(false);
        }
      }
    },
    [profileRepo, user?.displayName, user?.createdAt]
  );

  const loadSavedPlaces = useCallback(
    async (userId: string) => {
      const seq = ++placesSeqRef.current;
      setIsLoadingPlaces(true);
      try {
        const result = await profileRepo.getSavedPlaces(userId);
        if (seq !== placesSeqRef.current || activeUserIdRef.current !== userId) {
          return;
        }
        if (result?.success) {
          setSavedPlaces(result.data);
        } else if (result?.error) {
          logger.warn('Failed to load saved places', result.error);
          setError(result.error);
        }
      } catch (err: unknown) {
        if (seq !== placesSeqRef.current || activeUserIdRef.current !== userId) {
          return;
        }
        logger.error('Unexpected exception while loading saved places', err);
      } finally {
        if (seq === placesSeqRef.current && activeUserIdRef.current === userId) {
          setIsLoadingPlaces(false);
        }
      }
    },
    [profileRepo]
  );

  const loadPreferences = useCallback(
    async (userId: string) => {
      const seq = ++preferencesSeqRef.current;
      setIsLoadingPreferences(true);
      try {
        const result = await profileRepo.getPreferences(userId);
        if (seq !== preferencesSeqRef.current || activeUserIdRef.current !== userId) {
          return;
        }
        if (result?.success) {
          setPreferences(result.data);
        } else if (result?.error) {
          logger.warn('Failed to load preferences', result.error);
        }
      } catch (err: unknown) {
        if (seq !== preferencesSeqRef.current || activeUserIdRef.current !== userId) {
          return;
        }
        logger.error('Unexpected exception while loading preferences', err);
      } finally {
        if (seq === preferencesSeqRef.current && activeUserIdRef.current === userId) {
          setIsLoadingPreferences(false);
        }
      }
    },
    [profileRepo]
  );

  // Synchronize with auth state changes
  useEffect(() => {
    if (isAuthenticated && user?.id) {
      activeUserIdRef.current = user.id;
      loadProfile(user.id);
      loadSavedPlaces(user.id);
      loadPreferences(user.id);
    } else {
      // User signed out or guest: cancel in-flight operations and purge all state
      ++profileSeqRef.current;
      ++placesSeqRef.current;
      ++preferencesSeqRef.current;
      activeUserIdRef.current = null;
      setProfile(null);
      setSavedPlaces([]);
      setPreferences(null);
      setError(null);
      setIsLoading(false);
      setIsLoadingPlaces(false);
      setIsLoadingPreferences(false);
      setIsSaving(false);
    }
  }, [isAuthenticated, user?.id, loadProfile, loadSavedPlaces, loadPreferences]);

  const refreshProfile = useCallback(async () => {
    if (user?.id) {
      await loadProfile(user.id);
    }
  }, [user?.id, loadProfile]);

  const refreshSavedPlaces = useCallback(async () => {
    if (user?.id) {
      await loadSavedPlaces(user.id);
    }
  }, [user?.id, loadSavedPlaces]);

  const refreshPreferences = useCallback(async () => {
    if (user?.id) {
      await loadPreferences(user.id);
    }
  }, [user?.id, loadPreferences]);

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

  const addSavedPlace = useCallback(
    async (input: SavedPlaceInput): Promise<ProfileResult<SavedPlace>> => {
      if (!user?.id) {
        const unauthError: ProfileError = {
          code: 'UNAUTHENTICATED',
          message: 'Cannot add saved place without an active authenticated session.'
        };
        setError(unauthError);
        return { success: false, error: unauthError };
      }

      setIsSaving(true);
      setError(null);

      try {
        const result = await profileRepo.upsertSavedPlace(user.id, input);
        if (result.success) {
          // If home or work, replace existing entry of same kind; otherwise append
          setSavedPlaces((prev) => {
            if (input.kind === 'home' || input.kind === 'work') {
              const filtered = prev.filter((p) => p.kind !== input.kind);
              return [...filtered, result.data];
            }
            return [...prev, result.data];
          });
          return result;
        } else {
          setError(result.error);
          return result;
        }
      } catch (err: unknown) {
        const errObj: ProfileError = {
          code: 'UNKNOWN_ERROR',
          message: err instanceof Error ? err.message : 'Failed to add saved place.'
        };
        setError(errObj);
        return { success: false, error: errObj };
      } finally {
        setIsSaving(false);
      }
    },
    [user?.id, profileRepo]
  );

  const deleteSavedPlace = useCallback(
    async (placeId: string): Promise<ProfileResult<void>> => {
      if (!user?.id) {
        const unauthError: ProfileError = {
          code: 'UNAUTHENTICATED',
          message: 'Cannot delete saved place without an active authenticated session.'
        };
        setError(unauthError);
        return { success: false, error: unauthError };
      }

      setIsSaving(true);
      setError(null);

      try {
        const result = await profileRepo.deleteSavedPlace(user.id, placeId);
        if (result.success) {
          setSavedPlaces((prev) => prev.filter((p) => p.id !== placeId));
          return result;
        } else {
          setError(result.error);
          return result;
        }
      } catch (err: unknown) {
        const errObj: ProfileError = {
          code: 'UNKNOWN_ERROR',
          message: err instanceof Error ? err.message : 'Failed to delete saved place.'
        };
        setError(errObj);
        return { success: false, error: errObj };
      } finally {
        setIsSaving(false);
      }
    },
    [user?.id, profileRepo]
  );

  const updatePreferences = useCallback(
    async (input: PreferencesUpdateInput): Promise<ProfileResult<TravelerPreferences>> => {
      if (!user?.id) {
        const unauthError: ProfileError = {
          code: 'UNAUTHENTICATED',
          message: 'Cannot update preferences without an active authenticated session.'
        };
        setError(unauthError);
        return { success: false, error: unauthError };
      }

      setIsSaving(true);
      setError(null);

      try {
        const result = await profileRepo.upsertPreferences(user.id, input);
        if (result.success) {
          setPreferences(result.data);
          return result;
        } else {
          setError(result.error);
          return result;
        }
      } catch (err: unknown) {
        const errObj: ProfileError = {
          code: 'UNKNOWN_ERROR',
          message: err instanceof Error ? err.message : 'Failed to update preferences.'
        };
        setError(errObj);
        return { success: false, error: errObj };
      } finally {
        setIsSaving(false);
      }
    },
    [user?.id, profileRepo]
  );

  // Derived saved addresses map for quickActionResolver
  const savedAddresses: SavedAddressesMap = useMemo(() => {
    const home = savedPlaces.find((p) => p.kind === 'home')?.placeText ?? null;
    const work = savedPlaces.find((p) => p.kind === 'work')?.placeText ?? null;
    return { home, work };
  }, [savedPlaces]);

  const value = useMemo<ProfileContextValue>(
    () => ({
      profile,
      savedPlaces,
      savedAddresses,
      preferences,
      isLoading,
      isLoadingPlaces,
      isLoadingPreferences,
      isSaving,
      error,
      refreshProfile,
      refreshSavedPlaces,
      refreshPreferences,
      updateProfile,
      addSavedPlace,
      deleteSavedPlace,
      updatePreferences,
      clearError
    }),
    [
      profile,
      savedPlaces,
      savedAddresses,
      preferences,
      isLoading,
      isLoadingPlaces,
      isLoadingPreferences,
      isSaving,
      error,
      refreshProfile,
      refreshSavedPlaces,
      refreshPreferences,
      updateProfile,
      addSavedPlace,
      deleteSavedPlace,
      updatePreferences,
      clearError
    ]
  );

  return <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>;
};

export function useProfile(): ProfileContextValue {
  const context = useContext(ProfileContext);
  if (!context) {
    return {
      profile: null,
      savedPlaces: [],
      savedAddresses: { home: null, work: null },
      preferences: null,
      isLoading: false,
      isLoadingPlaces: false,
      isLoadingPreferences: false,
      isSaving: false,
      error: null,
      refreshProfile: async () => {},
      refreshSavedPlaces: async () => {},
      refreshPreferences: async () => {},
      updateProfile: async () => ({
        success: false,
        error: {
          code: 'UNAUTHENTICATED',
          message: 'useProfile must be used within a ProfileProvider'
        }
      }),
      addSavedPlace: async () => ({
        success: false,
        error: {
          code: 'UNAUTHENTICATED',
          message: 'useProfile must be used within a ProfileProvider'
        }
      }),
      deleteSavedPlace: async () => ({
        success: false,
        error: {
          code: 'UNAUTHENTICATED',
          message: 'useProfile must be used within a ProfileProvider'
        }
      }),
      updatePreferences: async () => ({
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

export function useSavedPlaces() {
  const { savedPlaces, savedAddresses, isLoadingPlaces, addSavedPlace, deleteSavedPlace, refreshSavedPlaces } =
    useProfile();
  return {
    savedPlaces,
    savedAddresses,
    isLoadingPlaces,
    addSavedPlace,
    deleteSavedPlace,
    refreshSavedPlaces
  };
}

export function useSavedAddresses() {
  const { savedAddresses } = useProfile();
  return savedAddresses;
}

export function useTravelerPreferences() {
  const { preferences, isLoadingPreferences, updatePreferences, refreshPreferences } = useProfile();
  return {
    preferences,
    isLoadingPreferences,
    updatePreferences,
    refreshPreferences
  };
}
