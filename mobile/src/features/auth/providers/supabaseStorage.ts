import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { logger } from '../../../utils/logger';

/**
 * Storage adapter interface required by @supabase/supabase-js.
 */
export interface SupabaseAuthStorage {
  getItem: (key: string) => Promise<string | null>;
  setItem: (key: string, value: string) => Promise<void>;
  removeItem: (key: string) => Promise<void>;
}

/**
 * Native secure storage adapter for Supabase using expo-secure-store.
 * Stores tokens encrypted in iOS Keychain / Android KeyStore.
 */
export class NativeSupabaseStorage implements SupabaseAuthStorage {
  async getItem(key: string): Promise<string | null> {
    try {
      return await SecureStore.getItemAsync(key);
    } catch (error) {
      logger.error('NativeSupabaseStorage: Failed to read from secure store', error);
      return null;
    }
  }

  async setItem(key: string, value: string): Promise<void> {
    try {
      await SecureStore.setItemAsync(key, value);
    } catch (error) {
      logger.error('NativeSupabaseStorage: Failed to write to secure store', error);
    }
  }

  async removeItem(key: string): Promise<void> {
    try {
      await SecureStore.deleteItemAsync(key);
    } catch (error) {
      logger.error('NativeSupabaseStorage: Failed to delete from secure store', error);
    }
  }
}

/**
 * Web in-memory storage adapter for Supabase.
 * Enforces Waymark safety policy: NO localStorage or sessionStorage persistence on web.
 */
export class WebMemorySupabaseStorage implements SupabaseAuthStorage {
  private memoryStore = new Map<string, string>();

  async getItem(key: string): Promise<string | null> {
    return this.memoryStore.get(key) ?? null;
  }

  async setItem(key: string, value: string): Promise<void> {
    this.memoryStore.set(key, value);
  }

  async removeItem(key: string): Promise<void> {
    this.memoryStore.delete(key);
  }

  /**
   * Test helper to inspect in-memory store.
   */
  getMemoryStoreForTesting(): Map<string, string> {
    return this.memoryStore;
  }

  /**
   * Test helper to reset memory store.
   */
  clearMemoryForTesting(): void {
    this.memoryStore.clear();
  }
}

/**
 * Factory function creating the appropriate platform-specific Supabase storage adapter.
 *
 * @param platform Platform identifier override (defaults to Platform.OS)
 */
export function createSupabaseStorage(platform: string = Platform.OS): SupabaseAuthStorage {
  if (platform === 'web') {
    return new WebMemorySupabaseStorage();
  }
  return new NativeSupabaseStorage();
}
