/**
 * @vitest-environment node
 */
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import {
  PromptOutputFormatDB,
  PromptRelationDB,
} from "../../../src/main/database";
import { FolderDB } from "../../../src/main/database/folder";
import { PromptDB } from "../../../src/main/database/prompt";
import { SCHEMA_INDEXES, SCHEMA_TABLES } from "../../../src/main/database/schema";
import DatabaseAdapter from "../../../src/main/database/sqlite";
import {
  restorePromptSnapshotBatch,
  type PromptRestoreBatchDependencies,
} from "../../../src/main/services/prompt-restore-batch";
import type {
  Folder,
  OutputFormatItem,
  Prompt,
  PromptRelation,
  PromptRestoreBatchPayload,
  PromptVersion,
} from "@prompthub/shared/types";

interface SeededGraph {
  parentFolder: Folder;
  childFolder: Folder;
  prompts: Prompt[];
}

function byId<T extends { id: string }>(items: T[]): Record<string, T> {
  return Object.fromEntries(items.map((item) => [item.id, item]));
}

function reversed<T>(items: T[]): T[] {
  return [...items].reverse();
}

describe("restorePromptSnapshotBatch", () => {
  let rawDb: DatabaseAdapter.Database;
  let promptDb: PromptDB;
  let folderDb: FolderDB;
  let relationDb: PromptRelationDB;
  let outputFormatDb: PromptOutputFormatDB;
  let deps: PromptRestoreBatchDependencies;

  beforeEach(() => {
    rawDb = new DatabaseAdapter(":memory:");
    rawDb.pragma("foreign_keys = ON");
    rawDb.exec(SCHEMA_TABLES);
    rawDb.exec(SCHEMA_INDEXES);

    promptDb = new PromptDB(rawDb);
    folderDb = new FolderDB(rawDb);
    relationDb = new PromptRelationDB(rawDb);
    outputFormatDb = new PromptOutputFormatDB(rawDb);
    deps = { promptDb, folderDb, relationDb, outputFormatDb, rawDb };
  });

  afterEach(() => {
    rawDb.close();
  });

  function seedGraph(prefix: string): SeededGraph {
    const parentFolder = folderDb.create({ name: `${prefix} parent` });
    const childFolder = folderDb.create({
      name: `${prefix} child`,
      parentId: parentFolder.id,
    });

    const first = promptDb.create({
      title: `${prefix} first`,
      systemPrompt: "system",
      userPrompt: "body v1",
      folderId: childFolder.id,
      variables: [],
      tags: ["alpha"],
    });
    promptDb.update(first.id, { userPrompt: "body v2" });

    const second = promptDb.create({
      title: `${prefix} second`,
      systemPrompt: "",
      userPrompt: "second body",
      folderId: parentFolder.id,
      variables: [],
      tags: [],
    });

    const child = promptDb.create({
      title: `${prefix} child`,
      systemPrompt: "",
      userPrompt: "child body",
      parentId: first.id,
      folderId: parentFolder.id,
      variables: [],
      tags: [],
    });

    relationDb.create({
      sourcePromptId: first.id,
      targetPromptId: second.id,
      kind: "depends_on",
    });
    outputFormatDb.create({
      sourcePromptId: first.id,
      targetPromptId: second.id,
    });

    return { parentFolder, childFolder, prompts: [first, second, child] };
  }

  function takeSnapshot(): PromptRestoreBatchPayload {
    const prompts = promptDb.getAll();
    const versions: PromptVersion[] = prompts.flatMap((prompt) =>
      promptDb.getVersions(prompt.id),
    );

    return {
      folders: folderDb.getAll(),
      prompts,
      versions,
      promptRelations: relationDb.list(),
      outputFormatItems: outputFormatDb.list(),
    };
  }

  function liveState() {
    return {
      folders: folderDb.getAll(),
      prompts: promptDb.getAll(),
      relations: relationDb.list(),
      outputFormats: outputFormatDb.list(),
    };
  }

  it("restores the captured prompt graph exactly", () => {
    seedGraph("keep-");
    const snapshot = takeSnapshot();

    seedGraph("live-");

    const result = restorePromptSnapshotBatch(deps, snapshot);

    expect(result).toMatchObject({
      restored: true,
      folderCount: 2,
      promptCount: 3,
      relationCount: 1,
      outputFormatCount: 1,
    });
    expect(result.versionCount).toBe(snapshot.versions.length);

    const live = liveState();
    expect(live.prompts.map((prompt) => prompt.id).sort()).toEqual(
      snapshot.prompts.map((prompt) => prompt.id).sort(),
    );
    expect(live.folders.map((folder) => folder.id).sort()).toEqual(
      snapshot.folders.map((folder) => folder.id).sort(),
    );

    const restoredPrompts = byId(live.prompts);
    const firstSnapshotPrompt = snapshot.prompts.find(
      (prompt) => prompt.title === "keep- first",
    )!;
    expect(restoredPrompts[firstSnapshotPrompt.id].title).toBe("keep- first");
    expect(restoredPrompts[firstSnapshotPrompt.id].folderId).toBe(
      snapshot.folders.find((folder) => folder.name === "keep- child")!.id,
    );
    expect(
      restoredPrompts[
        snapshot.prompts.find((prompt) => prompt.title === "keep- child")!.id
      ].parentId,
    ).toBe(firstSnapshotPrompt.id);

    const restoredFolders = byId(live.folders);
    expect(
      snapshot.folders
        .filter((folder) => folder.parentId)
        .every((folder) => restoredFolders[folder.parentId!] !== undefined),
    ).toBe(true);
    expect(live.folders.length).toBe(snapshot.folders.length);

    expect(live.relations).toEqual(snapshot.promptRelations);
    expect(live.outputFormats).toEqual(snapshot.outputFormatItems);
    expect(
      promptDb
        .getVersions(firstSnapshotPrompt.id)
        .map((version) => version.id)
        .sort(),
    ).toEqual(
      snapshot.versions
        .filter((version) => version.promptId === firstSnapshotPrompt.id)
        .map((version) => version.id)
        .sort(),
    );
  });

  it("accepts collections ordered child before parent", () => {
    seedGraph("keep-");
    const snapshot = takeSnapshot();
    seedGraph("live-");

    const result = restorePromptSnapshotBatch(deps, {
      folders: reversed(snapshot.folders),
      prompts: reversed(snapshot.prompts),
      versions: reversed(snapshot.versions),
      promptRelations: reversed(snapshot.promptRelations ?? []),
      outputFormatItems: reversed(snapshot.outputFormatItems ?? []),
    });

    expect(result.restored).toBe(true);
    const live = liveState();
    expect(live.prompts.map((prompt) => prompt.id).sort()).toEqual(
      snapshot.prompts.map((prompt) => prompt.id).sort(),
    );
    expect(
      live.folders.find((folder) => folder.name === "keep- child")!.parentId,
    ).toBe(snapshot.folders.find((folder) => folder.name === "keep- parent")!.id);
  });

  it("rolls the whole restore back when a row violates constraints", () => {
    seedGraph("keep-");
    const snapshot = takeSnapshot();
    seedGraph("live-");
    const before = liveState();

    const brokenVersion = {
      id: "version-ghost",
      promptId: "does-not-exist",
      version: 1,
      systemPrompt: "",
      userPrompt: "ghost",
      variables: [],
      createdAt: 1,
    } as unknown as PromptVersion;

    const result = restorePromptSnapshotBatch(deps, {
      ...snapshot,
      versions: [...snapshot.versions, brokenVersion],
    });

    expect(result.restored).toBe(false);
    expect(result.error).toBeTruthy();
    expect(liveState()).toEqual(before);
  });

  it("drops graph rows whose endpoints are not part of the restore", () => {
    const seeded = seedGraph("keep-");
    const snapshot = takeSnapshot();

    const selfRelation = {
      id: "relation-self",
      sourcePromptId: seeded.prompts[0].id,
      targetPromptId: seeded.prompts[0].id,
      kind: "related_to",
      note: null,
      createdAt: 1,
      updatedAt: 1,
    } as unknown as PromptRelation;
    const ghostRelation = {
      ...selfRelation,
      id: "relation-ghost",
      targetPromptId: "prompt-not-restored",
    } as unknown as PromptRelation;
    const ghostOutputFormat = {
      id: "output-ghost",
      sourcePromptId: seeded.prompts[0].id,
      targetPromptId: "prompt-not-restored",
      sortOrder: 1,
      createdAt: "2026-10-12T00:00:00.000Z",
      updatedAt: "2026-10-12T00:00:00.000Z",
    } as unknown as OutputFormatItem;

    const result = restorePromptSnapshotBatch(deps, {
      ...snapshot,
      promptRelations: [
        ...(snapshot.promptRelations ?? []),
        selfRelation,
        ghostRelation,
      ],
      outputFormatItems: [
        ...(snapshot.outputFormatItems ?? []),
        ghostOutputFormat,
      ],
    });

    expect(result.restored).toBe(true);
    expect(result.relationCount).toBe(snapshot.promptRelations?.length ?? 0);
    expect(result.outputFormatCount).toBe(
      snapshot.outputFormatItems?.length ?? 0,
    );

    const live = liveState();
    expect(live.relations).toEqual(snapshot.promptRelations);
    expect(live.outputFormats).toEqual(snapshot.outputFormatItems);
  });

  it.each([
    ["null", null],
    ["a non-object", "payload"],
    ["a missing folder collection", { prompts: [], versions: [] }],
    [
      "a non-object entry inside prompts",
      { folders: [], prompts: [null], versions: [] },
    ],
  ])("rejects %s without touching stored data", (_label, payload) => {
    seedGraph("live-");
    const before = liveState();

    const result = restorePromptSnapshotBatch(deps, payload as never);

    expect(result.restored).toBe(false);
    expect(result.error).toBeTruthy();
    expect(liveState()).toEqual(before);
  });

  it("treats empty collections as a full clear", () => {
    seedGraph("live-");

    const result = restorePromptSnapshotBatch(deps, {
      folders: [],
      prompts: [],
      versions: [],
    });

    expect(result.restored).toBe(true);
    expect(liveState()).toEqual({
      folders: [],
      prompts: [],
      relations: [],
      outputFormats: [],
    });
  });

  it("reports zero counts for an all-empty payload shape", () => {
    const result = restorePromptSnapshotBatch(deps, {
      folders: [] as Folder[],
      prompts: [] as Prompt[],
      versions: [] as PromptVersion[],
      promptRelations: [] as PromptRelation[],
      outputFormatItems: [] as OutputFormatItem[],
    });

    expect(result).toMatchObject({
      restored: true,
      promptCount: 0,
      folderCount: 0,
      versionCount: 0,
      relationCount: 0,
      outputFormatCount: 0,
    });
  });
});
