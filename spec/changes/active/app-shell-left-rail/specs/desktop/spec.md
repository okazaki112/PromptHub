# Desktop Delta

## Requirements

- Desktop app must support a global left rail that can host more than Prompt and Skill.
- Prompt and Skill must become first-class modules inside the new global shell instead of being the only top-level mode switch.
- Desktop app must support a Rules module in the new global shell.
- Skill Projects must remain inside the Skill module as a second-level section.
- The shell must be extensible to future modules such as Agent and MCP.
- The Rules module must allow editing a known set of global rule files and project rule files.
- The Rules module sidebar must separate global rules from project rules.
- The Rules module must support manually adding project directories that expose a canonical rule file.

## Scenarios

- User launches PromptHub and sees a left rail with global module icons.
- User switches from Prompt to Skill without losing module-specific sidebars.
- User switches to Rules and can inspect/edit a global or project rule file.
- User can add a project directory and immediately see its canonical rule file under project rules.
- User opens Skill and still sees `Projects` as a second-level section.
- Future modules can be added without redesigning the top-level shell again.
