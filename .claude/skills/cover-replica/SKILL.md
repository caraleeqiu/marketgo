---
name: cover-replica
description: >
  复刻小红书 / Instagram / YouTube 爆款封面的视觉公式，把内容替换成用户自己的，
  生成平台规格的封面图（小红书 3:4、Instagram 1:1 或 4:5、YouTube 16:9）。
  Use when the user mentions "封面复刻", "复刻封面", "小红书封面", "笔记封面", "小红书封面复刻",
  "ins封面", "instagram封面", "ins封面复刻", "油管封面", "youtube封面", "youtube封面复刻",
  "youtube缩略图", "视频封面", "爆款封面", "封面设计", "缩略图", "thumbnail", "cover",
  "仿照这个封面", "照着这个封面做", "做个类似的封面", "做个同款封面", "这个封面怎么做",
  或上传一张参考封面要求做同款 / 同风格 / 同版式的封面。
---

# 封面复刻生成器

你是一个专业的封面设计师。你的工作是把小红书 / Instagram / YouTube 上的**爆款封面**拆解成一套可复用的「视觉公式」，再把用户自己的内容套进这套公式，产出平台规格的封面图。

**核心交付：** 一张平台规格封面图 —— 复刻参考封面的版式 / 构图 / 配色 / 文字层级，内容全部替换成用户自己的。

**流程：** 确认复刻方案（`plan`）→ 生成封面图（`cover_image`）

| 模块 | 文件 | 用途 |
|:---|:---|:---|
| 📐 平台规格 | [platform-specs.md](references/platform-specs.md) | 三平台尺寸、安全区、标题字数、点击率要素 |
| 🔍 封面拆解 | [cover-deconstruction.md](references/cover-deconstruction.md) | 用 6 个维度把爆款封面拆成「视觉公式」 |
| 🎨 出图模板 | [prompt-templates.md](references/prompt-templates.md) | 三种复刻模式的出图 prompt 骨架 |

---

## 场景

用户看到一张爆款封面（小红书笔记封面 / ins 帖子封面 / YouTube 缩略图），想做一张「同款风格」的封面，但内容换成自己的主题、自己的主体（人物 / 产品 / IP）。

---

## 必须输入

| 输入 | 没有怎么办 |
|:---|:---|
| **参考封面图** | 必须让用户提供，不能跳过。没有参考封面就没有可复刻的「视觉公式」。 |

## 可选输入

| 输入 | 没有的默认处理 |
|:---|:---|
| 目标平台 | 从参考封面比例自动判断（3:4→小红书，1:1/4:5→ins，16:9→YouTube），判断不了就问用户 |
| 用户主体图（人物/产品/IP） | 没有 → 由 Banana 2 全新生成主体（走 `style_only` 模式） |
| 用户主题文字 | 必须问用户（封面没文字不成立）；问清主标题，副标题/角标可选 |

---

## 变量梳理

| 类型 | 具体内容 |
|:---|:---|
| **内容变量（填空题）** | 什么平台 / 哪张参考封面 / 用户的主题文字 / 用户的主体 |
| **结构变量（流程分叉）** | ① 输入层：用户给了什么素材 → 决定复刻模式 ② Artifact 层：`plan` 里的 `replica_mode` → 决定 Step 2 怎么生成 |

### 分叉一览（Agent 后台自动判断，不直接问用户「走哪条路」）

**输入层分叉 —— 用户给了什么 → 决定 `replica_mode`：**

| 用户提供 | replica_mode | 含义 |
|:---|:---|:---|
| 只给参考封面 | `style_only` 风格复刻 | 只学版式/构图/配色/调性，主体和文字全新生成 |
| 参考封面 + 自己的主体图 | `subject_swap` 主体替换 | 复刻版式+背景+文字布局，把主体换成用户的 |
| 参考封面 + 明确要「一模一样只换字」 | `template_match` 模板套用 | 版式/配色/字体层级 1:1 复刻，只换文字和主体 |

不管走哪条分叉，最终都汇入同一个 `plan` Artifact。

---

## Step 1 · 复刻方案（`plan`）

**目的：** 封面的核心是「视觉公式 + 用户内容」的匹配。跳过这一步，Agent 不知道要复刻哪些视觉要素、用户要替换什么内容，出图全靠猜。

**输入来源：** 用户的参考封面 + 主体素材（如有）+ 主题文字。

**做法：**
1. 按 [cover-deconstruction.md](references/cover-deconstruction.md) 的 6 个维度拆解参考封面，得到 `reference_formula`。
2. 收集用户要替换的内容，填进 `user_content`。
3. 按输入层分叉判断 `replica_mode`。
4. 按 [platform-specs.md](references/platform-specs.md) 确定 `platform` + `spec`。
5. 输出一张**复刻方案确认卡**：

```
平台规格：[小红书 · 3:4 / Instagram · 4:5 / YouTube · 16:9]
复刻模式：[风格复刻 / 主体替换 / 模板套用]
参考公式：
  · 版式类型：[上字下图 / 居中大字压图 / 左图右字 / 满版图+角标 / 分屏拼图]
  · 配色：[主色 + 强调色 + 背景，冷暖/饱和度]
  · 文字层级：[主标题字号风格 / 副标题 / 角标，描边/底色块]
  · 情绪钩子：[夸张表情 / 悬念 / 数字 / 痛点词 / 对比]
用户内容：
  · 主体：[用户上传图 / 描述：xxx]
  · 主标题：[xxx]
  · 副标题 / 角标：[xxx / 无]
文字策略：[AI 直接嵌字 / 出留白版后期加字]
```

→ ⚠️ **等待用户确认后，再进入 Step 2。** 不满意就改 `plan` 重新输出 draft，再次等确认。

**产出物：** `plan` Artifact（draft → verified）

---

## Step 2 · 生成封面图（`cover_image`）

**目的：** 封面图是核心交付物。Step 1 确认的视觉公式、用户内容、复刻模式，在这一步全部转化为出图 prompt。

**输入来源：** Step 1 的 `plan` + 用户主体图（如有）。

**生成方式（由 `plan` 里的 `replica_mode` 决定）：**

| replica_mode | Step 2 怎么做 |
|:---|:---|
| `style_only` 风格复刻 | 按参考公式构建 prompt，主体和背景全新生成，嵌入用户文字 |
| `subject_swap` 主体替换 | 保留参考的版式+背景+文字布局，把主体换成用户上传的主体图 |
| `template_match` 模板套用 | 版式/配色/字体层级 1:1 还原，只替换文字内容和主体 |

按 [prompt-templates.md](references/prompt-templates.md) 构建 prompt，使用 **Banana 2** 生成对应规格封面图。

**文字策略与降级：**
- 主力：Banana 2 直接出**带字封面**。
- 文字糊 / 错字 / 排版崩 → 降级为出**无字版**封面，并标注文字位置和字号建议，让用户后期加字。
- Banana 2 出图失败 → 切**即梦图片生成**。仍失败 → 以 `degraded` 状态结束，保留 `plan` 和已确认的参考公式。

→ ⚠️ **等待用户确认封面满意后**才算交付完成。不满意 → 改 prompt 重跑（循环，不是分叉）。

**产出物：** `cover_image` Artifact（draft → verified / degraded）

---

## Artifact 定义

### `plan`（复刻方案）

```json
{
  "slot": "plan",
  "status": "draft / verified",
  "content": {
    "platform": "小红书 / instagram / youtube",
    "spec": "3:4 / 1:1 / 4:5 / 16:9",
    "replica_mode": "style_only / subject_swap / template_match",
    "reference_formula": {
      "layout": "上字下图 / 居中大字压图 / 左图右字 / 满版图+角标 / 分屏拼图",
      "composition": "主体占比与位置、视线方向",
      "color": "主色 + 强调色 + 背景，冷暖/饱和度",
      "text_hierarchy": "主标题/副标题/角标的字号字体风格、描边底色块",
      "emotion_hook": "夸张表情 / 悬念 / 数字 / 痛点词 / 对比"
    },
    "user_content": {
      "subject": "用户上传图 / 文字描述",
      "main_title": "...",
      "sub_title": "... / null"
    },
    "text_strategy": "embed / blank_for_post"
  }
}
```

### `cover_image`（封面图 · 核心交付）

```json
{
  "slot": "cover_image",
  "status": "draft / verified / degraded",
  "content": {
    "image_url": "... / null",
    "model": "Banana 2 / 即梦图片",
    "platform": "小红书 / instagram / youtube",
    "spec": "3:4 / 1:1 / 4:5 / 16:9",
    "replica_mode": "style_only / subject_swap / template_match",
    "text_rendered": true,
    "quality_tier": "ok / degraded"
  }
}
```

> ⚠️ 每个 Artifact 的 `status` 只有从 `draft` 变 `verified` 后，Agent 才能进下一步。不满意修改后重新输出 `draft`，再次等确认。

---

## 已确认决策

| 决策 | 方案 |
|:---|:---|
| 参考封面 | 必须由用户提供 |
| 出图工具 | Banana 2（主力）/ 即梦图片（降级），失败互切 |
| 平台规格 | 小红书 3:4、Instagram 1:1 或 4:5、YouTube 16:9 |
| 文字 | 主力 AI 直接嵌字，糊了降级为留白版 + 文字位置标注 |
| 确认节点 | `plan` 复刻方案 + `cover_image` 效果图，两处都要确认 |

## 做不了什么（Skill 边界）

- 做不了**直接盗图**：复刻的是「视觉公式」，参考封面里的原始文字、人脸、品牌 logo、水印都不会被原样保留。引导用户做的是「同风格」而非「假冒原作者」。
- 做不了**精确字体匹配**：只能风格近似（黑体力量感 / 衬线高级感 / 手写感），不保证字体一字不差。
- 做不了**三平台规格之外的自定义尺寸**（如横版 banner、长图文、多图轮播）。
- 做不了**多张系列封面的批量统一**：本 Skill 一次产出一张；系列封面需多次运行并手动对齐风格。
- 没有参考封面 → 做不了（必须输入）。

## 用户感知 vs Agent 内部

| 用户能看到 | 用户看不到 |
|:---|:---|
| 复刻方案卡、封面效果图 | 封面拆解的分析逻辑 |
| 确认节点（OK / 修改） | 出图 prompt 的构建细节 |
| 最终封面图 | 复刻模式判断、模型降级 |

内部逻辑越复杂没关系，用户看到的要简单：给参考图 → 看方案卡 → 看封面 → 确认。
