# Composition Skill Template

Use this when the workflow has multiple phases, persistent intermediate
artifacts, or dependent sub-skills.

Prefer a phase-entry architecture for non-trivial composition skills:

```text
{skill-name}/
  SKILL.md
  schemas/
    artifact_contract.json
    *.schema.json
  phases/
    01-{phase-name}/
      PHASE.md
      references/
      templates/
      scripts/
    02-{phase-name}/
      PHASE.md
      references/
      templates/
```

Design rules:

- Root `SKILL.md` should be a thin controller, not a full methodology dump.
- Each `PHASE.md` is the authoritative command surface for one phase.
- `references/` files define reasoning methodology only.
- `templates/` files define copyable payload skeletons and prompt structures.
- If the root `SKILL.md` starts becoming a 500+ line monolith, split phase
  detail out immediately.

## Root `SKILL.md` Skeleton

```md
---
name: {skill-name}
description: >-
  {Trigger-first routing description.}
allowed-tools: 
compatibility: "{runtime assumptions}"
metadata:
  ilands:
    applicable-to: [creation]
    priority: {1.0-5.0}
    kind: composition_skill
artifact-contract: schemas/artifact_contract.json
entry_skill_ref: "platform/{skill-name}"
---

# {Skill Title}

## What This Skill Owns

- shared bootstrap
- shared CLI discipline
- shared schema discipline
- shared artifact 协议 discipline
- artifact flow
- phase routing

## What This Skill Does Not Own

- approval / checkpoint policy
- publish policy
- budget policy
- generic runtime pause / resume mechanics

Those belong to runtime policy or system prompt configuration, not to the skill
package.

## Overview

{What the workflow starts from, what it produces, and which intermediate
artifacts matter.}

## Required Bootstrap

{How to resolve the artifact contract, load the first phase entry file, and
bootstrap shared resources.}

## Artifact CLI Primer

This skill uses the artifact working set through `dl artifact ...`.

Common operations:
cat <<'EOF' | - `dl artifact write --slot=<name> --content-type=<mime> --content-file=- --contract='<ARTIFACT_CONTRACT_PATH>'`
...
EOF
- `dl artifact read --slot=<name>`
cat <<'EOF' | - `dl artifact patch-json --slot=<name> --operations-file=- `
[{"op":"set","path":"field","value":"..."}]
EOF
- `dl artifact finalize --slot=<name> --mode=verify --contract='<ARTIFACT_CONTRACT_PATH>'`

Rules:
- Use `write` for first write or full replacement.
- Use `patch-json` only for incremental structured updates to an existing JSON
  slot.
- `patch-json` is JSONPath-lite, not RFC 6902 JSON Patch. It accepts
  `--operations`, not `--patch`; paths look like `field`, `nested.field`, or
  `items[0].field`, not `/field`; supported ops are only `set`, `merge`,
  `append`, and `delete`.
- Do not pass `--contract` to `patch-json`; finalize the patched slot afterward
  with `--contract='<ARTIFACT_CONTRACT_PATH>'`.
- `--content` is always a string.
- Write and finalize calls must use the same `ARTIFACT_CONTRACT_PATH`.
- `finalize --mode=verify` is the default completion checkpoint.
- For any slot that is not explicitly draft-only, the immediate next non-read
  action after a successful `write` should be `finalize --mode=verify` for
  that same slot.
- Use `verify_and_promote` only if the target runtime truly models canonical
  promotion as part of normal workflow completion.

If exact syntax is unclear, use:
- `dl artifact --help`
- `dl artifact patch-json --help`
- `dl artifact finalize --help`

## Shared Schema Discipline

- load the exact slot schema before the first write to that slot
- start from `templates/*.minimum.json` when present
- treat minimum templates as validation floors, not richness ceilings
- keep cross-field semantics coherent even when the schema does not enforce
  them yet
- repair AJV errors literally instead of inventing alternate field shapes

## Shared Artifact 协议 Discipline

每个用户可见 slot schema 都需**从 SOP 推导**——不是从骨架对号入座。

**首要参考**：`docs/deriving_artifact_schemas.md`——5+1 步推导原则（数据形态 → layout / unit 形态 → component / 点击语义 → is_segment / 视觉语义 → variant、config / 用 const 锁死）。完整规范见 `docs/artifact_protocol.md`（《Artifact 协议规范 0508》精简版）。

协议组合空间是 **4 layouts × 7 component_types × {is_segment 真假} × variant/config**：

1. Wrapper：`slot` / `display_name` / `status` / `version`（+ 可选 `skill`）。
2. `content_layout`：从 `single` / `list` / `grid` / `form` 中**按数据形态推**一个，按需加 `config`（grid 必填 `columns`；list 可选 `index_prefix`）。
3. `component_type`：从 `card` / `markdown` / `code` / `image` / `video` / `music` / `form_field` 中**按 unit 形态推**一个；字段直接平铺，无 `preview` 包裹层。
4. `detail`：**按点击语义推**——segment artifact 用 `{ "variant": "media_player" }`，其他固定 `null`。

**示例参考（不是菜单）**：`templates/slot_schema_examples/` 下有 5 份已被推过的具象组合 + `README.md` 列出协议组合空间和这 5 份的覆盖范围。**只有当推导结果正好命中其中一个组合**才能 cp 起手；否则按推导直接写 schema，参考最相邻示例的 wrapper 写法。

**Phase 4 validator 硬约束**（不合规直接 fail）：
- root `required` 必须含 `["slot", "display_name", "status", "version", "content_layout", "content"]`
- `properties.slot.const` = slot 名
- `properties.content_layout.properties.layout_type.const` ∈ `{single, list, grid, form}` 且与 `artifact_layout_plan[].layout_type` 一致
- `content.items.required` ⊇ `["id", "component_type", "detail"]`
- `content.items.properties.component_type.const` ∈ 协议组件 7 种且与 `primary_component_type` 一致
- `is_segment: true` ↔ `content.items.detail.properties.variant.const = "media_player"`；`is_segment: false` ↔ `content.items.detail.type = "null"`

规则：
- 渲染相关的硬语义字段必须写进 schema 或稳定输出，不要让前端从 prose 里推。
- 前端会自动处理：hover 引用按钮、`markdown` 截断、`music` 折叠展开、`list` 折叠、`word_count` 计算——schema 不要再写这些。
- 不要复制一份 `rendererProps` 之类的 UI shadow 对象，除非 runtime 真把它当一类数据持久化。
- 不要为 detail 页加只在 detail 才用的字段，除非这些字段对工作流也有用。
- 旧的渲染家族名（`form_summary` / `card_grid` / `item_list` / `timeline`）已被本协议取代，不要再在 schema 里出现。
- 纯内部 / 非用户可渲染 slot（agent 自用 bookkeeping）在 `artifact_contract.json` 的 slot 配置加 `"user_visible": false` 跳过协议检查。

## Artifact Flow

{ASCII or mermaid artifact graph}

## Phase Entry Map

| Phase | Entry file | Output |
|---|---|---|
| 01 | `phases/01-{phase-name}/PHASE.md` | `{slot_1}` |
| 02 | `phases/02-{phase-name}/PHASE.md` | `{slot_2}` |
| ... | ... | ... |

Follow the handoff chain phase-by-phase instead of keeping all detailed
methodology in the root file.

## Completion Definition

This workflow is complete when all required completion predicates pass:
- `slot_present({required_slot_1})`
- `slot_present({required_slot_2})`
- `slot_verified({final_slot})`
- `{optional slot_promoted({final_slot}) if canonical promotion is part of this runtime}`

The skill ends here. Publish or delivery policy belongs to outer orchestration.

## Failure and Partial Completion

- Retry same step with bounded attempts.
- Switch provider or params where possible.
- Accept degraded or partial intermediates only if the contract allows it.
- Emit structured failure metadata when terminal completion cannot be reached.
```

Do not add runtime recovery or pause/resume instructions to the authored skill.
If the runtime supports long-running workflow recovery, that guidance belongs in
the global CLI playbook, not in `SKILL.md`.

## `PHASE.md` Skeleton

```md
# Phase NN: {Phase Name}

## Goal

{What this phase must produce.}

## Required Inputs

- {upstream artifact or external input}
- `ARTIFACT_CONTRACT_PATH`

## Required Slot / Schema Loads

Read `schemas/{slot}.schema.json` from the same skill root as this phase file
with the built-in `read` tool.

## Required Companion Resources

- `references/{methodology}.md`
- `templates/{slot}.minimum.json`
- `templates/{prompt_or_batch_shape}.md`

Load the methodology explicitly with the built-in `read` tool.

## Current Pi CLI Patterns

{Only the current command patterns for this phase.}

## Output Slot

- `{slot}`

## Next Phase Entry

After success, load:

    phases/{next-phase}/PHASE.md

using the built-in `read` tool from the same skill root.
```

## Phase Resource Rules

- `PHASE.md` owns command authority and file routing.
- `references/*.md` own reasoning methodology only.
- `templates/*.minimum.json` own minimal valid payload shapes.
- `templates/*.md` or `*.json` own reusable prompt / batch skeletons only.
- Keep user-approval and pause policy out of phase files; that belongs to
  runtime policy.

## Artifact Contract Example

```json
{
  "skill": "{skill-name}",
  "slots": {
    "analysis": {
      "produced_in": "Phase 1",
      "consumed_by": ["Phase 2"],
      "promotable": false,
      "input_fence": {},
      "schema_ref": "schemas/analysis.schema.json",
      "verification": {
        "required_fields": ["summary", "key_points"]
      }
    },
    "final_output": {
      "produced_in": "Final Phase",
      "consumed_by": [],
      "promotable": true,
      "input_fence": {"analysis": 1},
      "schema_ref": "schemas/final_output.schema.json",
      "verification": {
        "mode": "verify_and_promote",
        "required_fields": ["url", "storage_ref"]
      }
    }
  },
  "completion": {
    "required_slots": ["analysis", "final_output"],
    "terminal_slots": ["final_output"],
    "done_when": [
      "slot_present(analysis)",
      "slot_promoted(final_output)"
    ]
  },
  "failure_policy": {
    "ladder": ["retry", "alternate", "degrade", "partial_finalize", "emit_failure_metadata"],
    "minimum_viable_deliverable": "final_output"
  }
}
```
