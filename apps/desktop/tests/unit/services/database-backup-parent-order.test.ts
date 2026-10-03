import { beforeEach, describe, expect, it, vi } from "vitest";

import { restoreFromBackup } from "../../../src/renderer/services/database-backup";
import { installWindowMocks } from "../../helpers/window";

const clearDatabaseMock = vi.fn().mockResolvedValue(undefined);
const getDatabaseMock = vi.fn();
const getAllFoldersMock = vi.fn();
const getAllPromptsMock = vi.fn();
const createOutputFormatItemMock = vi.fn();
const listOutputFormatItemsMock = vi.fn();
const listPromptRelationsMock = vi.fn();
const restoreAiConfigSnapshotMock = vi.fn();
const restoreSettingsStateSnapshotMock = vi.fn();
const getAiConfigSnapshotMock = vi.fn();
const getSettingsStateSnapshotMock = vi.fn();

vi.mock("../../../src/renderer/services/database", () => ({
  clearDatabase: () => clearDatabaseMock(),
  createOutputFormatItem: (...args: unknown[]) =>
    createOutputFormatItemMock(...args),
  getAllFolders: () => getAllFoldersMock(),
  getAllPrompts: () => getAllPromptsMock(),
  getDatabase: () => getDatabaseMock(),
  listPromptRelations: (...args: unknown[]) => listPromptRelationsMock(...args),
  listOutputFormatItems: (...args: unknown[]) =>
    listOutputFormatItemsMock(...args),
}));

vi.mock("../../../src/renderer/services/settings-snapshot", () => ({
  getAiConfigSnapshot: (...args: unknown[]) => getAiConfigSnapshotMock(...args),
  getSettingsStateSnapshot: (...args: unknown[]) =>
    getSettingsStateSnapshotMock(...args),
  restoreAiConfigSnapshot: (...args: unknown[]) =>
    restoreAiConfigSnapshotMock(...args),
  restoreSettingsStateSnapshot: (...args: unknown[]) =>
    restoreSettingsStateSnapshotMock(...args),
}));

function createTransactionMock(getAllResult: unknown[] = []) {
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
    objectStore: () => ({
      add: vi.fn(),
      getAll: vi.fn(() => {
        const request: {
          result?: unknown[];
          onsuccess: (() => void) | null;
          onerror: (() => void) | null;
        } = {
          result: getAllResult,
          onsuccess: null,
          onerror: null,
        };
        queueMicrotask(() => {
          request.onsuccess?.();
        });
        return request;
      }),
    }),
    oncomplete: null,
    onerror: null,
  };

  queueMicrotask(() => {
    transaction.oncomplete?.();
  });

  return transaction;
}

describe("database-backup prompt hierarchy restore", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    getAllFoldersMock.mockResolvedValue([]);
    getAllPromptsMock.mockResolvedValue([]);
    createOutputFormatItemMock.mockResolvedValue(undefined);
    listPromptRelationsMock.mockResolvedValue([]);
    listOutputFormatItemsMock.mockResolvedValue([]);
    getAiConfigSnapshotMock.mockReturnValue(undefined);
    getSettingsStateSnapshotMock.mockReturnValue(undefined);
    getDatabaseMock.mockResolvedValue({
      transaction: () => createTransactionMock(),
    });

    installWindowMocks();
  });

  it("restores prompts in parent-first order even when backup payload is unsorted", async () => {
    const parentPrompt = {
      id: "prompt-parent",
      title: "Parent prompt",
      userPrompt: "parent content",
      createdAt: "2026-04-07T00:00:00.000Z",
      updatedAt: "2026-04-07T00:00:00.000Z",
      order: 0,
    };
    const childPrompt = {
      id: "prompt-child",
      title: "Child prompt",
      userPrompt: "child content",
      parentId: "prompt-parent",
      createdAt: "2026-04-07T00:00:01.000Z",
      updatedAt: "2026-04-07T00:00:01.000Z",
      order: 0,
    };

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
          insertDirect: vi.fn().mockResolvedValue(undefined),
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
      prompts: [childPrompt, parentPrompt],
      folders: [],
      versions: [],
    });

    expect(window.api.prompt.insertDirect).toHaveBeenNthCalledWith(
      1,
      parentPrompt,
    );
    expect(window.api.prompt.insertDirect).toHaveBeenNthCalledWith(
      2,
      childPrompt,
    );
  });

  it("restores a multi-level prompt chain parent-first from an unsorted payload", async () => {
    const rootPrompt = {
      id: "prompt-root",
      title: "Root prompt",
      userPrompt: "root content",
      createdAt: "2026-04-07T00:00:00.000Z",
      updatedAt: "2026-04-07T00:00:00.000Z",
      order: 0,
    };
    const midPrompt = {
      id: "prompt-mid",
      title: "Mid prompt",
      userPrompt: "mid content",
      parentId: "prompt-root",
      createdAt: "2026-04-07T00:00:01.000Z",
      updatedAt: "2026-04-07T00:00:01.000Z",
      order: 0,
    };
    const leafPrompt = {
      id: "prompt-leaf",
      title: "Leaf prompt",
      userPrompt: "leaf content",
      parentId: "prompt-mid",
      createdAt: "2026-04-07T00:00:02.000Z",
      updatedAt: "2026-04-07T00:00:02.000Z",
      order: 0,
    };

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
          insertDirect: vi.fn().mockResolvedValue(undefined),
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
      prompts: [leafPrompt, rootPrompt, midPrompt],
      folders: [],
      versions: [],
    });

    expect(window.api.prompt.insertDirect).toHaveBeenNthCalledWith(
      1,
      rootPrompt,
    );
    expect(window.api.prompt.insertDirect).toHaveBeenNthCalledWith(
      2,
      midPrompt,
    );
    expect(window.api.prompt.insertDirect).toHaveBeenNthCalledWith(
      3,
      leafPrompt,
    );
  });
});
