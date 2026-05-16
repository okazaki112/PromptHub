import { FolderDB } from '@prompthub/db';
import type { CreateFolderDTO, Folder, UpdateFolderDTO } from '@prompthub/shared';
import { getServerDatabase } from '../database.js';
import { ErrorCode } from '../utils/response.js';
import { PromptDB } from '@prompthub/db';
import { syncPromptWorkspaceFromDatabase } from './prompt-workspace.js';

export interface FolderActor {
  userId: string;
  role: 'admin' | 'user';
}

export class FolderServiceError extends Error {
  constructor(
    public readonly status: 400 | 401 | 403 | 404 | 409 | 422 | 500,
    public readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = 'FolderServiceError';
  }
}

interface FolderRow {
  id: string;
  owner_user_id: string | null;
  visibility: 'private' | 'shared';
}

export class FolderService {
  private readonly folderDb = new FolderDB(getServerDatabase());
  private readonly promptDb = new PromptDB(getServerDatabase());
  private readonly db = getServerDatabase();

  create(actor: FolderActor, data: CreateFolderDTO): Folder {
    this.assertCreateVisibilityAllowed(actor, data.visibility);
    this.assertParentAllowed(actor, data.parentId, data.visibility ?? 'private');

    const folder = this.folderDb.create({
      ...data,
      visibility: data.visibility ?? 'private',
      isPrivate: data.visibility ? data.visibility === 'private' : data.isPrivate,
    });

    this.db
      .prepare('UPDATE folders SET owner_user_id = ?, visibility = ? WHERE id = ?')
      .run(actor.userId, data.visibility ?? 'private', folder.id);

    syncPromptWorkspaceFromDatabase(this.db, this.promptDb, this.folderDb);

    return this.getById(actor, folder.id);
  }

  list(actor: FolderActor, scope: 'private' | 'shared' | 'all' = 'private'): Folder[] {
    const rows = this.getVisibleFolderRows(actor, scope);
    return rows.map((row) => this.getById(actor, row.id));
  }

  getById(actor: FolderActor, id: string): Folder {
    const row = this.getFolderRow(id);
    if (!row) {
      throw new FolderServiceError(404, ErrorCode.NOT_FOUND, 'Folder not found');
    }

    this.assertCanRead(actor, row);

    const folder = this.folderDb.getById(id);
    if (!folder) {
      throw new FolderServiceError(404, ErrorCode.NOT_FOUND, 'Folder not found');
    }

    return {
      ...folder,
      ownerUserId: row.owner_user_id,
      visibility: row.visibility,
    };
  }

  update(actor: FolderActor, id: string, data: UpdateFolderDTO): Folder {
    const row = this.getRequiredFolderRow(id);
    this.assertCanWrite(actor, row);

    const nextVisibility = data.visibility ?? row.visibility;
    if (nextVisibility !== row.visibility && actor.role !== 'admin') {
      throw new FolderServiceError(403, ErrorCode.FORBIDDEN, 'Only admin can change shared visibility');
    }

    const nextParentId = data.parentId === undefined ? undefined : data.parentId;
    if (nextParentId !== undefined) {
      this.assertParentAllowed(actor, nextParentId, nextVisibility);
    }

    const updated = this.folderDb.update(id, {
      ...data,
      isPrivate: data.visibility ? data.visibility === 'private' : data.isPrivate,
    });

    if (!updated) {
      throw new FolderServiceError(404, ErrorCode.NOT_FOUND, 'Folder not found');
    }

    if (data.visibility !== undefined) {
      this.db.prepare('UPDATE folders SET visibility = ? WHERE id = ?').run(data.visibility, id);
    }

    syncPromptWorkspaceFromDatabase(this.db, this.promptDb, this.folderDb);

    return this.getById(actor, id);
  }

  delete(actor: FolderActor, id: string): void {
    const row = this.getRequiredFolderRow(id);
    this.assertCanWrite(actor, row);

    const deleted = this.folderDb.delete(id);
    if (!deleted) {
      throw new FolderServiceError(404, ErrorCode.NOT_FOUND, 'Folder not found');
    }

    syncPromptWorkspaceFromDatabase(this.db, this.promptDb, this.folderDb);
  }

  reorder(actor: FolderActor, ids: string[]): void {
    const rows = ids.map((id) => this.getRequiredFolderRow(id));
    if (rows.length === 0) {
      return;
    }

    const firstVisibility = rows[0].visibility;
    const firstOwner = rows[0].owner_user_id;

    for (const row of rows) {
      this.assertCanWrite(actor, row);

      if (row.visibility !== firstVisibility) {
        throw new FolderServiceError(422, ErrorCode.VALIDATION_ERROR, 'Cannot reorder mixed visibility folders');
      }

      if (firstVisibility === 'private' && row.owner_user_id !== firstOwner) {
        throw new FolderServiceError(422, ErrorCode.VALIDATION_ERROR, 'Cannot reorder folders from different owners');
      }
    }

    this.folderDb.reorder(ids);
    syncPromptWorkspaceFromDatabase(this.db, this.promptDb, this.folderDb);
  }

  private getVisibleFolderRows(actor: FolderActor, scope: 'private' | 'shared' | 'all'): FolderRow[] {
    if (scope === 'private') {
      return this.db
        .prepare('SELECT id, owner_user_id, visibility FROM folders WHERE owner_user_id = ? AND visibility = ? ORDER BY sort_order ASC')
        .all(actor.userId, 'private') as FolderRow[];
    }

    if (scope === 'shared') {
      return this.db
        .prepare("SELECT id, owner_user_id, visibility FROM folders WHERE visibility = 'shared' ORDER BY sort_order ASC")
        .all() as FolderRow[];
    }

    return this.db
      .prepare('SELECT id, owner_user_id, visibility FROM folders WHERE (owner_user_id = ? AND visibility = ?) OR visibility = ? ORDER BY sort_order ASC')
      .all(actor.userId, 'private', 'shared') as FolderRow[];
  }

  private getFolderRow(id: string): FolderRow | null {
    const row = this.db
      .prepare('SELECT id, owner_user_id, visibility FROM folders WHERE id = ?')
      .get(id) as FolderRow | undefined;
    return row ?? null;
  }

  private getRequiredFolderRow(id: string): FolderRow {
    const row = this.getFolderRow(id);
    if (!row) {
      throw new FolderServiceError(404, ErrorCode.NOT_FOUND, 'Folder not found');
    }
    return row;
  }

  private assertCanRead(actor: FolderActor, row: FolderRow): void {
    if (row.visibility === 'shared') {
      return;
    }

    if (row.owner_user_id !== actor.userId) {
      throw new FolderServiceError(404, ErrorCode.NOT_FOUND, 'Folder not found');
    }
  }

  private assertCanWrite(actor: FolderActor, row: FolderRow): void {
    if (row.visibility === 'shared') {
      if (actor.role !== 'admin') {
        throw new FolderServiceError(403, ErrorCode.FORBIDDEN, 'Only admin can modify shared folders');
      }
      return;
    }

    if (row.owner_user_id !== actor.userId) {
      throw new FolderServiceError(404, ErrorCode.NOT_FOUND, 'Folder not found');
    }
  }

  private assertCreateVisibilityAllowed(actor: FolderActor, visibility: 'private' | 'shared' | undefined): void {
    if (visibility === 'shared' && actor.role !== 'admin') {
      throw new FolderServiceError(403, ErrorCode.FORBIDDEN, 'Only admin can create shared folders');
    }
  }

  private assertParentAllowed(
    actor: FolderActor,
    parentId: string | undefined,
    visibility: 'private' | 'shared',
  ): void {
    if (!parentId) {
      return;
    }

    const parent = this.getRequiredFolderRow(parentId);
    this.assertCanRead(actor, parent);

    if (parent.visibility !== visibility) {
      throw new FolderServiceError(422, ErrorCode.VALIDATION_ERROR, 'Parent folder visibility must match child visibility');
    }

    if (visibility === 'private' && parent.owner_user_id !== actor.userId) {
      throw new FolderServiceError(422, ErrorCode.VALIDATION_ERROR, 'Private folders must stay under the same owner');
    }
  }
}
