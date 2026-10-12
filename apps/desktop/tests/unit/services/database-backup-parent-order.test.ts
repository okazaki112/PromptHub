import { beforeEach, describe, expect, it, vi } from "vitest";

import { restoreFromBackup } from "../../../src/renderer/services/database-backup";
import { installWindowMocks } from "../../helpers/window";

const clearDatabaseMock = vi.fn().mockResolvedValue(undefined);
const getDatabaseMock = vi.fn();
const getAllFoldersMock = vi.fn();
const getAllPromptsMock = vi.fn();
const restoreSettingsStateSnapshotMock = vi.fn();

vi.mock("../../../src/renderer/services/database", () => ({
  clearDatabase: () => clearDatabaseMock(),
  createOutputFormatItem: vi.fn(),
  getAllFolders: () => getAllFoldersMock(),
  getAllPrompts: () => getAllPromptsMock(),
  getDatabase: () => getDatabaseMock(),
  listPromptRelations: vi.fn().mockResolvedValue([]),
  listOutputFormatItems: vi.fn().mockResolvedValue([]),
}));

vi.mock("../../../src/renderer/services/settings-snapshot", () => ({
  getAiConfigSnapshot: vi.fn().mockReturnValue(undefined),
  getSettingsStateSnapshot: vi.fn().mockReturnValue(undefined),
  restoreAiConfigSnapshot: vi.fn(),
  restoreSettingsStateSnapshot: (...args: unknown[]) =>
    restoreSettingsStateSnapshotMock(...args),
}));

interface RecordedStore {
  added: unknown[];
}

function createRecordingDatabase(stores: Record<string, RecordedStore>) {
  return {
    transaction: () => {
      const transaction: {
        error: null;
        objectStore: (name: string) => {
          add: ReturnType<typeof vi.fn>;
          getAll: ReturnType<typeof vi.fn>;
        };
        oncomplete: (() => void) | null;
        onerror: (() => void) | null;
      } = {
        error: null,
        objectStore: (name: string) => ({
          add: vi.fn((value: unknown) => {
            stores[name] = stores[name] ?? { added: [] };
            stores[name].added.push(value);
          }),
          getAll: vi.fn(() => {
            const request: {
              result: unknown[];
              onsuccess: (() => void) | null;
              onerror: (() => void) | null;
            } = { result: [], onsuccess: null, onerror: null };
            queueMicrotask(() => request.onsuccess?.());
            return request;
          }),
        }),
        oncomplete: null,
        onerror: null,
      };

      queueMicrotask(() => transaction.oncomplete?.());
      return transaction;
    },
  };
}

function promptRow(id: string, parentId: string | null) {
  return {
    id,
    title: `${id} title`,
    userPrompt: `${id} content`,
    parentId,
    createdAt: "2026-04-07T00:00:00.000Z",
    updatedAt: "2026-04-07T00:00:00.000Z",
    order: 0,
  };
}

describe("database-backup prompt hierarchy restore", () => {
  let stores: Record<string, RecordedStore>;

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    stores = {};
    getAllFoldersMock.mockResolvedValue([]);
    getAllPromptsMock.mockResolvedValue([]);
    getDatabaseMock.mockResolvedValue(createRecordingDatabase(stores));

    installWindowMocks();
  });

  it("writes prompts parent-first into IndexedDB when no batch restore exists", async () => {
    const parentPrompt = promptRow("prompt-parent", null);
    const childPrompt = promptRow("prompt-child", "prompt-parent");

    await restoreFromBackup({
      version: 1,
      exportedAt: "2026-04-07T00:00:00.000Z",
      prompts: [childPrompt, parentPrompt],
      folders: [],
      versions: [],
    } as never);

    expect((stores.prompts?.added ?? []).map((row) => (row as { id: string }).id)).toEqual([
      "prompt-parent",
      "prompt-child",
    ]);
  });

  it("writes a multi-level prompt chain parent-first when no batch restore exists", async () => {
    const rootPrompt = promptRow("prompt-root", null);
    const midPrompt = promptRow("prompt-mid", "prompt-root");
    const leafPrompt = promptRow("prompt-leaf", "prompt-mid");

    await restoreFromBackup({
      version: 1,
      exportedAt: "2026-04-07T00:00:00.000Z",
      prompts: [leafPrompt, rootPrompt, midPrompt],
      folders: [],
      versions: [],
    } as never);

    expect((stores.prompts?.added ?? []).map((row) => (row as { id: string }).id)).toEqual([
      "prompt-root",
      "prompt-mid",
      "prompt-leaf",
    ]);
  });

  it("writes folders parent-first into IndexedDB when no batch restore exists", async () => {
    const parentFolder = {
      id: "folder-parent",
      name: "Parent",
      createdAt: "2026-04-07T00:00:00.000Z",
      updatedAt: "2026-04-07T00:00:00.000Z",
      order: 0,
    };
    const childFolder = {
      id: "folder-child",
      name: "Child",
      parentId: "folder-parent",
      createdAt: "2026-04-07T00:00:01.000Z",
      updatedAt: "2026-04-07T00:00:01.000Z",
      order: 0,
    };

    await restoreFromBackup({
      version: 1,
      exportedAt: "2026-04-07T00:00:00.000Z",
      prompts: [promptRow("prompt-1", null)],
      folders: [childFolder, parentFolder],
      versions: [],
    } as never);

    expect((stores.folders?.added ?? []).map((row) => (row as { id: string }).id)).toEqual([
      "folder-parent",
      "folder-child",
    ]);
  });

  it("falls back to row-by-row inserts parent-first for runtimes without the batch channel", async () => {
    const parentFolder = {
      id: "folder-parent",
      name: "Parent",
      createdAt: "2026-04-07T00:00:00.000Z",
      updatedAt: "2026-04-07T00:00:00.000Z",
      order: 0,
    };
    const childFolder = {
      id: "folder-child",
      name: "Child",
      parentId: "folder-parent",
      createdAt: "2026-04-07T00:00:01.000Z",
      updatedAt: "2026-04-07T00:00:01.000Z",
      order: 0,
    };
    const insertFolderDirect = vi.fn().mockResolvedValue(undefined);

    installWindowMocks({
      api: {
        prompt: {
          getAll: vi.fn().mockResolvedValue([]),
          delete: vi.fn().mockResolvedValue(true),
          insertDirect: vi.fn().mockResolvedValue(undefined),
          syncWorkspace: vi.fn().mockResolvedValue(undefined),
        },
        folder: {
          getAll: vi.fn().mockResolvedValue([]),
          delete: vi.fn().mockResolvedValue(true),
          insertDirect: insertFolderDirect,
        },
        version: {
          insertDirect: vi.fn().mockResolvedValue(undefined),
        },
        skill: {
          deleteAll: vi.fn().mockResolvedValue(undefined),
        },
      },
    });

    await restoreFromBackup({
      version: 1,
      exportedAt: "2026-04-07T00:00:00.000Z",
      prompts: [],
      folders: [childFolder, parentFolder],
      versions: [],
    } as never);

    expect(insertFolderDirect).toHaveBeenNthCalledWith(1, parentFolder);
    expect(insertFolderDirect).toHaveBeenNthCalledWith(2, childFolder);
    expect(stores.folders).toBeUndefined();
  });

  it("hands the unsorted hierarchy to the batch restore in a single call", async () => {
    const restoreBatch = vi.fn().mockResolvedValue({
      restored: true,
      promptCount: 2,
      folderCount: 1,
      versionCount: 0,
      relationCount: 0,
      outputFormatCount: 0,
    });
    installWindowMocks({
      api: {
        prompt: { restoreBatch },
        skill: { deleteAll: vi.fn().mockResolvedValue(undefined) },
      },
    });

    const parentPrompt = promptRow("prompt-parent", null);
    const childPrompt = promptRow("prompt-child", "prompt-parent");

    await restoreFromBackup({
      version: 1,
      exportedAt: "2026-04-07T00:00:00.000Z",
      prompts: [childPrompt, parentPrompt],
      folders: [
        {
          id: "folder-1",
          name: "Folder",
          createdAt: "2026-04-07T00:00:00.000Z",
          updatedAt: "2026-04-07T00:00:00.000Z",
          order: 0,
        },
      ],
      versions: [],
    } as never);

    expect(restoreBatch).toHaveBeenCalledTimes(1);
    expect(stores.prompts).toBeUndefined();

    const payload = restoreBatch.mock.calls[0]?.[0] as {
      prompts: Array<{ id: string }>;
      folders: Array<{ id: string }>;
    };
    expect(payload.prompts.map((row) => row.id).sort()).toEqual([
      "prompt-child",
      "prompt-parent",
    ]);
    expect(payload.folders.map((row) => row.id)).toEqual(["folder-1"]);
  });
});
