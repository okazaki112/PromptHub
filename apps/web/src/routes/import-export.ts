import { Hono } from 'hono';
import type { Context } from 'hono';
import { getAuthUser } from '../middleware/auth.js';
import { BackupService } from '../services/backup.service.js';
import { getMediaBase64Map, writePulledSyncMedia } from '../services/sync-media.js';
import {
  parseSyncSnapshot,
  withDefaultImportedSettings,
} from '../services/sync-snapshot.js';
import { error, ErrorCode, success } from '../utils/response.js';
import { unzipSync, strFromU8 } from 'fflate';

const importExport = new Hono();
const backupService = new BackupService();

importExport.get('/export', async (c) => {
  try {
    const actor = getAuthUser(c);
    const payload = backupService.export(actor);
    const media = getMediaBase64Map(actor.userId, payload.prompts);
    c.header('Content-Type', 'application/json; charset=utf-8');
    c.header('Content-Disposition', `attachment; filename="prompthub-web-export-${Date.now()}.json"`);
    return c.body(JSON.stringify({
      ...payload,
      images: media.images,
      videos: media.videos,
    }, null, 2), 200);
  } catch (routeError) {
    return toRouteErrorResponse(c, routeError);
  }
});

importExport.post('/import', async (c) => {
  const contentType = c.req.header('content-type') ?? '';

  // Handle ZIP file upload (from desktop export)
  if (contentType.includes('application/zip') || contentType.includes('application/octet-stream') || contentType.includes('multipart/form-data')) {
    try {
      let zipBuffer: Uint8Array;

      if (contentType.includes('multipart/form-data')) {
        const formData = await c.req.formData();
        const file = formData.get('file');
        if (!file || typeof file === 'string') {
          return error(c, 400, ErrorCode.BAD_REQUEST, 'Missing file field in form data');
        }
        zipBuffer = new Uint8Array(await file.arrayBuffer());
      } else {
        zipBuffer = new Uint8Array(await c.req.arrayBuffer());
      }

      const files = unzipSync(zipBuffer);
      // Desktop ZIP contains import-with-prompthub.json as the importable payload
      const jsonEntry = files['import-with-prompthub.json'];
      if (!jsonEntry) {
        return error(c, 400, ErrorCode.BAD_REQUEST, 'Invalid ZIP file: missing import-with-prompthub.json');
      }

      const jsonText = strFromU8(jsonEntry);
      let rawData: unknown;
      try {
        rawData = JSON.parse(jsonText);
      } catch {
        return error(c, 400, ErrorCode.BAD_REQUEST, 'Invalid JSON in import-with-prompthub.json');
      }

      const snapshot = parseSyncSnapshot(rawData);
      const actor = getAuthUser(c);
      writePulledSyncMedia(actor.userId, {
        images: snapshot.images,
        videos: snapshot.videos,
      });
      const result = backupService.import(
        actor,
        withDefaultImportedSettings(snapshot),
        { forceSettingsImport: true },
      );
      return success(c, result, 201);
    } catch (routeError) {
      return toRouteErrorResponse(c, routeError);
    }
  }

  try {
    let rawData: unknown;
    try {
      rawData = await c.req.json();
    } catch {
      return error(c, 400, ErrorCode.BAD_REQUEST, 'Invalid JSON request body');
    }

    const snapshot = parseSyncSnapshot(rawData);
    const actor = getAuthUser(c);
    writePulledSyncMedia(actor.userId, {
      images: snapshot.images,
      videos: snapshot.videos,
    });
    const result = backupService.import(
      actor,
      withDefaultImportedSettings(snapshot),
      { forceSettingsImport: true },
    );
    return success(c, result, 201);
  } catch (routeError) {
    return toRouteErrorResponse(c, routeError);
  }
});

function toRouteErrorResponse(c: Context, routeError: unknown): Response {
  if (routeError instanceof Error) {
    if (routeError.message.startsWith('Sync snapshot is invalid:')) {
      return error(c, 422, ErrorCode.VALIDATION_ERROR, routeError.message);
    }
    return error(c, 400, ErrorCode.BAD_REQUEST, routeError.message);
  }

  return error(c, 500, ErrorCode.INTERNAL_ERROR, 'Internal server error');
}

export default importExport;
