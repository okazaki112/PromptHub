import path from "path";

import {
  DatabaseAdapter,
  closeDatabase,
  getDatabase,
  initDatabase as dbInit,
  isDatabaseEmpty,
  PromptDB,
  FolderDB,
  RuleDB,
  SkillDB,
  SCHEMA,
  SCHEMA_INDEXES,
  SCHEMA_TABLES,
} from "@prompthub/db";
import type { InitDatabaseHooks } from "@prompthub/db";

import { getUserDataPath } from "./runtime-paths";

function getDbPath(): string {
  return path.join(getUserDataPath(), "prompthub.db");
}

export function initDatabase(hooks?: InitDatabaseHooks): DatabaseAdapter.Database {
  return dbInit(getDbPath(), hooks);
}

export {
  closeDatabase,
  DatabaseAdapter,
  FolderDB,
  getDatabase,
  isDatabaseEmpty,
  PromptDB,
  RuleDB,
  SCHEMA,
  SCHEMA_INDEXES,
  SCHEMA_TABLES,
  SkillDB,
};
