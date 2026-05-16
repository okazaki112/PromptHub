# Implementation

## Shipped Changes

- Renamed desktop settings labels for app settings, model services, and data/sync.
- Merged desktop language and notifications into `GeneralSettings`.
- Restored a standalone web runtime language entry via `LanguageSettings`.
- Kept `Agent管理` unchanged.
- Added a `SettingsPage`-level optional second settings column for desktop `数据与同步` subsections.
- Changed `DataSettings` to receive the active subsection and render only the corresponding content panel.

## Verification

- `pnpm --filter @prompthub/desktop lint`
- `pnpm --filter @prompthub/desktop build`

## Follow-up

- Consider reusing the optional second settings column for other dense settings areas such as `模型服务`.
