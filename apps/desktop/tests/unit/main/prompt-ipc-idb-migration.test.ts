/**
 * @vitest-environment node
 */
import fs from "fs";
import os from "os";
import path from "path";

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { IPC_CHANNELS } from "@prompthub/shared/constants/ipc-channels";
import type { Folder, Prompt, PromptVersion } from "@prompthub/shared/types";

import DatabaseAdapter from "../../../src/main/database/sqlite";
import { FolderDB } from "../../../src/main/database/folder";
import { PromptDB } from "../../../src/main/database/prompt";
import { SCHEMA_INDEXES, SCHEMA_TABLES } from "../../../src/main/database/schema";
import { registerPromptIPC } from "../../../src/main/ipc/prompt.ipc";
import {
  configureRuntimePaths,
  resetRuntimePaths,
} from "../../../src/main/runtime-paths";

const { handleMock } = vi.hoisted(() => ({
  handleMock: vi.fn(),
}));

vi.mock("electron", () => ({
  ipcMain: {
    handle: handleMock,
  },
}));

describe("prompt IPC IDB migration", () => {
  let tempDir: string;
  let rawDb: DatabaseAdapter.Database;
  let promptDb: PromptDB;
  let folderDb: FolderDB;

  beforeEach(() => {
    handleMock.mockReset();
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "prompthub-idb-migration-"));
    configureRuntimePaths({ userDataPath: tempDir });

    rawDb = new DatabaseAdapter(":memory:");
    rawDb.pragma("journal_mode = WAL");
    rawDb.pragma("foreign_keys = ON");
    rawDb.exec(SCHEMA_TABLES);
    rawDb.exec(SCHEMA_INDEXES);

    promptDb = new PromptDB(rawDb);
    folderDb = new FolderDB(rawDb);
    registerPromptIPC(promptDb, folderDb, rawDb);
  });

  afterEach(() => {
    rawDb.close();
    resetRuntimePaths();
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  it("imports parent-child folders even when payload order is child-first", async () => {
    const handlers = Object.fromEntries(
      handleMock.mock.calls.map(([channel, handler]) => [channel, handler]),
    ) as Record<string, (...args: unknown[]) => Promise<unknown>>;

    const folders: Folder[] = [
      {
        id: "child-folder",
        name: "Child",
        parentId: "parent-folder",
        order: 1,
        isPrivate: false,
        visibility: "private",
        createdAt: "2026-04-21T00:00:00.000Z",
        updatedAt: "2026-04-21T00:00:00.000Z",
      },
      {
        id: "parent-folder",
        name: "Parent",
        parentId: null,
        order: 0,
        isPrivate: false,
        visibility: "private",
        createdAt: "2026-04-21T00:00:00.000Z",
        updatedAt: "2026-04-21T00:00:00.000Z",
      },
    ];

    const prompts: Prompt[] = [
      {
        id: "prompt-1",
        title: "Migrated prompt",
        description: null,
        promptType: "text",
        systemPrompt: null,
        systemPromptEn: null,
        userPrompt: "hello",
        userPromptEn: null,
        variables: [],
        tags: [],
        folderId: "child-folder",
        images: [],
        videos: [],
        isFavorite: false,
        isPinned: false,
        currentVersion: 1,
        version: 1,
        usageCount: 0,
        source: null,
        notes: null,
        lastAiResponse: null,
        createdAt: "2026-04-21T00:00:00.000Z",
        updatedAt: "2026-04-21T00:00:00.000Z",
      },
    ];

    const versions: PromptVersion[] = [
      {
        id: "version-1",
        promptId: "prompt-1",
        version: 1,
        systemPrompt: null,
        systemPromptEn: null,
        userPrompt: "hello",
        userPromptEn: null,
        variables: [],
        note: null,
        aiResponse: null,
        createdAt: "2026-04-21T00:00:00.000Z",
      },
    ];

    const result = (await handlers[IPC_CHANNELS.PROMPT_MIGRATE_IDB_BATCH](null, {
      folders,
      prompts,
      versions,
    })) as {
      imported: boolean;
      folderCount: number;
      promptCount: number;
      versionCount: number;
    };

    expect(result).toEqual({
      imported: true,
      folderCount: 2,
      promptCount: 1,
      versionCount: 1,
    });
    expect(folderDb.getById("child-folder")?.parentId).toBe("parent-folder");
    expect(promptDb.getById("prompt-1")?.folderId).toBe("child-folder");
  });
});
