# 从 SOP 推导 Artifact Schema —— 决策原则

本文件是 Phase 3 落地协议的**首要参考**。Phase 2 让你列出 `artifact_layout_plan[]`，本文教你如何从手头的 SOP 把每条 plan 推导成一份**协议合规的 slot schema**。

不是从 5 份骨架里挑一份。**协议组合空间是 4 layouts × 7 component_types × {is_segment 真/假} × variant / config**——你得为每个用户可见 artifact 推出该用哪一组合，再把组合用 JSON Schema `const` 锁死。

`templates/slot_schema_examples/` 下的几份示例只是"已被推出过的几个组合"，**不是菜单**。读完它们能学到字段写法，但你不能把"我的 SOP 哪个例子最像"当成决策路径——那样会丢掉数据形态自身的特征。

---

## 第 0 步：确认这个 slot 是不是 user_visible

只有用户可见 / 前端会渲染的 slot 才走协议。Agent 内部 bookkeeping artifact（如 create-skill 的 `skill_brief` / `skill_structure` 等）在 `artifact_contract.json` slot 配置加 `"user_visible": false` 跳过。判断：

- 这个 slot 会作为卡片 / 列表 / 视频出现在产品 UI 里 → user_visible（默认）
- 这个 slot 只是 agent 跨心跳读回来用的工作记忆 / 验证留底 → 加 `user_visible: false`

---

## 第 1 步：从 SOP 列出所有用户可见 artifact

读 SOP，问以下三个问题：

1. SOP 在每个 phase 的"产出"段说自己产出什么？（直接抄）
2. SOP 让用户在最后看到什么？（终态产物）
3. SOP 中间产物里，哪些会被前端展示给用户决策 / 选择？（中间产物也算 user_visible）

每个用户可见产出 = 一个 slot。把它们列进 Phase 2 的 `artifact_layout_plan[]`，然后逐条走第 2-6 步。

---

## 第 2 步：数据形态 → 选 `content_layout`

问：**这个 slot 的 content 是什么形态？**

| 数据形态特征 | layout_type | layout_config |
|---|---|---|
| 单一整体（一篇文档 / 一个视频 / 一份配置摘要） | `single` | （无） |
| 多条**有序**条目，用户期望看到序号（场景 1 / 场景 2 / 段 1 / 段 2） | `list` | `index_prefix` 字面（如 `"Scene"` / `"Segment"` / `"Track"`） |
| 多条**等价**条目，用网格平铺（角色卡片墙 / 道具图册） | `grid` | `columns` 1-3，按密度选 |
| **键值参数**（项目设置 / 视觉配置 / 模型选项） | `form` | （无） |

**踩坑**：

- 不要因为"我有多个东西"就上 list/grid。如果用户期望读到的是一份连贯叙事（如剧本梗概），那是 `single + markdown`，里面用 markdown 列表表达"多个东西"。
- 不要因为"配置里只有一项"就上 single。配置即使一项也用 form——产品后续会扩展。
- list vs grid：list 强调**顺序**（场景顺序、片段顺序），grid 强调**等价并列**（角色卡片之间没先后）。
- 一个 slot 只能一个 layout_type。混合形态的 slot 需要拆成两个 slot。

---

## 第 3 步：unit 形态 → 选 `component_type`

问：**`content[]` 数组里每一条最小单元是什么？**

| unit 形态特征 | component_type | 必备字段 |
|---|---|---|
| 实体（媒体 + title + subtitle + tag/badge/reference 多维信息） | `card` | `id, component_type, variant, title, subtitle, detail` |
| 长文 / 富文本 / 一段叙事 markdown | `markdown` | `id, component_type, text, detail` |
| Prompt / 代码片段（语义是"这是给某个工具吃的字符串"） | `code` | `id, component_type, content, detail`；可选 `language ∈ {text, json, python, prompt}` |
| 单图（不是 card 那种带文字的，纯一张图） | `image` | `id, component_type, image_url, detail` |
| 单视频（终态成片 / 单一视频展示） | `video` | `id, component_type, detail`；通常带 `video_url` |
| 单音频 / 单首音乐 | `music` | `id, component_type, title, audio_url, detail` |
| 单个配置字段（form layout 里每条） | `form_field` | `id, component_type, key, value, display_type` |

**踩坑**：

- card vs markdown：是**实体**（角色 / 场景 / 片段）就 card；是**叙事文字**（梗概 / 剧本正文）就 markdown。card 的 title/subtitle 是固定双行，markdown 是连续段落。
- card vs image：纯一张图无任何元信息 → image；图 + 角色名 + 描述 + 标签 → card。
- video（component）vs segment artifact（is_segment=true 的 card with media.type=video）：单个最终成片走 single + video；多段视频片段每段都能点进播放器走 list/grid + card + is_segment=true。
- code vs markdown：能否当字符串喂给某个工具？能 → code；只是给人看 → markdown。
- 一个 layout 下所有 content[] 条目**必须同 component_type**——layout 是"网格 / 列表"的几何，component 是"格子里装什么"。如果数据条目类型不一，要么拆 slot，要么把它们抽象成同一种 card（用 tags/badges 区分子类）。

---

## 第 4 步：点击语义 → 决定 `is_segment`

问：**用户在前端点击这条 content 会发生什么？**

- 点击 = 把这条引用到对话框（"我想 @ 这个角色 / @ 这个场景"）→ `is_segment: false`，`detail: null`
- 点击 = 进入 media player 播放视频 / 音频片段 → `is_segment: true`，`detail: { variant: "media_player" }`

**只有 segment artifact 能进 media_player**。判断：

- 视频片段（storyboard segment / 音乐分段 / 视频成片切片）→ `is_segment: true`
- 终态成片（一个完整视频）虽然也是视频，但**通常**作为 single + video 渲染，前端有自己的播放控件而不进 media_player → `is_segment: false`
- 所有非视频音频组件（card with image media / markdown / form_field 等）→ 永远 `is_segment: false`

**踩坑**：

- segment artifact 的 card 必须 component_type=card 且 media.type ∈ {video, audio}（前端把它们当播放片段）。一张图的 card 不能 is_segment=true。
- 一个 slot 内所有 content[] 条目要么全 segment 要么全非 segment——不要混。

---

## 第 5 步：视觉 / 类型语义 → 选 variant 和 config

### 5.1 card variant（仅 component_type=card）

问：**这张卡的视觉重心在哪里？**

| 视觉特征 | variant |
|---|---|
| 媒体竖版主体 + 文字次要（人物头像 / 角色海报） | `portrait` |
| 媒体横向上方 + 文字下方 + tags（场景图 / 视频片段缩略图） | `horizontal` |
| 缩略图小图左 + 文字主体右（紧凑引用列表） | `landscape` |

一个 slot 内**所有 card 强制同一 variant**——网格 / 列表的视觉一致性。如果你的 entry 性格冲突（character 适合 portrait、location 适合 horizontal），要么拆 slot，要么挑一个全局 best fit 妥协。

### 5.2 grid columns（仅 layout_type=grid）

按密度：

- 1 列：内容多文字、需要展开阅读 → 几乎不用，多半改 list
- 2 列：默认；中等密度
- 3 列：高密度展示（角色 / 道具 / 引用图册）

### 5.3 list index_prefix（仅 layout_type=list）

按序号语义起字面：`"Scene"` / `"Segment"` / `"Track"` / `"Chapter"` / `"Step"` 等。**不要写中文**——前端会拼成 `Scene 1` / `Segment 2`，混中文容易被各端字号挤变形。如果不需要序号字面（如纯按顺序但不想前缀）就**不填**这个 config。

### 5.4 form_field display_type（仅 component_type=form_field）

按 value 的物理类型，从 9 种里挑：

| value 是什么 | display_type |
|---|---|
| 一段普通字符串（描述、名字、URL 不点击） | `text` |
| 数字（年龄 / 时长 / 数量；前端可附单位） | `number` |
| true/false 开关 | `boolean` |
| 枚举值（状态、tag、模型名）→ 高亮标签 | `badge` |
| 颜色 hex 值（"#A855F7"）→ 色块预览 | `color` |
| 图片 URL → 缩略图渲染 | `image` |
| 可点击超链接 URL | `url` |
| ISO 8601 日期 | `date` |
| 秒数 → 前端格式化 mm:ss | `duration` |

一个字段一个 display_type；不要把 9:16 这种 "字符串看上去像 enum" 的硬塞 badge——它就是 text，badge 留给真正离散状态值。

---

## 第 6 步：用 JSON Schema `const` 锁死推导结果

把第 2-5 步的所有选择**用 const 写死在 schema**——这是 Phase 4 cross-check 的钩子。具体：

| 决策位置 | 锁死字段 |
|---|---|
| 第 2 步 layout_type | `properties.content_layout.properties.layout_type.const = "<single|list|grid|form>"` |
| 第 2 步 grid columns（如选 grid 且 plan 给了固定值） | `properties.content_layout.properties.config.properties.columns.const = <N>` |
| 第 3 步 component_type | `properties.content.items.properties.component_type.const = "<card|markdown|...>"` |
| 第 4 步 is_segment + 第 4 步 detail.variant | `properties.content.items.properties.detail.{type:"null"} 或 {properties.variant.const="media_player"}` |
| 第 5 步 card variant | `properties.content.items.properties.variant.const = "<portrait|horizontal|landscape>"` |
| 第 5 步 form_field display_type（plan 已写死单一字段时） | `properties.content.items.properties.display_type.const = "<...>"` |

**Wrapper 同时要求**（Phase 4 validator 严查）：

```json
"required": ["slot", "display_name", "status", "version", "content_layout", "content"],
"properties": {
  "slot":          { "const": "<your_slot_name>" },
  "display_name":  { "type": "string", "minLength": 1 },
  "status":        { "enum": ["draft", "verified"] },
  "version":       { "type": "integer", "minimum": 1 },
  "content_layout": { /* 第 2 步 const */ },
  "content":       { "type": "array", "items": { /* 第 3-5 步 const + domain 字段 */ } }
}
```

**领域字段的 escape hatch**：runtime 渲染只看协议字段，但 agent 工作流需要的额外数据**写在 `content.items` 上**，把该层 `additionalProperties` 设为 `true`。Wrapper 层（顶级）应当 `additionalProperties: false`——只有协议字段。

**escape hatch 不是"agent 写的内容默认藏起来"——只有真正不需要给用户看见的数据才走 additionalProperties**。先按下面这条铁律分类：

| 数据是 | 放哪里 |
|---|---|
| Agent 写出的长文，用户应该看得见（image / video generation prompt / 角色 base prompt / 长 instructions / description） | `content.items.text`（协议扩展字段，前端按可展开长文块渲染。只放 prompt 主体；不重复 subtitle 已写过的描述） |
| Agent 写出的短描述（一句话剧情 / 形象摘要），用户应该看得见 | `content.items.subtitle`（一句话） |
| Agent 写出的离散 meta（media 类型 `image`/`video`/`audio`、生成模型名 `seedream`/`seedance-2-0`/`banana`、asset 类型 `character`/`location`/`object`/`scene N`、生成状态 `video gen done` 等），用户应该看得见 | `content.items.tags[]`（每条 `{label}`，单个 chip）。**badges 字段已从 Card 协议移除**——状态信号也走 tags 用 label 后缀（如 `video gen pending`）。 |
| 纯下游工具消费的领域 ID（`asset_id` / `image_model` 字符串、`scene_number` 整数、`duration_seconds` 数字） | `content.items` 上的自定义字段，靠 `additionalProperties: true` 容纳 |
| 内部规划 / 工作记忆 / 验证留底（永不渲染） | 整个 slot 标 `user_visible: false` 跳过协议 |

判断口诀："这条数据用户希望直接看到吗？" 是 → 协议字段；否 → additionalProperties。**不要因为"我有 schema 定义就够了"而把 prompt 藏在自定义字段里**——前端不读你的字段名，没在协议白名单里的字段一律不渲染。

---

## 推导样例：从 SOP 到 schema 决策一览

### 样例 1：visual_config（来自视觉成片 SOP）

- 第 0 步：用户配置面板上要展示 → user_visible
- 第 1 步：SOP 第 1 phase "视觉配置" 产出
- 第 2 步：5 维度 visual_style + aspect_ratio + resolution + 模型选择，是**键值参数**集合 → `form`
- 第 3 步：每条是一个**单字段**（color_palette / lighting / texture / era_mood / aspect_ratio 等）→ `form_field`
- 第 4 步：点击 = 引用进对话 → `is_segment: false` → `detail: null`
- 第 5 步：display_type 按 value 类型混用：text 给文字描述、badge 给 aspect_ratio 这类离散值。这种情况 plan 不锁单一 display_type，schema 用 enum 而非 const
- 第 6 步：`layout_type.const="form"` + `component_type.const="form_field"` + 每条 `display_type.enum=[...]`

### 样例 2：reference_list（来自视觉成片 SOP）

- 第 0-1 步：素材库要展示给用户挑选 → user_visible，Phase 2 产出
- 第 2 步：3 类素材（character/location/object）按等价网格平铺 → `grid` + columns=3
- 第 3 步：每条是 image + title + 描述 + tag + 状态 badge → `card`
- 第 4 步：点击 = @ 这个素材进对话（不是进 player）→ `is_segment: false`
- 第 5 步：character 适合 portrait（人物竖版），location/object 也接受 portrait 妥协 → variant=`portrait`
- 第 6 步：`layout_type.const="grid"` + `config.columns.const=3` + `component_type.const="card"` + `variant.const="portrait"` + `detail.type="null"`；**image-generation base_prompt 走 `content.items.text`（只放 prompt 主体，不重复 subtitle 描述）**；media 类型 / 模型名 / asset 类型走 tags（`{label:"image"}`、`{label:"seedream"}`、`{label:"character"}`，状态如 `{label:"image done"}` / `{label:"register-asset done"}`）；纯下游 ID（`asset_id` / `image_model` / `ref_id_list`）走 `content.items.additionalProperties:true`

### 样例 3：storyboard（来自视觉成片 SOP）

- 第 0-1 步：分镜板用户要审 → user_visible
- 第 2 步：segment 有顺序（segment 1 / 2 / 3 ...）→ `list` + `index_prefix="Segment"`
- 第 3 步：每个 segment 是带视频缩略 + title + 引用的实体 → `card`
- 第 4 步：点击 segment = 进 media_player 播放该 segment → `is_segment: true`
- 第 5 步：video 缩略图横向显示 + 文字下方 → variant=`horizontal`（或 `landscape` 走紧凑列表）
- 第 6 步：`layout_type.const="list"` + `config.index_prefix.const="Segment"` + `component_type.const="card"` + `variant.const="horizontal"` + `detail.properties.variant.const="media_player"`；**video-generation prompt 走 `content.items.text`（只放 prompt 主体）**；media 类型 / 模型名 / scene 归属 / 时长 / 视频生成状态走 tags（`{label:"video"}`、`{label:"seedance-2-0"}`、`{label:"scene 3"}`、`{label:"8s"}`、`{label:"video gen pending"}` / `done` / `error`）；纯下游字段（`scene_number` / `duration_seconds` / `model` / `fallback_history`）走 additionalProperties。**不要造 `final_prompt` / `narration` / `shots[]` 这种中间结构往 additionalProperties 里塞**——agent 直接按 by-shot 思路把整段 prompt 写进 `text`

### 样例 4：final（来自视觉成片 SOP）

- 第 0-1 步：终态成片 → user_visible
- 第 2 步：单个完整视频 → `single`
- 第 3 步：单视频组件 → `video`
- 第 4 步：成片有自己的播放器 UI，**不**进 media_player segment 框 → `is_segment: false`
- 第 5 步：video 组件无 variant
- 第 6 步：`layout_type.const="single"` + `component_type.const="video"` + `detail.type="null"`；`video_url / total_duration_seconds / aspect_ratio / resolution / segment_count` 走 additionalProperties

### 样例 5：concept（来自 screenplay-shortform SOP）

- 第 0-1 步：剧本梗概给用户读 → user_visible
- 第 2 步：是一份**连贯叙事**（破题 + 4 维度 + logline + 起承转合 synopsis），整体一篇 → `single`
- 第 3 步：unit = 长文 markdown（前端用 markdown renderer 自动截断 + 展开）→ `markdown`
- 第 4 步：点击 = 引用进对话 → `is_segment: false`
- 第 5 步：markdown 组件无 variant，可设 max_lines
- 第 6 步：`layout_type.const="single"` + `component_type.const="markdown"` + `detail.type="null"`

---

## 不要这样做（反模式）

1. **"我看哪个例子最像就抄哪个"**：组合空间不是菜单。你的 SOP 数据形态可能是任何 layout × component 组合，必须独立推。
2. **拿 component_type=card 当万能**：长文 / 单图 / 单视频都有专门组件，不要硬塞进 card 的 title/subtitle。
3. **layout_type 选错重做整 schema**：所以**先想清楚 layout 再开始写 schema**。Phase 2 plan 阶段就要敲定。
4. **用 description / label 字符串塞渲染信息**：硬语义信息（layout / component / variant）必须写进 schema 作为 const，前端不会读 description。
5. **把 wrapper 字段开放**：`slot / display_name / status / version / content_layout / content` 6 个 wrapper 字段是 closed set，wrapper 层 `additionalProperties: false` 严查。领域字段往 `content.items` 上挂。
6. **混 segment**：一个 slot 内所有 content 要么全 segment 要么全非 segment；不要 list 里既有 segment card 又有非 segment card。
7. **照抄旧 skill 的 flat 域 schema**（如 screenplay-shortform 的 `concept.schema.json`）：那是 Pre-protocol 时期的产物，是反例。
8. **把 agent 写的可见内容藏在 additionalProperties 里**：如直接挂 `final_prompt` / `base_prompt` / `notes` / `description_long` 字段在 card 上。前端只渲染协议白名单字段，自定义字段全不显示——等于用户看不到。可见长文走 `card.text`（只放 prompt 主体），可见短描述走 `subtitle`，可见离散 meta（media 类型 / 模型名 / asset 类型 / 状态）走 `tags`。只有真正不需要给用户看的下游 ID（`asset_id` / `model` 字符串）才走 additionalProperties。`badges[]` 已从 Card 协议移除——状态信号也走 tags。

---

## 验证：让 Phase 4 validator 替你兜底

写完 schema 跑：

```bash
node skills/create-skill/scripts/validate_skill_package.mjs <你的-skill 目录>
```

输出 JSON 里：

- `protocol_compliance.findings` 应为 `[]`——任何 wrapper / slot const / layout / component / detail 不合规都会逐条列出
- `layout_plan_cross_check.findings` 应为 `[]`——比对 `_design/skill_structure.json` 的 `artifact_layout_plan[]` 与 schema const 一致

每条 finding 都对应到上面 6 步中的某一步。修复回路：finding → 反推到决策第几步 → 修推导 → 修 schema → 重跑。

不要绕过 validator——它是协议合规的最终保障。
