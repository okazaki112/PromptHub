import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Hono } from 'hono';

import { errorHandler } from './error-handler';

function createAppWithThrowingRoute(errorFactory: () => Error): Hono {
  const app = new Hono();
  app.onError(errorHandler);
  app.get('/boom', () => {
    throw errorFactory();
  });
  return app;
}

describe('errorHandler', () => {
  const originalNodeEnv = process.env.NODE_ENV;

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    process.env.NODE_ENV = originalNodeEnv;
    vi.restoreAllMocks();
  });

  it('returns a generic 500 message in production', async () => {
    process.env.NODE_ENV = 'production';
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const app = createAppWithThrowingRoute(() => new Error('secret failure'));

    const response = await app.request('http://localhost/boom');

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Internal server error',
      },
    });
    expect(consoleErrorSpy).toHaveBeenCalledWith('[ERROR] GET /boom: secret failure');
  });

  it('returns the original 500 error message outside production', async () => {
    process.env.NODE_ENV = 'test';
    const error = new Error('debug failure');
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const app = createAppWithThrowingRoute(() => error);

    const response = await app.request('http://localhost/boom');

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'debug failure',
      },
    });
    expect(consoleErrorSpy).toHaveBeenCalledWith('[ERROR] GET /boom:', error);
  });

  it('preserves explicit client error statuses and messages', async () => {
    process.env.NODE_ENV = 'test';
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const app = createAppWithThrowingRoute(() => Object.assign(new Error('bad input'), { status: 400 }));

    const response = await app.request('http://localhost/boom');

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: {
        code: 'BAD_REQUEST',
        message: 'bad input',
      },
    });
    expect(consoleErrorSpy).toHaveBeenCalled();
  });
});
