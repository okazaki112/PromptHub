import type { Folder } from "./folder";
import type {
  OutputFormatItem,
  Prompt,
  PromptRelation,
  PromptVersion,
} from "./prompt";

/**
 * Backup restore payload. The main process clears the prompt graph and writes
 * these rows inside a single SQLite transaction, then rebuilds the workspace
 * files once.
 */
export interface PromptRestoreBatchPayload {
  folders: Folder[];
  prompts: Prompt[];
  versions: PromptVersion[];
  promptRelations?: PromptRelation[];
  outputFormatItems?: OutputFormatItem[];
}

export interface PromptRestoreBatchResult {
  restored: boolean;
  promptCount: number;
  folderCount: number;
  versionCount: number;
  relationCount: number;
  outputFormatCount: number;
  error?: string;
}
