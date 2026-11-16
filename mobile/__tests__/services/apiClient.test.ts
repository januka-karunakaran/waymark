import { ApiClient } from '../../src/services/api/apiClient';
import { ApiError } from '../../src/services/api/apiError';

describe('ApiClient Service', () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
    jest.clearAllMocks();
  });

  it('performs successful GET request and parses JSON data', async () => {
    const mockData = { status: 'ok', routeId: 'route-kandy-1' };
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      statusText: 'OK',
      headers: new Headers({ 'content-type': 'application/json' }),
      json: () => Promise.resolve(mockData)
    });

    const client = new ApiClient({ baseUrl: 'https://api.waymark.local/v1' });
    const response = await client.get<typeof mockData>('/transit/routes');

    expect(response.status).toBe(200);
    expect(response.data).toEqual(mockData);
    expect(global.fetch).toHaveBeenCalledWith(
      'https://api.waymark.local/v1/transit/routes',
      expect.objectContaining({
        method: 'GET'
      })
    );
  });

  it('injects authorization bearer token when tokenProvider is set', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      statusText: 'OK',
      headers: new Headers({ 'content-type': 'application/json' }),
      json: () => Promise.resolve({ success: true })
    });

    const client = new ApiClient({
      baseUrl: 'https://api.waymark.local/v1',
      tokenProvider: () => Promise.resolve('commuter-session-token-xyz')
    });

    await client.get('/secure/telemetry');

    expect(global.fetch).toHaveBeenCalledWith(
      'https://api.waymark.local/v1/secure/telemetry',
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: 'Bearer commuter-session-token-xyz'
        })
      })
    );
  });

  it('throws ApiError with user-safe message on HTTP 500 server error', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 503,
      statusText: 'Service Unavailable',
      headers: new Headers({ 'content-type': 'application/json' }),
      json: () => Promise.resolve({ message: 'Subterranean relay failure' })
    });

    const client = new ApiClient({ baseUrl: 'https://api.waymark.local/v1' });

    await expect(client.get('/transit/status')).rejects.toThrow(ApiError);
    try {
      await client.get('/transit/status');
    } catch (err) {
      const apiErr = err as ApiError;
      expect(apiErr.statusCode).toBe(503);
      expect(apiErr.toUserSafeMessage()).toContain('experiencing technical difficulties');
    }
  });

  it('handles timeout correctly and maps to TIMEOUT_ERROR code', async () => {
    global.fetch = jest.fn().mockImplementation(() => {
      const err = new Error('The operation was aborted');
      err.name = 'AbortError';
      return Promise.reject(err);
    });

    const client = new ApiClient({ baseUrl: 'https://api.waymark.local/v1', defaultTimeoutMs: 50 });

    try {
      await client.get('/slow-endpoint');
      fail('Expected client.get to throw');
    } catch (err) {
      const apiErr = err as ApiError;
      expect(apiErr.isTimeout).toBe(true);
      expect(apiErr.code).toBe('TIMEOUT_ERROR');
      expect(apiErr.toUserSafeMessage()).toContain('timed out');
    }
  });
});
