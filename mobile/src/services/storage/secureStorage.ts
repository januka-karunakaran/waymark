import * as SecureStore from 'expo-secure-store';
import { logger } from '../../utils/logger';

export interface StorageService {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  removeItem(key: string): Promise<void>;
}

export class SecureStorageService implements StorageService {
  async getItem(key: string): Promise<string | null> {
    try {
      return await SecureStore.getItemAsync(key);
    } catch (error) {
      logger.error(`SecureStorage failed to get key "${key}"`, error);
      return null;
    }
  }

  async setItem(key: string, value: string): Promise<void> {
    try {
      await SecureStore.setItemAsync(key, value);
    } catch (error) {
      logger.error(`SecureStorage failed to set key "${key}"`, error);
      throw error;
    }
  }

  async removeItem(key: string): Promise<void> {
    try {
      await SecureStore.deleteItemAsync(key);
    } catch (error) {
      logger.error(`SecureStorage failed to delete key "${key}"`, error);
      throw error;
    }
  }
}

export const secureStorage = new SecureStorageService();
