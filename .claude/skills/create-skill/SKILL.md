---
name: create-skill
description: >-
  Authors or updates a reusable skill source package for the current Pi
  runtime. Use when a developer or Agent needs to codify a recurring workflow,
  adapt an existing skill, or formalize an artifact-backed methodology into
  checked source files. Produces verified skill authoring artifacts and a
  promoted source package manifest. Do NOT use for one-off prompts or to encode
  approval, publish, runtime reload, or budget policy that belongs in system
  prompt or runtime configuration.
allowed-tools: Read(*) Write(*) Edit(*) Bash(dl artifact:*)
compatibility: "Pi-safe source authoring workflow; future skill-forge authoring commands are noted but not executable here."
metadata:
  ilands:
    applicable-to: [full]
    priority: 2.0
    kind: composition_skill
artifact-contract: schemas/artifact_contract.json
---

<!-- cli-audit: pi-safe-artifact-first -->

# Create Skill

## What This Skill Owns

- reusable skill source authoring
- artifact-backed intent and structure records
- source package manifesting
- static validation and completion semantics

## What This Skill Does Not Own

- runtime reload or activation of newly written source files
- publish policy
- approval density or checkpoint policy
- budget governance
- generic pause / resume mechanics

Those are runtime or system-prompt concerns. A skill source package is complete
when its source files and validation artifacts satisfy this contract.

## Required Bootstrap

Before writing any artifact, read from this same skill directory:

1. `schemas/artifact_contract.json` and carry its exact absolute path forward
   as `ARTIFACT_CONTRACT_PATH`.
2. The schema and minimum template for the slot you are about to write.
3. Any referenced methodology document needed for the current phase.

Every `dl artifact write`, `dl artifact finalize`, and `dl artifact validate`
call in this skill must pass `--contract='<ARTIFACT_CONTRACT_PATH>'`.

## Artifact CLI Primer

Use the artifact working set through `dl artifact ...`.

Common operations:

```bash
```bash
cat <<'EOF' | dl artifact write --slot=<slot> --content-type=application/json --contract='<ARTIFACT_CONTRACT_PATH>' --content-file=-
<serialized-json>
EOF
```
dl artifact finalize --slot=<slot> --mode=verify \
  --contract='<ARTIFACT_CONTRACT_PATH>'

# Phase 3 verifies the source manifest; Phase 4 promotes it only after
# static validation passes.
dl artifact finalize --slot=skill_source_package --mode=verify \
  --contract='<ARTIFACT_CONTRACT_PATH>'

```bash
cat <<'EOF' | dl artifact patch-json --slot=<slot> --operations-file=-
[{"op":"set","path":"field","value":"..."}]
EOF
```
```

Rules:

- `--content` is always a string. Serialize JSON before passing it.
- Use `write` for first write or full replacement.
- Use `patch-json` only for incremental structured updates to an existing JSON
  slot.
- `patch-json` is JSONPath-lite, not RFC 6902 JSON Patch. It accepts
  `--operations`, not `--patch`; its paths are `field`, `nested.field`, or
  `items[0].field`, not `/field`; supported ops are only `set`, `merge`,
  `append`, and `delete`.
- Do not pass `--contract` to `patch-json`; the patched slot becomes draft
  again and must be finalized afterward with the loaded contract path before
  downstream use.
- After a successful write, the immediate next non-read action must be
  `finalize` for the same slot.
- CLI verification or promotion is persistence and validation only. It is not
  user acceptance. Accept / revise handoff belongs to outer runtime policy.
- Never say a slot is written, verified, promoted, or complete unless the tool
  result in this run proves it.

## Future Skill-Forge Commands

Future runtimes may implement first-class authoring commands such as
`dl skill draft-create`, `dl skill draft-update`, `dl skill validate`,
`dl skill compile`, `dl skill activate`, `dl skill fork`, and
`dl skill search`.

In the current Pi runtime these are design notes only. Do not call them as part
of this workflow. Author and validate source files directly.

## Artifact Flow

```text
skill_brief
  -> skill_structure
    -> skill_source_package (verified)
      -> skill_validation_report
        -> skill_source_package (promoted)
```

Completion requires:

- `slot_verified(skill_brief)`
- `slot_verified(skill_structure)`
- `slot_verified(skill_validation_report)`
- `skill_validation_report.status` is `pass` or `warn`
- `slot_promoted(skill_source_package)`

## Phase Map

| Phase | Freedom level | Output |
| --- | --- | --- |
| 0 | medium | existing-skill source review |
| 1 | high | `skill_brief` |
| 2 | medium | `skill_structure` |
| 3 | medium | source files and `skill_source_package` |
| 4 | low | `skill_validation_report` |
| 5 | medium | representative verification notes |

## Phase 0: Prerequisite Check

Search existing skills through repository files and available skill metadata.
Use source inspection, not `dl skill` authoring commands.

- If an existing skill is close, adapt that source package instead of starting
  from nothing.
- If the need is one-off, write inline methodology instead of a new skill.
- If the workflow boundary is still fuzzy, do not author source files yet.

## Phase 1: Intent Capture

Read:

- `docs/phase1_intent_methodology.md`
- `schemas/skill_brief.schema.json`
- `templates/skill_brief.minimum.json`

Write `skill_brief` with the recurring problem, trigger cases, target runtime,
output boundary, non-goals, and failure policy.

```bash
```bash
cat <<'EOF' | dl artifact write --slot=skill_brief --content-type=application/json --contract='<ARTIFACT_CONTRACT_PATH>' --content-file=-
<serialized skill_brief JSON>
EOF
```
dl artifact finalize --slot=skill_brief --mode=verify \
  --contract='<ARTIFACT_CONTRACT_PATH>'
```

## Phase 2: Structure Design

Read:

- `docs/completion_contract_design.md`
- `docs/failure_and_partial_completion.md`
- `docs/runtime_boundary.md`
- `docs/artifact_protocol.md`
- `schemas/skill_structure.schema.json`
- `templates/skill_structure.minimum.json`

Use the verified `skill_brief` to decide:

1. target skill name and root directory
2. atomic vs composition structure
3. file layout and resources
4. artifact slots and completion predicates
5. validation plan
6. runtime boundaries and non-goals
7. **artifact layout plan**（必填字段，schema root 已 require）：对照 `docs/artifact_protocol.md` 的四步决策法，逐个用户可见 slot 想清楚 `layout_type`、`primary_component_type`、是否是 segment artifact，把结果填进 `artifact_layout_plan[]`。约束：
   - 数组本身必须存在；完全不产用户可见 artifact 的 skill 用 `[]`。
   - 每个用户可见 slot 必须有且仅有一条；条目里的 `slot` 必须同时出现在 `artifact_slots[]` 中（schema 不能跨数组校验，作者自己保证）。
   - `layout_type: "grid"` 必填 `layout_config.columns`（1–3）；`list` 时可选 `layout_config.index_prefix`。
   - `primary_component_type: "card"` 必填 `card_variant`（`portrait` / `horizontal` / `landscape`）；`form_field` 必填 `display_type`。
   - `is_segment: true` 表示该 artifact 的 `detail` 走 `media_player`；其他都填 `false`，`detail` 固定 `null`。
   - 不要把 `media_player` 当 `component_type`，它只能出现在 `detail.variant`。

Write and verify `skill_structure`:

```bash
```bash
cat <<'EOF' | dl artifact write --slot=skill_structure --content-type=application/json --contract='<ARTIFACT_CONTRACT_PATH>' --content-file=-
<serialized skill_structure JSON>
EOF
```
dl artifact finalize --slot=skill_structure --mode=verify \
  --contract='<ARTIFACT_CONTRACT_PATH>'
```

## Phase 3: Source Authoring

Author or update source files directly under the target skill directory.

Rules:

- Use `docs/writing_descriptions.md` for frontmatter descriptions.
- Use `docs/template_atomic.md` or `docs/template_composition.md` as the source
  skeleton.
- For composition skills, keep the root `SKILL.md` thin and put phase-specific
  details under `phases/NN-name/PHASE.md`.
- Include `schemas/artifact_contract.json` when the generated skill writes or
  verifies artifacts.
- Include `templates/*.minimum.json` for schema-backed JSON slots.
- Keep approval, publish, budget, and runtime reload policy out of the skill.

### 用户可见 slot schema 的推导（不是从骨架对号入座）

**首要参考**：`docs/deriving_artifact_schemas.md`——5+1 步把 SOP 推成 schema：

1. 第 0 步：判断这个 slot 是不是 user_visible（不是 → 加 `"user_visible": false` opt-out 跳过协议）
2. 第 1 步：从 SOP 列出所有用户可见 artifact
3. 第 2 步：数据形态 → 选 `content_layout.layout_type` ∈ `{single, list, grid, form}`
4. 第 3 步：unit 形态 → 选 `content.items.component_type` ∈ `{card, markdown, code, image, video, music, form_field}`
5. 第 4 步：点击语义 → 决定 `is_segment`（true → `detail.variant: "media_player"`；false → `detail: null`）
6. 第 5 步：视觉/类型语义 → 选 `card_variant` / `columns` / `index_prefix` / `display_type`
7. 第 6 步：用 JSON Schema `const` 把每一步的选择锁死；领域字段挂在 `content.items` 上（`additionalProperties: true`）；wrapper 层 `additionalProperties: false`

协议组合空间是 **4 layouts × 7 component_types × {is_segment 真假} × variant/config**——你的 slot 必须从 SOP 数据形态推出**这一组合**，不是从有限菜单里挑。

**示例参考（不是菜单）**：`templates/slot_schema_examples/` 下有 5 份已被推过的具象组合（`single_markdown` / `single_video` / `form` / `grid_card` / `list_card_segment`）+ `README.md` 列出协议组合空间和这 5 份的覆盖范围。**只有当你推导结果正好命中这 5 个组合之一**才能 cp 起手——大多数情况你应该按推导直接写 schema，参考最相邻示例的 wrapper 写法。

### Phase 4 validator 硬约束（不合规直接 fail）

写完 schema 跑 `node skills/create-skill/scripts/validate_skill_package.mjs <你的 skill>`：

1. Root `required` 必须含全部 6 个 wrapper 字段：`["slot", "display_name", "status", "version", "content_layout", "content"]`。
2. `properties.slot.const` 必须 = slot 名（与 artifact_contract.json 中 key 一致）。
3. `properties.status.enum` 必须含 `"draft"` 和 `"verified"`。
4. `properties.version.type` 必须 = `"integer"`。
5. `properties.content_layout.properties.layout_type.const` 必须 ∈ 4 种 layout 之一，且与 Phase 2 `artifact_layout_plan[].layout_type` 一致。
6. `properties.content.type` 必须 = `"array"`，`items.required` 必须含 `["id", "component_type", "detail"]`。
7. `properties.content.items.properties.component_type.const` 必须 ∈ 7 种 component 之一，且与 Phase 2 `primary_component_type` 一致。
8. 非 segment artifact：`content.items.properties.detail.type = "null"`；segment artifact：`content.items.properties.detail.properties.variant.const = "media_player"`。

每条 finding 都对应到推导 6 步中的某一步——修复回路：finding → 反推到决策第几步 → 改推导 → 改 schema → 重跑。不要绕过 validator。

**opt-out**：纯内部 / 非用户可渲染的 slot（如 create-skill 自己的 4 个 bookkeeping artifact）在 `artifact_contract.json` 的 slot 配置里加 `"user_visible": false` 跳过协议检查。默认所有 slot 视为 user_visible（即默认强校验）。

Read:

- `schemas/skill_source_package.schema.json`
- `templates/skill_source_package.minimum.json`

After source files are written, record the package manifest in
`skill_source_package` and verify it. Do not promote it in this phase:

```bash
```bash
cat <<'EOF' | dl artifact write --slot=skill_source_package --content-type=application/json --contract='<ARTIFACT_CONTRACT_PATH>' --content-file=-
<serialized skill_source_package JSON>
EOF
```
dl artifact finalize --slot=skill_source_package --mode=verify \
  --contract='<ARTIFACT_CONTRACT_PATH>'
```

Promotion is delayed until Phase 4 static validation returns `pass` or `warn`.

## Phase 4: Static Validation

Run the local validator after source files and the source package manifest are
verified:

```bash
node skills/create-skill/scripts/validate_skill_package.mjs <target-skill-dir>
```

Read:

- `schemas/skill_validation_report.schema.json`
- `templates/skill_validation_report.minimum.json`

If validation returns `fail`, write and verify `skill_validation_report` with
`terminal_source_package_promoted: false`, keep `skill_source_package`
unpromoted, and report the validation blockers as the current terminal state.

If validation returns `pass` or `warn`, promote `skill_source_package` first:

```bash
dl artifact finalize --slot=skill_source_package --mode=verify_and_promote \
  --contract='<ARTIFACT_CONTRACT_PATH>'
```

Then write and verify `skill_validation_report`. It must record:

- frontmatter validation result
- artifact contract and schema parse results
- template parse results
- unsupported `dl skill` authoring-command audit
- whether `write` / `finalize` / `validate` examples use `--contract`
- whether `patch-json` examples use supported JSONPath-lite operations and do
  not include an unsupported `--contract`
- **`protocol_compliance`**：每个非 opt-out slot 的 schema 都通过 wrapper 6 字段 / slot const / layout_type / content.items 协议检查（详见 Phase 3 §Protocol-compliant slot schemas）
- **`layout_plan_cross_check`**：当 `_design/skill_structure.json` 存在时，比对 `artifact_layout_plan[]` 与对应 schema 的 `layout_type / component_type / card_variant / display_type / is_segment ↔ detail.variant` 一致；不存在则跳过（`ran: false`）
- whether the terminal package manifest was promoted after validation

```bash
```bash
cat <<'EOF' | dl artifact write --slot=skill_validation_report --content-type=application/json --contract='<ARTIFACT_CONTRACT_PATH>' --content-file=-
<serialized skill_validation_report JSON>
EOF
```
dl artifact finalize --slot=skill_validation_report --mode=verify \
  --contract='<ARTIFACT_CONTRACT_PATH>'
```

## Phase 5: Representative Verification

Do one representative verification pass appropriate to the authored skill:

1. Confirm the description routes the intended trigger cases.
2. Confirm artifact contracts and schemas are coherent.
3. Confirm source files do not depend on current-Pi unsupported authoring
   commands.
4. Confirm runtime-owned policy was not baked into the skill.

If runtime reload is required to use the new skill, report it as an external
next step. Do not claim activation from this skill alone.

## Constraints

- Artifact rules are load-bearing. Missing `--contract` means the write,
  finalize, or validate call was not properly tied to the contract.
- `patch-json` must not include `--contract`; it must use `--operations` with
  supported JSONPath-lite ops, followed by a contract-backed finalize.
- The terminal source package must be promoted with
  `dl artifact finalize --mode=verify_and_promote` only after static validation
  returns `pass` or `warn`.
- The validation report must be verified after promotion for `pass` / `warn`
  results, or verified with `terminal_source_package_promoted: false` for
  `fail` results.
- Keep future skill-forge commands in the future-command note only.
- Keep templates declarative and parseable. Minimum templates are validation
  floors, not richness ceilings.
- Do not generate a 700-line composition root. Split phase detail into
  `phases/` and keep the root controller concise.
