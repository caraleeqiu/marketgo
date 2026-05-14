# Slot Schema Examples

本目录是 **5 份已被推出过的协议合规组合**。**不是菜单。**

协议组合空间是 `4 layouts × 7 component_types × {is_segment 真/假} × variant/config`——你的 slot 应当从 SOP 数据形态推出来一个组合，不是从这 5 个里选最像的一个。

写 slot schema 之前先读：

→ `docs/deriving_artifact_schemas.md`

那篇文档给你 5+1 步推导原则：SOP → artifacts → content_layout → component_type → is_segment → variant/config → schema const lock。读完你应当能为**任何** SOP 推出协议合规的 schema。

## 这 5 份示例覆盖的组合

| 文件 | layout_type | component_type | is_segment | variant / config |
|---|---|---|---|---|
| `single_markdown.json` | `single` | `markdown` | `false` | （无） |
| `single_video.json` | `single` | `video` | `false` | （无） |
| `form.json` | `form` | `form_field` | `false` | display_type 用 enum，按字段值类型而定 |
| `grid_card.json` | `grid` | `card` | `false` | `variant: portrait` + `columns: const`（举例 1-3） |
| `list_card_segment.json` | `list` | `card` | `true` | `variant: landscape` + `index_prefix` + `detail.variant: media_player` |

## 协议组合空间 vs 这 5 份示例

| layout × component | 示例覆盖 | 没覆盖（仍然合法） |
|---|---|---|
| single + markdown | ✅ single_markdown.json | — |
| single + video | ✅ single_video.json | — |
| single + image | ❌ | 单图终态 / 封面 |
| single + music | ❌ | 单音频终态 |
| single + code | ❌ | 单 prompt / 单段代码 |
| single + card | ❌ | 单实体卡（用得少） |
| list + card (非 segment) | ❌ | 有序但不进 player 的卡片列表 |
| list + card (segment) | ✅ list_card_segment.json | — |
| list + markdown | ❌ | 有序章节文档 |
| grid + card | ✅ grid_card.json | — |
| grid + image | ❌ | 纯图册 |
| form + form_field | ✅ form.json | — |

没列举的组合**不是不合法**，是没人写过示例。按 `docs/deriving_artifact_schemas.md` 推导后直接写 schema，validator 通过即可。

## 怎么用这些示例

1. 跑完 `docs/deriving_artifact_schemas.md` 的 5+1 步推导，确定你的 slot 用什么 layout + component + is_segment + variant
2. **如果**正好命中其中一份示例的组合，可以从那份起手 cp，把 `YOUR_SLOT_NAME` / `YOUR_TITLE` 替换、按需调 `card_variant` / `columns` / `index_prefix` / `display_type`、追加领域字段（`content.items.additionalProperties:true`）
3. **如果**你的组合不在这 5 份里，直接按推导结果手写 schema——参考最相邻示例的 wrapper 写法 + 协议规范 0508 的对应 component schema 字段
4. 跑 validator：`node skills/create-skill/scripts/validate_skill_package.mjs <你的 skill>`，protocol_compliance 通过即合规

## 反模式

- ❌ "我看哪个例子最像就抄哪个" —— 跳过推导直接对号入座
- ❌ 看示例只有 portrait card 就把所有 grid card 都写 portrait —— 推导第 5 步告诉你按视觉重心选 variant
- ❌ 看示例 form 用 display_type enum 就你的 form 也用 enum —— 如果你的 plan 锁定单一字段类型应该用 const
- ❌ 把"agent 写出的、用户应看见的长文"（image / video generation prompt / 角色 base prompt / 长 instructions）塞进 additionalProperties 自定义字段 —— 走 `card.text`（grid_card.json / list_card_segment.json 已暴露此可选字段）；只有纯下游 ID（`asset_id` 等）才走 additionalProperties

## 进一步说明

完整协议规范见 create-skill 仓外的《Artifact 协议规范 0508》文档；本仓内的精简版在 `docs/artifact_protocol.md`。本目录示例只是协议在几个常见数据形态上的具象实现。
