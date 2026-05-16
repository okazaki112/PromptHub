/**
 * Settings type definitions
 */

import type { SkillProject } from './skill';

export interface Settings {
  theme: Theme;
  language: Language;
  autoSave: boolean;
  defaultFolderId?: string;
  backgroundImageFileName?: string;
  backgroundImageOpacity?: number;
  backgroundImageBlur?: number;
  customPlatformRootPaths?: Record<string, string>;
  customSkillPlatformPaths?: Record<string, string>;
  skillPlatformOrder?: string[];
  skillProjects?: SkillProject[];
  lastManualBackupAt?: string;
  lastManualBackupVersion?: string;
  sync?: SyncSettings;
  device?: DeviceManagementSettings;
  updateChannel?: UpdateChannel;
  // Startup behavior — main process reads these to honor "minimize on launch"
  launchAtStartup?: boolean;
  minimizeOnLaunch?: boolean;
  // GitHub personal access token (optional). Used to authenticate GitHub
  // API calls in the skill store so the user isn't limited to 60 req/h.
  // Never sent to third-party hosts; only attached for api.github.com and
  // raw.githubusercontent.com. See #108.
  githubToken?: string;
  // Security
  security?: {
    masterPasswordConfigured: boolean;
    unlocked: boolean;
  
  };
}

export interface SyncSettings {
  enabled: boolean;
  provider: SyncProviderKind;
  endpoint?: string;
  username?: string;
  password?: string;
  remotePath?: string;
  autoSync?: boolean;
  lastSyncAt?: string;
}

export type SyncProviderKind =
  | 'manual'
  | 'webdav'
  | 'self-hosted'
  | 's3';

export interface DeviceManagementSettings {
  syncCadence?: 'manual' | '15m' | '1h' | '1d';
  storeAutoSync?: boolean;
  storeSyncCadence?: 'manual' | '1h' | '1d';
}

export type Theme = 'light' | 'dark' | 'system';
export type Language = 'en' | 'zh' | 'zh-TW' | 'ja' | 'fr' | 'de' | 'es';
export type UpdateChannel = 'stable' | 'preview';

export const DEFAULT_SETTINGS: Settings = {
  theme: 'system',
  language: 'zh',
  autoSave: true,
  backgroundImageOpacity: 0.22,
  backgroundImageBlur: 14,
  customPlatformRootPaths: {},
  customSkillPlatformPaths: {},
  skillPlatformOrder: [],
  skillProjects: [],
  sync: {
    enabled: false,
    provider: 'manual',
    autoSync: false,
  },
  device: {
    syncCadence: 'manual',
    storeAutoSync: true,
    storeSyncCadence: '1d',
  },
  updateChannel: 'stable',
};
