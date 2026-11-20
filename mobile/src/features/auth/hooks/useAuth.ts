import { useContext } from 'react';
import { AuthContext, AuthContextValue } from '../context/AuthContext';

/**
 * useAuth
 *
 * Hook providing access to the Waymark global authentication state and lifecycle actions.
 * Throws a descriptive error if consumed outside an AuthProvider boundary.
 */
export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider.');
  }
  return context;
}
