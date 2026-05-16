import { Hono } from 'hono';
import { z } from 'zod';
import type { Context } from 'hono';
import { getAuthUser } from '../middleware/auth.js';
import { PromptService, PromptServiceError } from '../services/prompt.service.js';
import { error, ErrorCode, paginated, success } from '../utils/response.js';
import { parseJsonBody } from '../utils/validation.js';

const prompts = new Hono();
const promptService = new PromptService();

const variableSchema = z.object({
  name: z.string().trim().min(1, 'variable name is required'),
  type: z.enum(['text', 'textarea', 'number', 'select']),
  label: z.string().trim().min(1).optional(),
  defaultValue: z.string().optional(),
  options: z.array(z.string()).optional(),
  required: z.boolean(),
});

const createPromptSchema = z.object({
  visibility: z.enum(['private', 'shared']).optional(),
  title: z.string().trim().min(1, 'title is required').max(200, 'title is too long'),
  description: z.string().max(5000).optional(),
  promptType: z.enum(['text', 'image', 'video']).optional(),
  systemPrompt: z.string().max(100000).optional(),
  systemPromptEn: z.string().max(100000).optional(),
  userPrompt: z.string().min(1, 'userPrompt is required').max(100000, 'userPrompt is too long'),
  userPromptEn: z.string().max(100000).optional(),
  variables: z.array(variableSchema).optional(),
  tags: z.array(z.string().trim().min(1)).optional(),
  folderId: z.string().trim().min(1).optional(),
  images: z.array(z.string().trim().min(1)).optional(),
  videos: z.array(z.string().trim().min(1)).optional(),
  source: z.string().max(5000).optional(),
  notes: z.string().max(20000).optional(),
});

const updatePromptSchema = createPromptSchema.partial().extend({
  isFavorite: z.boolean().optional(),
  isPinned: z.boolean().optional(),
  usageCount: z.number().int().nonnegative().optional(),
  lastAiResponse: z.string().max(100000).optional(),
});

const createVersionSchema = z.object({
  note: z.string().max(500).optional(),
});

const renameTagSchema = z.object({
  oldTag: z.string().trim().min(1),
  newTag: z.string().trim().min(1),
});

const deleteTagSchema = z.object({
  tag: z.string().trim().min(1),
});

const listQuerySchema = z.object({
  scope: z.enum(['private', 'shared', 'all']).optional(),
  keyword: z.string().optional(),
  tags: z.string().optional(),
  folderId: z.string().optional(),
  isFavorite: z.enum(['true', 'false']).optional(),
  sortBy: z.enum(['title', 'createdAt', 'updatedAt', 'usageCount']).optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
  limit: z.coerce.number().int().positive().max(200).optional(),
  offset: z.coerce.number().int().nonnegative().optional(),
});

const versionDiffQuerySchema = z.object({
  from: z.coerce.number().int().positive(),
  to: z.coerce.number().int().positive(),
});

prompts.post('/', async (c) => {
  const parsed = await parseJsonBody(c, createPromptSchema);
  if (!parsed.success) {
    return parsed.response;
  }

  try {
    return success(c, promptService.create(getAuthUser(c), parsed.data), 201);
  } catch (routeError) {
    return toPromptErrorResponse(c, routeError);
  }
});

prompts.get('/', async (c) => {
  const parsed = listQuerySchema.safeParse(c.req.query());
  if (!parsed.success) {
    const message = parsed.error.issues.map((issue) => issue.message).join('; ');
    return error(c, 422, ErrorCode.VALIDATION_ERROR, message);
  }

  const query = parsed.data;
    const normalizedQuery = {
      scope: query.scope,
      keyword: query.keyword,
    tags: query.tags ? query.tags.split(',').map((tag) => tag.trim()).filter(Boolean) : undefined,
    folderId: query.folderId,
    isFavorite:
      query.isFavorite === undefined ? undefined : query.isFavorite === 'true',
    sortBy: query.sortBy,
    sortOrder: query.sortOrder,
    limit: query.limit,
    offset: query.offset,
  };

  try {
    const data = promptService.list(getAuthUser(c), normalizedQuery);
    return paginated(c, data, {
      total: data.length,
      limit: normalizedQuery.limit ?? data.length,
      offset: normalizedQuery.offset ?? 0,
    });
  } catch (routeError) {
    return toPromptErrorResponse(c, routeError);
  }
});

prompts.get('/:id', async (c) => {
  try {
    return success(c, promptService.getById(getAuthUser(c), c.req.param('id')));
  } catch (routeError) {
    return toPromptErrorResponse(c, routeError);
  }
});

prompts.put('/:id', async (c) => {
  const parsed = await parseJsonBody(c, updatePromptSchema);
  if (!parsed.success) {
    return parsed.response;
  }

  try {
    return success(c, promptService.update(getAuthUser(c), c.req.param('id'), parsed.data));
  } catch (routeError) {
    return toPromptErrorResponse(c, routeError);
  }
});

prompts.delete('/:id', async (c) => {
  try {
    promptService.delete(getAuthUser(c), c.req.param('id'));
    return success(c, { ok: true });
  } catch (routeError) {
    return toPromptErrorResponse(c, routeError);
  }
});

prompts.post('/:id/copy', async (c) => {
  try {
    return success(c, promptService.duplicate(getAuthUser(c), c.req.param('id')), 201);
  } catch (routeError) {
    return toPromptErrorResponse(c, routeError);
  }
});

prompts.get('/:id/versions', async (c) => {
  try {
    return success(c, promptService.getVersions(getAuthUser(c), c.req.param('id')));
  } catch (routeError) {
    return toPromptErrorResponse(c, routeError);
  }
});

prompts.post('/:id/versions', async (c) => {
  const parsed = await parseJsonBody(c, createVersionSchema);
  if (!parsed.success) {
    return parsed.response;
  }

  try {
    return success(c, promptService.createVersion(getAuthUser(c), c.req.param('id'), parsed.data.note), 201);
  } catch (routeError) {
    return toPromptErrorResponse(c, routeError);
  }
});

prompts.post('/:id/versions/:versionId/rollback', async (c) => {
  const version = Number(c.req.param('versionId'));
  if (!Number.isInteger(version) || version <= 0) {
    return error(c, 422, ErrorCode.VALIDATION_ERROR, 'versionId must be a positive integer');
  }

  try {
    return success(c, promptService.rollback(getAuthUser(c), c.req.param('id'), version));
  } catch (routeError) {
    return toPromptErrorResponse(c, routeError);
  }
});

prompts.delete('/:id/versions/:versionId', async (c) => {
  try {
    promptService.deleteVersion(
      getAuthUser(c),
      c.req.param('id'),
      c.req.param('versionId'),
    );
    return success(c, { ok: true });
  } catch (routeError) {
    return toPromptErrorResponse(c, routeError);
  }
});

prompts.get('/:id/versions/diff', async (c) => {
  const parsed = versionDiffQuerySchema.safeParse(c.req.query());
  if (!parsed.success) {
    const message = parsed.error.issues.map((issue) => issue.message).join('; ');
    return error(c, 422, ErrorCode.VALIDATION_ERROR, message);
  }

  try {
    return success(c, promptService.diff(getAuthUser(c), c.req.param('id'), parsed.data.from, parsed.data.to));
  } catch (routeError) {
    return toPromptErrorResponse(c, routeError);
  }
});

prompts.get('/meta/tags', async (c) => {
  try {
    getAuthUser(c);
    return success(c, promptService.getAllTags());
  } catch (routeError) {
    return toPromptErrorResponse(c, routeError);
  }
});

prompts.post('/meta/tags/rename', async (c) => {
  const parsed = await parseJsonBody(c, renameTagSchema);
  if (!parsed.success) {
    return parsed.response;
  }

  try {
    getAuthUser(c);
    promptService.renameTag(parsed.data.oldTag, parsed.data.newTag);
    return success(c, { ok: true });
  } catch (routeError) {
    return toPromptErrorResponse(c, routeError);
  }
});

prompts.post('/meta/tags/delete', async (c) => {
  const parsed = await parseJsonBody(c, deleteTagSchema);
  if (!parsed.success) {
    return parsed.response;
  }

  try {
    getAuthUser(c);
    promptService.deleteTag(parsed.data.tag);
    return success(c, { ok: true });
  } catch (routeError) {
    return toPromptErrorResponse(c, routeError);
  }
});

function toPromptErrorResponse(c: Context, routeError: unknown): Response {
  if (routeError instanceof PromptServiceError) {
    return error(c, routeError.status, routeError.code, routeError.message);
  }

  return error(c, 500, ErrorCode.INTERNAL_ERROR, 'Internal server error');
}

export default prompts;
