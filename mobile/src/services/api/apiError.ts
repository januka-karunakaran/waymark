export interface ApiErrorOptions {
  message: string;
  statusCode?: number;
  code?: string;
  details?: unknown;
  originalError?: unknown;
}

export class ApiError extends Error {
  public readonly statusCode?: number;
  public readonly code: string;
  public readonly details?: unknown;
  public readonly isNetworkError: boolean;
  public readonly isTimeout: boolean;

  constructor(options: ApiErrorOptions) {
    super(options.message);
    this.name = 'ApiError';
    this.statusCode = options.statusCode;
    this.code = options.code || (options.statusCode ? `HTTP_${options.statusCode}` : 'UNKNOWN_ERROR');
    this.details = options.details;
    this.isNetworkError = options.code === 'NETWORK_ERROR';
    this.isTimeout = options.code === 'TIMEOUT_ERROR';

    // Restore prototype chain for instanceof checks
    Object.setPrototypeOf(this, ApiError.prototype);
  }

  /**
   * Return a user-safe message that does not leak internal infrastructure details.
   */
  public toUserSafeMessage(): string {
    if (this.isTimeout) {
      return 'The request timed out. Please verify your connection and try again.';
    }
    if (this.isNetworkError) {
      return 'Unable to reach the transit network. Please check your data or Wi-Fi connection.';
    }
    if (this.statusCode && this.statusCode >= 500) {
      return 'Transit service is currently experiencing technical difficulties. Please try again shortly.';
    }
    if (this.statusCode === 404) {
      return 'The requested transit resource was not found.';
    }
    if (this.statusCode === 401 || this.statusCode === 403) {
      return 'You do not have authorization to access this transit telemetry.';
    }
    return this.message || 'An unexpected transit system error occurred.';
  }
}
