# Implementation

## Shipped Changes

- Added `settings-readers.ts` as an Electron-free helper for reading startup settings and GitHub token from SQLite.
- Updated `settings.ipc.ts`, `main/index.ts`, and `skill-installer.ts` to use the shared helper.
- Removed `githubToken` from renderer persisted state using zustand `partialize`.
- Added `loadSettingsFromMainProcess()` and called it during `App.tsx` startup after settings hydration.
- Updated tests to cover the new boundaries.

## Verification

- `pnpm --filter @prompthub/desktop lint`
- `pnpm --filter @prompthub/desktop cli:build`
- `pnpm --filter @prompthub/desktop test -- --run tests/unit/main/github-token-setting.test.ts tests/unit/main/settings-startup.test.ts tests/unit/stores/settings-github-token.test.ts tests/unit/stores/settings-startup.test.ts tests/unit/main/skill-installer.test.ts`

## Follow-up

- Consider moving GitHub token storage to encrypted main-process storage in a future change.
