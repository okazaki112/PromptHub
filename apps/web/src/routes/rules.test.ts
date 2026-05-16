import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { closeDatabase } from '@prompthub/db';
import { issueSolvedCaptcha } from '../test-helpers/auth-captcha';

const ENV_KEYS = [
  'PORT',
  'HOST',
  'JWT_SECRET',
  'JWT_ACCESS_TTL',
  'JWT_REFRESH_TTL',
  'DATA_ROOT',
  'ALLOW_REGISTRATION',
  'LOG_LEVEL',
] as const;

const originalEnv = Object.fromEntries(ENV_KEYS.map((key) => [key, process.env[key]]));

async function createTestApp(dataDir: string) {
  process.env.PORT = '3997';
  process.env.HOST = '127.0.0.1';
  process.env.JWT_SECRET = 'test-secret-for-web-rule-routes-1234567890';
  process.env.JWT_ACCESS_TTL = '900';
  process.env.JWT_REFRESH_TTL = '604800';
  process.env.DATA_ROOT = dataDir;
  process.env.ALLOW_REGISTRATION = 'true';
  process.env.LOG_LEVEL = 'debug';

  const [{ createApp }] = await Promise.all([import('../app')]);
  return createApp();
}

async function registerUser(app: Awaited<ReturnType<typeof createTestApp>>) {
  const captcha = await issueSolvedCaptcha(app);
  const response = await app.request(
    new Request('http://local/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'ruleowner', password: 'debugpass001', ...captcha }),
    }),
  );
  const payload = (await response.json()) as {
    data: { accessToken: string };
  };
  return payload.data.accessToken;
}

describe('web rule routes', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    closeDatabase();
    for (const key of ENV_KEYS) {
      const value = originalEnv[key];
      if (value === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = value;
      }
    }
  });

  it('creates and removes project rules for the authenticated user', async () => {
    const dataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'prompthub-web-rule-routes-test-'));

    try {
      const app = await createTestApp(dataDir);
      const token = await registerUser(app);

      const createResponse = await app.request(
        new Request('http://local/api/rules/projects', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ name: 'Docs Site', rootPath: '/workspace/docs' }),
        }),
      );

      expect(createResponse.status).toBe(201);
      const createPayload = (await createResponse.json()) as {
        data: { id: string; platformName: string; projectRootPath: string | null };
      };
      expect(createPayload.data.id).toMatch(/^project:/);
      expect(createPayload.data.platformName).toBe('Docs Site');
      expect(createPayload.data.projectRootPath).toBe('/workspace/docs');

      const listResponse = await app.request(
        new Request('http://local/api/rules', {
          headers: { Authorization: `Bearer ${token}` },
        }),
      );
      const listPayload = (await listResponse.json()) as {
        data: Array<{ id: string }>;
      };
      expect(listPayload.data.some((item) => item.id === createPayload.data.id)).toBe(true);

      const deleteResponse = await app.request(
        new Request(
          `http://local/api/rules/projects/${encodeURIComponent(createPayload.data.id.slice('project:'.length))}`,
          {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${token}` },
          },
        ),
      );

      expect(deleteResponse.status).toBe(200);

      const afterDeleteResponse = await app.request(
        new Request('http://local/api/rules', {
          headers: { Authorization: `Bearer ${token}` },
        }),
      );
      const afterDeletePayload = (await afterDeleteResponse.json()) as {
        data: Array<{ id: string }>;
      };
      expect(afterDeletePayload.data.some((item) => item.id === createPayload.data.id)).toBe(false);
    } finally {
      fs.rmSync(dataDir, { recursive: true, force: true });
    }
  }, 20000);
});
