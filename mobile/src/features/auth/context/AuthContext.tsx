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
  /** Resets active error state */
  clearError: () => void;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

export interface AuthProviderProps {
  children: ReactNode;
  /** Injected authentication service adapter (defaults to unavailableAuthService) */
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

      if (!candidateSession) {
        if (isMountedRef.current && seq === authOperationSeqRef.current) {
          setSession(null);
          setUser(null);
          setStatus('guest');
        }
        return;
      }

      // 3. Confirm session validity with the trusted identity provider
      let providerSession: AuthSession | null = null;
      try {
        providerSession = await authService.getCurrentSession();
      } catch (err) {
        logger.warn('AuthProvider: Provider validation failed on initialization', err);
      }

      if (!providerSession) {
        // Provider rejected stored session (e.g. revoked remotely); purge storage
        await storage.clearSession();
        if (isMountedRef.current && seq === authOperationSeqRef.current) {
          setSession(null);
          setUser(null);
          setStatus('guest');
        }
        return;
      }

      // 4. Provider confirmed valid session
      if (isMountedRef.current && seq === authOperationSeqRef.current) {
        setSession(providerSession);
        setUser(providerSession.user);
        setStatus('authenticated');
      }
    } catch (err) {
      logger.error('AuthProvider: Unexpected initialization failure', err);
      if (isMountedRef.current && seq === authOperationSeqRef.current) {
        setSession(null);
        setUser(null);
        setStatus('guest');
      }
    }
  }, [authService, storage]);

  useEffect(() => {
    isMountedRef.current = true;
    if (autoInitialize) {
      initialize();
    }
    return () => {
      isMountedRef.current = false;
    };
  }, [autoInitialize, initialize]);

  const signIn = useCallback(
    async (credentials: SignInCredentials): Promise<AuthResult> => {
      // Validation guards
      if (!credentials || !credentials.email?.trim() || !credentials.password) {
        const validationError = AuthError.invalidCredentials('Email and password must not be empty.');
        if (isMountedRef.current) {
          setError(validationError);
        }
        return { success: false, error: validationError };
      }

      // Prevent duplicate concurrent requests
      if (status === 'authenticating') {
        const rateLimitError = AuthError.rateLimited('Authentication request already in progress.');
        return { success: false, error: rateLimitError };
      }

      // Explicit NOT_CONFIGURED check
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

        // Sequence check: discard late result if another operation (e.g. signOut) supervened
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
            // Requires email verification or pending approval
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
    // Increment sequence number to invalidate any in-flight sign-in or sign-up requests
    ++authOperationSeqRef.current;

    // Immediately clear in-memory authenticated state
    if (isMountedRef.current) {
      setUser(null);
      setSession(null);
      setStatus('guest');
      setError(null);
    }

    // Clear local storage
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
    clearError
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
