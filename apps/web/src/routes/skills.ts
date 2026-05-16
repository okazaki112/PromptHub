import { Hono } from 'hono';
import { z } from 'zod';
import type { SkillSafetyReport, SkillSafetyScanInput } from '@prompthub/shared';
import type { Context } from 'hono';
import { getAuthUser } from '../middleware/auth.js';
import { SkillService, SkillServiceError } from '../services/skill.service.js';
import { error, ErrorCode, success } from '../utils/response.js';
import { parseJsonBody } from '../utils/validation.js';

const skills = new Hono();
const skillService = new SkillService();

const createSkillSchema = z.object({
  name: z.string().trim().min(1, 'name is required').max(120),
  description: z.string().max(10000).optional(),
  instructions: z.string().max(200000).optional(),
  content: z.string().max(200000).optional(),
  mcp_config: z.string().max(50000).optional(),
  protocol_type: z.enum(['skill', 'mcp', 'claude-code']).default('skill'),
  version: z.string().max(50).optional(),
  author: z.string().max(120).optional(),
  source_url: z.string().url().optional(),
  local_repo_path: z.string().max(1000).optional(),
  tags: z.array(z.string()).optional(),
  original_tags: z.array(z.string()).optional(),
  is_favorite: z.boolean().default(false),
  icon_url: z.string().url().optional(),
  icon_emoji: z.string().max(32).optional(),
  icon_background: z.string().max(50).optional(),
  category: z.enum(['general', 'office', 'dev', 'ai', 'data', 'management', 'deploy', 'design', 'security', 'meta']).optional(),
  is_builtin: z.boolean().optional(),
  registry_slug: z.string().max(200).optional(),
  content_url: z.string().url().optional(),
  prerequisites: z.array(z.string()).optional(),
  compatibility: z.array(z.string()).optional(),
  visibility: z.enum(['private', 'shared']).optional(),
});

const updateSkillSchema = createSkillSchema.partial().extend({
  currentVersion: z.number().int().nonnegative().optional(),
  versionTrackingEnabled: z.boolean().optional(),
  safetyReport: z.any().optional(),
});

const versionSchema = z.object({
  note: z.string().max(500).optional(),
});

const safetyFindingSchema = z.object({
  code: z.string(),
  severity: z.enum(['info', 'warn', 'high']),
  title: z.string(),
  detail: z.string(),
  filePath: z.string().optional(),
  evidence: z.string().optional(),
});

const safetyReportSchema = z.object({
  level: z.enum(['safe', 'warn', 'high-risk', 'blocked']),
  summary: z.string(),
  findings: z.array(safetyFindingSchema),
  recommendedAction: z.enum(['allow', 'review', 'block']),
  scannedAt: z.number().int().nonnegative(),
  checkedFileCount: z.number().int().nonnegative(),
  scanMethod: z.literal('ai'),
  score: z.number().min(0).max(100).optional(),
});

const safetyScanInputSchema = z.object({
  name: z.string().optional(),
  content: z.string().optional(),
  sourceUrl: z.string().url().optional(),
  contentUrl: z.string().url().optional(),
  localRepoPath: z.string().optional(),
  securityAudits: z.array(z.string()).optional(),
  aiConfig: z
    .object({
      provider: z.string(),
      apiProtocol: z.enum(['openai', 'gemini', 'anthropic']),
      apiKey: z.string(),
      apiUrl: z.string(),
      model: z.string(),
    })
    .optional(),
});

const fetchRemoteSchema = z.object({
  url: z.string().url(),
  importToLibrary: z.boolean().optional(),
  name: z.string().trim().min(1).max(120).optional(),
  description: z.string().max(10000).optional(),
  visibility: z.enum(['private', 'shared']).optional(),
});

const deleteAllSchema = z.object({
  confirm: z.boolean(),
});

const listQuerySchema = z.object({
  scope: z.enum(['private', 'shared', 'all']).optional(),
});

skills.post('/', async (c) => {
  const parsed = await parseJsonBody(c, createSkillSchema);
  if (!parsed.success) {
    return parsed.response;
  }

  try {
    return success(c, skillService.create(getAuthUser(c), parsed.data), 201);
  } catch (routeError) {
    return toSkillErrorResponse(c, routeError);
  }
});

skills.get('/', async (c) => {
  const parsed = listQuerySchema.safeParse(c.req.query());
  if (!parsed.success) {
    const message = parsed.error.issues.map((issue) => issue.message).join('; ');
    return error(c, 422, ErrorCode.VALIDATION_ERROR, message);
  }

  try {
    return success(c, skillService.list(getAuthUser(c), parsed.data.scope));
  } catch (routeError) {
    return toSkillErrorResponse(c, routeError);
  }
});

skills.get('/search', async (c) => {
  const parsed = listQuerySchema.safeParse(c.req.query());
  if (!parsed.success) {
    const message = parsed.error.issues.map((issue) => issue.message).join('; ');
    return error(c, 422, ErrorCode.VALIDATION_ERROR, message);
  }

  try {
    return success(c, skillService.list(getAuthUser(c), parsed.data.scope ?? 'shared'));
  } catch (routeError) {
    return toSkillErrorResponse(c, routeError);
  }
});

skills.get('/:id', async (c) => {
  try {
    return success(c, skillService.getById(getAuthUser(c), c.req.param('id')));
  } catch (routeError) {
    return toSkillErrorResponse(c, routeError);
  }
});

skills.put('/:id', async (c) => {
  const parsed = await parseJsonBody(c, updateSkillSchema);
  if (!parsed.success) {
    return parsed.response;
  }

  try {
    return success(c, skillService.update(getAuthUser(c), c.req.param('id'), parsed.data));
  } catch (routeError) {
    return toSkillErrorResponse(c, routeError);
  }
});

skills.delete('/:id', async (c) => {
  try {
    skillService.delete(getAuthUser(c), c.req.param('id'));
    return success(c, { ok: true });
  } catch (routeError) {
    return toSkillErrorResponse(c, routeError);
  }
});

skills.delete('/', async (c) => {
  const parsed = deleteAllSchema.safeParse({ confirm: c.req.query('confirm') === 'true' });
  if (!parsed.success) {
    const message = parsed.error.issues.map((issue) => issue.message).join('; ');
    return error(c, 422, ErrorCode.VALIDATION_ERROR, message);
  }

  try {
    skillService.deleteAll(getAuthUser(c), parsed.data.confirm);
    return success(c, { ok: true });
  } catch (routeError) {
    return toSkillErrorResponse(c, routeError);
  }
});

skills.post('/:id/export', async (c) => {
  try {
    const skill = skillService.getById(getAuthUser(c), c.req.param('id'));
    return success(c, { name: skill.name, content: skill.content ?? skill.instructions ?? '' });
  } catch (routeError) {
    return toSkillErrorResponse(c, routeError);
  }
});

skills.post('/import', async (c) => {
  const parsed = await parseJsonBody(c, createSkillSchema);
  if (!parsed.success) {
    return parsed.response;
  }

  try {
    return success(c, skillService.create(getAuthUser(c), parsed.data), 201);
  } catch (routeError) {
    return toSkillErrorResponse(c, routeError);
  }
});

skills.post('/:id/safety-scan', async (c) => {
  let body: unknown = {};
  try {
    body = await c.req.json();
  } catch {
    body = {};
  }

  const parsed = safetyScanInputSchema.partial().safeParse(body);
  if (!parsed.success) {
    const message = parsed.error.issues
      .map((issue) => {
        const path = issue.path.join('.');
        return path ? `${path}: ${issue.message}` : issue.message;
      })
      .join('; ');
    return error(c, 422, ErrorCode.VALIDATION_ERROR, message);
  }

  try {
    const report = await skillService.scanSafety(
      getAuthUser(c),
      c.req.param('id'),
      parsed.data as Partial<SkillSafetyScanInput>,
    );
    return success(c, report);
  } catch (routeError) {
    return toSkillErrorResponse(c, routeError);
  }
});

skills.post('/safety-scan', async (c) => {
  const parsed = await parseJsonBody(c, safetyScanInputSchema);
  if (!parsed.success) {
    return parsed.response;
  }

  try {
    const report = await skillService.scanSafetyInput(
      parsed.data as SkillSafetyScanInput,
    );
    return success(c, report);
  } catch (routeError) {
    return toSkillErrorResponse(c, routeError);
  }
});

skills.put('/:id/safety-report', async (c) => {
  const parsed = await parseJsonBody(c, safetyReportSchema);
  if (!parsed.success) {
    return parsed.response;
  }

  try {
    const updated = skillService.saveSafetyReport(getAuthUser(c), c.req.param('id'), parsed.data as SkillSafetyReport);
    return success(c, updated);
  } catch (routeError) {
    return toSkillErrorResponse(c, routeError);
  }
});

skills.post('/fetch-remote', async (c) => {
  const parsed = await parseJsonBody(c, fetchRemoteSchema);
  if (!parsed.success) {
    return parsed.response;
  }

  try {
    const result = await skillService.fetchRemote(getAuthUser(c), parsed.data);
    return success(c, result, result.importedSkill ? 201 : 200);
  } catch (routeError) {
    return toSkillErrorResponse(c, routeError);
  }
});

skills.get('/:id/versions', async (c) => {
  try {
    return success(c, skillService.getVersions(getAuthUser(c), c.req.param('id')));
  } catch (routeError) {
    return toSkillErrorResponse(c, routeError);
  }
});

skills.post('/:id/versions', async (c) => {
  const parsed = await parseJsonBody(c, versionSchema);
  if (!parsed.success) {
    return parsed.response;
  }

  try {
    return success(c, skillService.createVersion(getAuthUser(c), c.req.param('id'), parsed.data.note), 201);
  } catch (routeError) {
    return toSkillErrorResponse(c, routeError);
  }
});

skills.post('/:id/versions/:versionId/rollback', async (c) => {
  const version = Number(c.req.param('versionId'));
  if (!Number.isInteger(version) || version <= 0) {
    return error(c, 422, ErrorCode.VALIDATION_ERROR, 'versionId must be a positive integer');
  }

  try {
    return success(c, skillService.rollback(getAuthUser(c), c.req.param('id'), version));
  } catch (routeError) {
    return toSkillErrorResponse(c, routeError);
  }
});

skills.delete('/:id/versions/:versionId', async (c) => {
  try {
    skillService.deleteVersion(getAuthUser(c), c.req.param('id'), c.req.param('versionId'));
    return success(c, { ok: true });
  } catch (routeError) {
    return toSkillErrorResponse(c, routeError);
  }
});

function toSkillErrorResponse(c: Context, routeError: unknown): Response {
  if (routeError instanceof SkillServiceError) {
    return error(c, routeError.status, routeError.code, routeError.message);
  }

  if (routeError instanceof Error) {
    if (routeError.message === 'AI_NOT_CONFIGURED') {
      return error(c, 422, ErrorCode.VALIDATION_ERROR, 'AI_NOT_CONFIGURED');
    }
    if (routeError.message === 'SAFETY_SCAN_BLOCKED_SOURCE') {
      return error(c, 422, ErrorCode.VALIDATION_ERROR, 'SAFETY_SCAN_BLOCKED_SOURCE');
    }
  }

  return error(c, 500, ErrorCode.INTERNAL_ERROR, 'Internal server error');
}

export default skills;
