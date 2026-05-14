# Failure and Partial Completion

Use one shared failure ladder. The exact thresholds are workflow-specific, but
the ladder itself should not fork by Lens.

## Shared Ladder

1. retry
2. alternate provider or alternate parameters
3. degrade
4. partial finalize when the contract allows it
5. emit structured failure metadata

## What Stays Workflow-Specific

- minimum viable deliverable
- which intermediates may be partial
- which defects are acceptable vs blocking

## Example

```json
{
  "failure_policy": {
    "ladder": [
      "retry",
      "alternate",
      "degrade",
      "partial_finalize",
      "emit_failure_metadata"
    ],
    "minimum_viable_deliverable": "final_video",
    "partial_success_rules": [
      "reference_list may be incomplete if final storyboard still resolves",
      "storyboard may be regenerated incrementally before terminal finalize"
    ]
  }
}
```

## Guidance

- Do not pretend partial success is terminal success.
- Do not encode "ask the user" as the final fallback in the skill package.
- If terminal completion is impossible, emit explicit failure metadata instead of vague prose.


