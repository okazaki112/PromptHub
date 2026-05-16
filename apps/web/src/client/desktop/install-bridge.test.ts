import { beforeEach, describe, expect, it, vi } from 'vitest';

async function loadInstallDesktopBridge() {
  const module = await import('./install-bridge');
  return module.installDesktopBridge;
}

describe('installDesktopBridge media helpers', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.restoreAllMocks();
    Reflect.deleteProperty(window, 'api');
    Reflect.deleteProperty(window, 'electron');
    Reflect.deleteProperty(window, '__PROMPTHUB_WEB__');
    vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({ data: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })));
  });

  it('falls back when crypto.randomUUID is unavailable for pasted image uploads', async () => {
    const installDesktopBridge = await loadInstallDesktopBridge();
    const originalCrypto = globalThis.crypto;
    Object.defineProperty(globalThis, 'crypto', {
      configurable: true,
      value: {},
    });

    installDesktopBridge();

    const electronBridge = Reflect.get(window, 'electron') as {
      saveImageBuffer: (buffer: ArrayBuffer) => Promise<string>;
    };
    const fileName = await electronBridge.saveImageBuffer(new Uint8Array([1, 2, 3]).buffer);

    expect(fileName).toMatch(/^image-/);
    expect(fileName).toMatch(/\.png$/);

    Object.defineProperty(globalThis, 'crypto', {
      configurable: true,
      value: originalCrypto,
    });
  });

  it('exposes prompt tag helpers and rules bridge methods', async () => {
    const installDesktopBridge = await loadInstallDesktopBridge();
    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: RequestInfo | URL) => {
        const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;
        if (url.endsWith('/api/prompts/meta/tags')) {
          return new Response(JSON.stringify({ data: ['alpha', 'beta'] }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          });
        }
        if (url.endsWith('/api/rules') || url.endsWith('/api/rules/scan')) {
          return new Response(JSON.stringify({ data: [] }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          });
        }
        return new Response(JSON.stringify({ data: { success: true } }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }),
    );

    installDesktopBridge();

    const api = Reflect.get(window, 'api') as {
      prompt: {
        getAllTags: () => Promise<string[]>;
        renameTag: (oldTag: string, newTag: string) => Promise<boolean>;
        deleteTag: (tag: string) => Promise<boolean>;
      };
      rules: {
        list: () => Promise<unknown[]>;
        scan: () => Promise<unknown[]>;
        addProject: (input: { name: string; rootPath: string }) => Promise<unknown>;
        removeProject: (projectId: string) => Promise<{ success: boolean }>;
      };
    };

    await expect(api.prompt.getAllTags()).resolves.toEqual(['alpha', 'beta']);
    await expect(api.prompt.renameTag('alpha', 'beta')).resolves.toBe(true);
    await expect(api.prompt.deleteTag('beta')).resolves.toBe(true);
    await expect(api.rules.list()).resolves.toEqual([]);
    await expect(api.rules.scan()).resolves.toEqual([]);
    await expect(
      api.rules.addProject({ name: 'Docs Site', rootPath: '/workspace/docs' }),
    ).resolves.toEqual({ success: true });
    await expect(api.rules.removeProject('docs-site')).resolves.toEqual({ success: true });
  });
});
