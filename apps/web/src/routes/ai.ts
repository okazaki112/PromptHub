import { Hono } from 'hono';
import { z } from 'zod';
import type { AITransportRequest, AITransportResponse } from '@prompthub/shared';
import { error, ErrorCode, success } from '../utils/response.js';
import { parseJsonBody } from '../utils/validation.js';
import { requestRemoteBuffered, requestRemoteStream } from '../utils/remote-http.js';

const ai = new Hono();

const requestSchema = z.object({
  requestId: z.string().trim().min(1).optional(),
  method: z.enum(['GET', 'POST']),
  url: z.string().trim().url('url must be valid'),
  headers: z.record(z.string()).optional(),
  body: z.string().optional(),
});

function toTransportResponse(response: {
  status: number;
  statusText: string;
  headers: Record<string, string>;
  body: string;
}): AITransportResponse {
  return {
    ok: response.status >= 200 && response.status < 300,
    status: response.status,
    statusText: response.statusText,
    body: response.body,
    headers: response.headers,
  };
}

function toErrorResponse(routeError: unknown): AITransportResponse {
  return {
    ok: false,
    status: 0,
    statusText: '',
    body: '',
    headers: {},
    error: routeError instanceof Error ? routeError.message : 'Unknown error',
  };
}

async function executeBufferedRequest(request: AITransportRequest): Promise<AITransportResponse> {
  try {
    const response = await requestRemoteBuffered({
      url: request.url,
      method: request.method,
      headers: request.headers,
      body: request.body,
      allowedProtocols: ['https:', 'http:'],
    });

    return toTransportResponse({
      status: response.status,
      statusText: response.statusText,
      headers: response.headers,
      body: response.body.toString('utf-8'),
    });
  } catch (routeError) {
    return toErrorResponse(routeError);
  }
}

ai.post('/request', async (c) => {
  const parsed = await parseJsonBody(c, requestSchema);
  if (!parsed.success) {
    return parsed.response;
  }

  const response = await executeBufferedRequest(parsed.data);
  return success(c, response);
});

ai.post('/stream', async (c) => {
  const parsed = await parseJsonBody(c, requestSchema);
  if (!parsed.success) {
    return parsed.response;
  }

  try {
    const response = await requestRemoteStream({
      url: parsed.data.url,
      method: parsed.data.method,
      headers: parsed.data.headers,
      body: parsed.data.body,
      allowedProtocols: ['https:', 'http:'],
    });

    if (response.status < 200 || response.status >= 300 || !response.body) {
      const fallback = await executeBufferedRequest(parsed.data);
      return success(c, fallback);
    }

    const headers = new Headers();
    headers.set('Content-Type', response.headers['content-type'] ?? 'text/event-stream; charset=utf-8');
    headers.set('Cache-Control', 'no-cache');
    headers.set('Connection', 'keep-alive');
    headers.set('X-PromptHub-Request-Id', parsed.data.requestId ?? '');

    for (const [key, value] of Object.entries(response.headers)) {
      const normalizedKey = key.toLowerCase();
      if (normalizedKey === 'content-length' || normalizedKey === 'connection') {
        continue;
      }
      if (!headers.has(key) && value) {
        headers.set(key, value);
      }
    }

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers,
    });
  } catch (routeError) {
    return error(
      c,
      500,
      ErrorCode.INTERNAL_ERROR,
      routeError instanceof Error ? routeError.message : 'Internal server error',
    );
  }
});

export default ai;
