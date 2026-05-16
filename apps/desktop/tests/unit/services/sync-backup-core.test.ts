import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  autoSyncBackup,
  computeHash,
  downloadSyncBackup,
  getRemoteSyncBackupTimestamp,
  incrementalUploadSyncBackup,
  type RemoteDownloadResult,
  type RemoteStatResult,
  type RemoteSyncAdapter,
} from "../../../src/renderer/services/sync-backup-core";
import { installWindowMocks } from "../../helpers/window";

const exportDatabaseMock = vi.fn();
const restoreFromBackupMock = vi.fn();
const getAllPromptsMock = vi.fn();
const getAllFoldersMock = vi.fn();
const getSettingsStateSnapshotMock = vi.fn();
const restoreAiConfigSnapshotMock = vi.fn();
const restoreSettingsStateSnapshotMock = vi.fn();

vi.mock("../../../src/renderer/services/database", () => ({
  getAllPrompts: () => getAllPromptsMock(),
  getAllFolders: () => getAllFoldersMock(),
}));

vi.mock("../../../src/renderer/services/database-backup", () => ({
  exportDatabase: (...args: unknown[]) => exportDatabaseMock(...args),
  restoreFromBackup: (...args: unknown[]) => restoreFromBackupMock(...args),
}));

vi.mock("../../../src/renderer/services/settings-snapshot", () => ({
  getSettingsStateSnapshot: (...args: unknown[]) =>
    getSettingsStateSnapshotMock(...args),
  restoreAiConfigSnapshot: (...args: unknown[]) =>
    restoreAiConfigSnapshotMock(...args),
  restoreSettingsStateSnapshot: (...args: unknown[]) =>
    restoreSettingsStateSnapshotMock(...args),
  SENSITIVE_SETTINGS_FIELDS: ["aiApiKey", "s3AccessKeyId"],
}));

function createAdapter(overrides?: {
  downloadText?: (path: string) => Promise<RemoteDownloadResult>;
  uploadText?: (path: string, content: string) => Promise<{ success: boolean; error?: string }>;
  stat?: (path: string) => Promise<RemoteStatResult>;
  prepareLegacyUpload?: () => Promise<void>;
  prepareIncrementalUpload?: (includeMedia: boolean) => Promise<void>;
}): RemoteSyncAdapter {
  return {
    paths: {
      legacy: "remote/legacy.json",
      manifest: "remote/manifest.json",
      data: "remote/data.json",
      image: (fileName: string) => `remote/images/${fileName}`,
      video: (fileName: string) => `remote/videos/${fileName}`,
    },
    prepareLegacyUpload:
      overrides?.prepareLegacyUpload || vi.fn().mockResolvedValue(undefined),
    prepareIncrementalUpload:
      overrides?.prepareIncrementalUpload ||
      vi.fn().mockResolvedValue(undefined),
    uploadText:
      overrides?.uploadText || vi.fn().mockResolvedValue({ success: true }),
    downloadText:
      overrides?.downloadText ||
      vi.fn().mockResolvedValue({ success: false, notFound: true }),
    stat: overrides?.stat,
  };
}

function createLegacyBackup(exportedAt: string) {
  return JSON.stringify({
    version: "3.1",
    exportedAt,
    prompts: [],
    folders: [],
    versions: [],
  });
}

function createManifest(updatedAt: string) {
  return JSON.stringify({
    version: "4.0",
    createdAt: updatedAt,
    updatedAt,
    dataHash: "deadbeef",
    images: {},
    videos: {},
    encrypted: false,
  });
}

function createIncrementalData(exportedAt: string) {
  return JSON.stringify({
    version: "4.0",
    exportedAt,
    prompts: [],
    folders: [],
    versions: [],
  });
}

describe("sync-backup-core", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useRealTimers();
    installWindowMocks();
    getAllPromptsMock.mockResolvedValue([]);
    getAllFoldersMock.mockResolvedValue([]);
    getSettingsStateSnapshotMock.mockReturnValue(undefined);
    exportDatabaseMock.mockResolvedValue({
      version: 1,
      exportedAt: "2026-01-01T00:00:00.000Z",
      prompts: [],
      folders: [],
      versions: [],
    });
    restoreFromBackupMock.mockResolvedValue(undefined);
    localStorage.clear();
  });

  describe("getRemoteSyncBackupTimestamp", () => {
    it("prefers incremental manifest timestamps before legacy backup timestamps", async () => {
      const stat = vi.fn(async (path: string) => {
        if (path.includes("manifest")) {
          return {
            exists: true,
            lastModified: "2026-01-03T00:00:00.000Z",
          };
        }

        return {
          exists: true,
          lastModified: "2026-01-01T00:00:00.000Z",
        };
      });
      const adapter = createAdapter({ stat });

      const result = await getRemoteSyncBackupTimestamp(adapter);

      expect(stat).toHaveBeenCalledTimes(1);
      expect(stat).toHaveBeenCalledWith("remote/manifest.json");
      expect(result).toEqual({
        exists: true,
        lastModified: "2026-01-03T00:00:00.000Z",
      });
    });

    it("falls back to parsing the legacy backup when manifest is unavailable", async () => {
      const downloadText = vi.fn(async (path: string) => {
        if (path.includes("manifest")) {
          return { success: false, notFound: true };
        }

        return {
          success: true,
          data: createLegacyBackup("2026-01-04T00:00:00.000Z"),
        };
      });
      const adapter = createAdapter({ downloadText, stat: undefined });

      const result = await getRemoteSyncBackupTimestamp(adapter);

      expect(downloadText).toHaveBeenNthCalledWith(1, "remote/manifest.json");
      expect(downloadText).toHaveBeenNthCalledWith(2, "remote/legacy.json");
      expect(result).toEqual({
        exists: true,
        lastModified: "2026-01-04T00:00:00.000Z",
      });
    });
  });

  describe("downloadSyncBackup", () => {
    it("falls back to the legacy backup payload when no incremental manifest exists", async () => {
      const downloadText = vi.fn(async (path: string) => {
        if (path.includes("manifest")) {
          return { success: false, notFound: true };
        }

        return {
          success: true,
          data: createLegacyBackup("2026-01-05T00:00:00.000Z"),
        };
      });
      const adapter = createAdapter({ downloadText, stat: undefined });

      const result = await downloadSyncBackup(adapter);

      expect(downloadText).toHaveBeenCalledWith("remote/manifest.json");
      expect(downloadText).toHaveBeenCalledWith("remote/legacy.json");
      expect(restoreFromBackupMock).toHaveBeenCalledWith(
        expect.objectContaining({
          exportedAt: "2026-01-05T00:00:00.000Z",
          prompts: [],
          folders: [],
          versions: [],
        }),
      );
      expect(result.success).toBe(true);
      expect(result.localChanged).toBe(true);
    });

    it("reports a decryption failure when encrypted incremental data cannot be decoded", async () => {
      const downloadText = vi.fn(async (path: string) => {
        if (path.includes("manifest")) {
          return {
            success: true,
            data: JSON.stringify({
              version: "4.0",
              createdAt: "2026-01-05T00:00:00.000Z",
              updatedAt: "2026-01-05T00:00:00.000Z",
              dataHash: "deadbeef",
              images: {},
              videos: {},
              encrypted: true,
            }),
          };
        }

        return {
          success: true,
          data: JSON.stringify({ data: "not-valid-base64" }),
        };
      });
      const adapter = createAdapter({ downloadText, stat: undefined });

      const result = await downloadSyncBackup(adapter, {
        encryptionPassword: "secret",
      });

      expect(result.success).toBe(false);
      expect(result.message).toContain("Decryption failed");
      expect(restoreFromBackupMock).not.toHaveBeenCalled();
    });
  });

  describe("incrementalUploadSyncBackup", () => {
    it("returns a no-op result when data and media already match the remote manifest", async () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date("2026-01-06T00:00:00.000Z"));

      const imageBase64 = "image-base64";
      const videoBase64 = "video-base64";
      exportDatabaseMock.mockResolvedValue({
        version: 1,
        exportedAt: "2026-01-01T00:00:00.000Z",
        prompts: [{ id: "prompt-1", videos: ["demo.mp4"] }],
        folders: [],
        versions: [],
        images: { "cover.png": imageBase64 },
      });
      window.electron.readVideoBase64.mockResolvedValue(videoBase64);

      const expectedDataString = JSON.stringify({
        version: "4.0",
        exportedAt: "2026-01-06T00:00:00.000Z",
        prompts: [{ id: "prompt-1", videos: ["demo.mp4"] }],
        folders: [],
        versions: [],
        aiConfig: undefined,
        settings: undefined,
        settingsUpdatedAt: undefined,
        rules: undefined,
        skills: undefined,
        skillVersions: undefined,
        skillFiles: undefined,
      });

      const manifest = JSON.stringify({
        version: "4.0",
        createdAt: "2026-01-06T00:00:00.000Z",
        updatedAt: "2026-01-06T00:00:00.000Z",
        dataHash: await computeHash(expectedDataString),
        images: {
          "cover.png": {
            hash: await computeHash(imageBase64),
            size: imageBase64.length,
            uploadedAt: "2026-01-06T00:00:00.000Z",
          },
        },
        videos: {
          "demo.mp4": {
            hash: await computeHash(videoBase64),
            size: videoBase64.length,
            uploadedAt: "2026-01-06T00:00:00.000Z",
          },
        },
        encrypted: false,
      });

      const prepareIncrementalUpload = vi.fn().mockResolvedValue(undefined);
      const downloadText = vi.fn(async (path: string) => {
        if (path.includes("manifest")) {
          return { success: true, data: manifest };
        }

        return { success: false, notFound: true };
      });
      const uploadText = vi.fn().mockResolvedValue({ success: true });
      const adapter = createAdapter({
        prepareIncrementalUpload,
        downloadText,
        uploadText,
      });

      const result = await incrementalUploadSyncBackup(adapter);

      expect(prepareIncrementalUpload).toHaveBeenCalledWith(true);
      expect(uploadText).not.toHaveBeenCalled();
      expect(result.success).toBe(true);
      expect(result.localChanged).toBe(false);
      expect(result.message).toContain("Already up to date");
      expect(result.details?.skipped).toBe(3);
    });
  });

  describe("autoSyncBackup", () => {
    it("uploads local data when the remote backup does not exist", async () => {
      const uploadText = vi.fn().mockResolvedValue({ success: true });
      const stat = vi.fn().mockResolvedValue({ exists: false });
      const adapter = createAdapter({ uploadText, stat });

      const result = await autoSyncBackup(adapter, { incrementalSync: false });

      expect(uploadText).toHaveBeenCalledTimes(1);
      expect(uploadText).toHaveBeenCalledWith(
        "remote/legacy.json",
        expect.any(String),
      );
      expect(result.success).toBe(true);
      expect(result.localChanged).toBe(false);
    });

    it("downloads remote data when the manifest timestamp is newer than local changes", async () => {
      getAllPromptsMock.mockResolvedValue([
        {
          id: "prompt-1",
          updatedAt: "2026-01-01T00:00:00.000Z",
        },
      ]);

      const stat = vi.fn().mockResolvedValue({
        exists: true,
        lastModified: "2026-01-03T00:00:00.000Z",
      });
      const downloadText = vi.fn(async (path: string) => {
        if (path.includes("manifest")) {
          return { success: true, data: createManifest("2026-01-03T00:00:00.000Z") };
        }

        return {
          success: true,
          data: createIncrementalData("2026-01-03T00:00:00.000Z"),
        };
      });
      const adapter = createAdapter({ stat, downloadText });

      const result = await autoSyncBackup(adapter);

      expect(downloadText).toHaveBeenCalledWith("remote/manifest.json");
      expect(downloadText).toHaveBeenCalledWith("remote/data.json");
      expect(restoreFromBackupMock).toHaveBeenCalledWith(
        expect.objectContaining({
          exportedAt: "2026-01-03T00:00:00.000Z",
        }),
      );
      expect(result.success).toBe(true);
      expect(result.localChanged).toBe(true);
    });

    it("treats settingsUpdatedAt as local activity when deciding to upload", async () => {
      getSettingsStateSnapshotMock.mockReturnValue({
        settingsUpdatedAt: "2026-01-04T00:00:00.000Z",
      });

      const stat = vi.fn().mockResolvedValue({
        exists: true,
        lastModified: "2026-01-03T00:00:00.000Z",
      });
      const uploadText = vi.fn().mockResolvedValue({ success: true });
      const adapter = createAdapter({
        stat,
        uploadText,
      });

      const result = await autoSyncBackup(adapter, { incrementalSync: false });

      expect(uploadText).toHaveBeenCalledTimes(1);
      expect(uploadText).toHaveBeenCalledWith(
        "remote/legacy.json",
        expect.any(String),
      );
      expect(result.success).toBe(true);
      expect(result.localChanged).toBe(false);
    });

    it("returns a no-op result when local and remote timestamps are equal", async () => {
      getAllPromptsMock.mockResolvedValue([
        {
          id: "prompt-1",
          updatedAt: "2026-01-03T00:00:00.000Z",
        },
      ]);

      const stat = vi.fn().mockResolvedValue({
        exists: true,
        lastModified: "2026-01-03T00:00:00.000Z",
      });
      const downloadText = vi.fn();
      const uploadText = vi.fn();
      const adapter = createAdapter({ stat, downloadText, uploadText });

      const result = await autoSyncBackup(adapter);

      expect(downloadText).not.toHaveBeenCalled();
      expect(uploadText).not.toHaveBeenCalled();
      expect(result.success).toBe(true);
      expect(result.localChanged).toBe(false);
      expect(result.message).toContain("Already up to date");
    });
  });
});
