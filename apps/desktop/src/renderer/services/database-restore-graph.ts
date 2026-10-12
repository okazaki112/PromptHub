import { getAllFolders, getAllPrompts } from "./database";
import type { DatabaseBackup } from "./database-backup-format";

export function sortPromptsForRestore(
  prompts: DatabaseBackup["prompts"],
): DatabaseBackup["prompts"] {
  const remaining = new Map(prompts.map((prompt) => [prompt.id, prompt]));
  const restored = new Set<string>();
  const ordered: DatabaseBackup["prompts"] = [];

  while (remaining.size > 0) {
    let progressed = false;

    for (const [id, prompt] of remaining) {
      if (
        !prompt.parentId ||
        restored.has(prompt.parentId) ||
        !remaining.has(prompt.parentId)
      ) {
        ordered.push(prompt);
        restored.add(id);
        remaining.delete(id);
        progressed = true;
      }
    }

    if (!progressed) {
      ordered.push(...remaining.values());
      break;
    }
  }

  return ordered;
}

export function sortFoldersForRestore(
  folders: DatabaseBackup["folders"],
): DatabaseBackup["folders"] {
  const remaining = new Map(folders.map((folder) => [folder.id, folder]));
  const restored = new Set<string>();
  const ordered: DatabaseBackup["folders"] = [];

  while (remaining.size > 0) {
    let progressed = false;

    for (const [id, folder] of remaining) {
      if (
        !folder.parentId ||
        restored.has(folder.parentId) ||
        !remaining.has(folder.parentId)
      ) {
        ordered.push(folder);
        restored.add(id);
        remaining.delete(id);
        progressed = true;
      }
    }

    if (!progressed) {
      ordered.push(...remaining.values());
      break;
    }
  }

  return ordered;
}

/**
 * Row-by-row restore kept for runtimes without the batch channel (the web
 * client bridge exposes per-row APIs over HTTP, and its server owns ordering).
 */
async function importDatabaseRowByRow(
  normalizedBackup: DatabaseBackup,
): Promise<boolean> {
  if (
    !window.api?.prompt?.getAll ||
    !window.api?.prompt?.delete ||
    !window.api?.prompt?.insertDirect ||
    !window.api?.folder?.getAll ||
    !window.api?.folder?.delete ||
    !window.api?.folder?.insertDirect ||
    !window.api?.version?.insertDirect
  ) {
    return false;
  }

  if (
    (normalizedBackup.promptRelations?.length ?? 0) > 0 &&
    !window.api.prompt.insertRelationDirect
  ) {
    return false;
  }
  if (
    (normalizedBackup.outputFormatItems?.length ?? 0) > 0 &&
    !window.api.prompt.insertOutputFormatDirect
  ) {
    return false;
  }

  const existingPrompts = await getAllPrompts();
  for (const prompt of existingPrompts) {
    await window.api.prompt.delete(prompt.id);
  }

  const existingFolders = await getAllFolders();
  for (const folder of existingFolders) {
    await window.api.folder.delete(folder.id);
  }

  for (const folder of sortFoldersForRestore(normalizedBackup.folders)) {
    await window.api.folder.insertDirect(folder);
  }

  for (const prompt of sortPromptsForRestore(normalizedBackup.prompts)) {
    await window.api.prompt.insertDirect(prompt);
  }

  for (const version of normalizedBackup.versions) {
    await window.api.version.insertDirect(version);
  }

  const restoredPromptIds = new Set(
    normalizedBackup.prompts.map((prompt) => prompt.id),
  );
  for (const relation of normalizedBackup.promptRelations ?? []) {
    if (
      relation.sourcePromptId === relation.targetPromptId ||
      !restoredPromptIds.has(relation.sourcePromptId) ||
      !restoredPromptIds.has(relation.targetPromptId)
    ) {
      continue;
    }
    await window.api.prompt.insertRelationDirect(relation);
  }

  for (const item of normalizedBackup.outputFormatItems ?? []) {
    if (
      !restoredPromptIds.has(item.sourcePromptId) ||
      (item.targetPromptId !== null &&
        !restoredPromptIds.has(item.targetPromptId))
    ) {
      continue;
    }
    await window.api.prompt.insertOutputFormatDirect(item);
  }

  await window.api.prompt.syncWorkspace?.();
  return true;
}

export async function restorePromptGraph(
  normalizedBackup: DatabaseBackup,
): Promise<boolean> {
  if (window.api?.prompt?.restoreBatch) {
    const result = await window.api.prompt.restoreBatch({
      folders: normalizedBackup.folders,
      prompts: normalizedBackup.prompts,
      versions: normalizedBackup.versions,
      promptRelations: normalizedBackup.promptRelations,
      outputFormatItems: normalizedBackup.outputFormatItems,
    });

    if (!result?.restored) {
      throw new Error(
        `Backup restore was blocked because the prompt graph could not be written: ${
          result?.error ?? "the main process returned no result"
        }. Local data was left untouched.`,
      );
    }

    return true;
  }

  return importDatabaseRowByRow(normalizedBackup);
}
