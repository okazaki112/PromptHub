import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { closeDatabase } from '@prompthub/db';

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

function configureTestEnv(dataDir: string): void {
  process.env.PORT = '3995';
  process.env.HOST = '127.0.0.1';
  process.env.JWT_SECRET = 'test-secret-for-web-rule-workspace-1234567890';
  process.env.JWT_ACCESS_TTL = '900';
  process.env.JWT_REFRESH_TTL = '604800';
  process.env.DATA_ROOT = dataDir;
  process.env.ALLOW_REGISTRATION = 'true';
  process.env.LOG_LEVEL = 'debug';
}

describe('web rule workspace storage', () => {
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

  it('round-trips per-user rule backup records through the workspace filesystem', async () => {
    const dataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'prompthub-web-rule-workspace-test-'));

    try {
      configureTestEnv(dataDir);
      const workspaceModule = await import('./rule-workspace.js');

      workspaceModule.importRuleBackupRecords('user-a', [
        {
          id: 'project:docs-site',
          platformId: 'workspace',
          platformName: 'Docs Site',
          platformIcon: 'FolderRoot',
          platformDescription: 'Project rules',
          name: 'AGENTS.md',
          description: 'Project rules file',
          path: '/repo/AGENTS.md',
          targetPath: '/repo/AGENTS.md',
          projectRootPath: '/repo',
          syncStatus: 'synced',
          content: '# Docs rules',
          versions: [
            {
              id: 'rule-v1',
              savedAt: '2026-05-09T00:00:00.000Z',
              source: 'create',
              content: '# Docs rules',
            },
          ],
        },
      ]);

      const exported = workspaceModule.exportRuleBackupRecords('user-a');
      expect(exported).toEqual([
        expect.objectContaining({
          id: 'project:docs-site',
          content: '# Docs rules',
          versions: [
            expect.objectContaining({
              id: 'rule-v1',
              content: '# Docs rules',
            }),
          ],
        }),
      ]);

      expect(workspaceModule.exportRuleBackupRecords('user-b')).toEqual([]);
    } finally {
      fs.rmSync(dataDir, { recursive: true, force: true });
    }
  });
});
