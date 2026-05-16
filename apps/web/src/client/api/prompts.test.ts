import { beforeEach, describe, expect, it, vi } from 'vitest';

const { fetchWithAuthRetryMock } = vi.hoisted(() => ({
  fetchWithAuthRetryMock: vi.fn(),
}));

vi.mock('./auth-session', () => ({
  fetchWithAuthRetry: fetchWithAuthRetryMock,
}));

import {
  copyPrompt,
  createPrompt,
  createPromptVersion,
  deletePrompt,
  getPromptVersionDiff,
  getPromptVersions,
  getPrompts,
  rollbackPromptVersion,
  updatePrompt,
} from './prompts';

function createJsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

describe('client prompts api', () => {
  beforeEach(() => {
    fetchWithAuthRetryMock.mockReset();
  });

  it('builds prompt query strings and sends the expected prompt API requests', async () => {
    fetchWithAuthRetryMock
      .mockResolvedValueOnce(createJsonResponse(200, { data: [{ id: 'prompt-1' }] }))
      .mockResolvedValueOnce(createJsonResponse(201, { data: { id: 'prompt-2' } }))
      .mockResolvedValueOnce(createJsonResponse(200, { data: { id: 'prompt-2' } }))
      .mockResolvedValueOnce(createJsonResponse(200, { data: { ok: true } }))
      .mockResolvedValueOnce(createJsonResponse(201, { data: { id: 'prompt-copy' } }))
      .mockResolvedValueOnce(createJsonResponse(200, { data: [{ id: 'version-1' }] }))
      .mockResolvedValueOnce(createJsonResponse(201, { data: { id: 'version-2' } }))
      .mockResolvedValueOnce(createJsonResponse(200, { data: { id: 'prompt-rolled' } }))
      .mockResolvedValueOnce(createJsonResponse(200, { data: { fields: [] } }));

    expect(
      (await getPrompts('token-1', {
        scope: 'shared',
        keyword: 'seo',
        isFavorite: true,
        sortBy: 'updatedAt',
        sortOrder: 'desc',
      })).data[0]?.id,
    ).toBe('prompt-1');
    expect((await createPrompt('token-1', { title: 'Hero', userPrompt: 'Write hero copy' })).data.id).toBe('prompt-2');
    expect((await updatePrompt('token-1', 'prompt-2', { title: 'Hero v2' })).data.id).toBe('prompt-2');
    expect((await deletePrompt('token-1', 'prompt-2')).data.ok).toBe(true);
    expect((await copyPrompt('token-1', 'prompt-2')).data.id).toBe('prompt-copy');
    expect((await getPromptVersions('token-1', 'prompt-2')).data[0]?.id).toBe('version-1');
    expect((await createPromptVersion('token-1', 'prompt-2', 'snapshot')).data.id).toBe('version-2');
    expect((await rollbackPromptVersion('token-1', 'prompt-2', 3)).data.id).toBe('prompt-rolled');
    expect((await getPromptVersionDiff('token-1', 'prompt-2', 1, 3)).data.fields).toEqual([]);

    expect(fetchWithAuthRetryMock).toHaveBeenNthCalledWith(
      1,
      '/api/prompts?scope=shared&keyword=seo&isFavorite=true&sortBy=updatedAt&sortOrder=desc',
      {
        headers: { Authorization: 'Bearer token-1' },
      },
    );
    expect(fetchWithAuthRetryMock).toHaveBeenNthCalledWith(2, '/api/prompts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer token-1' },
      body: JSON.stringify({ title: 'Hero', userPrompt: 'Write hero copy' }),
    });
    expect(fetchWithAuthRetryMock).toHaveBeenNthCalledWith(9, '/api/prompts/prompt-2/versions/diff?from=1&to=3', {
      headers: { Authorization: 'Bearer token-1' },
    });
  });

  it('surfaces API error messages for prompt requests', async () => {
    fetchWithAuthRetryMock.mockResolvedValueOnce(createJsonResponse(404, { error: { message: 'Prompt not found' } }));

    await expect(deletePrompt('token-1', 'missing')).rejects.toThrow('Prompt not found');
  });
});
