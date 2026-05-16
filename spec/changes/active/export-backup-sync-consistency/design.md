# Design

## Overview

The fix is to converge on one logical snapshot contract instead of keeping separate per-route payload schemas.

## Key Decisions

- Treat `apps/web/src/services/sync-snapshot.ts` as the web-side normalization boundary for importable/exportable sync snapshots.
- Reuse the shared `DEFAULT_SETTINGS` contract when imported snapshots omit `settings`, instead of letting `/api/import` and `/api/sync/*` drift on separate route-local fallbacks.
- Keep accepting historical PromptHub envelopes (`prompthub-backup`, `prompthub-export`) and legacy `versions` payloads for compatibility.
- Make desktop `import-with-prompthub.json` contain a full re-importable snapshot, even when the ZIP also includes human-readable file trees.
- Treat `skillFiles` as part of the recoverable snapshot contract, with the web skill workspace acting as the durable backing store instead of introducing a separate database table.
- Keep unavailable desktop sync affordances visible but explicitly disabled when the backing capability is not implemented, so the settings UI matches the real execution path; once a capability is wired end-to-end, enable the control and keep the scope explicit.
- Allow desktop users to enable multiple backup destinations simultaneously, but route startup sync, periodic sync, and save-triggered sync through one explicit `syncProvider` so automatic flows never compete across providers.
- Promote provider identity in the desktop data submenu (`Self-Hosted PromptHub`, `WebDAV`, `S3 Compatible Storage`) and surface enabled state directly in the menu so the settings IA matches actual runtime behavior.
- Keep bulky binary/media duplication out of future enhancements when possible, but correctness and re-importability take priority over ZIP size in the embedded JSON payload.

## Affected Areas

- `apps/web/src/routes/import-export.ts`
- `apps/web/src/services/sync-snapshot.ts`
- `apps/web/src/services/backup.service.ts`
- `apps/web/src/services/skill-workspace.ts`
- `apps/web/src/routes/sync.ts`
- `apps/web/src/routes/import-export.test.ts`
- `apps/web/src/routes/sync.test.ts`
- `apps/web/src/services/skill-workspace.test.ts`
- `apps/desktop/src/renderer/components/settings/DataSettings.tsx`
- `apps/desktop/src/renderer/components/settings/SettingsPage.tsx`
- `apps/desktop/src/renderer/App.tsx`
- `apps/desktop/src/renderer/services/app-background.ts`
- `apps/desktop/src/renderer/services/webdav-save-sync.ts`
- `apps/desktop/src/renderer/stores/settings.store.ts`
- `apps/desktop/src/renderer/stores/prompt.store.ts`
- `apps/desktop/src/renderer/stores/folder.store.ts`
- `apps/desktop/src/renderer/stores/rules.store.ts`
- `apps/desktop/src/renderer/stores/skill.store.ts`
- `apps/desktop/src/renderer/components/skill/SkillFileEditor.tsx`
- `apps/desktop/src/renderer/components/skill/SkillFullDetailPage.tsx`
- `apps/desktop/src/renderer/components/skill/SkillVersionHistoryModal.tsx`
- `apps/desktop/src/renderer/components/skill/detail-utils.ts`
- `apps/desktop/src/renderer/components/prompt/VersionHistoryModal.tsx`
- `apps/desktop/src/renderer/i18n/locales/*.json`
- `apps/desktop/tests/unit/components/data-settings.test.tsx`
- `apps/desktop/tests/unit/components/settings-page.test.tsx`
- `apps/desktop/tests/unit/services/app-background.test.ts`
- `apps/desktop/tests/unit/services/webdav-save-sync.test.ts`
- `apps/desktop/tests/unit/stores/prompt-save-sync.test.ts`
- `apps/desktop/tests/unit/stores/folder-save-sync.test.ts`
- `apps/desktop/src/renderer/services/database-backup.ts`
- `apps/desktop/src/renderer/services/self-hosted-sync.ts`
- `apps/desktop/tests/unit/services/database-backup.test.ts`
- `apps/desktop/tests/unit/services/self-hosted-sync.test.ts`

## Tradeoffs

- Embedding a full snapshot inside selective ZIP exports increases ZIP size when media is included, but it restores the important invariant that the embedded JSON is directly importable.
- Reusing one parser reduces drift, but some route-specific error messages become slightly less bespoke.
