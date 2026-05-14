# Artifact 渲染协议（规划新 skill 输出时使用）

本文件总结《Artifact 协议规范 0508》，用于在 Phase 2（结构设计）阶段决定**新 skill 的每个用户可见 slot 数据应该长什么样**。前端按此协议统一渲染，skill 不需要为每个新 slot 写前端代码。

如果你正在写的 skill 不会产出任何用户可见 artifact，可以跳过本文件。

---

## 三层模型

```
Wrapper（外壳）           slot / display_name / status / version
  └─ content_layout      数据怎么组织排列（single / list / grid / form）
       └─ component      每个原子单元长什么样（card / markdown / code / image / video / music / form_field）
            └─ detail    点击后展示什么（仅 segment artifact 用 media_player，其他固定为 null）
```

每个用户可见 slot 都要走这套结构。**字段直接平铺，没有 `preview` 包裹层**。

---

## 四步决策法

为新 skill 的每个用户可见 slot 走一次：

### 第一步 · 填 Wrapper

- `slot`：全局唯一标识，例如 `character_pack`、`storyboard`
- `display_name`：卡片 header 的显示名
- `status`：`draft` 或 `verified`
- `version`：整数，每次写入 +1

### 第二步 · 选 content_layout

| 数据形态 | layout_type |
|---|---|
| 单个内容（一篇文章 / 一段视频 / 一张图） | `single` |
| 多条，需要序号（如 `Scene 1 / Scene 2`） | `list` |
| 多条，网格均匀排列 | `grid`（`columns: 1–3`） |
| 配置项 / 参数键值对 | `form` |

### 第三步 · 选 component_type

| 内容形态 | component_type |
|---|---|
| 实体（媒体 + 多维信息，如角色、场景、片段） | `card` |
| 长文 / 富文本 | `markdown` |
| Prompt / 代码片段 | `code` |
| 一张图片 | `image` |
| 视频 | `video` |
| 音频 / 音乐 | `music` |
| 单个配置字段 | `form_field` |

### 第四步 · 决定 detail

- 这是 **segment artifact**（可单击进 media_player 的片段，例如视频片段）？→ `detail: { "variant": "media_player" }`
- 其他所有类型？→ `detail: null`（固定）

注：`media_player` 不是顶层 renderer family，它只能出现在 segment artifact 的 `detail.variant` 字段里，不能用作 `component_type`。

---

## 前端代办，skill 不要写

- Hover 时自动显示 `@`（引用按钮）；segment artifact 额外显示 `↗`（进入播放器）
- `markdown` 超出 `max_lines` 自动截断 + 「展开全文」
- `music` 卡片的 `lyrics / tags / description` 折叠展开
- `list` 是否折叠由前端按内容长度自动判断
- `word_count` 由前端计算

skill 不要在 schema 里塞 `rendererProps` / UI shadow 字段。

---

## 常见误区

- ❌ 用旧渲染家族名（`form_summary`、`card_grid`、`item_list`、`timeline`）做 schema 字段或 schema 名。这些已被本协议取代，统一用 `layout_type` + `component_type` 表达。`media_player` 不在这条里——它仍然是 segment artifact 唯一合法的 `detail.variant`，只是不能再当顶层 renderer family。
- ❌ 在 component 外再包一层 `preview`。component 字段直接平铺。
- ❌ 给非 segment artifact 写 `detail: { variant: "media_player" }`。只有 segment artifact 才允许，其他必须 `detail: null`。
- ❌ 把 `media_player` 当 `component_type` 用。它是 detail variant，不是组件。
- ❌ 在 `list` 的每条 item 里塞 `index`。序号由前端按数组顺序推导。
- ❌ 把 `lyrics / tags / description` 拆到独立 detail 页面。`music` 组件已经原生折叠展示。
- ❌ **把"agent 写给用户看的内容"藏在 additionalProperties 自定义字段里**（如 `final_prompt` / `base_prompt` / `notes` 直接挂在 card 上）。前端只渲染协议字段——藏起来 = 用户看不到 = 等于没写。任何 agent 产出的需要展示给用户的长文走 `card.text` / 短文摘要走 `subtitle` / 离散 meta（media 类型 / 模型名 / asset 类型 / 生成状态）走 `tags`；只有真正的工作流内部数据（如 `asset_id` 这种纯下游消费的领域 ID）才走 additionalProperties。
- ❌ **用 `badges[]` 字段**——Card 协议已移除 badges。状态信号（生成中 / 已生成 / 失败）走 tags（如 tag label `video gen pending` / `video gen done` / `video gen error`）。

---

## 关键 component 字段速查

只列 schema 设计时容易记错的点；完整字段以协议规范为准。

- **card**：必有 `title` + `subtitle`，`variant` 三选一（`portrait` / `horizontal` / `landscape`）。`media` 整体不填 = 此卡不产媒体；`media.url` 不填 = 生成中；`media.state: "failed"` 仅生成失败时填。`references[]` 是简化的 alias→URL 映射列表：每条只两个字段——`element_id`（在本卡 `text` 等字段里出现的占位符本体名，如 `"image1"` / `"audio1"` / `"asset1"`，agent 在 prompt 里写 `@image1`、tool 按 element_id 解析）+ `url`（被该 alias 绑定的资源 URL）。前端按 element_id 标签 + url 渲染缩略图。`text` 是协议扩展长文字段（前端按可展开长文块渲染、用户可见可复制）——任何"agent 写出的、用户应该看得见"的长文（image / video generation prompt / 角色 base prompt / 长 description / instructions），必须走 `text`，不要藏在 additionalProperties 自定义字段里。**Text 内容只放 prompt 主体 / 长文本身**——必要 meta（media 类型 / 生成模型 / asset 类型）走 tags；不要在 text 里重复 subtitle 已经描述过的信息（如 subtitle 已写"30 岁亚洲女性，瘦削挺拔"，text 里就不再单独写"image is of a woman with blonde hair"——那是冗余 meta；prompt 主体内的描述细节作为 image-gen / video-gen prompt 的固有内容，不算冗余）。`tags[]` 是面向用户的可见标签 chip——只放**必要 meta**：media 类型（`image` / `video` / `audio`）、生成模型名（`seedream` / `seedance-2-0` / `banana` 等）、asset 类型（`character` / `location` / `object` / `scene N` 等）；不写描述性内容（不写"金色头发" / "女性"等已在 subtitle 的描述）。`badges[]` 已从 Card 协议移除——state 信号（生成状态 done / pending / error 等）放进 tags（如 tag label 写 `video gen pending` / `video gen done`），不再走单独的 badges 字段。
- **markdown**：`text` 必填，`max_lines` 默认 3。
- **code**：`content` 必填，`language` 取 `text | json | python | prompt`。
- **video**：`segment` 类型时 `video_url` 必填。
- **music**：`title` + `audio_url` 必填；`lyrics / tags / description` 是展开时显示的三件套。
- **form_field**：`key` 同时作为展示名；`display_type` 从 `text | number | boolean | badge | color | image | url | date | duration` 选。

---

## Phase 2 产物

`artifact_layout_plan[]` 在 `skill_structure` 里**必填**（schema root 已 require）。每个用户可见 slot 必须有且仅有一条；slot 名必须同时出现在 `artifact_slots[]` 中。完全不产用户可见 artifact 的 skill 写 `[]`。

最小条目（适用 single / list + 非 card / 非 form_field）：

```json
{
  "slot": "character_brief",
  "display_name": "角色简介",
  "layout_type": "single",
  "primary_component_type": "markdown",
  "is_segment": false
}
```

按 layout / component 条件展开的字段：

- `layout_type: "grid"` → 必填 `layout_config.columns`（1–3）。
- `layout_type: "list"` → 可选 `layout_config.index_prefix`（如 `"Scene"`），不填则不显示序号。
- `primary_component_type: "card"` → 必填 `card_variant`（`portrait` / `horizontal` / `landscape`）。
- `primary_component_type: "form_field"` → 必填 `display_type`（`text` / `number` / `boolean` / `badge` / `color` / `image` / `url` / `date` / `duration`）。

完整示例（card grid，每行 2 列）：

```json
{
  "slot": "character_list",
  "display_name": "角色列表",
  "layout_type": "grid",
  "layout_config": { "columns": 2 },
  "primary_component_type": "card",
  "card_variant": "portrait",
  "is_segment": false
}
```

`artifact_layout_plan` 不是运行时 schema，是 Phase 2 决策快照——逼作者在结构设计阶段就把渲染形态想清楚，避免到 Phase 3 写 schema 时才发现数据形态和前端可渲染范式不匹配。

注意：plan 里的 `layout_config` / `card_variant` / `display_type` 是规划字段，不是运行时 artifact 的字段。运行时 artifact 仍按权威协议写 `content_layout.config.columns` / `content_layout.config.index_prefix` / component 的 `variant` 等。

---

## 协议来源

完整协议（含 schema 字段、交互约定、完整例子）参见《Artifact 协议规范 0508》。本文件是 Phase 2 决策版的精简引用，schema 细节以协议规范为准。
