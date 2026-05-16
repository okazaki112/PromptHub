import { Hono } from 'hono';
import { z } from 'zod';
import type { Settings } from '@prompthub/shared';
import { getAuthUser } from '../middleware/auth.js';
import { SettingsService } from '../services/settings.service.js';
import { error, ErrorCode, success } from '../utils/response.js';
import { parseJsonBody } from '../utils/validation.js';

const settings = new Hono();
const settingsService = new SettingsService();

const updateSettingsSchema = z.object({
  theme: z.enum(['light', 'dark', 'system']).optional(),
  language: z.enum(['en', 'zh', 'zh-TW', 'ja', 'fr', 'de', 'es']).optional(),
  autoSave: z.boolean().optional(),
  defaultFolderId: z.string().trim().min(1).nullable().optional(),
  customPlatformRootPaths: z.record(z.string()).optional(),
  customSkillPlatformPaths: z.record(z.string()).optional(),
  sync: z
    .object({
      enabled: z.boolean(),
       provider: z.enum(['manual', 'webdav', 'self-hosted', 's3']),
      endpoint: z.string().url().optional(),
      username: z.string().optional(),
      password: z.string().optional(),
      remotePath: z.string().optional(),
      autoSync: z.boolean().optional(),
      lastSyncAt: z.string().optional(),
    })
    .optional(),
  device: z
    .object({
      syncCadence: z.enum(['manual', '15m', '1h', '1d']).optional(),
      storeAutoSync: z.boolean().optional(),
      storeSyncCadence: z.enum(['manual', '1h', '1d']).optional(),
    })
    .optional(),
  security: z
    .object({
      masterPasswordConfigured: z.boolean(),
      unlocked: z.boolean(),
    })
    .optional(),
});

settings.get('/', async (c) => {
  try {
    const { userId } = getAuthUser(c);
    return success(c, settingsService.get(userId));
  } catch {
    return error(c, 500, ErrorCode.INTERNAL_ERROR, 'Internal server error');
  }
});

settings.put('/', async (c) => {
  const parsed = await parseJsonBody(c, updateSettingsSchema);
  if (!parsed.success) {
    return parsed.response;
  }

  try {
    const { userId } = getAuthUser(c);
    const nextSettings: Partial<Settings> = {
      ...parsed.data,
      defaultFolderId: parsed.data.defaultFolderId ?? undefined,
    };
    settingsService.set(userId, nextSettings);
    return success(c, { ok: true });
  } catch {
    return error(c, 500, ErrorCode.INTERNAL_ERROR, 'Internal server error');
  }
});

export default settings;
