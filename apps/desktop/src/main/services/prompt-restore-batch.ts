import type {
  PromptRestoreBatchPayload,
  PromptRestoreBatchResult,
} from "@prompthub/shared/types";
import type { FolderDB } from "../database/folder";
import type { PromptDB } from "../database/prompt";
import type { PromptOutputFormatDB, PromptRelationDB } from "../database";
import type Database from "../database/sqlite";

export interface PromptRestoreBatchDependencies {
  promptDb: PromptDB;
  folderDb: FolderDB;
  relationDb: PromptRelationDB;
  outputFormatDb: PromptOutputFormatDB;
  rawDb: Database.Database;
}

const CHILD_FIRST_CLEAR_ORDER = [
  "DELETE FROM prompt_output_format_items",
  "DELETE FROM prompt_relations",
  "DELETE FROM prompt_versions",
  "DELETE FROM prompts",
  "DELETE FROM folders",
];

function failed(message: string): PromptRestoreBatchResult {
  return {
    restored: false,
    promptCount: 0,
    folderCount: 0,
    versionCount: 0,
    relationCount: 0,
    outputFormatCount: 0,
    error: message,
  };
}

function isRecord(value: unknown): boolean {
  return typeof value === "object" && value !== null;
}

/**
 * Backup arrays carry no ordering guarantee, but folder and prompt rows
 * self-reference, so a child must never be inserted before its parent.
 */
function sortByParentFirst<T extends { id: string }>(
  rows: readonly T[],
  getParentId: (row: T) => string | null | undefined,
): T[] {
  const pending = new Map(rows.map((row) => [row.id, row]));
  const ordered: T[] = [];
  const emitted = new Set<string>();

  while (pending.size > 0) {
    let progressed = false;

    for (const [id, row] of [...pending]) {
      const parentId = getParentId(row);
      if (!parentId || emitted.has(parentId) || !pending.has(parentId)) {
        ordered.push(row);
        emitted.add(id);
        pending.delete(id);
        progressed = true;
      }
    }

    if (!progressed) {
      ordered.push(
        ...[...pending.values()].sort((left, right) =>
          left.id.localeCompare(right.id),
        ),
      );
      break;
    }
  }

  return ordered;
}

function readCollections(
  payload: PromptRestoreBatchPayload,
):
  | {
      folders: PromptRestoreBatchPayload["folders"];
      prompts: PromptRestoreBatchPayload["prompts"];
      versions: PromptRestoreBatchPayload["versions"];
      relations: PromptRestoreBatchPayload["promptRelations"];
      outputFormats: PromptRestoreBatchPayload["outputFormatItems"];
    }
  | null {
  const folders = payload.folders;
  const prompts = payload.prompts;
  const versions = payload.versions;
  const relations = payload.promptRelations ?? [];
  const outputFormats = payload.outputFormatItems ?? [];

  const collections = [folders, prompts, versions, relations, outputFormats];
  if (collections.some((rows) => !Array.isArray(rows))) {
    return null;
  }
  if (collections.some((rows) => rows.some((row) => !isRecord(row)))) {
    return null;
  }

  return { folders, prompts, versions, relations, outputFormats };
}

/**
 * Graph rows whose endpoints are not part of this restore are dropped, matching
 * the per-row restore path: a backup may reference prompts that were sanitized
 * away or deleted upstream.
 */
function keepRestorableRelations(
  relations: readonly PromptRestoreBatchPayload["promptRelations"][number][],
  restoredPromptIds: ReadonlySet<string>,
): PromptRestoreBatchPayload["promptRelations"] {
  return relations.filter(
    (relation) =>
      relation.sourcePromptId !== relation.targetPromptId &&
      restoredPromptIds.has(relation.sourcePromptId) &&
      restoredPromptIds.has(relation.targetPromptId),
  );
}

function keepRestorableOutputFormats(
  items: readonly PromptRestoreBatchPayload["outputFormatItems"][number][],
  restoredPromptIds: ReadonlySet<string>,
): PromptRestoreBatchPayload["outputFormatItems"] {
  return items.filter(
    (item) =>
      restoredPromptIds.has(item.sourcePromptId) &&
      (item.targetPromptId === null ||
        restoredPromptIds.has(item.targetPromptId)),
  );
}

export function restorePromptSnapshotBatch(
  deps: PromptRestoreBatchDependencies,
  payload: PromptRestoreBatchPayload,
): PromptRestoreBatchResult {
  if (!isRecord(payload)) {
    return failed("Restore payload must be an object.");
  }

  const collections = readCollections(payload);
  if (!collections) {
    return failed("Restore payload requires folder, prompt and version arrays.");
  }

  const { folders, prompts, versions, relations, outputFormats } = collections;

  try {
    const restoredPromptIds = new Set(prompts.map((prompt) => prompt.id));
    const restorableRelations = keepRestorableRelations(
      relations,
      restoredPromptIds,
    );
    const restorableOutputFormats = keepRestorableOutputFormats(
      outputFormats,
      restoredPromptIds,
    );

    const restore = deps.rawDb.transaction(() => {
      for (const statement of CHILD_FIRST_CLEAR_ORDER) {
        deps.rawDb.prepare(statement).run();
      }

      for (const folder of sortByParentFirst(folders, (row) => row.parentId)) {
        deps.folderDb.insertFolderDirect(folder);
      }
      for (const prompt of sortByParentFirst(prompts, (row) => row.parentId)) {
        deps.promptDb.insertPromptDirect(prompt);
      }
      for (const version of versions) {
        deps.promptDb.insertVersionDirect(version);
      }
      for (const relation of restorableRelations) {
        deps.relationDb.insertRelationDirect(relation);
      }
      for (const item of restorableOutputFormats) {
        deps.outputFormatDb.insertItemDirect(item);
      }
    });

    restore();

    return {
      restored: true,
      promptCount: prompts.length,
      folderCount: folders.length,
      versionCount: versions.length,
      relationCount: restorableRelations.length,
      outputFormatCount: restorableOutputFormats.length,
    };
  } catch (error) {
    return failed(error instanceof Error ? error.message : String(error));
  }
}
