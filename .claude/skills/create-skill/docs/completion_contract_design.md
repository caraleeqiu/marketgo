# Completion Contract Design

The completion contract is the declarative truth for "what does done mean?".

## Required Blocks

### `slots`

Each slot declares:

- producer phase
- downstream consumers
- whether it is promotable
- input fences
- verification rules

### `completion`

Use this block to describe the workflow-level end state:

```json
{
  "completion": {
    "required_slots": ["analysis", "final_output"],
    "optional_slots": ["debug_report"],
    "terminal_slots": ["final_output"],
    "done_when": [
      "slot_present(analysis)",
      "slot_verified(final_output)"
    ]
  }
}
```

## `done_when` DSL

Use one function-style predicate format throughout the contract.

Supported design patterns:

- `slot_present(name)`
- `slot_verified(name)`
- `slot_promoted(name)`
- `all_slots_present(a,b,c)`
- `at_least_n_verified(3,shots)`

Keep predicates simple and observable. Avoid prose and mixed syntaxes like
`final_video.verified`.

Default to `slot_verified(...)` unless the runtime genuinely models promotion as
part of normal workflow completion. Use `slot_promoted(...)` only when the
workflow depends on canonical promotion, not as a reflex.

CLI verification and promotion are artifact persistence semantics, not user
acceptance. If the product needs accept / revise, model that in outer runtime
handoff policy rather than in the skill's completion contract.

## Phase Completion vs Workflow Completion

- **Phase completion** belongs in skill methodology text.
- **Workflow completion** belongs in the contract's `completion.done_when`.

The two should agree.

## Practical Rules

- Required slots should be minimal but sufficient.
- Terminal slots should be the outermost deliverable, not every intermediate artifact.
- If a slot must be finalized, reflect that in `done_when`.
- Prefer the weakest true completion predicate. If verification is enough, do
  not hardcode promotion into every generated contract.


