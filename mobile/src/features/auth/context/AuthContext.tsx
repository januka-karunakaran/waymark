import React, {
  createContext,
  useCallback,
  useEffect,
  useRef,
  useState,
  ReactNode
} from 'react';
import {
  AuthError,
  AuthResult,
  AuthSession,
  AuthStatus,
  AuthUser,
  ServiceReadiness,
  SignInCredentials,
  SignUpDetails
} from '../types';
import { AuthService } from '../services';
import { createAuthService } from '../providers';
import { AuthSessionStorage, authSessionStorage } from '../storage';
import { logger } from '../../../utils/logger';

export interface AuthContextValue {
  /** High-level authentication lifecycle status */
  status: AuthStatus;
  /** Active authenticated user profile, or null */
  user: AuthUser | null;
  /** Active provider-issued session container, or null */
  session: AuthSession | null;
  /** Computed helper: true strictly when authenticated with active session */
  isAuthenticated: boolean;
  /** Computed helper: true while startup session hydration is in progress */
  isInitializing: boolean;
  /** Current domain error, or null */
  error: AuthError | null;
  /** Operational readiness of configured identity provider */
  serviceReadiness: ServiceReadiness;

  /** Triggers startup session hydration / revalidation */
  initialize: () => Promise<void>;
  /** Attempts credential sign-in with the configured identity provider */
  signIn: (credentials: SignInCredentials) => Promise<AuthResult>;
  /** Registers a new account with the configured identity provider */
  signUp: (details: SignUpDetails) => Promise<AuthResult>;
  /** Revokes active session, clears storage, and transitions to guest */
  signOut: () => Promise<void>;
  /** Requests password recovery for the given email address */
  resetPassword: (email: string) => Promise<AuthResult>;
  /** Resets active error state */
  clearError: () => void;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

export interface AuthProviderProps {
  children: ReactNode;
  /** Injected authentication service adapter (defaults to createAuthService()) */
  authService?: AuthService;
  /** Injected secure session storage adapter (defaults to authSessionStorage) */
  storage?: AuthSessionStorage;
  /** Whether to execute session hydration on mount (defaults to true) */
  autoInitialize?: boolean;
}

/**
 * AuthProvider
 *
 * Primary application authentication boundary managing the global session lifecycle,
 * provider delegation, secure storage synchronization, and race-condition safety.
 *
 * Architectural Reconciliation:
 * - The identity provider (AuthService) serves as the primary authority of truth.
 * - Subscribes to provider state events (onAuthStateChange) for background token refreshes,
 *   remote revocations, and user updates without duplicate listeners.
 * - Stale local storage is never permitted to resurrect a revoked remote session.
 * - Public transit discovery remains 100% accessible in unauthenticated / guest state.
 */
export const AuthProvider: React.FC<AuthProviderProps> = ({
  children,
  authService = createAuthService(),
  storage = authSessionStorage,
  autoInitialize = true
}) => {
  const [status, setStatus] = useState<AuthStatus>('initializing');
  const [user, setUser] = useState<AuthUser | null>(null);
  const [session, setSession] = useState<AuthSession | null>(null);
  const [error, setError] = useState<AuthError | null>(null);

  const isMountedRef = useRef<boolean>(true);
  const authOperationSeqRef = useRef<number>(0);

  const serviceReadiness = authService.getServiceReadiness();

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const initialize = useCallback(async () => {
    const seq = ++authOperationSeqRef.current;
    if (isMountedRef.current) {
      setStatus('initializing');
      setError(null);
    }

    try {
      // 1. If service is not configured, resolve immediately to guest
      if (authService.getServiceReadiness() === 'not_configured') {
        if (isMountedRef.current && seq === authOperationSeqRef.current) {
          setSession(null);
          setUser(null);
          setStatus('guest');
        }
        return;
      }

      // 2. Read candidate session from secure storage
      let candidateSession: AuthSession | null = null;
      try {
        candidateSession = await storage.getSession();
      } catch (err) {
        logger.warn('AuthProvider: Storage retrieval failed on initialization', err);
      }

      // 3. Confirm session validity with the trusted identity provider (single authority of truth)
      let providerSession: AuthSession | null = null;
      let providerError: unknown = null;
      try {
        providerSession = await authService.getCurrentSession();
      } catch (err) {
        providerError = err;
        logger.warn('AuthProvider: Provider validation failed on initialization', err);
      }

      if (!isMountedRef.current || seq !== authOperationSeqRef.current) {
        return;
      }

      // 4. Handle offline / network unavailability during startup:
      // Zero-deception policy: never fabricate provider verification when offline.
      if (providerError && !providerSession) {
        setSession(null);
        setUser(null);
        setStatus('guest');
        return;
      }

      // 5. If provider has no session (or candidate session was not found and provider has none):
      if (!providerSession) {
        // If storage had a stale candidate record, purge it to prevent resurrection
        if (candidateSession) {
          await storage.clearSession();
        }
        setSession(null);
        setUser(null);
        setStatus('guest');
        return;
      }

      // 6. Handle expired session token
      if (providerSession.expiresAt <= Date.now()) {
        if (authService.refreshSession) {
          try {
            const refreshResult = await authService.refreshSession();
            if (refreshResult.success && refreshResult.session) {
              await storage.saveSession(refreshResult.session);
              setSession(refreshResult.session);
              setUser(refreshResult.session.user);
              setStatus('authenticated');
              return;
            }
          } catch {
            // Refresh failed
          }
        }

        // Expired token could not be refreshed; purge storage and transition to guest
        await storage.clearSession();
        setSession(null);
        setUser(null);
        setStatus('guest');
        return;
      }

      // 7. Provider confirmed a valid, unexpired session:
      try {
        await storage.saveSession(providerSession);
      } catch (storageErr) {
        logger.warn('AuthProvider: Failed to synchronize session to storage', storageErr);
      }

      setSession(providerSession);
      setUser(providerSession.user);
      setStatus('authenticated');
    } catch (err) {
      logger.error('AuthProvider: Unexpected initialization failure', err);
      if (isMountedRef.current && seq === authOperationSeqRef.current) {
        setSession(null);
        setUser(null);
        setStatus('guest');
      }
    }
  }, [authService, storage]);

  // Lifecycle & Provider Event Synchronization
  useEffect(() => {
    isMountedRef.current = true;
    if (autoInitialize) {
      initialize();
    }

    // Subscribe to provider state changes (e.g. background token refresh, remote sign-out)
    let unsubscribe: (() => void) | undefined;
    if (authService.onAuthStateChange) {
      unsubscribe = authService.onAuthStateChange(async (updatedSession, event) => {
        if (!isMountedRef.current) return;

        if (event === 'SIGNED_OUT' || !updatedSession) {
          setSession(null);
          setUser(null);
          setStatus('guest');
          try {
            await storage.clearSession();
          } catch {
            // Ignore
          }
        } else if (
          event === 'TOKEN_REFRESHED' ||
          event === 'SIGNED_IN' ||
          event === 'USER_UPDATED' ||
          event === 'PASSWORD_RECOVERY'
        ) {
          setSession(updatedSession);
          setUser(updatedSession.user);
          setStatus('authenticated');
          setError(null);
          try {
            await storage.saveSession(updatedSession);
          } catch {
            // Ignore
          }
        }
      });
    }

    return () => {
      isMountedRef.current = false;
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [autoInitialize, authService, initialize, storage]);

  const signIn = useCallback(
    async (credentials: SignInCredentials): Promise<AuthResult> => {
      if (!credentials || !credentials.email?.trim() || !credentials.password) {
        const validationError = AuthError.invalidCredentials('Email and password must not be empty.');
        if (isMountedRef.current) {
          setError(validationError);
        }
        return { success: false, error: validationError };
      }

      if (status === 'authenticating') {
        const rateLimitError = AuthError.rateLimited('Authentication request already in progress.');
        return { success: false, error: rateLimitError };
      }

      if (authService.getServiceReadiness() === 'not_configured') {
        const notConfiguredError = AuthError.notConfigured();
        if (isMountedRef.current) {
          setError(notConfiguredError);
          setStatus('guest');
        }
        return { success: false, error: notConfiguredError };
      }

      const seq = ++authOperationSeqRef.current;
      if (isMountedRef.current) {
        setStatus('authenticating');
        setError(null);
      }

      try {
        const result = await authService.signIn(credentials);

        if (!isMountedRef.current || seq !== authOperationSeqRef.current) {
          return result;
        }

        if (result.success && result.session) {
          try {
            await storage.saveSession(result.session);
          } catch (storageErr) {
            logger.error('AuthProvider: Failed to persist session after login', storageErr);
          }

          setSession(result.session);
          setUser(result.session.user);
          setStatus('authenticated');
          setError(null);
          return result;
        } else {
          const authErr = result.error ?? AuthError.invalidCredentials();
          setStatus('error');
          setError(authErr);
          return { success: false, error: authErr };
        }
      } catch (err) {
        if (!isMountedRef.current || seq !== authOperationSeqRef.current) {
          return { success: false, error: AuthError.unknown() };
        }
        const authErr = err instanceof AuthError ? err : AuthError.unknown();
        setStatus('error');
        setError(authErr);
        return { success: false, error: authErr };
      }
    },
    [authService, status, storage]
  );

  const signUp = useCallback(
    async (details: SignUpDetails): Promise<AuthResult> => {
      if (!details || !details.email?.trim() || !details.password) {
        const validationError = AuthError.invalidCredentials('Email and password must not be empty.');
        if (isMountedRef.current) {
          setError(validationError);
        }
        return { success: false, error: validationError };
      }

      if (authService.getServiceReadiness() === 'not_configured') {
        const notConfiguredError = AuthError.notConfigured();
        if (isMountedRef.current) {
          setError(notConfiguredError);
        }
        return { success: false, error: notConfiguredError };
      }

      const seq = ++authOperationSeqRef.current;
      if (isMountedRef.current) {
        setStatus('authenticating');
        setError(null);
      }

      try {
        const result = await authService.signUp(details);

        if (!isMountedRef.current || seq !== authOperationSeqRef.current) {
          return result;
        }

        if (result.success) {
          if (result.session) {
            try {
              await storage.saveSession(result.session);
            } catch (storageErr) {
              logger.error('AuthProvider: Failed to persist session after registration', storageErr);
            }
            setSession(result.session);
            setUser(result.session.user);
            setStatus('authenticated');
          } else {
            // Requires email verification
            setSession(null);
            setUser(result.user ?? null);
            setStatus('guest');
          }
          setError(null);
          return result;
        } else {
          const authErr = result.error ?? AuthError.unknown();
          setStatus('error');
          setError(authErr);
          return { success: false, error: authErr };
        }
      } catch (err) {
        if (!isMountedRef.current || seq !== authOperationSeqRef.current) {
          return { success: false, error: AuthError.unknown() };
        }
        const authErr = err instanceof AuthError ? err : AuthError.unknown();
        setStatus('error');
        setError(authErr);
        return { success: false, error: authErr };
      }
    },
    [authService, storage]
  );

  const signOut = useCallback(async (): Promise<void> => {
    // Invalidate in-flight auth operations
    ++authOperationSeqRef.current;

    // Immediately clear in-memory authenticated state
    if (isMountedRef.current) {
      setUser(null);
      setSession(null);
      setStatus('guest');
      setError(null);
    }

    // Clear secure local storage
    try {
      await storage.clearSession();
    } catch (storageErr) {
      logger.error('AuthProvider: Failed to clear session from storage during sign-out', storageErr);
    }

    // Attempt remote session revocation
    try {
      await authService.signOut();
    } catch (providerErr) {
      logger.warn('AuthProvider: Remote sign-out failed or timed out', providerErr);
    }
  }, [authService, storage]);

  const resetPassword = useCallback(
    async (email: string): Promise<AuthResult> => {
      const trimmedEmail = email?.trim();
      if (!trimmedEmail) {
        const validationError = AuthError.invalidCredentials('Email address must not be empty.');
        if (isMountedRef.current) {
          setError(validationError);
        }
        return { success: false, error: validationError };
      }

      if (authService.getServiceReadiness() === 'not_configured') {
        const notConfiguredError = AuthError.notConfigured(
          'Account recovery services are currently unconfigured.'
        );
        if (isMountedRef.current) {
          setError(notConfiguredError);
        }
        return { success: false, error: notConfiguredError };
      }

      if (authService.resetPassword) {
        try {
          return await authService.resetPassword(trimmedEmail);
        } catch (err) {
          const authErr = err instanceof AuthError ? err : AuthError.unknown();
          return { success: false, error: authErr };
        }
      }

      // Default accepted outcome for ready mock adapters lacking explicit resetPassword implementation
      return { success: true };
    },
    [authService]
  );

  const value: AuthContextValue = {
    status,
    user,
    session,
    isAuthenticated: status === 'authenticated' && session !== null,
    isInitializing: status === 'initializing',
    error,
    serviceReadiness,
    initialize,
    signIn,
    signUp,
    signOut,
    resetPassword,
    clearError
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
