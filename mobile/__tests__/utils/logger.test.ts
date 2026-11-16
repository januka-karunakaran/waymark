import { logger } from '../../src/utils/logger';

describe('Logger Utility', () => {
  let warnSpy: jest.SpyInstance;
  let errorSpy: jest.SpyInstance;

  beforeEach(() => {
    warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    warnSpy.mockRestore();
    errorSpy.mockRestore();
  });

  it('redacts sensitive keys from meta in warn and error logs', () => {
    logger.warn('Auth issue detected', {
      token: 'secret-token-123',
      password: 'mypassword',
      username: 'navigator_01'
    });

    expect(warnSpy).toHaveBeenCalledWith(
      '[WARN] Auth issue detected',
      expect.objectContaining({
        token: '***REDACTED***',
        password: '***REDACTED***',
        username: 'navigator_01'
      })
    );
  });

  it('safely handles Error instances and metadata in error logs', () => {
    const errorObj = new Error('Database disconnected');
    logger.error('Failed to query node', errorObj, {
      endpoint: '/nodes',
      apiKey: 'key_abc'
    });

    expect(errorSpy).toHaveBeenCalledWith(
      '[ERROR] Failed to query node',
      expect.objectContaining({
        error: expect.objectContaining({
          message: 'Database disconnected',
          name: 'Error'
        }),
        meta: expect.objectContaining({
          endpoint: '/nodes',
          apiKey: '***REDACTED***'
        })
      })
    );
  });
});
