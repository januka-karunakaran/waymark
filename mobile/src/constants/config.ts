export const APP_CONFIG_CONSTANTS = {
  APP_NAME: 'Waymark 2100',
  APP_VERSION: '1.0.0',
  STORAGE_KEYS: {
    USER_TOKEN: 'waymark.secure.auth_token',
    COMFORT_SETTINGS: 'waymark.settings.comfort',
    RECENT_DESTINATIONS: 'waymark.cache.recent_destinations'
  },
  DEFAULT_COMFORT_PREFERENCES: {
    audioGuidance: true,
    quietBoarding: true,
    informationDensity: 'Standard'
  }
} as const;
