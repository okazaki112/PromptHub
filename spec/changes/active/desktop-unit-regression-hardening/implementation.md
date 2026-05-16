# Implementation

## Shipped

- Hardened `apps/desktop/src/renderer/components/UpdateDialog.tsx` so manual pre-upgrade backup failures are caught and surfaced as dialog error state instead of leaking an unhandled rejection.
- Restored the `rules:rewrite` IPC contract in `apps/desktop/src/main/ipc/rules.ipc.ts` by always returning a non-empty human-readable `summary` together with rewritten content.
- Fixed `apps/desktop/src/renderer/components/skill/SkillFileEditor.tsx` so reopening/bootstrap effects only reset editor state when the active skill source actually changes, preventing async re-renders from clearing unsaved edits and disabling the save action mid-edit.
- Updated desktop unit fixtures and assertions to match current runtime behavior:
  - `apps/desktop/tests/helpers/window.ts` now exposes `window.api.upgradeBackup` by default.
  - `apps/desktop/tests/unit/components/skill-settings.test.tsx` includes the current `githubToken` store shape.
  - `apps/desktop/tests/unit/components/skill-file-editor.test.tsx` exercises the inline editor mode that exposes the real textarea/save shortcut flow.
  - `apps/desktop/tests/setup.ts` now restores real timers after each test so fake-timer based suites do not leak clock state into later component tests.
  - `apps/desktop/tests/unit/components/rules-manager.test.tsx` matches the current rewrite summary copy and snapshot diff UI.
  - `apps/desktop/tests/unit/components/update-dialog.test.tsx` now wraps the flicker-regression render path in `act(...)` so the async updater/bootstrap state settles without test warnings.
  - `apps/desktop/tests/unit/cli/bin-entry.test.ts` accepts the current desktop runtime dependency set, including `@aws-sdk/client-s3`.

## Verification

- `pnpm --filter @prompthub/desktop test:run tests/unit/components/rules-manager.test.tsx tests/unit/components/skill-file-editor.test.tsx tests/unit/components/skill-settings.test.tsx tests/unit/components/update-dialog.test.tsx tests/unit/cli/bin-entry.test.ts tests/unit/main/rules-ipc.test.ts tests/unit/stores/rules.store.test.ts`
- `pnpm --filter @prompthub/desktop test:run tests/unit/components/update-dialog.test.tsx`
- `pnpm --filter @prompthub/desktop test:unit`
- `pnpm --filter @prompthub/desktop typecheck`
- `pnpm --filter @prompthub/desktop lint`
- `pnpm --filter @prompthub/desktop build`

## Synced Docs

- `spec/domains/desktop/spec.md`
- `spec/logic/rules-workspace.md`

## Follow-ups

- None.
