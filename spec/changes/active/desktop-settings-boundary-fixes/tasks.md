# Tasks

- [x] Move reusable settings readers into an Electron-free main-process module.
- [x] Update `SkillInstaller` to use the new helper instead of importing from IPC code.
- [x] Exclude `githubToken` from renderer persisted state.
- [x] Load `githubToken` and startup settings from main process after settings hydration.
- [x] Update regression tests for settings readers, renderer store behavior, and `SkillInstaller` token loading.
- [x] Run lint and targeted tests.
