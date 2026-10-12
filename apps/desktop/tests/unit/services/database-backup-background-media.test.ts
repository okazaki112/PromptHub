import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  downloadSelectiveExport,
  exportDatabase,
  restoreFromBackup,
} from "../../../src/renderer/services/database-backup";
import { installWindowMocks } from "../../helpers/window";

const getAllPromptsMock = vi.fn();
const getAllFoldersMock = vi.fn();
const getSettingsStateSnapshotMock = vi.fn();
const restoreSettingsStateSnapshotMock = vi.fn();

vi.mock("../../../src/renderer/services/database", () => ({
  clearDatabase: vi.fn().mockResolvedValue(undefined),
  createOutputFormatItem: vi.fn(),
  getAllFolders: () => getAllFoldersMock(),
  getAllPrompts: () => getAllPromptsMock(),
  getDatabase: vi.fn(),
  listPromptRelations: vi.fn().mockResolvedValue([]),
  listOutputFormatItems: vi.fn().mockResolvedValue([]),
}));

vi.mock("../../../src/renderer/services/settings-snapshot", () => ({
  getAiConfigSnapshot: vi.fn().mockReturnValue(undefined),
  getSettingsStateSnapshot: (...args: unknown[]) =>
    getSettingsStateSnapshotMock(...args),
  restoreAiConfigSnapshot: vi.fn(),
  restoreSettingsStateSnapshot: (...args: unknown[]) =>
    restoreSettingsStateSnapshotMock(...args),
}));

const REFERENCED_IMAGE = "referenced.png";
const BACKGROUND_IMAGE = "background.png";

interface ExportZipScopeArg {
  imageFileNames?: string[];
  backgroundImage?: boolean;
  backgroundImageFileName?: string;
  exportJson?: string;
}

function promptReferencingImage() {
  return {
    id: "prompt-bg-1",
    title: "BG Prompt",
    description: "",
    systemPrompt: "",
    userPrompt: "user",
    variables: [],
    tags: [],
    folderId: null,
    createdAt: "2026-10-12T00:00:00.000Z",
    updatedAt: "2026-10-12T00:00:00.000Z",
    version: 1,
    currentVersion: 1,
    usageCount: 0,
    isFavorite: false,
    isPinned: false,
    promptType: "text",
    images: [REFERENCED_IMAGE],
  };
}

function installMediaMocks(backgroundFileName?: string) {
  getAllPromptsMock.mockResolvedValue([promptReferencingImage()]);
  getAllFoldersMock.mockResolvedValue([]);
  getSettingsStateSnapshotMock.mockReturnValue({
    state: backgroundFileName
      ? { backgroundImageFileName: backgroundFileName }
      : {},
    settingsUpdatedAt: "2026-10-12T00:00:00.000Z",
  });
  installWindowMocks({
    api: {
      prompt: {
        getAll: vi.fn().mockResolvedValue([]),
        delete: vi.fn().mockResolvedValue(undefined),
        insertDirect: vi.fn().mockResolvedValue(undefined),
        syncWorkspace: vi.fn().mockResolvedValue(undefined),
      },
      folder: {
        getAll: vi.fn().mockResolvedValue([]),
        delete: vi.fn().mockResolvedValue(undefined),
        insertDirect: vi.fn().mockResolvedValue(undefined),
      },
      version: {
        getAll: vi.fn().mockResolvedValue([]),
        insertDirect: vi.fn().mockResolvedValue(undefined),
      },
      skill: { getAll: vi.fn().mockResolvedValue([]) },
      rules: { list: vi.fn().mockResolvedValue([]) },
    },
    electron: {
      getImageSize: vi.fn().mockResolvedValue(16),
      readImageBase64: vi.fn((fileName: string) =>
        Promise.resolve(
          fileName === BACKGROUND_IMAGE ? "bg-base64" : "ref-base64",
        ),
      ),
      saveImageBase64: vi.fn().mockResolvedValue(undefined),
    },
  });
}

function firstExportZipScope(): ExportZipScopeArg {
  const call = window.electron.exportZip.mock.calls[0]?.[0] as {
    scope: ExportZipScopeArg;
  };
  return call.scope;
}

function embeddedPayloadImages(
  scope: ExportZipScopeArg,
): Record<string, string> | undefined {
  const parsed = JSON.parse(String(scope.exportJson)) as {
    payload: { images?: Record<string, string> };
  };
  return parsed.payload.images;
}

describe("selective export background media", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("exports the selected background image as restorable media", async () => {
    installMediaMocks(BACKGROUND_IMAGE);

    const backup = await exportDatabase();

    expect(backup.images).toEqual({
      [REFERENCED_IMAGE]: "ref-base64",
      [BACKGROUND_IMAGE]: "bg-base64",
    });
    expect(window.electron.readImageBase64).toHaveBeenCalledWith(
      BACKGROUND_IMAGE,
    );
  });

  it("keeps the background file when only the background scope is selected", async () => {
    installMediaMocks(BACKGROUND_IMAGE);

    await downloadSelectiveExport({ images: false, backgroundImage: true });

    const scope = firstExportZipScope();
    expect(scope.imageFileNames).toEqual([]);
    expect(scope.backgroundImageFileName).toBe(BACKGROUND_IMAGE);
    expect(embeddedPayloadImages(scope)).toEqual({
      [BACKGROUND_IMAGE]: "bg-base64",
    });
  });

  it("drops the background file when the background scope is off", async () => {
    installMediaMocks(BACKGROUND_IMAGE);

    await downloadSelectiveExport({ images: true, backgroundImage: false });

    const scope = firstExportZipScope();
    expect(scope.imageFileNames).toEqual([REFERENCED_IMAGE]);
    expect(scope.backgroundImageFileName).toBeUndefined();
    expect(embeddedPayloadImages(scope)).toEqual({
      [REFERENCED_IMAGE]: "ref-base64",
    });
  });

  it("restores the background image file from exported media", async () => {
    installMediaMocks(BACKGROUND_IMAGE);

    await restoreFromBackup({
      version: 1,
      exportedAt: "2026-10-12T00:00:00.000Z",
      prompts: [],
      folders: [],
      versions: [],
      images: { [BACKGROUND_IMAGE]: "bg-base64" },
      settings: { state: { backgroundImageFileName: BACKGROUND_IMAGE } },
    } as never);

    expect(window.electron.saveImageBase64).toHaveBeenCalledWith(
      BACKGROUND_IMAGE,
      "bg-base64",
    );
    expect(restoreSettingsStateSnapshotMock).toHaveBeenCalledWith({
      state: { backgroundImageFileName: BACKGROUND_IMAGE },
    });
  });
});
