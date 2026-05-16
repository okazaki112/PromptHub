import { Hono } from 'hono';
import { z } from 'zod';
import type {
  CreateRuleProjectInput,
  RuleBackupRecord,
  RuleFileContent,
  RuleFileDescriptor,
  RuleFileId,
  RuleRewriteRequest,
  RuleRewriteResult,
  RuleVersionSnapshot,
} from '@prompthub/shared';
import { getAuthUser } from '../middleware/auth.js';
import {
  createProjectRule,
  exportRuleBackupRecords,
  importRuleBackupRecords,
  readRuleContent,
  readRuleVersions,
  removeProjectRule,
  removeRuleVersion,
  saveRuleContent,
} from '../services/rule.service.js';
import { error, ErrorCode, success } from '../utils/response.js';
import { parseJsonBody } from '../utils/validation.js';

const rules = new Hono();

const ruleIdSchema = z.string().min(1);

const saveRuleSchema = z.object({
  content: z.string(),
});

const rewriteRuleSchema = z.object({
  instruction: z.string().min(1),
  currentContent: z.string(),
  fileName: z.string().min(1),
  platformName: z.string().min(1),
  aiConfig: z
    .object({
      apiKey: z.string(),
      apiUrl: z.string(),
      model: z.string(),
      provider: z.string(),
      apiProtocol: z.string(),
    })
    .optional(),
});

const importRecordsSchema = z.object({
  records: z.array(z.unknown()),
  options: z
    .object({
      replace: z.boolean().optional(),
    })
    .optional(),
});

const deleteVersionSchema = z.object({
  versionId: z.string().min(1),
});

const createProjectRuleSchema = z.object({
  id: z.string().min(1).optional(),
  name: z.string().trim().min(1),
  rootPath: z.string().trim().min(1),
});

rules.get('/', async (c) => {
  const actor = getAuthUser(c);
  const records = exportRuleBackupRecords(actor.userId);
  const descriptors: RuleFileDescriptor[] = records.map((record) => ({
    id: record.id,
    platformId: record.platformId,
    platformName: record.platformName,
    platformIcon: record.platformIcon,
    platformDescription: record.platformDescription,
    name: record.name,
    description: record.description,
    path: record.targetPath || record.path,
    exists: true,
    group: record.id.startsWith('project:') ? 'workspace' : 'assistant',
    managedPath: record.managedPath,
    targetPath: record.targetPath,
    projectRootPath: record.projectRootPath ?? null,
    syncStatus: record.syncStatus,
  }));
  return success(c, descriptors);
});

rules.post('/scan', async (c) => {
  const actor = getAuthUser(c);
  const records = exportRuleBackupRecords(actor.userId);
  const descriptors: RuleFileDescriptor[] = records.map((record) => ({
    id: record.id,
    platformId: record.platformId,
    platformName: record.platformName,
    platformIcon: record.platformIcon,
    platformDescription: record.platformDescription,
    name: record.name,
    description: record.description,
    path: record.targetPath || record.path,
    exists: true,
    group: record.id.startsWith('project:') ? 'workspace' : 'assistant',
    managedPath: record.managedPath,
    targetPath: record.targetPath,
    projectRootPath: record.projectRootPath ?? null,
    syncStatus: record.syncStatus,
  }));
  return success(c, descriptors);
});

rules.post('/projects', async (c) => {
  const parsed = await parseJsonBody(c, createProjectRuleSchema);
  if (!parsed.success) {
    return parsed.response;
  }

  const actor = getAuthUser(c);
  return success(c, createProjectRule(actor.userId, parsed.data), 201);
});

rules.delete('/projects/:projectId', async (c) => {
  const projectId = c.req.param('projectId');
  if (!projectId) {
    return error(c, 422, ErrorCode.VALIDATION_ERROR, 'project id is required');
  }

  const actor = getAuthUser(c);
  removeProjectRule(actor.userId, projectId);
  return success(c, { success: true });
});

rules.get('/:id', async (c) => {
  const parsed = ruleIdSchema.safeParse(c.req.param('id'));
  if (!parsed.success) {
    return error(c, 422, ErrorCode.VALIDATION_ERROR, 'rule id is required');
  }

  const actor = getAuthUser(c);
  const content = readRuleContent(actor.userId, parsed.data as RuleFileId);
  if (!content) {
    return error(c, 404, ErrorCode.NOT_FOUND, 'Rule not found');
  }
  return success(c, content);
});

rules.put('/:id', async (c) => {
  const idParsed = ruleIdSchema.safeParse(c.req.param('id'));
  if (!idParsed.success) {
    return error(c, 422, ErrorCode.VALIDATION_ERROR, 'rule id is required');
  }

  const parsed = await parseJsonBody(c, saveRuleSchema);
  if (!parsed.success) {
    return parsed.response;
  }

  const actor = getAuthUser(c);
  const updated = saveRuleContent(actor.userId, idParsed.data as RuleFileId, parsed.data.content);
  return success(c, updated);
});

function buildRewriteResult(payload: z.infer<typeof rewriteRuleSchema>): RuleRewriteResult {
  const current = payload.currentContent.trim();
  const instruction = payload.instruction.trim();
  const rewrittenContent = current
    ? `${current}\n\n<!-- ${instruction} -->`
    : `<!-- ${instruction} -->`;

  return {
    content: rewrittenContent,
    summary: 'AI rewrite generated a new draft.',
  };
}

rules.post('/rewrite', async (c) => {
  const parsed = await parseJsonBody(c, rewriteRuleSchema);
  if (!parsed.success) {
    return parsed.response;
  }

  return success(c, buildRewriteResult(parsed.data));
});

rules.post('/:id/rewrite', async (c) => {
  const idParsed = ruleIdSchema.safeParse(c.req.param('id'));
  if (!idParsed.success) {
    return error(c, 422, ErrorCode.VALIDATION_ERROR, 'rule id is required');
  }

  const parsed = await parseJsonBody(c, rewriteRuleSchema);
  if (!parsed.success) {
    return parsed.response;
  }

  return success(c, buildRewriteResult(parsed.data));
});

rules.post('/import-records', async (c) => {
  const parsed = await parseJsonBody(c, importRecordsSchema);
  if (!parsed.success) {
    return parsed.response;
  }

  const actor = getAuthUser(c);
  importRuleBackupRecords(actor.userId, parsed.data.records as RuleBackupRecord[]);
  return success(c, { success: true });
});

rules.delete('/:id/versions/:versionId', async (c) => {
  const idParsed = ruleIdSchema.safeParse(c.req.param('id'));
  if (!idParsed.success) {
    return error(c, 422, ErrorCode.VALIDATION_ERROR, 'rule id is required');
  }

  const versionParsed = deleteVersionSchema.safeParse({
    versionId: c.req.param('versionId'),
  });
  if (!versionParsed.success) {
    return error(c, 422, ErrorCode.VALIDATION_ERROR, 'version id is required');
  }

  const actor = getAuthUser(c);
  const updatedVersions: RuleVersionSnapshot[] = removeRuleVersion(
    actor.userId,
    idParsed.data as RuleFileId,
    versionParsed.data.versionId,
  );
  return success(c, updatedVersions);
});

export default rules;
