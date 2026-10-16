# Tasks

- [x] Add selectedPromptId prop to prompt-list route/type/component.
- [x] useVirtualizedPromptListModel accepts selected id and finds target index after flatten.
- [x] Remove `scrollTo top` on orderKey; add `scrollToIndex(target,{align:"start"})` guarded target found.
- [x] hook unit tests: no target no scroll; selection changes target; order key changes target updates.
- [x] tsc / eslint / all component tests / desktop build.
- [ ] User packaged/runtime visual pass: click parent with children; selected row stays visible (not jump top).
