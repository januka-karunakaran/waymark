import { Platform } from 'react-native';
import { AuthSessionStorage } from './AuthSessionStorage';
import { NativeAuthSessionStorage } from './NativeAuthSessionStorage';
import { WebAuthSessionStorage } from './WebAuthSessionStorage';

export * from './AuthSessionStorage';
export * from './NativeAuthSessionStorage';
export * from './WebAuthSessionStorage';

/**
 * Creates the appropriate platform-specific session storage instance.
 * - Native (iOS / Android): Hardware-backed Keychain / KeyStore via expo-secure-store.
 * - Web: In-memory transient storage (strictly no localStorage persistence).
 *
 * @param platform Platform identifier override (defaults to Platform.OS)
 */
export function createAuthSessionStorage(platform: string = Platform.OS): AuthSessionStorage {
  if (platform === 'web') {
    return new WebAuthSessionStorage();
  }
  return new NativeAuthSessionStorage();
}

export const authSessionStorage = createAuthSessionStorage();
