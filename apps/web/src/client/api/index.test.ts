import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { fetchHealth } from './index';

const fetchMock = vi.fn<typeof fetch>();

function createJsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

describe('client api/index', () => {
  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('returns parsed health status when the health check succeeds', async () => {
    fetchMock.mockResolvedValueOnce(createJsonResponse(200, { status: 'ok' }));

    await expect(fetchHealth()).resolves.toEqual({ status: 'ok' });
    expect(fetchMock).toHaveBeenCalledWith('/health');
  });

  it('throws a descriptive error when the health check response is not ok', async () => {
    fetchMock.mockResolvedValueOnce(
      new Response(null, {
        status: 503,
        statusText: 'Service Unavailable',
      }),
    );

    await expect(fetchHealth()).rejects.toThrow('Health check failed: Service Unavailable');
  });

  it('logs and rethrows network errors from the health check request', async () => {
    const networkError = new Error('network down');
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    fetchMock.mockRejectedValueOnce(networkError);

    await expect(fetchHealth()).rejects.toThrow('network down');
    expect(consoleErrorSpy).toHaveBeenCalledWith('Failed to fetch health status', networkError);
  });
});
