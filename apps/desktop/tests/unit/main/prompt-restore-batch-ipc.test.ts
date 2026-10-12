/**
 * @vitest-environment node
 */
import os from "os";
import path from "path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { IPC_CHANNELS } from "@prompthub/shared/constants/ipc-channels";
import type { Folder, Prompt, PromptVersion } from "@prompthub/shared/types";

import { FolderDB } from "../../../src/main/database/folder";
import { PromptDB } from "../../../src/main/database/prompt";
import { SCHEMA_INDEXES, SCHEMA_TABLES } from "../../../src/main/database/schema";
import DatabaseAdapter from "../../../src/main/database/sqlite";
import { registerPromptIPC } from "../../../src/main/ipc/prompt.ipc";
import {
  configureRuntimePaths,
  resetRuntimePaths,
} from "../../../src/main/runtime-paths";

const { handleMock, syncMock } = vi.hoisted(() => ({
  handleMock: vi.fn(),
  syncMock: vi.fn(() => ({
    promptCount: 0,
    folderCount: 0,
    versionCount: 0,
  })),
}));

vi.mock("electron", () => ({
  ipcMain: { handle: handleMock },
}));

vi.mock("../../../src/main/services/prompt-workspace", () => ({
  syncPromptWorkspaceFromDatabase: syncMock,
}));

type IpcHandler = (
  event: unknown,
  payload: unknown,
) => Promise<Record<string, unknown>>;

function restorePayload(): {
  folders: Folder[];
  prompts: Prompt[];
  versions: PromptVersion[];
} {
  const now = "2026-10-12T00:00:00.000Z";
  return {
    folders: [
      {
        id: "folder-1",
        name: "Folder",
        parentId: null,
        order: 0,
        createdAt: now,
        updatedAt: now,
      } as Folder,
    ],
    prompts: [
      {
        id: "prompt-1",
        title: "First",
        userPrompt: "one",
        systemPrompt: "",
        folderId: "folder-1",
        parentId: null,
        variables: [],
        tags: [],
        createdAt: now,
        updatedAt: now,
        order: 0,
      } as unknown as Prompt,
      {
        id: "prompt-2",
        title: "Second",
        userPrompt: "two",
        systemPrompt: "",
        folderId: "folder-1",
        parentId: "prompt-1",
        variables: [],
        tags: [],
        createdAt: now,
        updatedAt: now,
        order: 0,
      } as unknown as Prompt,
    ],
    versions: [
      {
        id: "version-1",
        promptId: "prompt-1",
        version: 1,
        systemPrompt: "",
        userPrompt: "one",
        variables: [],
        createdAt: 1,
      } as unknown as PromptVersion,
    ],
  };
}

describe("prompt restore batch IPC", () => {
  let rawDb: DatabaseAdapter.Database;
  let handlers: Record<string, IpcHandler>;

  beforeEach(() => {
    vi.clearAllMocks();
    configureRuntimePaths({
      userDataPath: path.join(os.tmpdir(), "prompthub-restore-batch-ipc"),
    });

    rawDb = new DatabaseAdapter(":memory:");
    rawDb.pragma("foreign_keys = ON");
    rawDb.exec(SCHEMA_TABLES);
    rawDb.exec(SCHEMA_INDEXES);

    registerPromptIPC(new PromptDB(rawDb), new FolderDB(rawDb), rawDb);

    handlers = Object.fromEntries(
      handleMock.mock.calls.map(([channel, handler]) => [channel, handler]),
    ) as Record<string, IpcHandler>;
  });

  afterEach(() => {
    rawDb.close();
    resetRuntimePaths();
  });

  it("rebuilds the workspace exactly once per batch restore", async () => {
    const handler = handlers[IPC_CHANNELS.PROMPT_RESTORE_BATCH];
    expect(handler).toBeTypeOf("function");

    const result = await handler(null, restorePayload());

    expect(result).toMatchObject({ restored: true, promptCount: 2 });
    expect(syncMock).toHaveBeenCalledTimes(1);
  });

  it("skips the workspace rebuild when the batch restore fails", async () => {
    const handler = handlers[IPC_CHANNELS.PROMPT_RESTORE_BATCH];

    const result = await handler(null, {
      ...restorePayload(),
      versions: [
        {
          id: "version-ghost",
          promptId: "prompt-missing",
          version: 1,
          systemPrompt: "",
          userPrompt: "ghost",
          variables: [],
          createdAt: 1,
        } as unknown as PromptVersion,
      ],
    });

    expect(result.restored).toBe(false);
    expect(typeof result.error).toBe("string");
    expect(syncMock).not.toHaveBeenCalled();
  });
});
