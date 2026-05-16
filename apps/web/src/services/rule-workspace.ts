import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import type { CreateRuleProjectInput, RuleBackupRecord, RuleVersionSnapshot } from '@prompthub/shared';
import { getRulesDir } from '../runtime-paths.js';

const RULE_VERSION_LIMIT = 20;
const RULE_META_FILE_NAME = '_rule.json';
const VERSION_INDEX_FILE_NAME = 'index.json';

interface StoredRuleVersionIndexEntry {
  id: string;
  savedAt: string;
  source: RuleVersionSnapshot['source'];
  fileName: string;
}

interface StoredRuleMeta {
  id: RuleBackupRecord['id'];
  platformId: RuleBackupRecord['platformId'];
  platformName: string;
  platformIcon: string;
  platformDescription: string;
  name: string;
  description: string;
  path: string;
  managedPath: string;
  targetPath: string;
  projectRootPath?: string | null;
  syncStatus?: RuleBackupRecord['syncStatus'];
}

function ensureDir(targetPath: string): void {
  fs.mkdirSync(targetPath, { recursive: true });
}

function slugify(input: string | null | undefined): string {
  const normalized = (input ?? '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  return normalized || 'rule';
}

function encodeRuleId(ruleId: string): string {
  return encodeURIComponent(ruleId);
}

function getUserRulesRoot(userId: string): string {
  return path.join(getRulesDir(), userId);
}

function getUserRulesGlobalRoot(userId: string): string {
  return path.join(getUserRulesRoot(userId), 'global');
}

function getUserRulesProjectsRoot(userId: string): string {
  return path.join(getUserRulesRoot(userId), 'projects');
}

function getUserRulesVersionsRoot(userId: string): string {
  return path.join(getUserRulesRoot(userId), '.versions');
}

function getRuleVersionsDir(userId: string, ruleId: string): string {
  return path.join(getUserRulesVersionsRoot(userId), encodeRuleId(ruleId));
}

function getRuleVersionIndexPath(userId: string, ruleId: string): string {
  return path.join(getRuleVersionsDir(userId, ruleId), VERSION_INDEX_FILE_NAME);
}

function getManagedCopyPath(userId: string, record: RuleBackupRecord): string {
  if (record.id.startsWith('project:')) {
    const projectId = record.id.slice('project:'.length);
    const dirName = `${slugify(record.platformName)}__${projectId}`;
    return path.join(getUserRulesProjectsRoot(userId), dirName, record.name);
  }

  return path.join(getUserRulesGlobalRoot(userId), record.platformId, record.name);
}

function listMetaPaths(rootDir: string): string[] {
  if (!fs.existsSync(rootDir)) {
    return [];
  }

  const entries = fs.readdirSync(rootDir, { withFileTypes: true });
  return entries
    .filter((entry) => entry.isDirectory())
    .map((entry) => path.join(rootDir, entry.name, RULE_META_FILE_NAME))
    .filter((metaPath) => fs.existsSync(metaPath));
}

function listAllMetaPaths(userId: string): string[] {
  const globalRoot = getUserRulesGlobalRoot(userId);
  const projectRoot = getUserRulesProjectsRoot(userId);
  const globalMetaPaths: string[] = [];

  if (fs.existsSync(globalRoot)) {
    for (const entry of fs.readdirSync(globalRoot, { withFileTypes: true })) {
      if (!entry.isDirectory()) {
        continue;
      }
      const metaPath = path.join(globalRoot, entry.name, RULE_META_FILE_NAME);
      if (fs.existsSync(metaPath)) {
        globalMetaPaths.push(metaPath);
      }
    }
  }

  return [...globalMetaPaths, ...listMetaPaths(projectRoot)];
}

function readJsonFile<T>(filePath: string): T | null {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8')) as T;
  } catch {
    return null;
  }
}

function writeJsonFile(filePath: string, value: unknown): void {
  ensureDir(path.dirname(filePath));
  fs.writeFileSync(filePath, JSON.stringify(value, null, 2), 'utf8');
}

function readVersionIndex(userId: string, ruleId: string): StoredRuleVersionIndexEntry[] {
  return readJsonFile<StoredRuleVersionIndexEntry[]>(
    getRuleVersionIndexPath(userId, ruleId),
  ) ?? [];
}

function readRuleVersions(userId: string, ruleId: string): RuleVersionSnapshot[] {
  const versionDir = getRuleVersionsDir(userId, ruleId);
  return readVersionIndex(userId, ruleId)
    .map((entry) => {
      const contentPath = path.join(versionDir, entry.fileName);
      if (!fs.existsSync(contentPath)) {
        return null;
      }
      return {
        id: entry.id,
        savedAt: entry.savedAt,
        source: entry.source,
        content: fs.readFileSync(contentPath, 'utf8'),
      } satisfies RuleVersionSnapshot;
    })
    .filter((version): version is RuleVersionSnapshot => version !== null);
}

function writeRuleVersions(
  userId: string,
  ruleId: string,
  versions: RuleVersionSnapshot[],
): void {
  const versionDir = getRuleVersionsDir(userId, ruleId);
  fs.rmSync(versionDir, { recursive: true, force: true });
  ensureDir(versionDir);

  const orderedVersions = [...versions]
    .sort(
      (left, right) =>
        new Date(left.savedAt).getTime() - new Date(right.savedAt).getTime(),
    )
    .slice(-RULE_VERSION_LIMIT);

  const index: StoredRuleVersionIndexEntry[] = [];
  for (const [position, version] of orderedVersions.entries()) {
    const fileName = `${String(position + 1).padStart(4, '0')}.md`;
    fs.writeFileSync(path.join(versionDir, fileName), version.content, 'utf8');
    index.unshift({
      id: version.id,
      savedAt: version.savedAt,
      source: version.source,
      fileName,
    });
  }

  writeJsonFile(getRuleVersionIndexPath(userId, ruleId), index);
}

function toStoredRuleMeta(userId: string, record: RuleBackupRecord): StoredRuleMeta {
  const managedPath = getManagedCopyPath(userId, record);
  return {
    id: record.id,
    platformId: record.platformId,
    platformName: record.platformName,
    platformIcon: record.platformIcon,
    platformDescription: record.platformDescription,
    name: record.name,
    description: record.description,
    path: record.path,
    managedPath,
    targetPath: record.targetPath || record.path,
    projectRootPath: record.projectRootPath ?? null,
    syncStatus: record.syncStatus,
  };
}

function toRuleBackupRecord(userId: string, meta: StoredRuleMeta): RuleBackupRecord | null {
  if (!fs.existsSync(meta.managedPath)) {
    return null;
  }

  return {
    id: meta.id,
    platformId: meta.platformId,
    platformName: meta.platformName,
    platformIcon: meta.platformIcon,
    platformDescription: meta.platformDescription,
    name: meta.name,
    description: meta.description,
    path: meta.path,
    managedPath: meta.managedPath,
    targetPath: meta.targetPath,
    projectRootPath: meta.projectRootPath ?? null,
    syncStatus: meta.syncStatus,
    content: fs.readFileSync(meta.managedPath, 'utf8'),
    versions: readRuleVersions(userId, meta.id),
  };
}

export function exportRuleBackupRecords(userId: string): RuleBackupRecord[] {
  return listAllMetaPaths(userId)
    .map((metaPath) => readJsonFile<StoredRuleMeta>(metaPath))
    .filter((meta): meta is StoredRuleMeta => meta !== null)
    .map((meta) => toRuleBackupRecord(userId, meta))
    .filter((record): record is RuleBackupRecord => record !== null);
}

export function importRuleBackupRecords(
  userId: string,
  records: RuleBackupRecord[],
): void {
  if (records.length === 0) {
    return;
  }

  ensureDir(getUserRulesRoot(userId));

  for (const record of records) {
    const meta = toStoredRuleMeta(userId, record);
    ensureDir(path.dirname(meta.managedPath));
    fs.writeFileSync(meta.managedPath, record.content, 'utf8');
    writeJsonFile(path.join(path.dirname(meta.managedPath), RULE_META_FILE_NAME), meta);
    writeRuleVersions(userId, record.id, record.versions);
  }
}

export function bootstrapRuleWorkspace(): void {
  ensureDir(getRulesDir());
}

export function createProjectRule(userId: string, input: CreateRuleProjectInput): RuleBackupRecord {
  const name = input.name.trim();
  const rootPath = input.rootPath.trim();
  if (!name || !rootPath) {
    throw new Error('Rule project name and rootPath are required');
  }

  const duplicate = exportRuleBackupRecords(userId).find(
    (record) =>
      record.id.startsWith('project:') &&
      record.projectRootPath?.toLowerCase() === rootPath.toLowerCase(),
  );
  if (duplicate) {
    throw new Error('Rule project root path already exists');
  }

  const projectId = input.id ?? crypto.randomUUID();
  const ruleRecord: RuleBackupRecord = {
    id: `project:${projectId}`,
    platformId: 'workspace',
    platformName: name,
    platformIcon: 'FolderRoot',
    platformDescription: `Project rules from ${rootPath}`,
    name: 'AGENTS.md',
    description: 'Project rule file loaded from a user-managed directory.',
    path: path.join(rootPath, 'AGENTS.md'),
    managedPath: path.join(
      getUserRulesProjectsRoot(userId),
      `${slugify(name)}__${projectId}`,
      'AGENTS.md',
    ),
    targetPath: path.join(rootPath, 'AGENTS.md'),
    projectRootPath: rootPath,
    syncStatus: 'target-missing',
    content: '',
    versions: [],
  };

  importRuleBackupRecords(userId, [ruleRecord]);
  return exportRuleBackupRecords(userId).find((record) => record.id === ruleRecord.id) ?? ruleRecord;
}

export function removeProjectRule(userId: string, projectId: string): void {
  const ruleId = `project:${projectId}`;
  const record = exportRuleBackupRecords(userId).find((item) => item.id === ruleId);
  if (!record?.managedPath) {
    return;
  }

  fs.rmSync(path.dirname(record.managedPath), { recursive: true, force: true });
  fs.rmSync(getRuleVersionsDir(userId, ruleId), { recursive: true, force: true });
}
