import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { refreshMock } = vi.hoisted(() => ({
  refreshMock: vi.fn(),
}));

vi.mock('./auth', () => ({
  refresh: refreshMock,
}));

import {
  AUTH_SESSION_EVENT,
  clearStoredAuthSession,
  fetchWithAuthRetry,
  getStoredAccessToken,
  getStoredRefreshToken,
  storeAuthSession,
} from './auth-session';

const fetchMock = vi.fn<typeof fetch>();

function createJsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

describe('client auth-session api', () => {
  beforeEach(() => {
    fetchMock.mockReset();
    refreshMock.mockReset();
    clearStoredAuthSession();
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('stores and clears auth session state in memory', () => {
    const listener = vi.fn();
    window.addEventListener(AUTH_SESSION_EVENT, listener);

    storeAuthSession('token-1', 'refresh-1');
    expect(getStoredAccessToken()).toBe('token-1');
    expect(getStoredRefreshToken()).toBe('refresh-1');

    clearStoredAuthSession();
    expect(getStoredAccessToken()).toBeNull();
    expect(getStoredRefreshToken()).toBeNull();
    expect(listener).toHaveBeenCalledTimes(2);

    window.removeEventListener(AUTH_SESSION_EVENT, listener);
  });

  it('retries requests after refreshing an expired access token', async () => {
    storeAuthSession('token-1', 'refresh-1');
    fetchMock
      .mockResolvedValueOnce(createJsonResponse(401, { error: { message: 'expired' } }))
      .mockResolvedValueOnce(createJsonResponse(200, { data: { ok: true } }));
    refreshMock.mockResolvedValueOnce({
      data: {
        accessToken: 'token-2',
        refreshToken: 'refresh-2',
      },
    });

    const response = await fetchWithAuthRetry('/api/protected', {
      method: 'GET',
      headers: { Authorization: 'Bearer stale-token' },
    });

    expect(response.status).toBe(200);
    expect(refreshMock).toHaveBeenCalledWith('refresh-1');
    expect(getStoredAccessToken()).toBe('token-2');
    expect(getStoredRefreshToken()).toBe('refresh-2');
    expect(fetchMock).toHaveBeenNthCalledWith(2, '/api/protected', {
      method: 'GET',
      credentials: 'include',
      headers: expect.any(Headers),
    });
    const retriedHeaders = fetchMock.mock.calls[1]?.[1]?.headers;
    expect(retriedHeaders).toBeInstanceOf(Headers);
    expect((retriedHeaders as Headers).get('Authorization')).toBe('Bearer token-2');
  });

  it('returns the first 401 response when refresh fails without an in-memory refresh token', async () => {
    const unauthorizedResponse = createJsonResponse(401, { error: { message: 'expired' } });
    fetchMock.mockResolvedValueOnce(unauthorizedResponse);
    refreshMock.mockRejectedValueOnce(new Error('no cookie session'));

    const response = await fetchWithAuthRetry('/api/protected');

    expect(response).toBe(unauthorizedResponse);
    expect(refreshMock).toHaveBeenCalledWith(undefined);
  });

  it('attaches the stored access token to the first request before any retry', async () => {
    storeAuthSession('token-1', 'refresh-1');
    fetchMock.mockResolvedValueOnce(createJsonResponse(200, { data: { ok: true } }));

    await fetchWithAuthRetry('/api/protected', { method: 'GET' });

    const initialHeaders = fetchMock.mock.calls[0]?.[1]?.headers;
    expect(initialHeaders).toBeInstanceOf(Headers);
    expect((initialHeaders as Headers).get('Authorization')).toBe('Bearer token-1');
    expect(fetchMock.mock.calls[0]?.[1]?.credentials).toBe('include');
    expect(refreshMock).not.toHaveBeenCalled();
  });

  it('clears stored session state when refresh fails', async () => {
    storeAuthSession('token-1', 'refresh-1');
    const unauthorizedResponse = createJsonResponse(401, { error: { message: 'expired' } });
    fetchMock.mockResolvedValueOnce(unauthorizedResponse);
    refreshMock.mockRejectedValueOnce(new Error('refresh failed'));

    const response = await fetchWithAuthRetry('/api/protected');

    expect(response).toBe(unauthorizedResponse);
    expect(getStoredAccessToken()).toBeNull();
    expect(getStoredRefreshToken()).toBeNull();
  });

  it('shares one refresh request across concurrent 401 responses', async () => {
    storeAuthSession('token-1', 'refresh-1');

    fetchMock
      .mockResolvedValueOnce(createJsonResponse(401, { error: { message: 'expired' } }))
      .mockResolvedValueOnce(createJsonResponse(401, { error: { message: 'expired' } }))
      .mockResolvedValueOnce(createJsonResponse(200, { data: { ok: 'a' } }))
      .mockResolvedValueOnce(createJsonResponse(200, { data: { ok: 'b' } }));

    refreshMock.mockResolvedValueOnce({
      data: {
        accessToken: 'token-2',
        refreshToken: 'refresh-2',
      },
    });

    const [first, second] = await Promise.all([
      fetchWithAuthRetry('/api/skills'),
      fetchWithAuthRetry('/api/settings'),
    ]);

    expect(first.status).toBe(200);
    expect(second.status).toBe(200);
    expect(refreshMock).toHaveBeenCalledTimes(1);
    expect(getStoredAccessToken()).toBe('token-2');
    expect(getStoredRefreshToken()).toBe('refresh-2');
  });
});
