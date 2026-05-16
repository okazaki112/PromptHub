import { Buffer } from 'node:buffer';
import { requestRemoteBuffered } from '../utils/remote-http.js';

export interface WebDavConfig {
  endpoint: string;
  username?: string;
  password?: string;
  remotePath?: string;
}

function trimSlashes(value: string): string {
  return value.replace(/^\/+|\/+$/g, '');
}

function encodePathSegment(value: string): string {
  return encodeURIComponent(value).replace(/%2F/gi, '/');
}

function getAuthHeader(config: WebDavConfig): Record<string, string> {
  if (!config.username) {
    return {};
  }

  const token = Buffer.from(`${config.username}:${config.password ?? ''}`).toString('base64');
  return {
    Authorization: `Basic ${token}`,
  };
}

export function buildWebDavTargetUrl(config: WebDavConfig, fileName: string): string {
  const baseUrl = config.endpoint.replace(/\/$/, '');
  const remotePath = config.remotePath ? trimSlashes(config.remotePath) : '';
  const segments = [remotePath, trimSlashes(fileName)].filter(Boolean).map(encodePathSegment);
  return segments.length > 0 ? `${baseUrl}/${segments.join('/')}` : `${baseUrl}/${encodePathSegment(fileName)}`;
}

export async function testWebDavConnection(config: WebDavConfig): Promise<{ ok: boolean; status: number }> {
  const response = await requestRemoteBuffered({
    url: config.endpoint,
    method: 'PROPFIND',
    headers: {
      Depth: '0',
      ...getAuthHeader(config),
    },
    allowedProtocols: ['https:'],
  });

  return {
    ok: response.status >= 200 && response.status < 300,
    status: response.status,
  };
}

export async function pushWebDavFile(config: WebDavConfig, fileName: string, payload: string): Promise<{ ok: boolean; status: number }> {
  const response = await requestRemoteBuffered({
    url: buildWebDavTargetUrl(config, fileName),
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      ...getAuthHeader(config),
    },
    body: payload,
    allowedProtocols: ['https:'],
    maxBytes: 100 * 1024 * 1024,
  });

  return {
    ok: response.status >= 200 && response.status < 300,
    status: response.status,
  };
}

export async function pullWebDavFile(config: WebDavConfig, fileName: string): Promise<{ ok: boolean; status: number; body: string }> {
  const response = await requestRemoteBuffered({
    url: buildWebDavTargetUrl(config, fileName),
    method: 'GET',
    headers: {
      Accept: 'application/json',
      ...getAuthHeader(config),
    },
    allowedProtocols: ['https:'],
  });

  return {
    ok: response.status >= 200 && response.status < 300,
    status: response.status,
    body: response.body.toString('utf-8'),
  };
}

// Create a WebDAV collection (directory). Returns true if created or already exists.
export async function mkcolWebDavDirectory(config: WebDavConfig, dirName: string): Promise<boolean> {
  const response = await requestRemoteBuffered({
    url: buildWebDavTargetUrl(config, dirName),
    method: 'MKCOL',
    headers: { ...getAuthHeader(config) },
    allowedProtocols: ['https:'],
  });
  // 201 Created, 405 Method Not Allowed (already exists on most servers)
  return response.status === 201 || response.status === 405 || response.status === 200;
}
