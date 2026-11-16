export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export interface RequestOptions {
  headers?: Record<string, string>;
  params?: Record<string, string | number | boolean | undefined>;
  timeoutMs?: number;
  skipAuth?: boolean;
}

export interface ApiResponse<T = unknown> {
  data: T;
  status: number;
  statusText: string;
  headers: Headers;
}

export type AuthTokenProvider = () => Promise<string | null>;
export type RequestInterceptor = (url: string, init: RequestInit) => Promise<{ url: string; init: RequestInit }>;
export type ResponseInterceptor = <T>(response: ApiResponse<T>) => Promise<ApiResponse<T>>;
