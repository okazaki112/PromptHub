# Data Path Change Delta

## Requirements

- When a selected target directory already contains PromptHub data, the app must not copy current data into it by default.
- Users must be able to switch to an existing data directory without modifying that directory.
- Destructive overwrite must create a target backup before replacing target data.
- Legacy `data:migrate` must remain safe and refuse to overwrite existing target data.

## Scenarios

- Empty target: migrate current data and require restart.
- Existing copied target: switch path only and require restart.
- Existing target with overwrite: back up target, then copy current data.
- Already-active target: report success without scheduling another restart.
