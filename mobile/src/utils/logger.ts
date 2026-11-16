const SENSITIVE_KEYS = new Set([
  'token',
  'authorization',
  'password',
  'secret',
  'creditcard',
  'cookie',
  'api_key',
  'apikey'
]);

function maskSensitiveData(data: unknown): unknown {
  if (typeof data !== 'object' || data === null) {
    return data;
  }

  if (Array.isArray(data)) {
    return data.map(maskSensitiveData);
  }

  const masked: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(data as Record<string, unknown>)) {
    if (SENSITIVE_KEYS.has(key.toLowerCase())) {
      masked[key] = '***REDACTED***';
    } else if (typeof value === 'object' && value !== null) {
      masked[key] = maskSensitiveData(value);
    } else {
      masked[key] = value;
    }
  }
  return masked;
}

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export const logger = {
  debug(message: string, meta?: unknown): void {
    if (__DEV__) {
      if (meta !== undefined) {
        console.debug(`[DEBUG] ${message}`, maskSensitiveData(meta));
      } else {
        console.debug(`[DEBUG] ${message}`);
      }
    }
  },

  info(message: string, meta?: unknown): void {
    if (__DEV__) {
      if (meta !== undefined) {
        console.info(`[INFO] ${message}`, maskSensitiveData(meta));
      } else {
        console.info(`[INFO] ${message}`);
      }
    }
  },

  warn(message: string, meta?: unknown): void {
    if (meta !== undefined) {
      console.warn(`[WARN] ${message}`, maskSensitiveData(meta));
    } else {
      console.warn(`[WARN] ${message}`);
    }
  },

  error(message: string, error?: unknown, meta?: unknown): void {
    const safeMeta = meta !== undefined ? maskSensitiveData(meta) : undefined;
    const safeError =
      error instanceof Error
        ? { message: error.message, name: error.name }
        : error;
    console.error(`[ERROR] ${message}`, { error: safeError, meta: safeMeta });
  }
};
