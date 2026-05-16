import { describe, expect, it } from 'vitest';
import config from '../vite.server.config';

describe('web server build config', () => {
  it('externalizes node-sqlite3-wasm and bcryptjs from the SSR bundle', () => {
    const external = config.build?.rollupOptions?.external;
    const ssrExternal = config.ssr?.external;

    expect(external).toEqual(expect.arrayContaining(['node-sqlite3-wasm', 'bcryptjs']));
    expect(ssrExternal).toEqual(expect.arrayContaining(['node-sqlite3-wasm', 'bcryptjs']));
  });
});
