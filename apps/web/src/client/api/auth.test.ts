import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { getCaptcha, getMe, login, logout, refresh, register } from './auth';

const fetchMock = vi.fn<typeof fetch>();

function createJsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

describe('client auth api', () => {
  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('posts login credentials and returns the parsed auth response', async () => {
    fetchMock.mockResolvedValueOnce(
      createJsonResponse(200, {
        data: {
          accessToken: 'token-1',
          refreshToken: 'refresh-1',
          accessTokenExpiresIn: 900,
          refreshTokenExpiresIn: 604800,
          user: { id: 'user-1', username: 'alice', role: 'admin' },
        },
      }),
    );

    const response = await login({
      username: 'alice',
      password: 'secret',
      captchaId: '550e8400-e29b-41d4-a716-446655440000',
      captchaAnswer: '7',
    });

    expect(response.data.user.username).toBe('alice');
    expect(fetchMock).toHaveBeenCalledWith('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: 'alice',
        password: 'secret',
        captchaId: '550e8400-e29b-41d4-a716-446655440000',
        captchaAnswer: '7',
      }),
      credentials: 'include',
    });
  });

  it('loads captcha challenges for auth forms', async () => {
    fetchMock.mockResolvedValueOnce(
      createJsonResponse(200, {
        data: {
          captchaId: '550e8400-e29b-41d4-a716-446655440000',
          expiresInSeconds: 300,
          imageData: 'data:image/svg+xml;base64,PHN2Zz48L3N2Zz4=',
        },
      }),
    );

    const response = await getCaptcha();

    expect(response.data.imageData).toContain('data:image/svg+xml;base64,');
    expect(fetchMock).toHaveBeenCalledWith('/api/auth/captcha', {
      credentials: 'include',
    });
  });

  it('extracts API error messages for register and refresh failures', async () => {
    fetchMock.mockResolvedValueOnce(createJsonResponse(409, { error: { message: 'Username already exists' } }));

    await expect(
      register({
        username: 'alice',
        password: 'secret',
        captchaId: '550e8400-e29b-41d4-a716-446655440000',
        captchaAnswer: '7',
      }),
    ).rejects.toThrow('Username already exists');

    fetchMock.mockResolvedValueOnce(createJsonResponse(401, { error: { message: 'Refresh expired' } }));

    await expect(refresh('expired-refresh')).rejects.toThrow('Refresh expired');
  });

  it('retries logout with a refreshed token after a 401 response', async () => {
    fetchMock
      .mockResolvedValueOnce(createJsonResponse(401, { error: { message: 'Expired access token' } }))
      .mockResolvedValueOnce(
        createJsonResponse(200, {
          data: {
            accessToken: 'token-2',
            refreshToken: 'refresh-2',
            accessTokenExpiresIn: 900,
            refreshTokenExpiresIn: 604800,
            user: { id: 'user-1', username: 'alice', role: 'admin' },
          },
        }),
      )
      .mockResolvedValueOnce(createJsonResponse(200, { data: { ok: true } }));

    const response = await logout('token-1', 'refresh-1');

    expect(response).toEqual({ data: { ok: true } });
    expect(fetchMock).toHaveBeenNthCalledWith(1, '/api/auth/logout', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer token-1',
      },
      body: JSON.stringify({ refreshToken: 'refresh-1' }),
      credentials: 'include',
    });
    expect(fetchMock).toHaveBeenNthCalledWith(2, '/api/auth/refresh', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken: 'refresh-1' }),
      credentials: 'include',
    });
    expect(fetchMock).toHaveBeenNthCalledWith(3, '/api/auth/logout', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer token-2',
      },
      body: JSON.stringify({ refreshToken: 'refresh-2' }),
      credentials: 'include',
    });
  });

  it('requests the current user profile with bearer auth', async () => {
    fetchMock.mockResolvedValueOnce(createJsonResponse(200, { data: { id: 'user-1', username: 'alice' } }));

    const response = await getMe('token-1');

    expect(response).toEqual({ data: { id: 'user-1', username: 'alice' } });
    expect(fetchMock).toHaveBeenCalledWith('/api/auth/me', {
      headers: {
        Authorization: 'Bearer token-1',
      },
      credentials: 'include',
    });
  });
});
