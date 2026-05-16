# Desktop Spec Delta

## Modified Requirements

### Settings Secret Handling

The desktop renderer must not persist the raw `githubToken` into zustand localStorage snapshots. The token may be displayed in settings UI only after being loaded from the main-process settings source.

### CLI Dependency Boundary

Desktop CLI entry points must not acquire a runtime dependency on Electron merely by importing `SkillInstaller`.

### Startup Settings Sync

After renderer settings hydration completes, the desktop app must reconcile startup-related settings from the main-process settings source before continuing normal initialization.
