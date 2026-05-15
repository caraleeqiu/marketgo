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

## Current Pi CLI Patterns

```bash
cat <<'EOF' | dl artifact write --slot=outfit_plan --content-type=application/json --contract='<ARTIFACT_CONTRACT_PATH>' --content-file=-
<serialized outfit_plan JSON>
EOF
dl artifact finalize --slot=outfit_plan --mode=verify \
  --contract='<ARTIFACT_CONTRACT_PATH>'
```

## 确认门（Confirmation Gate）

`outfit_plan` 写入后是 `draft`。进入 Phase 03 前必须收集并确认以下用户决策，再把决策写回 `outfit_plan` 并 finalize 为 `verified`：

1. **3 套方案是否 OK** —— 不满意则改 `outfit_plan` 重出 `draft`，循环。
2. **给哪几套做产品溯源 + 首帧图** —— 用户从 3 套里选 1-3 套；选中的卡片 `selected_for_frame` 置 `true`。这些套会在 Phase 03 搜真实产品、在 Phase 04 出首帧图。
3. **是否生成 OOTD 视频、给哪几套** —— 可选交付物。要的话：选定进入视频的那些套（1-3 套，`selected_for_video` 置 `true`），并确认**视频风格**（见 `references/frame-and-video.md` 的视频风格调色板；用户不指定则由场景 + `style_profile` 推断）。选 1 套 = 单段走秀；选 2-3 套 = 换装 montage（每套一段 + 特效转场 + 连续 BGM）。三套 `selected_for_video` 全为 `false` 则不生成视频，工作流在 Phase 04 收尾。

把决策写回 `outfit_plan` 后重新 finalize：

```bash
cat <<'EOF' | dl artifact patch-json --slot=outfit_plan --operations-file=-
[{"op":"set","path":"content[0].selected_for_frame","value":true},
 {"op":"set","path":"content[0].selected_for_video","value":true}]
EOF
dl artifact finalize --slot=outfit_plan --mode=verify \
  --contract='<ARTIFACT_CONTRACT_PATH>'
```

## Output Slot

- `outfit_plan`（verified，含 `selected_for_frame` / `selected_for_video` 决策）

## Next Phase Entry

确认门通过后，load：

    phases/03-product-sourcing/PHASE.md

using the built-in read tool from the same skill root.
