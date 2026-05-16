# Desktop Delta Spec

## Modified Requirements

### Update Backup Failure Handling

The desktop update dialog must handle manual pre-upgrade backup failures inside the dialog flow.

#### Scenario: pre-upgrade backup fails

- Given the user clicks the manual backup action before download or install
- When the automatic snapshot or export step fails
- Then the dialog must surface an error state instead of leaking an unhandled promise rejection

### Rules AI Rewrite Contract

The desktop rules rewrite IPC response must continue to include both rewritten content and a non-empty summary string.

#### Scenario: AI rewrite succeeds

- Given a valid rewrite payload and AI response content
- When `rules:rewrite` resolves
- Then the result includes `content`
- And the result includes a human-readable `summary`
