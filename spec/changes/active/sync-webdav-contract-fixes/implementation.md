# Implementation

## Shipped Changes

- Added `sync-media.ts` as a small web-side repository adapter for collecting referenced media into WebDAV payloads and writing pulled media back to the workspace.
- Tightened WebDAV orchestrator behavior in `apps/web/src/services/sync-orchestrator.ts`:
  - only `404` triggers fallback to legacy files
  - `manifest.json` upload failure now fails the push
  - structured backup pull now requires a valid manifest
  - both `prompthub-backup.json` and `prompthub-web-backup.json` are readable during fallback
- Updated `apps/web/src/routes/sync.ts` so direct `/sync/data` imports and WebDAV pulls both persist media files before importing records.
- Updated `apps/web/src/client/api/endpoints.ts` to match the unified `summary`-first sync contract and keep legacy count fields typed.
- Expanded sync regression coverage for orchestrator and route behavior.
- Fixed an existing web build blocker by changing `apps/desktop/src/renderer/components/ui/PlatformIcon.tsx` to use a relative import for `hermes.svg`, matching the rest of the file's asset imports and allowing the web Vite build to resolve the icon.

## Verification

- `pnpm --filter @prompthub/web lint`
- `pnpm --filter @prompthub/web exec tsc --noEmit`
- `pnpm --filter @prompthub/web test -- src/services/sync-orchestrator.test.ts --run`
- `pnpm --filter @prompthub/web test -- src/routes/sync.test.ts --run`
- `pnpm --filter @prompthub/web test -- src/client/api/endpoints.test.ts --run`
- `pnpm --filter @prompthub/web build`

## Follow-up

- If we later promote a true cross-provider orchestrator interface, `sync-media.ts` should move behind that shared repository boundary rather than staying WebDAV-specific glue.
