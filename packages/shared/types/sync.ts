import type { Folder } from './folder';
import type { Prompt, PromptVersion } from './prompt';
import type { RuleBackupRecord } from './rules';
import type { Settings, SyncProviderKind } from './settings';
import type { Skill, SkillFileSnapshot, SkillVersion } from './skill';

export type SyncDirection = 'push' | 'pull';
export type SyncMode = 'merge' | 'replace' | 'bidirectional';

export interface SyncCapabilities {
  incremental: boolean;
  bidirectional: boolean;
  media: boolean;
  encryption: boolean;
  manifest: boolean;
}

export type SyncErrorCode =
  | 'SYNC_AUTH_FAILED'
  | 'SYNC_CONNECTIVITY_FAILED'
  | 'SYNC_REMOTE_NOT_FOUND'
  | 'SYNC_PAYLOAD_INVALID'
  | 'SYNC_PROVIDER_UNSUPPORTED';

export interface SyncOperationSummary {
  prompts: number;
  folders: number;
  rules: number;
  skills: number;
}

export interface SyncWarning {
  code: string;
  message: string;
}

export interface SyncEvent {
  stage: string;
  message: string;
}

export interface SyncResult {
  ok: boolean;
  direction: SyncDirection;
  mode: SyncMode;
  provider: SyncProviderKind;
  syncedAt: string;
  summary: SyncOperationSummary;
  warnings?: SyncWarning[];
  events?: SyncEvent[];
  remoteFile?: string;
  errorCode?: SyncErrorCode;
  errorMessage?: string;
}

export interface SyncMediaFiles {
  images?: Record<string, string>;
  videos?: Record<string, string>;
}

export interface SyncSnapshot {
  version: string;
  exportedAt: string;
  prompts: Prompt[];
  promptVersions: PromptVersion[];
  versions?: PromptVersion[];
  folders: Folder[];
  rules?: RuleBackupRecord[];
  skills: Skill[];
  skillVersions: SkillVersion[];
  skillFiles?: Record<string, SkillFileSnapshot[]>;
  settings?: Settings;
  settingsUpdatedAt?: string;
  images?: Record<string, string>;
  videos?: Record<string, string>;
}

export interface RemoteSyncState {
  snapshot: SyncSnapshot;
  media?: SyncMediaFiles;
}

export interface SyncRequest {
  direction: SyncDirection;
  mode: SyncMode;
  provider: SyncProviderKind;
}
