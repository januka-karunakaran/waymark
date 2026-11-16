import { ApiClient } from './api/apiClient';
import { appConfig } from '../utils/config';

export * from './api/apiClient';
export * from './api/apiError';
export * from './api/types';
export * from './storage';

export const apiClient = new ApiClient({
  baseUrl: appConfig.apiUrl,
  defaultTimeoutMs: appConfig.apiTimeoutMs
});
