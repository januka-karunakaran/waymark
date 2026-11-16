export const API_CONSTANTS = {
  DEFAULT_TIMEOUT_MS: 15000,
  DEFAULT_BASE_URL: 'https://api.waymark2100.local/v1',
  RETRY_ATTEMPTS: 2,
  RETRY_BACKOFF_MS: 1000,
  HEADERS: {
    ACCEPT: 'application/json',
    CONTENT_TYPE: 'application/json',
    CLIENT_PLATFORM: 'waymark-mobile-native'
  }
} as const;
