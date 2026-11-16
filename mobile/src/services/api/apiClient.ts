import { API_CONSTANTS } from '../../constants/api';
import { logger } from '../../utils/logger';
import { ApiError } from './apiError';
import {
  ApiResponse,
  AuthTokenProvider,
  HttpMethod,
  RequestInterceptor,
  RequestOptions,
  ResponseInterceptor
} from './types';

export interface ApiClientConfig {
  baseUrl: string;
  defaultTimeoutMs?: number;
  tokenProvider?: AuthTokenProvider;
}

export class ApiClient {
  private readonly baseUrl: string;
  private readonly defaultTimeoutMs: number;
  private tokenProvider?: AuthTokenProvider;
  private requestInterceptors: RequestInterceptor[] = [];
  private responseInterceptors: ResponseInterceptor[] = [];

  constructor(config: ApiClientConfig) {
    this.baseUrl = config.baseUrl.replace(/\/+$/, '');
    this.defaultTimeoutMs =
      config.defaultTimeoutMs || API_CONSTANTS.DEFAULT_TIMEOUT_MS;
    this.tokenProvider = config.tokenProvider;
  }

  public setTokenProvider(provider: AuthTokenProvider): void {
    this.tokenProvider = provider;
  }

  public addRequestInterceptor(interceptor: RequestInterceptor): void {
    this.requestInterceptors.push(interceptor);
  }

  public addResponseInterceptor(interceptor: ResponseInterceptor): void {
    this.responseInterceptors.push(interceptor);
  }

  private buildUrl(
    endpoint: string,
    params?: Record<string, string | number | boolean | undefined>
  ): string {
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    const fullUrl = new URL(`${this.baseUrl}${cleanEndpoint}`);

    if (params) {
      for (const [key, value] of Object.entries(params)) {
        if (value !== undefined) {
          fullUrl.searchParams.append(key, String(value));
        }
      }
    }

    return fullUrl.toString();
  }

  private async execute<T>(
    method: HttpMethod,
    endpoint: string,
    body?: unknown,
    options: RequestOptions = {}
  ): Promise<ApiResponse<T>> {
    let url = this.buildUrl(endpoint, options.params);
    const timeout = options.timeoutMs ?? this.defaultTimeoutMs;
    const controller = new AbortController();
    const timerId = setTimeout(() => controller.abort(), timeout);

    const headers: Record<string, string> = {
      Accept: API_CONSTANTS.HEADERS.ACCEPT,
      'Content-Type': API_CONSTANTS.HEADERS.CONTENT_TYPE,
      'X-Client-Platform': API_CONSTANTS.HEADERS.CLIENT_PLATFORM,
      ...(options.headers || {})
    };

    if (!options.skipAuth && this.tokenProvider) {
      try {
        const token = await this.tokenProvider();
        if (token) {
          headers.Authorization = `Bearer ${token}`;
        }
      } catch (err) {
        logger.warn('Failed to retrieve authentication token for API request', err);
      }
    }

    let init: RequestInit = {
      method,
      headers,
      signal: controller.signal
    };

    if (body !== undefined && method !== 'GET') {
      init.body = typeof body === 'string' ? body : JSON.stringify(body);
    }

    // Apply request interceptors
    for (const interceptor of this.requestInterceptors) {
      const intercepted = await interceptor(url, init);
      url = intercepted.url;
      init = intercepted.init;
    }

    try {
      logger.debug(`API Request: [${method}] ${url}`);
      const response = await fetch(url, init);
      clearTimeout(timerId);

      const contentType = response.headers.get('content-type') || '';
      let data: unknown;
      if (contentType.includes('application/json')) {
        data = await response.json().catch(() => null);
      } else {
        data = await response.text().catch(() => null);
      }

      if (!response.ok) {
        const serverMessage =
          typeof data === 'object' && data !== null && 'message' in data
            ? String((data as { message: unknown }).message)
            : undefined;

        throw new ApiError({
          message: serverMessage || `Request failed with status ${response.status}`,
          statusCode: response.status,
          details: data
        });
      }

      let apiResponse: ApiResponse<T> = {
        data: data as T,
        status: response.status,
        statusText: response.statusText,
        headers: response.headers
      };

      // Apply response interceptors
      for (const interceptor of this.responseInterceptors) {
        apiResponse = await interceptor(apiResponse);
      }

      return apiResponse;
    } catch (error: unknown) {
      clearTimeout(timerId);

      if (error instanceof ApiError) {
        throw error;
      }

      if (error instanceof Error && error.name === 'AbortError') {
        throw new ApiError({
          message: `Request timed out after ${timeout}ms`,
          code: 'TIMEOUT_ERROR',
          originalError: error
        });
      }

      throw new ApiError({
        message:
          error instanceof Error
            ? error.message
            : 'Network connection failure or unreachable transit host',
        code: 'NETWORK_ERROR',
        originalError: error
      });
    }
  }

  public get<T>(endpoint: string, options?: RequestOptions): Promise<ApiResponse<T>> {
    return this.execute<T>('GET', endpoint, undefined, options);
  }

  public post<T>(endpoint: string, body?: unknown, options?: RequestOptions): Promise<ApiResponse<T>> {
    return this.execute<T>('POST', endpoint, body, options);
  }

  public put<T>(endpoint: string, body?: unknown, options?: RequestOptions): Promise<ApiResponse<T>> {
    return this.execute<T>('PUT', endpoint, body, options);
  }

  public patch<T>(endpoint: string, body?: unknown, options?: RequestOptions): Promise<ApiResponse<T>> {
    return this.execute<T>('PATCH', endpoint, body, options);
  }

  public delete<T>(endpoint: string, options?: RequestOptions): Promise<ApiResponse<T>> {
    return this.execute<T>('DELETE', endpoint, undefined, options);
  }
}
