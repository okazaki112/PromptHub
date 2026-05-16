# Delta for Desktop Card Detail Inline Edit

## Added

### Requirement: Card View Detail Quick Edit

The desktop card-view detail panel MUST support a lightweight inline edit flow for the selected prompt title and visible user prompt content without forcing the user into the full edit modal.

## Modified

- None.

## Removed

- None.

## Scenarios

### Scenario: User makes a quick copy fix from the card detail panel

- GIVEN the user is in desktop card view with a selected prompt
- WHEN they double-click the title in the right-hand detail panel
- THEN they can edit the title and currently visible user prompt in place
- AND saving reuses the existing prompt update flow without leaving the detail view

### Scenario: User abandons an inline draft

- GIVEN the user has unsaved inline changes in the card detail panel
- WHEN they cancel the inline edit session
- THEN the draft is discarded
- AND the detail panel returns to the persisted prompt content

### Scenario: User is editing while viewing an alternate prompt language

- GIVEN the detail panel is showing alternate-language content through the existing language toggle
- WHEN the user opens inline edit
- THEN the inline draft reflects the currently visible user prompt content
- AND the user cannot toggle language until they save or cancel the draft
