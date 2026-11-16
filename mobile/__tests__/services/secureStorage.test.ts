import { secureStorage } from '../../src/services/storage/secureStorage';
import * as SecureStore from 'expo-secure-store';

describe('SecureStorageService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('stores and retrieves items securely', async () => {
    await secureStorage.setItem('test_auth_key', 'token_12345');
    expect(SecureStore.setItemAsync).toHaveBeenCalledWith('test_auth_key', 'token_12345');

    const value = await secureStorage.getItem('test_auth_key');
    expect(SecureStore.getItemAsync).toHaveBeenCalledWith('test_auth_key');
    expect(value).toBe('token_12345');
  });

  it('deletes stored items', async () => {
    await secureStorage.setItem('temp_key', 'temp_val');
    await secureStorage.removeItem('temp_key');
    expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith('temp_key');
  });

  it('returns null gracefully when getItem encounters an error', async () => {
    (SecureStore.getItemAsync as jest.Mock).mockRejectedValueOnce(
      new Error('Keystore access denied')
    );
    const value = await secureStorage.getItem('corrupted_key');
    expect(value).toBeNull();
  });
});
