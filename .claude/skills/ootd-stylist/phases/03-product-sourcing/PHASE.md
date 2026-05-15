# Phase 03: 产品溯源

## Goal

给用户在 Phase 02 确认门选定（`selected_for_frame: true`）的每一套穿搭，逐个单品搜真实产品：产品图 + 名称 + 购买链接 + 参考价。产出 `product_picks`，作为 Phase 04 出图的视觉锚点，并让用户能直接照着买。

## Required Inputs

- 已 verified 的 `outfit_plan`，含 `selected_for_frame` 决策
- `ARTIFACT_CONTRACT_PATH`

## Required Slot / Schema Loads

用内置 read 工具从本 skill 根目录读取：

- `schemas/product_picks.schema.json`
- `templates/product_picks.minimum.json`

读上游 artifact：

```bash
dl artifact read --slot=outfit_plan
```

## Required Companion Resources

- `references/product-sourcing.md` —— 搜什么、匹配标准、要记录什么、诚实 caveat

显式用内置 read 工具加载该方法论。

## Methodology

1. 从 `outfit_plan` 取所有 `selected_for_frame: true` 的套，逐套逐个单品（上装/下装/外套/鞋/包/配饰）搜真实产品。
2. 每个单品 = `product_picks` grid 里的一张 card：产品图走 `media`，产品名走 `title`，所属单品槽位 + 套名走 `subtitle`，购买链接与参考价走 `text`，来源站点 / 单品类型 / 套名走 `tags`。
3. 匹配标准见 `references/product-sourcing.md`：视觉接近文字描述、风格调性一致、价格区间合理。
4. 某单品搜不到 → 该 card 用 `media.state=failed`，`text` 保留原文字描述，不阻塞其余。
5. 图片搜索是 runtime 提供的能力；runtime 无搜索能力时，按 `references/product-sourcing.md` 的降级规则记占位。

## Current Pi CLI Patterns

```bash
cat <<'EOF' | dl artifact write --slot=product_picks --content-type=application/json --contract='<ARTIFACT_CONTRACT_PATH>' --content-file=-
<serialized product_picks JSON>
EOF
dl artifact finalize --slot=product_picks --mode=verify \
  --contract='<ARTIFACT_CONTRACT_PATH>'
```

## 确认门（Confirmation Gate）

`product_picks` 写入后是 `draft`。进入 Phase 04 前必须确认：

1. **产品是否对** —— 用户审产品图与链接；不满意某个单品则换搜，重出对应 card 的 `draft`，循环。
2. 确认后 finalize `product_picks` 为 `verified`，加载 Phase 04。

## Output Slot

- `product_picks`（verified）

## Next Phase Entry

确认门通过后，load：

    phases/04-outfit-frame/PHASE.md

using the built-in read tool from the same skill root.
