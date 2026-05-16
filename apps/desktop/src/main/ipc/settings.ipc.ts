import { ipcMain } from 'electron';
import Database from '../database/sqlite';
import { IPC_CHANNELS } from '@prompthub/shared/constants';
import {
  getPlatformById,
  normalizeLegacySkillPathToRootTemplate,
} from '@prompthub/shared/constants/platforms';
import type { Settings } from '@prompthub/shared/types';
import { DEFAULT_SETTINGS } from '@prompthub/shared/types';
import {
  getMinimizeOnLaunchSetting,
  readGithubTokenSetting,
} from '../settings/settings-readers';

export {
  getMinimizeOnLaunchSetting,
  readGithubTokenSetting as getGithubTokenSetting,
} from '../settings/settings-readers';

/**
 * Register settings-related IPC handlers
 */
export function registerSettingsIPC(db: Database.Database): void {
  // Get settings
  ipcMain.handle(IPC_CHANNELS.SETTINGS_GET, async () => {
    const settings: Settings = { ...DEFAULT_SETTINGS };

    const stmt = db.prepare('SELECT key, value FROM settings');
    const rows = stmt.all() as { key: string; value: string }[];

    for (const row of rows) {
      try {
        (settings as any)[row.key] = JSON.parse(row.value);
      } catch {
        (settings as any)[row.key] = row.value;
      }
    }

    if (
      (!settings.customPlatformRootPaths ||
        Object.keys(settings.customPlatformRootPaths).length === 0) &&
      settings.customSkillPlatformPaths &&
      Object.keys(settings.customSkillPlatformPaths).length > 0
    ) {
      settings.customPlatformRootPaths = Object.fromEntries(
        Object.entries(settings.customSkillPlatformPaths).map(
          ([platformId, skillPath]) => {
            const platform = getPlatformById(platformId);
            if (!platform) {
              return [platformId, skillPath];
            }
            return [
              platformId,
              normalizeLegacySkillPathToRootTemplate(platform, skillPath),
            ];
          },
        ),
      );
    }

    return settings;
  });

  // Save settings
  ipcMain.handle(IPC_CHANNELS.SETTINGS_SET, async (_event, newSettings: Partial<Settings>) => {
    const stmt = db.prepare(`
      INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)
    `);

    const transaction = db.transaction(() => {
      for (const [key, value] of Object.entries(newSettings)) {
        stmt.run(key, JSON.stringify(value));
      }
    });

    transaction();
    return true;
  });
}
