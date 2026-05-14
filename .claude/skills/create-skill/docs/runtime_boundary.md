# Runtime Boundary

The skill package defines methodology and done semantics. Runtime policy lives
outside the package.

## Keep In The Skill

- workflow steps
- explicit phase handoff rules
- artifact graph
- verification rules
- completion contract
- failure ladder
- phase-local methodology and current command usage

## Keep Out Of The Skill

- approval profile density
- checkpoint pause policy
- publish policy
- per-run safety-cap governance
- lens-specific confirmation style
- generic pause/resume mechanics
- heartbeat internals
- runtime-owned recovery cursors such as `__workflow_progress`

## Why

These are runtime-owned concerns:

- approval/checkpoint behavior is selected by runtime policy and system prompt
- publish happens after terminal artifacts are complete
- budget governance already exists at runtime level
- pause/resume transport and heartbeat recovery are runtime surfaces
- skills should describe workflow routing, not runtime bookkeeping internals

If the skill duplicates these concerns, it drifts and becomes contradictory.


