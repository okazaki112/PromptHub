# Design

## Overview

This follow-up does not introduce a new abstraction layer. It repairs the WebDAV branch so the existing sync boundary behaves like a recoverable backup contract instead of a partial metadata export.

## Key Decisions

- Treat `404` as the only "missing backup" status for primary/legacy fallback; surface other HTTP failures directly.
- Require `manifest.json` for incremental WebDAV pull when `data.json` exists at the structured backup path.
- Upload and download referenced media files alongside `data.json`, and reflect them in `manifest.json`.
- Keep both legacy single-file names readable during fallback:
  - `prompthub-backup.json`
  - `prompthub-web-backup.json`
- Keep unified route responses centered on `summary`, while preserving historical count fields for compatibility.

## Affected Areas

- `apps/web/src/services/sync-orchestrator.ts`
- `apps/web/src/services/sync-media.ts`
- `apps/web/src/routes/sync.ts`
- `apps/web/src/client/api/endpoints.ts`
- `apps/web/src/routes/sync.test.ts`
- `apps/web/src/services/sync-orchestrator.test.ts`

## Tradeoffs

- Requiring a valid manifest is stricter than the previous behavior, but it prevents "successful" restores from incomplete remote state.
- Reusing the existing desktop-style WebDAV layout increases parity across clients, at the cost of a slightly larger web sync surface.
