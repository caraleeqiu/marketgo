# Atomic Skill Template

Use this when the workflow is linear and does not require a multi-slot artifact graph.

## Skeleton

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
    kind: atomic_skill
---

# {Skill Title}

## When to Use

- {concrete trigger 1}
- {concrete trigger 2}

## Artifact CLI Primer

{Include this short section only if the skill writes or reads artifacts, or
returns media results through artifacts.}

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

Use `write` for first write or full replacement. Use `patch-json` only for
incremental structured updates to an existing JSON slot. Promote only if the
target runtime genuinely requires canonical promotion. If exact syntax is
unclear, use:
- `dl artifact --help`
- `dl artifact write --help`
- `dl artifact patch-json --help`
- `dl artifact finalize --help`

`patch-json` is JSONPath-lite, not RFC 6902 JSON Patch. It accepts
`--operations`, not `--patch`; paths look like `field`, `nested.field`, or
`items[0].field`, not `/field`; supported ops are only `set`, `merge`,
`append`, and `delete`. Do not pass `--contract` to `patch-json`; finalize the
patched slot afterward with `--contract='<ARTIFACT_CONTRACT_PATH>'`.

For any non-draft terminal output, the immediate next non-read action after a
successful `dl artifact write` should be `dl artifact finalize` for that same
slot with the same contract path. Do not author skills that hand off draft slots
silently unless the draft handoff is an explicit, intentional part of the
workflow.

If the skill ships schema-backed JSON helpers, place them in `templates/`.
Treat `templates/*.minimum.json` as validation floors, not content ceilings.

如果 skill 产出用户可见 artifact，**从 SOP 推导**每个 slot schema——不是从骨架对号入座。

**首要参考**：`docs/deriving_artifact_schemas.md`——5+1 步推导原则把 SOP 推成 schema：数据形态 → `content_layout` ∈ `{single, list, grid, form}`；unit 形态 → `component_type` ∈ `{card, markdown, code, image, video, music, form_field}`；点击语义 → `is_segment`（true → `detail.variant: "media_player"`；false → `detail: null`）；视觉语义 → variant / config；最后用 JSON Schema `const` 锁死每一步选择。完整协议见 `docs/artifact_protocol.md`。

**示例参考（不是菜单）**：`templates/slot_schema_examples/` 下有 5 份具象组合 + `README.md`；只有当推导结果正好命中其中一个组合才能 cp 起手，否则直接按推导写 schema。

**Phase 4 validator 强校验**（不合规直接 fail）：root 必须 require 6 个 wrapper 字段、`slot.const` 对齐、`layout_type.const` ∈ 协议四种、`content.items` 必须 require `[id, component_type, detail]`、`component_type.const` ∈ 协议七种、segment artifact 的 `detail.variant.const = media_player` / 非 segment 的 `detail.type = null`。

规则：
- 渲染相关的硬语义字段写进 schema 或稳定输出，不要让前端从 prose 里推。
- 字段直接平铺，不要再包一层 `preview`。
- 不要复制一份 `rendererProps` 之类的 UI shadow 对象，除非 runtime 真把它当一类数据持久化。
- 不要为 detail 页加只在 detail 才用的字段，除非这些字段对工作流也有用。
- 不要再用旧的渲染家族名（`form_summary` / `card_grid` / `item_list` / `timeline`），统一用 `layout_type` + `component_type` 表达。
- 纯内部 / 非用户可渲染 slot 在 `artifact_contract.json` 加 `"user_visible": false` 跳过协议检查。

## Methodology

### Step 1: {step}
1. {concrete action}
2. {concrete action}

### Step 2: {step}
1. {concrete action}
2. {concrete action}

## Completion Definition

This skill is complete when:
- {observable output exists}
- {required fields or properties are present}
- `dl artifact finalize --slot={final_slot} --mode=verify --contract='<ARTIFACT_CONTRACT_PATH>'` succeeds

## Error Handling

- {failure}: retry with adjusted params
- {failure}: switch provider or degrade output
- {failure}: emit structured failure metadata and stop pretending success

## Constraints

- {hard constraint}
- {hard constraint}
```

## Notes

- Keep the workflow end-state observable.
- Do not describe approval policy or publish policy here.
- Do not add runtime recovery or pause/resume instructions here; those belong
  to the global CLI playbook.
- Use `references/` or `templates/` only when they materially improve reuse;
  do not create a long monolith if a short atomic skill suffices.
