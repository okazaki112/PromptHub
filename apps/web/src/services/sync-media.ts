import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import type { Prompt } from '@prompthub/shared';
import { ensureMediaDir, type MediaKind } from './media-workspace.js';

export interface SyncMediaManifestEntry {
  hash: string;
  size: number;
  uploadedAt: string;
}

export type SyncMediaFiles = Record<string, string>;
export type SyncMediaManifest = Record<string, SyncMediaManifestEntry>;

export interface SyncMediaBundle {
  images?: SyncMediaFiles;
  videos?: SyncMediaFiles;
  imageManifest: SyncMediaManifest;
  videoManifest: SyncMediaManifest;
}

export function normalizeSyncMediaFileName(fileName: string): string {
  const safeName = path.basename(fileName);
  if (safeName !== fileName || fileName.includes('..')) {
    throw new Error(`Invalid media filename: ${fileName}`);
  }
  return safeName;
}

function collectReferencedMedia(
  prompts: Pick<Prompt, 'images' | 'videos'>[],
  kind: MediaKind,
): string[] {
  const fileNames = new Set<string>();
  const key = kind === 'images' ? 'images' : 'videos';

  for (const prompt of prompts) {
    for (const fileName of prompt[key] ?? []) {
      fileNames.add(normalizeSyncMediaFileName(fileName));
    }
  }

  return Array.from(fileNames).sort((left, right) => left.localeCompare(right));
}

function buildKindBundle(
  userId: string,
  prompts: Pick<Prompt, 'images' | 'videos'>[],
  kind: MediaKind,
  uploadedAt: string,
): { files?: SyncMediaFiles; manifest: SyncMediaManifest } {
  const dirPath = ensureMediaDir(userId, kind);
  const fileNames = collectReferencedMedia(prompts, kind);
  const files: SyncMediaFiles = {};
  const manifest: SyncMediaManifest = {};
  const label = kind === 'images' ? 'image' : 'video';

  for (const fileName of fileNames) {
    const filePath = path.join(dirPath, fileName);
    if (!fs.existsSync(filePath)) {
      throw new Error(`Referenced ${label} file is missing: ${fileName}`);
    }

    const content = fs.readFileSync(filePath);
    const base64Data = content.toString('base64');

    files[fileName] = base64Data;
    manifest[fileName] = {
      hash: createHash('sha256').update(base64Data).digest('hex'),
      size: content.length,
      uploadedAt,
    };
  }

  return {
    files: Object.keys(files).length > 0 ? files : undefined,
    manifest,
  };
}

export function buildSyncMediaBundle(
  userId: string,
  prompts: Pick<Prompt, 'images' | 'videos'>[],
  uploadedAt: string,
): SyncMediaBundle {
  const images = buildKindBundle(userId, prompts, 'images', uploadedAt);
  const videos = buildKindBundle(userId, prompts, 'videos', uploadedAt);

  return {
    images: images.files,
    videos: videos.files,
    imageManifest: images.manifest,
    videoManifest: videos.manifest,
  };
}

export function getMediaBase64Map(
  userId: string,
  prompts: Pick<Prompt, 'images' | 'videos'>[],
): { images?: SyncMediaFiles; videos?: SyncMediaFiles } {
  const images = buildKindBundle(userId, prompts, 'images', new Date().toISOString()).files;
  const videos = buildKindBundle(userId, prompts, 'videos', new Date().toISOString()).files;

  return {
    images,
    videos,
  };
}

function writeSyncMediaFiles(
  userId: string,
  kind: MediaKind,
  files: SyncMediaFiles | undefined,
): void {
  if (!files) {
    return;
  }

  const dirPath = ensureMediaDir(userId, kind);
  for (const [fileName, base64Data] of Object.entries(files)) {
    const safeName = normalizeSyncMediaFileName(fileName);
    const filePath = path.join(dirPath, safeName);
    fs.writeFileSync(filePath, Buffer.from(base64Data, 'base64'));
  }
}

export function writePulledSyncMedia(
  userId: string,
  media: { images?: SyncMediaFiles; videos?: SyncMediaFiles },
): void {
  writeSyncMediaFiles(userId, 'images', media.images);
  writeSyncMediaFiles(userId, 'videos', media.videos);
}
