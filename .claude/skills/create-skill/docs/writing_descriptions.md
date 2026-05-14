# Writing Descriptions

The `description` field is the primary trigger surface. Write it for routing,
not for explanation.

## What a Good Description Must Do

1. Name the concrete job.
2. Tell the router when to load the skill.
3. Name the output or workflow boundary.
4. Include a clear `Do NOT use` boundary when confusion is likely.

## Good Example

```yaml
description: >-
  Authors or updates a reusable skill source package for the current Pi
  runtime. Use when a developer or Agent needs to codify a recurring workflow,
  adapt an existing skill, or formalize an artifact-backed methodology into
  checked source files. Produces verified skill authoring artifacts and a
  promoted source package manifest. Do NOT use for one-off prompts or to encode
  approval, publish, runtime reload, or budget policy that belongs in system
  prompt or runtime configuration.
```

## Anti-Patterns

### Internal-process description

Bad:

```yaml
description: >-
  Guides through intent capture, structure design, contract authoring, and
  activation.
```

This describes how the skill works internally, not when it should be chosen.

### Lens-specific routing prose

Bad:

```yaml
description: >-
  Creates skills for iLands autonomous agents with advisory-free behavior.
```

Lens behavior belongs to runtime policy, not skill routing.

### Publish-oriented ending

Bad:

```yaml
description: >-
  Creates a workflow and publishes the final result.
```

The skill should describe workflow completion, not outer publish policy.

## Checklist

- Can a router infer the trigger from the description alone?
- Does the description state the output or workflow boundary?
- Does it avoid internal phase narration?
- Does it avoid runtime policy such as approval density, publish policy, or budget rules?


