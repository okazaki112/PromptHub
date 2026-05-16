import { FolderDB, PromptDB } from '@prompthub/db';
import type { CreatePromptDTO, Prompt, PromptVersion, SearchQuery, UpdatePromptDTO } from '@prompthub/shared';
import { getServerDatabase } from '../database.js';
import { ErrorCode } from '../utils/response.js';
import { syncPromptWorkspaceFromDatabase } from './prompt-workspace.js';

export interface PromptActor {
  userId: string;
  role: 'admin' | 'user';
}

interface PromptRow {
  id: string;
  owner_user_id: string | null;
  visibility: 'private' | 'shared';
}

export class PromptServiceError extends Error {
  constructor(
    public readonly status: 400 | 401 | 403 | 404 | 409 | 422 | 500,
    public readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = 'PromptServiceError';
  }
}

export interface PromptDiffResult {
  from: PromptVersion;
  to: PromptVersion;
  fields: Array<{
    field: 'systemPrompt' | 'systemPromptEn' | 'userPrompt' | 'userPromptEn' | 'variables' | 'aiResponse';
    from: string;
    to: string;
  }>;
}

export class PromptService {
  private readonly promptDb = new PromptDB(getServerDatabase());
  private readonly folderDb = new FolderDB(getServerDatabase());
  private readonly db = getServerDatabase();

  create(actor: PromptActor, data: CreatePromptDTO): Prompt {
    const visibility = data.visibility ?? 'private';
    this.assertCanCreate(actor, visibility);

    const prompt = this.promptDb.create(data);
    this.db
      .prepare('UPDATE prompts SET owner_user_id = ?, visibility = ? WHERE id = ?')
      .run(actor.userId, visibility, prompt.id);

    syncPromptWorkspaceFromDatabase(this.db, this.promptDb, this.folderDb);

    return this.getById(actor, prompt.id);
  }

  list(actor: PromptActor, query: SearchQuery): Prompt[] {
    const rows = this.getVisibleRows(actor, query.scope ?? 'private');
    const baseData = rows.map((row) => this.getById(actor, row.id));

    let filtered = baseData;

    if (query.keyword) {
      const needle = query.keyword.toLowerCase();
      filtered = filtered.filter((prompt) =>
        [prompt.title, prompt.description ?? '', prompt.systemPrompt ?? '', prompt.userPrompt, ...(prompt.tags ?? [])]
          .join(' ')
          .toLowerCase()
          .includes(needle),
      );
    }

    if (query.tags?.length) {
      filtered = filtered.filter((prompt) =>
        query.tags!.every((tag) => prompt.tags.includes(tag)),
      );
    }

    if (query.folderId) {
      filtered = filtered.filter((prompt) => prompt.folderId === query.folderId);
    }

    if (query.isFavorite !== undefined) {
      filtered = filtered.filter((prompt) => prompt.isFavorite === query.isFavorite);
    }

    const sorted = this.sortPrompts(filtered, query.sortBy, query.sortOrder);
    const offset = query.offset ?? 0;
    const limit = query.limit ?? sorted.length;
    return sorted.slice(offset, offset + limit);
  }

  getById(actor: PromptActor, id: string): Prompt {
    const row = this.getRow(id);
    if (!row) {
      throw new PromptServiceError(404, ErrorCode.NOT_FOUND, 'Prompt not found');
    }

    this.assertCanRead(actor, row);

    const prompt = this.promptDb.getById(id);
    if (!prompt) {
      throw new PromptServiceError(404, ErrorCode.NOT_FOUND, 'Prompt not found');
    }

    return {
      ...prompt,
      ownerUserId: row.owner_user_id,
      visibility: row.visibility,
    };
  }

  update(actor: PromptActor, id: string, data: UpdatePromptDTO): Prompt {
    const row = this.getRequiredRow(id);
    this.assertCanWrite(actor, row);

    const nextVisibility = data.visibility ?? row.visibility;
    if (nextVisibility !== row.visibility && actor.role !== 'admin') {
      throw new PromptServiceError(403, ErrorCode.FORBIDDEN, 'Only admin can change shared visibility');
    }

    const prompt = this.promptDb.update(id, data);
    if (!prompt) {
      throw new PromptServiceError(404, ErrorCode.NOT_FOUND, 'Prompt not found');
    }

    if (data.visibility !== undefined) {
      this.db.prepare('UPDATE prompts SET visibility = ? WHERE id = ?').run(data.visibility, id);
    }

    syncPromptWorkspaceFromDatabase(this.db, this.promptDb, this.folderDb);

    return this.getById(actor, id);
  }

  delete(actor: PromptActor, id: string): void {
    const row = this.getRequiredRow(id);
    this.assertCanWrite(actor, row);

    const deleted = this.promptDb.delete(id);
    if (!deleted) {
      throw new PromptServiceError(404, ErrorCode.NOT_FOUND, 'Prompt not found');
    }

    syncPromptWorkspaceFromDatabase(this.db, this.promptDb, this.folderDb);
  }

  duplicate(actor: PromptActor, id: string): Prompt {
    const existing = this.getById(actor, id);

    const duplicated = this.promptDb.create({
      title: `${existing.title} (Copy)`,
      description: existing.description ?? undefined,
      promptType: existing.promptType,
      systemPrompt: existing.systemPrompt ?? undefined,
      systemPromptEn: existing.systemPromptEn ?? undefined,
      userPrompt: existing.userPrompt,
      userPromptEn: existing.userPromptEn ?? undefined,
      variables: existing.variables,
      tags: existing.tags,
      folderId: existing.folderId ?? undefined,
      images: existing.images,
      videos: existing.videos,
      source: existing.source ?? undefined,
      notes: existing.notes ?? undefined,
    });

    this.db
      .prepare('UPDATE prompts SET owner_user_id = ?, visibility = ? WHERE id = ?')
      .run(actor.userId, 'private', duplicated.id);

    syncPromptWorkspaceFromDatabase(this.db, this.promptDb, this.folderDb);

    return this.getById(actor, duplicated.id);
  }

  getVersions(actor: PromptActor, id: string): PromptVersion[] {
    this.getById(actor, id);
    return this.promptDb.getVersions(id);
  }

  createVersion(actor: PromptActor, id: string, note?: string): PromptVersion {
    const row = this.getRequiredRow(id);
    this.assertCanWrite(actor, row);

    const version = this.promptDb.createVersion(id, note);
    if (!version) {
      throw new PromptServiceError(404, ErrorCode.NOT_FOUND, 'Prompt not found');
    }

    syncPromptWorkspaceFromDatabase(this.db, this.promptDb, this.folderDb);

    return version;
  }

  deleteVersion(actor: PromptActor, id: string, versionId: string): void {
    const row = this.getRequiredRow(id);
    this.assertCanWrite(actor, row);

    const deleted = this.promptDb.deleteVersion(versionId);
    if (!deleted) {
      throw new PromptServiceError(404, ErrorCode.NOT_FOUND, 'Prompt version not found');
    }

    syncPromptWorkspaceFromDatabase(this.db, this.promptDb, this.folderDb);
  }

  rollback(actor: PromptActor, id: string, version: number): Prompt {
    const row = this.getRequiredRow(id);
    this.assertCanWrite(actor, row);

    const prompt = this.promptDb.rollback(id, version);
    if (!prompt) {
      throw new PromptServiceError(404, ErrorCode.NOT_FOUND, 'Prompt version not found');
    }

    syncPromptWorkspaceFromDatabase(this.db, this.promptDb, this.folderDb);

    return this.getById(actor, id);
  }

  diff(actor: PromptActor, id: string, fromVersion: number, toVersion: number): PromptDiffResult {
    this.getById(actor, id);

    const versions = this.promptDb.getVersions(id);
    const from = versions.find((version) => version.version === fromVersion);
    const to = versions.find((version) => version.version === toVersion);

    if (!from || !to) {
      throw new PromptServiceError(404, ErrorCode.NOT_FOUND, 'Prompt version not found');
    }

    const fields: PromptDiffResult['fields'] = [];

    this.pushDiff(fields, 'systemPrompt', from.systemPrompt, to.systemPrompt);
    this.pushDiff(fields, 'systemPromptEn', from.systemPromptEn, to.systemPromptEn);
    this.pushDiff(fields, 'userPrompt', from.userPrompt, to.userPrompt);
    this.pushDiff(fields, 'userPromptEn', from.userPromptEn, to.userPromptEn);
    this.pushDiff(fields, 'variables', JSON.stringify(from.variables), JSON.stringify(to.variables));
    this.pushDiff(fields, 'aiResponse', from.aiResponse, to.aiResponse);

    return { from, to, fields };
  }

  getAllTags(): string[] {
    return this.promptDb.getAllTags();
  }

  renameTag(oldTag: string, newTag: string): void {
    this.promptDb.renameTag(oldTag, newTag);
    syncPromptWorkspaceFromDatabase(this.db, this.promptDb, this.folderDb);
  }

  deleteTag(tag: string): void {
    this.promptDb.deleteTag(tag);
    syncPromptWorkspaceFromDatabase(this.db, this.promptDb, this.folderDb);
  }

  private getVisibleRows(actor: PromptActor, scope: 'private' | 'shared' | 'all'): PromptRow[] {
    if (scope === 'private') {
      return this.db
        .prepare('SELECT id, owner_user_id, visibility FROM prompts WHERE owner_user_id = ? AND visibility = ? ORDER BY updated_at DESC')
        .all(actor.userId, 'private') as PromptRow[];
    }

    if (scope === 'shared') {
      return this.db
        .prepare("SELECT id, owner_user_id, visibility FROM prompts WHERE visibility = 'shared' ORDER BY updated_at DESC")
        .all() as PromptRow[];
    }

    return this.db
      .prepare('SELECT id, owner_user_id, visibility FROM prompts WHERE (owner_user_id = ? AND visibility = ?) OR visibility = ? ORDER BY updated_at DESC')
      .all(actor.userId, 'private', 'shared') as PromptRow[];
  }

  private getRow(id: string): PromptRow | null {
    const row = this.db
      .prepare('SELECT id, owner_user_id, visibility FROM prompts WHERE id = ?')
      .get(id) as PromptRow | undefined;
    return row ?? null;
  }

  private getRequiredRow(id: string): PromptRow {
    const row = this.getRow(id);
    if (!row) {
      throw new PromptServiceError(404, ErrorCode.NOT_FOUND, 'Prompt not found');
    }
    return row;
  }

  private assertCanCreate(actor: PromptActor, visibility: 'private' | 'shared'): void {
    if (visibility === 'shared' && actor.role !== 'admin') {
      throw new PromptServiceError(403, ErrorCode.FORBIDDEN, 'Only admin can create shared prompts');
    }
  }

  private assertCanRead(actor: PromptActor, row: PromptRow): void {
    if (row.visibility === 'shared') {
      return;
    }

    if (row.owner_user_id !== actor.userId) {
      throw new PromptServiceError(404, ErrorCode.NOT_FOUND, 'Prompt not found');
    }
  }

  private assertCanWrite(actor: PromptActor, row: PromptRow): void {
    if (row.visibility === 'shared') {
      if (actor.role !== 'admin') {
        throw new PromptServiceError(403, ErrorCode.FORBIDDEN, 'Only admin can modify shared prompts');
      }
      return;
    }

    if (row.owner_user_id !== actor.userId) {
      throw new PromptServiceError(404, ErrorCode.NOT_FOUND, 'Prompt not found');
    }
  }

  private sortPrompts(
    prompts: Prompt[],
    sortBy: SearchQuery['sortBy'],
    sortOrder: SearchQuery['sortOrder'],
  ): Prompt[] {
    const direction = sortOrder === 'asc' ? 1 : -1;
    const copy = [...prompts];

    copy.sort((a, b) => {
      if (sortBy === 'title') {
        return a.title.localeCompare(b.title) * direction;
      }

      if (sortBy === 'usageCount') {
        return (a.usageCount - b.usageCount) * direction;
      }

      if (sortBy === 'createdAt') {
        return (new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()) * direction;
      }

      return (new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime()) * direction;
    });

    return copy;
  }

  private pushDiff(
    fields: PromptDiffResult['fields'],
    field: PromptDiffResult['fields'][number]['field'],
    from: string | null | undefined,
    to: string | null | undefined,
  ): void {
    const fromValue = from ?? '';
    const toValue = to ?? '';

    if (fromValue !== toValue) {
      fields.push({ field, from: fromValue, to: toValue });
    }
  }
}
