import { serve } from '@hono/node-server';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { readFile } from 'node:fs/promises';
import { config } from './config.js';
import { createApp } from './app.js';

const app = createApp();
const clientDistDir = path.resolve(process.cwd(), 'dist/client');
const clientIndexPath = path.join(clientDistDir, 'index.html');

if (existsSync(clientIndexPath)) {
  app.get('*', async (c) => {
    const requestPath = c.req.path === '/' ? '/index.html' : c.req.path;
    const normalizedPath = requestPath.replace(/^\//, '');
    const targetPath = path.resolve(clientDistDir, normalizedPath);

    if (targetPath.startsWith(clientDistDir) && existsSync(targetPath)) {
      const file = await readFile(targetPath);
      const extension = path.extname(targetPath).toLowerCase();
      const contentType = extension === '.html'
        ? 'text/html; charset=utf-8'
        : extension === '.js'
          ? 'application/javascript; charset=utf-8'
          : extension === '.css'
            ? 'text/css; charset=utf-8'
            : extension === '.json'
              ? 'application/json; charset=utf-8'
              : extension === '.svg'
                ? 'image/svg+xml'
                : extension === '.png'
                  ? 'image/png'
                  : extension === '.jpg' || extension === '.jpeg'
                    ? 'image/jpeg'
                    : 'application/octet-stream';

      return new Response(file, {
        status: 200,
        headers: {
          'Content-Type': contentType,
        },
      });
    }

    const html = await readFile(clientIndexPath);
    return new Response(html, {
      status: 200,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
      },
    });
  });
}

serve(
  {
    fetch: app.fetch,
    port: config.port,
    hostname: config.host,
  },
  (info) => {
    console.log(`PromptHub server listening on http://${info.address}:${info.port}`);
  },
);
