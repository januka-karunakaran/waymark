import { loadAppConfig } from '../../src/utils/config';

describe('loadAppConfig Utility', () => {
  it('loads default config when env variables are absent', () => {
    const config = loadAppConfig({});
    expect(config.apiUrl).toBe('https://api.waymark2100.local/v1');
    expect(config.apiTimeoutMs).toBe(15000);
    expect(config.appEnv).toBe('development');
    expect(config.enableAirShuttles).toBe(true);
    expect(config.enableOfflineCache).toBe(true);
  });

  it('parses custom environment variables and strips trailing slash from apiUrl', () => {
    const customEnv = {
      EXPO_PUBLIC_API_URL: 'https://custom.api.waymark.com/v2/   ',
      EXPO_PUBLIC_API_TIMEOUT_MS: '25000',
      EXPO_PUBLIC_APP_ENV: 'production',
      EXPO_PUBLIC_ENABLE_AIR_SHUTTLES: 'false',
      EXPO_PUBLIC_ENABLE_OFFLINE_CACHE: 'false'
    };

    const config = loadAppConfig(customEnv);
    expect(config.apiUrl).toBe('https://custom.api.waymark.com/v2');
    expect(config.apiTimeoutMs).toBe(25000);
    expect(config.appEnv).toBe('production');
    expect(config.enableAirShuttles).toBe(false);
    expect(config.enableOfflineCache).toBe(false);
  });

  it('handles invalid timeout gracefully with fallback', () => {
    const config = loadAppConfig({
      EXPO_PUBLIC_API_TIMEOUT_MS: 'invalid_number'
    });
    expect(config.apiTimeoutMs).toBe(15000);
  });
});
