import { Hono } from 'hono';
import { z } from 'zod';
import type { Settings, SyncProviderKind, SyncSettings, SyncSnapshot } from '@prompthub/shared';
import { getAuthUser } from '../middleware/auth.js';
import { BackupService } from '../services/backup.service.js';
import { SettingsService } from '../services/settings.service.js';
import {
  buildImportedSyncSummary,
  buildSyncSummary,
  parseSyncSnapshot,
  withDefaultImportedSettings,
} from '../services/sync-snapshot.js';
import { writePulledSyncMedia } from '../services/sync-media.js';
import {
  pullWebDavSnapshot,
  pushWebDavSnapshot,
} from '../services/sync-orchestrator.js';
import { error, ErrorCode, success } from '../utils/response.js';
import { parseJsonBody } from '../utils/validation.js';

const sync = new Hono();
const backupService = new BackupService();
const settingsService = new SettingsService();

const syncImportRequestSchema = z.object({
  payload: z.unknown(),
});

const syncConfigSchema = z.object({
  enabled: z.boolean(),
  provider: z.enum(['manual', 'webdav', 'self-hosted', 's3']),
  endpoint: z.string().url().optional(),
  username: z.string().optional(),
  password: z.string().optional(),
  remotePath: z.string().optional(),
  autoSync: z.boolean().optional(),
});

function getSyncSettings(userId: string): SyncSettings {
  const settings = settingsService.get(userId);
  return settings.sync ?? {
    enabled: false,
    provider: 'manual',
    autoSync: false,
  };
}

function assertWebDavConfig(settings: SyncSettings): asserts settings is SyncSettings & { endpoint: string } {
  if (settings.provider !== 'webdav' || !settings.endpoint) {
    throw new Error('WebDAV sync is not configured');
  }
}

function buildSyncStatus(userId: string, payload: { exportedAt: string; prompts: unknown[]; folders: unknown[]; skills: unknown[] }): {
  enabled: boolean;
  provider: SyncProviderKind;
  lastSyncAt: string;
  summary: {
    prompts: number;
    folders: number;
    skills: number;
  };
  message: string;
  config: SyncSettings;
  capabilities: {
    pull: boolean;
    push: boolean;
    autoSync: boolean;
  };
} {
  const syncSettings = getSyncSettings(userId);
  const providerMessage =
    syncSettings.provider === 'webdav'
      ? syncSettings.enabled
        ? 'WebDAV sync is configured for this account'
        : 'WebDAV sync is configured but currently disabled'
      : syncSettings.provider === 'self-hosted'
        ? 'Self-hosted sync is configured for this account'
        : syncSettings.provider === 's3'
          ? 'S3 sync is configured for this account'
      : 'Manual sync is available for this account';

  return {
    enabled: syncSettings.enabled,
    provider: syncSettings.provider,
    lastSyncAt: syncSettings.lastSyncAt ?? payload.exportedAt,
    summary: {
      prompts: payload.prompts.length,
      folders: payload.folders.length,
      skills: payload.skills.length,
    },
    message: providerMessage,
    config: syncSettings,
    capabilities: {
      pull: true,
      push: true,
      autoSync: Boolean(syncSettings.enabled && syncSettings.autoSync && syncSettings.provider === 'webdav'),
    },
  };
}

function parseRemoteSyncSnapshot(body: string): SyncSnapshot {
  let rawPayload: unknown;
  try {
    rawPayload = JSON.parse(body);
  } catch {
    throw new Error('Invalid JSON in remote sync payload');
  }

  return parseSyncSnapshot(rawPayload);
}

function toSyncValidationError(c: Parameters<typeof success>[0], routeError: unknown, fallbackMessage: string): Response {
  return error(
    c,
    422,
    ErrorCode.VALIDATION_ERROR,
    routeError instanceof Error ? routeError.message : fallbackMessage,
  );
}

function updateSyncLastSyncAt(userId: string, syncSettings: SyncSettings, lastSyncAt: string): void {
  const currentSettings = settingsService.get(userId);
  settingsService.set(userId, {
    ...currentSettings,
    sync: {
      ...syncSettings,
      lastSyncAt,
    },
  });
}

function buildSyncImportPayload(snapshot: SyncSnapshot) {
  return withDefaultImportedSettings(snapshot);
}

sync.get('/manifest', async (c) => {
  const actor = getAuthUser(c);
  const payload = backupService.export(actor);

  return success(c, {
    version: payload.version,
    exportedAt: payload.exportedAt,
    counts: {
      prompts: payload.prompts.length,
      folders: payload.folders.length,
      skills: payload.skills.length,
    },
    settingsUpdatedAt: payload.settingsUpdatedAt,
    actor: {
      userId: actor.userId,
      role: actor.role,
    },
  });
});

sync.get('/data', async (c) => {
  const payload = backupService.export(getAuthUser(c));
  return success(c, payload);
});

sync.put('/data', async (c) => {
  const parsed = await parseJsonBody(c, syncImportRequestSchema);
  if (!parsed.success) {
    return parsed.response;
  }

  let snapshot: SyncSnapshot;
  try {
    snapshot = parseSyncSnapshot(parsed.data.payload);
  } catch (routeError) {
    return toSyncValidationError(c, routeError, 'Sync payload is invalid');
  }

  const actor = getAuthUser(c);
  writePulledSyncMedia(actor.userId, {
    images: snapshot.images,
    videos: snapshot.videos,
  });
  const result = backupService.import(actor, buildSyncImportPayload(snapshot));
  updateSyncLastSyncAt(actor.userId, getSyncSettings(actor.userId), new Date().toISOString());
  return success(c, {
    ok: true,
    ...result,
    summary: buildImportedSyncSummary(result),
  });
});

sync.get('/config', async (c) => {
  const actor = getAuthUser(c);
  return success(c, getSyncSettings(actor.userId));
});

sync.put('/config', async (c) => {
  const parsed = await parseJsonBody(c, syncConfigSchema);
  if (!parsed.success) {
    return parsed.response;
  }

  const actor = getAuthUser(c);
  const currentSettings = settingsService.get(actor.userId);
  const nextSync: SyncSettings = {
    ...getSyncSettings(actor.userId),
    ...parsed.data,
  };

  const nextSettings: Partial<Settings> = {
    ...currentSettings,
    sync: nextSync,
  };

  settingsService.set(actor.userId, nextSettings);
  return success(c, nextSync);
});

sync.post('/push', async (c) => {
  const actor = getAuthUser(c);
  const syncSettings = getSyncSettings(actor.userId);

  try {
    assertWebDavConfig(syncSettings);
    const exported = backupService.export(actor);
    const pushed = await pushWebDavSnapshot(actor.userId, syncSettings, exported);
    updateSyncLastSyncAt(actor.userId, syncSettings, pushed.syncedAt);

    return success(c, {
      ok: true,
      provider: 'webdav',
      syncedAt: pushed.syncedAt,
      remoteFile: pushed.remoteFile,
      promptsExported: exported.prompts.length,
      foldersExported: exported.folders.length,
      rulesExported: exported.rules?.length ?? 0,
      skillsExported: exported.skills.length,
      summary: buildSyncSummary(exported),
    });
  } catch (routeError) {
    return toSyncValidationError(c, routeError, 'Sync push failed');
  }
});

sync.post('/pull', async (c) => {
  const actor = getAuthUser(c);
  const syncSettings = getSyncSettings(actor.userId);

  try {
    assertWebDavConfig(syncSettings);
    const pulled = await pullWebDavSnapshot(syncSettings);
    const remoteSnapshot = parseRemoteSyncSnapshot(pulled.body);
    writePulledSyncMedia(actor.userId, {
      images: pulled.images ?? remoteSnapshot.images,
      videos: pulled.videos ?? remoteSnapshot.videos,
    });

    const imported = backupService.import(
      actor,
      buildSyncImportPayload(remoteSnapshot),
    );
    updateSyncLastSyncAt(actor.userId, syncSettings, pulled.syncedAt);

    return success(c, {
      ok: true,
      ...imported,
      provider: 'webdav',
      syncedAt: pulled.syncedAt,
      remoteFile: pulled.remoteFile,
      summary: buildImportedSyncSummary(imported),
    });
  } catch (routeError) {
    return toSyncValidationError(c, routeError, 'Sync pull failed');
  }
});

sync.get('/status', async (c) => {
  const actor = getAuthUser(c);
  const payload = backupService.export(actor);
  return success(c, buildSyncStatus(actor.userId, payload));
});

export default sync;
