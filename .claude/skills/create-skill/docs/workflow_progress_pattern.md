# Workflow Progress Note (Runtime-Owned)

`__workflow_progress` is a runtime-owned progress cursor for long-running
workflows. It is not a section template for authored skills.

Authored skills should define phases, artifact contracts, and terminal done
semantics. They should not explain pause/resume mechanics, heartbeat
management, or runtime recovery surfaces.

If a runtime uses `__workflow_progress`, teach the detailed write/read/resume
rules in the global CLI playbook or system prompt. Keep `SKILL.md` clean.


