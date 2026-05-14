# Phase 02: 穿搭匹配

## Goal

把「主体风格 + 场景」转成具体的单品组合，产出 3 套差异化穿搭方案供用户挑选。这是核心卖点所在的一步。

## Required Inputs

- 已 verified 的 `style_profile`
- 用户的场景（必须）；可选：风格偏好、必含单品、季节
- `ARTIFACT_CONTRACT_PATH`

## Required Slot / Schema Loads

用内置 read 工具从本 skill 根目录读取：

- `schemas/outfit_plan.schema.json`
- `templates/outfit_plan.minimum.json`

读上游 artifact：

```bash
dl artifact read --slot=style_profile
```

## Required Companion Resources

- `references/scene-library.md` —— 10 个预设场景的穿搭基调、关键词、忌讳
- `references/styling-rules.md` —— 风格 × 场景 → 单品组合规则

显式用内置 read 工具加载这两份方法论。

## Methodology

1. 用 `references/scene-library.md` 确定场景基调与忌讳，叠加季节。
2. 用 `references/styling-rules.md` 结合 `style_profile` 出 3 套：基础百搭 / 进阶亮点 / 大胆尝试。
3. 每套是一张 card：tier 走 `title`，搭配理由走 `subtitle`，六槽位单品清单（上装/下装/外套/鞋/包/配饰）走 `text`，tier 与场景走 `tags`。
4. 必含单品、风格偏好是硬约束，3 套都要遵守；场景忌讳是红线。
5. 这一步需要确认的信息：用户从 3 套里选定 1 套（记在选定卡的 tag 或下游消费字段）。

## Current Pi CLI Patterns

```bash
cat <<'EOF' | dl artifact write --slot=outfit_plan --content-type=application/json --contract='<ARTIFACT_CONTRACT_PATH>' --content-file=-
<serialized outfit_plan JSON>
EOF
dl artifact finalize --slot=outfit_plan --mode=verify \
  --contract='<ARTIFACT_CONTRACT_PATH>'
```

## Output Slot

- `outfit_plan`

## Next Phase Entry

After success, load:

    phases/03-outfit-frame/PHASE.md

using the built-in read tool from the same skill root.
