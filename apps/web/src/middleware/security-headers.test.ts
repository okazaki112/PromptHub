import { describe, expect, it } from 'vitest';
import { Hono } from 'hono';

import { securityHeaders } from './security-headers.js';

describe('securityHeaders', () => {
  it('applies baseline hardening headers to responses', async () => {
    const app = new Hono();
    app.use('*', securityHeaders());
    app.get('/health', (c) => c.json({ ok: true }));

    const response = await app.request('http://local/health');

    expect(response.headers.get('content-security-policy')).toContain("default-src 'self'");
    expect(response.headers.get('x-frame-options')).toBe('DENY');
    expect(response.headers.get('x-content-type-options')).toBe('nosniff');
    expect(response.headers.get('referrer-policy')).toBe('no-referrer');
    expect(response.headers.get('cross-origin-opener-policy')).toBe('same-origin');
  });

  it('adds HSTS only for secure requests', async () => {
    const app = new Hono();
    app.use('*', securityHeaders());
    app.get('/secure', (c) => c.json({ ok: true }));

    const response = await app.request('https://local/secure');

    expect(response.headers.get('strict-transport-security')).toContain('max-age=31536000');
  });
});
