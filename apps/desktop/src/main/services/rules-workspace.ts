import { createRulesWorkspaceService } from "@prompthub/core";

import { initDatabase, RuleDB } from "../database";
import { getRulesDir } from "../runtime-paths";
import {
  getPlatformGlobalRulePath,
  getPlatformRootDir,
} from "./skill-installer-utils";

export const desktopRulesWorkspaceService = createRulesWorkspaceService({
  getRulesDir,
  createRuleDb: () => new RuleDB(initDatabase()),
  getPlatformGlobalRulePath,
  getPlatformRootDir,
});

export const {
  listRuleDescriptors,
  listCachedRuleDescriptors,
  scanRuleDescriptors,
  getProjectMetaById,
  resolveRuleMeta,
  readRuleContent,
  saveRuleContent,
  deleteRuleVersion,
  createProjectRule,
  bootstrapRuleWorkspace,
  removeProjectRule,
  exportRuleBackupRecords,
  importRuleBackupRecords,
} = desktopRulesWorkspaceService;
