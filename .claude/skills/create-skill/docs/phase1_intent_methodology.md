# Phase 1 Intent Methodology

This phase is about uncovering the workflow truth that the final skill package
must encode. It is not a fixed questionnaire. Ask only what helps Phase 2 make
structural decisions.

## The Six Dimensions

### D1. Problem boundary

- What recurring problem does the skill solve?
- Where does the workflow start?
- Where does it end?
- What should stay outside the skill?

### D2. Output shape

- What is the terminal output?
- Is it a file, an artifact slot, a structured JSON object, or another skill input?
- Who consumes the output next?

### D3. Pipeline shape

- Is the workflow linear or multi-phase?
- Are there intermediate artifacts that must persist across turns or heartbeats?
- Does it depend on other skills' methodology?

### D4. Completion semantics

- What counts as phase completion?
- What counts as workflow completion?
- Which outputs are required vs optional?
- Which slot or slots are terminal?

### D5. Verification rules

- Which properties can be checked mechanically?
- What should `verified` mean for each load-bearing slot?
- Which completion predicates can be expressed as `done_when` rules?

### D6. Failure and partial completion

- What are the likely failure modes?
- Can the workflow still produce a degraded but valid result?
- What is the minimum viable deliverable?
- When should the workflow stop with structured failure metadata instead of pretending success?

## Adaptation Rules

- Skip already-known dimensions.
- Push on vague answers until the workflow boundary is explicit.
- Prefer concrete examples of good output and common failure.
- Stop once Phase 2 can decide kind, contract, and failure ladder.

## Intent Sources

The source of truth may come from:

- a developer brief
- a user request
- an existing skill being forked
- the Agent's own self-review over repeated past runs

The source changes how you gather information, but not what you gather.

## `skill_brief` Example

```json
{
  "problem": "Turn a recurring artifact-backed workflow into a reusable skill package",
  "output": {
    "format": "validated skill source package",
    "consumer": "current runtime source authoring workflow",
    "constraints": [
      "description must be trigger-first",
      "completion contract must be explicit"
    ]
  },
  "pipeline": {
    "kind": "composition_skill",
    "steps": [
      "collect inputs",
      "produce intermediate artifacts",
      "finalize terminal artifact"
    ],
    "intermediate_artifacts": [
      "analysis",
      "draft",
      "final_output"
    ]
  },
  "completion": {
    "terminal_slots": [
      "final_output"
    ],
    "required_slots": [
      "analysis",
      "final_output"
    ],
    "done_when": [
      "slot_present(analysis)",
      "slot_verified(final_output)"
    ]
  },
  "verification": [
    {
      "slot": "analysis",
      "rules": [
        "required_fields(summary, key_points)"
      ]
    },
    {
      "slot": "final_output",
      "rules": [
        "required_fields(url, storage_ref)"
      ]
    }
  ],
  "failure_policy": {
    "minimum_viable_deliverable": "final_output",
    "ladder": [
      "retry",
      "alternate",
      "degrade",
      "emit_failure_metadata"
    ]
  }
}
```


