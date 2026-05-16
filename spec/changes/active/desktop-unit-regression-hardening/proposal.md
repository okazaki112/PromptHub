# Proposal

## Why

Recent desktop unit-suite runs exposed a mixed set of regressions:

- `UpdateDialog` could surface an unhandled rejection when the upgrade-backup API was unavailable during the manual pre-upgrade backup flow.
- `rules.ipc` returned `summary: null` even though the shared contract requires a string summary for AI rewrite results.
- Several unit tests drifted behind current UI labels, store shape, and runtime package metadata, causing false negatives in the full suite.

## Scope

- In scope:
- Harden the update backup action so failures do not leak as unhandled promise rejections.
- Restore the rules IPC rewrite response contract.
- Align desktop unit tests and shared test helpers with current UI/API behavior.
- Out of scope:
- New updater features, backup storage semantics, or rules authoring UX redesign.
- Broader CLI packaging changes beyond test expectation alignment.

## Risks

- Test updates could accidentally mask a real regression if they are loosened too far.
- Update error handling must not hide install-state transitions or backup prerequisites.

## Rollback Thinking

- Revert the specific UI/IPC/test patches in this change if they introduce behavioral regressions.
- The change is isolated to desktop renderer/main code and tests; no schema or persisted-data rollback is required.
