# CLI Standalone Spec Delta

## Added Requirements

### Requirement: CLI as Independent Product

PromptHub MUST provide a standalone CLI product under `apps/cli` that can be installed and executed without requiring the desktop application binary or Electron runtime.

#### Scenario: CLI bootstraps shared workspace

- **WHEN** the user runs the standalone CLI with a valid PromptHub workspace
- **THEN** the CLI resolves the same workspace layout as desktop
- **AND** it reads and writes the same PromptHub data directories.

### Requirement: Shared Runtime Path Contract

PromptHub MUST keep runtime path resolution in a shared module consumed by both desktop and CLI.

#### Scenario: Desktop and CLI resolve the same skills directory

- **WHEN** desktop and CLI run against the same appData / userData roots
- **THEN** `skills`, `rules`, `prompts`, and asset directories resolve to the same absolute paths.

### Requirement: Desktop Stops Shipping a CLI Entry

PromptHub desktop MUST stop exposing and packaging any CLI entry once `apps/cli` becomes the standalone CLI product.

#### Scenario: Desktop package no longer installs or launches CLI entrypoints

- **WHEN** the desktop application is installed or launched
- **THEN** it does not install a `prompthub` shell wrapper or desktop CLI bin
- **AND** desktop only surfaces standalone CLI guidance in Settings.

### Requirement: Desktop Settings Must Expose Standalone CLI Installation

PromptHub desktop MUST surface the standalone CLI through a dedicated Settings entry instead of burying it inside the About page, and the install action must use a real release artifact that users can install with npm or pnpm.

#### Scenario: User opens the CLI settings page

- **WHEN** the user navigates to desktop Settings
- **THEN** they can open a dedicated `PromptHub CLI` section
- **AND** that section shows whether the `prompthub` command is already installed
- **AND** it shows the exact install source and one-click install command based on the current release tarball

#### Scenario: User installs CLI from desktop Settings

- **GIVEN** the current release includes a CLI tarball asset
- **WHEN** the user clicks one-click install with npm or pnpm
- **THEN** desktop invokes the corresponding global package-manager install command against the GitHub release tarball
- **AND** it does not require building the CLI from repository source code inside the settings flow
