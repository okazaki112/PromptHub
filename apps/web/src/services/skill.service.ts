import { SkillDB } from '@prompthub/db';
import type {
  CreateSkillParams,
  Skill,
  SkillSafetyReport,
  SkillSafetyScanInput,
  SkillVersion,
  UpdateSkillParams,
} from '@prompthub/shared';
import { getServerDatabase } from '../database.js';
import { ErrorCode } from '../utils/response.js';
import { requestRemoteBuffered } from '../utils/remote-http.js';
import { ensureSkillName } from '../utils/skill-name.js';
import {
  parseRemoteSkill,
  scanSkillContentWithAI,
} from './skill-content.service.js';
import { syncSkillWorkspaceFromDatabase } from './skill-workspace.js';

export interface SkillActor {
  userId: string;
  role: 'admin' | 'user';
}

export class SkillServiceError extends Error {
  constructor(
    public readonly status: 400 | 401 | 403 | 404 | 409 | 422 | 500,
    public readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = 'SkillServiceError';
  }
}

interface SkillRow {
  id: string;
  owner_user_id: string | null;
  visibility: 'private' | 'shared';
}

export class SkillService {
  private readonly skillDb = new SkillDB(getServerDatabase());
  private readonly db = getServerDatabase();

  private syncWorkspace(): void {
    syncSkillWorkspaceFromDatabase(this.db, this.skillDb);
  }

  create(actor: SkillActor, data: CreateSkillParams): Skill {
    const visibility = data.visibility ?? 'shared';
    this.assertCanCreate(actor, visibility);

    const skill = this.skillDb.create({
      ...data,
      visibility,
    });

    this.db
      .prepare('UPDATE skills SET owner_user_id = ?, visibility = ? WHERE id = ?')
      .run(actor.userId, visibility, skill.id);

    this.syncWorkspace();

    return this.getById(actor, skill.id);
  }

  list(actor: SkillActor, scope: 'private' | 'shared' | 'all' = 'shared'): Skill[] {
    const rows = this.getVisibleRows(actor, scope);
    return rows.map((row) => this.getById(actor, row.id));
  }

  getById(actor: SkillActor, id: string): Skill {
    const row = this.getRow(id);
    if (!row) {
      throw new SkillServiceError(404, ErrorCode.NOT_FOUND, 'Skill not found');
    }

    this.assertCanRead(actor, row);

    const skill = this.skillDb.getById(id);
    if (!skill) {
      throw new SkillServiceError(404, ErrorCode.NOT_FOUND, 'Skill not found');
    }

    return {
      ...skill,
      ownerUserId: row.owner_user_id,
      visibility: row.visibility,
    };
  }

  update(actor: SkillActor, id: string, data: UpdateSkillParams): Skill {
    const row = this.getRequiredRow(id);
    this.assertCanWrite(actor, row);

    const nextVisibility = data.visibility ?? row.visibility;
    if (nextVisibility !== row.visibility && actor.role !== 'admin') {
      throw new SkillServiceError(403, ErrorCode.FORBIDDEN, 'Only admin can change shared visibility');
    }

    const updated = this.skillDb.update(id, data);
    if (!updated) {
      throw new SkillServiceError(404, ErrorCode.NOT_FOUND, 'Skill not found');
    }

    if (data.visibility !== undefined) {
      this.db.prepare('UPDATE skills SET visibility = ? WHERE id = ?').run(data.visibility, id);
    }

    this.syncWorkspace();

    return this.getById(actor, id);
  }

  delete(actor: SkillActor, id: string): void {
    const row = this.getRequiredRow(id);
    this.assertCanWrite(actor, row);

    const deleted = this.skillDb.delete(id);
    if (!deleted) {
      throw new SkillServiceError(404, ErrorCode.NOT_FOUND, 'Skill not found');
    }

    this.syncWorkspace();
  }

  deleteAll(actor: SkillActor, confirm: boolean): void {
    if (!confirm) {
      throw new SkillServiceError(422, ErrorCode.VALIDATION_ERROR, 'confirm=true is required');
    }

    if (actor.role !== 'admin') {
      throw new SkillServiceError(403, ErrorCode.FORBIDDEN, 'Only admin can delete all skills');
    }

    this.skillDb.deleteAll();
    this.syncWorkspace();
  }

  getVersions(actor: SkillActor, skillId: string): SkillVersion[] {
    this.getById(actor, skillId);
    return this.skillDb.getVersions(skillId);
  }

  createVersion(actor: SkillActor, skillId: string, note?: string): SkillVersion {
    const row = this.getRequiredRow(skillId);
    this.assertCanWrite(actor, row);

    const version = this.skillDb.createVersion(skillId, note);
    if (!version) {
      throw new SkillServiceError(404, ErrorCode.NOT_FOUND, 'Skill not found');
    }

    this.syncWorkspace();

    return version;
  }

  rollback(actor: SkillActor, skillId: string, version: number): Skill {
    const row = this.getRequiredRow(skillId);
    this.assertCanWrite(actor, row);

    const skill = this.skillDb.rollbackVersion(skillId, version);
    if (!skill) {
      throw new SkillServiceError(404, ErrorCode.NOT_FOUND, 'Skill version not found');
    }

    this.syncWorkspace();

    return this.getById(actor, skillId);
  }

  deleteVersion(actor: SkillActor, skillId: string, versionId: string): void {
    const row = this.getRequiredRow(skillId);
    this.assertCanWrite(actor, row);

    const deleted = this.skillDb.deleteVersion(skillId, versionId);
    if (!deleted) {
      throw new SkillServiceError(404, ErrorCode.NOT_FOUND, 'Skill version not found');
    }

    this.syncWorkspace();
  }

  saveSafetyReport(actor: SkillActor, skillId: string, report: SkillSafetyReport): Skill {
    const row = this.getRequiredRow(skillId);
    this.assertCanWrite(actor, row);

    const updated = this.skillDb.update(skillId, { safetyReport: report });
    if (!updated) {
      throw new SkillServiceError(404, ErrorCode.NOT_FOUND, 'Skill not found');
    }

    this.syncWorkspace();

    return this.getById(actor, skillId);
  }

  async scanSafety(
    actor: SkillActor,
    skillId: string,
    overrides: Partial<SkillSafetyScanInput> = {},
  ): Promise<SkillSafetyReport> {
    const skill = this.getById(actor, skillId);
    const input: SkillSafetyScanInput = {
      name: overrides.name ?? skill.name,
      content: overrides.content ?? skill.content ?? skill.instructions ?? '',
      sourceUrl: overrides.sourceUrl ?? skill.source_url,
      contentUrl: overrides.contentUrl ?? skill.content_url,
      localRepoPath: overrides.localRepoPath,
      securityAudits: overrides.securityAudits,
      aiConfig: overrides.aiConfig,
    };

    return scanSkillContentWithAI(input);
  }

  async scanSafetyInput(input: SkillSafetyScanInput): Promise<SkillSafetyReport> {
    return scanSkillContentWithAI(input);
  }

  async fetchRemote(
    actor: SkillActor,
    payload: {
      url: string;
      importToLibrary?: boolean;
      name?: string;
      description?: string;
      visibility?: 'private' | 'shared';
    },
  ): Promise<{
    content: string;
    metadata: {
      name?: string;
      description?: string;
      version?: string;
      author?: string;
      tags?: string[];
    };
    importedSkill?: Skill;
  }> {
    const response = await requestRemoteBuffered({
      url: payload.url,
      method: 'GET',
      headers: {
        Accept: 'text/plain, text/markdown, application/octet-stream;q=0.8, */*;q=0.1',
        'User-Agent': 'PromptHub/web-remote-skill-fetch',
      },
      allowedProtocols: ['https:'],
      maxBytes: 5 * 1024 * 1024,
    });

    if (response.status !== 200) {
      throw new SkillServiceError(422, ErrorCode.VALIDATION_ERROR, `Remote fetch failed with HTTP ${response.status}`);
    }

    const content = response.body.toString('utf-8');
    const parsed = parseRemoteSkill(content);

    let importedSkill: Skill | undefined;
    if (payload.importToLibrary) {
      const name = ensureSkillName(payload.name ?? parsed.name ?? '', new URL(payload.url).pathname.split('/').pop() ?? 'remote-skill');
      importedSkill = this.create(actor, {
        name,
        description: payload.description ?? parsed.description,
        content,
        instructions: parsed.body || content,
        protocol_type: 'skill',
        version: parsed.version,
        author: parsed.author,
        tags: parsed.tags,
        source_url: payload.url,
        content_url: payload.url,
        visibility: payload.visibility,
        is_favorite: false,
      });
    }

    return {
      content,
      metadata: {
        name: parsed.name,
        description: parsed.description,
        version: parsed.version,
        author: parsed.author,
        tags: parsed.tags,
      },
      importedSkill,
    };
  }

  private getVisibleRows(actor: SkillActor, scope: 'private' | 'shared' | 'all'): SkillRow[] {
    if (scope === 'private') {
      return this.db
        .prepare('SELECT id, owner_user_id, visibility FROM skills WHERE owner_user_id = ? AND visibility = ? ORDER BY updated_at DESC')
        .all(actor.userId, 'private') as SkillRow[];
    }

    if (scope === 'shared') {
      return this.db
        .prepare("SELECT id, owner_user_id, visibility FROM skills WHERE visibility = 'shared' ORDER BY updated_at DESC")
        .all() as SkillRow[];
    }

    return this.db
      .prepare('SELECT id, owner_user_id, visibility FROM skills WHERE (owner_user_id = ? AND visibility = ?) OR visibility = ? ORDER BY updated_at DESC')
      .all(actor.userId, 'private', 'shared') as SkillRow[];
  }

  private getRow(id: string): SkillRow | null {
    const row = this.db
      .prepare('SELECT id, owner_user_id, visibility FROM skills WHERE id = ?')
      .get(id) as SkillRow | undefined;
    return row ?? null;
  }

  private getRequiredRow(id: string): SkillRow {
    const row = this.getRow(id);
    if (!row) {
      throw new SkillServiceError(404, ErrorCode.NOT_FOUND, 'Skill not found');
    }
    return row;
  }

  private assertCanCreate(actor: SkillActor, visibility: 'private' | 'shared'): void {
    if (visibility === 'shared' && actor.role !== 'admin') {
      throw new SkillServiceError(403, ErrorCode.FORBIDDEN, 'Only admin can create shared skills');
    }
  }

  private assertCanRead(actor: SkillActor, row: SkillRow): void {
    if (row.visibility === 'shared') {
      return;
    }

    if (row.owner_user_id !== actor.userId) {
      throw new SkillServiceError(404, ErrorCode.NOT_FOUND, 'Skill not found');
    }
  }

  private assertCanWrite(actor: SkillActor, row: SkillRow): void {
    if (row.visibility === 'shared') {
      if (actor.role !== 'admin') {
        throw new SkillServiceError(403, ErrorCode.FORBIDDEN, 'Only admin can modify shared skills');
      }
      return;
    }

    if (row.owner_user_id !== actor.userId) {
      throw new SkillServiceError(404, ErrorCode.NOT_FOUND, 'Skill not found');
    }
  }
}
