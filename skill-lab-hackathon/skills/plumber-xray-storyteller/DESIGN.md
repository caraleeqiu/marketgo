# Plumber's X-Ray Storyteller — Skill 设计文档

> 面向 Skill Hackathon · 对照《Skill Hackathon Guide — Trending Dance》格式撰写
>
> **目标**：跑通一个能用的 Skill。本文档以「水管师傅的 X 光讲解视频」为案例，
> 核心交付是一条 9:16 竖版诊断科普短视频。

---

# 第一部分：概念落地

把 8 个核心概念逐个套到本 Skill 上，确认设计没有漏洞。

## ① Artifact（产出物）

本 Skill 有 3 个 Artifact，依次推进，每个都要 `draft → verified` 才能往下走：

```
Step 1 产出 → diagnosis_plan       [draft] → 师傅确认诊断准确 → [verified] → 进入 Step 2
Step 2 产出 → xray_keyframe        [draft] → 师傅确认 X 光图对 → [verified] → 进入 Step 3
Step 3 产出 → xray_storyteller_video → 最终交付物
```

不满意就回到对应 Step 修改重来（循环），不是分叉。

**Artifact 也决定下一步怎么走**——Agent 读 `diagnosis_plan` 的内容决定后续路径：

```
diagnosis_plan 里问题类型 = 漏水    → Step 2 剖开墙体画水迹渗入
diagnosis_plan 里问题类型 = 堵塞    → Step 2 剖开管壁画内壁堆积
diagnosis_plan 里衰变可视性 = 高    → Step 3 Shot 3 用渐进衰变动画
diagnosis_plan 里衰变可视性 = 低    → Step 3 Shot 3 改用正常 vs 异常对比静帧
diagnosis_plan 里声线方案 = 克隆    → Step 3 走 create-voice + tts
diagnosis_plan 里声线方案 = 纯字幕  → Step 3 跳过旁白生成
```

## ② Slot（Artifact 的骨架）

每个 Artifact 的字段结构（详细 JSON 见第二部分）：

- **diagnosis_plan 的 Slot**：问题类型、受影响部件、墙内/管内现状、衰变后果、
  衰变可视性、旁白脚本、目标时长、声线方案、署名信息、视频引擎
- **xray_keyframe 的 Slot**：图片 URL、生图模型、规格、源照片 URL、剖视画法
- **xray_storyteller_video 的 Slot**：视频 URL、引擎、时长、规格、镜头清单、
  所用声线、质量档位

Agent 按 Slot 填内容，师傅按 Slot 确认。

## ③ 主干和变量

- **主干**（每次都走，不会变）：确认诊断 → 生成 X 光关键帧 → 出片
- **变量**：
  - **内容变量（填空题）**：什么问题 / 哪个部件 / 墙内管内在发生什么 / 衰变后果
  - **结构变量（流程分叉）**：
    1. 问题类型 → 决定 X 光与衰变动画的 prompt 走向
    2. 有无声线样本 → 决定旁白生成方式（克隆 / 通用 TTS / 无）
    3. 衰变是否可视 → 决定 Shot 3 用动画还是对比静帧
    4. 有无署名信息 → 决定 Shot 5 个性化卡还是通用兑底卡

> ⚠️ 流程分叉由 Agent 后台自动判断，不直接问师傅「你想走哪条路」。
>
> **关键洞察**：不管多少条分叉，最终都汇入同一个 `diagnosis_plan` Artifact，
> 把混乱的输入（不同照片、不同问题、有没有声线样本）收束成统一的生产指令。

分叉发生在两个地方：

1. **输入层** — 师傅给了什么（照片 + 描述 + 声线样本？+ 署名信息？）→ 汇入 diagnosis_plan
2. **Artifact 层** — diagnosis_plan 里确认了什么 → 决定 Step 2 / Step 3 怎么走

## ④ 确认节点

Agent 在 3 个关键步骤暂停等师傅确认。位置围绕本 Skill 的核心卖点和信任设计：

| 确认节点 | 为什么停在这里 |
|---|---|
| Step 1 后（诊断卡） | **最关键**。诊断错 = 整条视频错 + 摧毁师傅在客户面前的信任。必须先确认诊断与脚本准确。 |
| Step 2 后（X 光关键帧） | X 光剖视是核心卖点。要确认「这看着就是我家墙里那根管子」，且能和真照片连上。 |
| Step 3 后（成片） | 确认最终交付物。不满意 → 回对应 Step 修改。 |

## ⑤ 模型和降级

每个关键模型都有备选，主力失败自动切备选：

| 用途 | 主力 | 降级链 |
|---|---|---|
| 视频生成 | Veo 3.1（原生音频 + 概念动画强） | Kling 3.0 → Seedance |
| X 光风格化生图 | banana-2（Imagen4 4K） | banana / gpt-image-2 |
| 衰变帧组生图 | gpt-image-2（多图编辑一致性最强） | banana-2 |
| 旁白 | create-voice 克隆师傅声线 + tts | minimax-tts 通用 → 纯字幕无旁白 |

> ⚠️ 整条链路围绕「短镜头 i2v + ffmpeg 拼接」的能力边界设计。每个生成片段
> 控制在 5–8s，5 个镜头拼起来 ≈ 45–75s。换引擎 = 单镜头时长上限与 prompt 写法
> 可能要重调。
>
> 视频引擎全部失败 → 以 `degraded` 状态结束，保留 X 光关键帧与已生成的镜头素材。

## ⑥ Skill 的边界（做不了什么）

| 做不了什么 | 原因 |
|---|---|
| 没有现场照片 | 真照片是信任锚点，没有照片整个 Skill 不成立 |
| 没有一句话问题描述 | 单靠照片 VLM 容易误判，描述是诊断的必要辅助 |
| 超过 ~75s 的视频 | 围绕短镜头拼接的能力边界设计 |
| 安全攸关的具体维修操作指令 | 只展示「问题是什么」和「大致修复概念」，实际维修建议归师傅；避免误导用户自行操作出事 |
| 水管以外的工种（HVAC / 电工 / 屋顶） | v1 仅水管，骨架可复用，后续版本扩展 |
| 真人实拍 talking-head 镜头 | AI 不扮演师傅本人——这是信任设计的底线 |

## ⑦ 用户感知 vs Agent 内部

| 师傅看到的（简单） | Agent 内部做的（复杂） |
|---|---|
| 3 步：确认诊断 → 看 X 光图 → 看成片 | Step 3 内部编排 5 个镜头 + 旁白克隆 + 混音 + 拼接 |
| 3 张卡片要确认 | 4 条结构分叉自动判断 + 多模型降级链 |

内部逻辑越复杂没关系，师傅看到的要简单。

## ⑧ 音画同出

短视频默认音画同出。Veo 3.1 原生带音频；BGM 走 `search-audio` 取库内素材，
`ffmpeg` 按 EBU R128 混音。旁白存在时对 BGM 做 ducking（侧链压缩），让人声清晰。

## 用一段话把概念串起来

**输入分叉**：不管师傅给的是漏水照、堵塞照还是腐蚀照，给没给声线样本、给没给
署名信息——所有路径最终都汇入 `diagnosis_plan`，把混乱输入收束成统一生产指令。

**主干 + 确认循环**：三个 Artifact 依次推进（diagnosis_plan → xray_keyframe →
xray_storyteller_video），每步停下等师傅确认。整条链路围绕「真照片做锚点 +
AI 只画相机拍不到的东西」的信任设计，以及「短镜头 i2v + ffmpeg 拼接」的能力边界。

```
                      ┌─ 漏水照 ─┐
   输入层分叉  师傅素材 ├─ 堵塞照 ─┤
                      ├─ 腐蚀照 ─┤
                      └─ 声线样本?├──┐
                       署名信息? ─┘  │
                                     ▼
                            ┌──────────────────┐
                            │  diagnosis_plan  │ ◄── 确认节点 1（最关键）
                            └────────┬─────────┘
                       Artifact 层分叉│（问题类型/衰变可视性/声线/署名）
                                     ▼
                            ┌──────────────────┐
                            │   xray_keyframe  │ ◄── 确认节点 2（核心卖点）
                            └────────┬─────────┘
                                     ▼
                            ┌──────────────────┐
                            │ 5 镜头编排出片    │
                            │ xray_storyteller │ ◄── 确认节点 3（最终交付）
                            │     _video       │
                            └──────────────────┘
```

---

# 第二部分：SOP

> 核心交付：一条 9:16 竖版「诊断科普」短视频 · 45–75s · 蓝领师傅可直接发社媒
>
> 流程：确认诊断 → 生成 X-ray 关键帧 → 出片（5 镜头编排）

## 场景

蓝领师傅（v1 聚焦水管工）在工地拍下一张问题照片——漏水的管接头、堵塞的下水道、
老化腐蚀的阀门。他想做一条短视频，给客户讲清楚两件事：

1. **墙里 / 管道里到底发生了什么**（客户肉眼看不到的部分）
2. **如果不修，会变成什么样**（后果可视化）

用途：取得客户信任、说服对方花钱修、或发社媒为自己引流。

**信任设计原则**：AI 不扮演师傅本人。真照片是信任锚点（Shot 1 / Shot 4），
AI 只负责渲染相机拍不到的东西（墙体内部、管道剖面、时间衰变）。旁白用师傅
本人克隆声线，观众听到的是真人。

## 必须输入

| 输入 | 没有怎么办 |
|---|---|
| 现场问题照片 | 必须让用户提供，不能跳过（信任锚点，没有照片整个 skill 不成立） |
| 一句话问题描述 | 必须让用户提供（辅助 VLM 诊断，避免单靠照片误判） |

## 可选输入

| 输入 | 没有的默认处理 |
|---|---|
| 师傅声线音频样本 | 降级为 minimax-tts 通用声线；仍不要 → 纯字幕无旁白 |
| 师傅署名信息（名字 / 电话 / 服务区） | Shot 5 用通用「联系你的本地水管工」CTA 兑底卡 |
| 问题类型（漏水 / 堵塞 / 腐蚀 / 水压） | VLM 从照片 + 描述推断，写入 diagnosis_plan 待用户确认 |
| 目标时长（45 / 60 / 75s） | 默认 60s |

## 变量梳理

| 类型 | 具体内容 |
|---|---|
| 内容变量（填空题） | 什么问题 / 哪个部件 / 墙里管内在发生什么 / 衰变后果长什么样 |
| 结构变量（流程分叉） | ① 问题类型 → 决定 X-ray 与 decay 动画的 prompt 走向 ② 有无声线样本 → 决定旁白生成方式 ③ 衰变是否可视 → 决定 Shot 3 用动画还是对比静帧 ④ 有无署名信息 → 决定 Shot 5 个性化卡还是通用兑底卡 |

> ⚠️ 流程分叉由 Agent 后台自动判断，不直接问用户「你想走哪条路」。
> 所有分叉最终都汇入同一个 `diagnosis_plan` Artifact。

## Step 1 · 诊断确认

**目的**：诊断是整条链路的源头。诊断错 = X-ray 画错 = 整条视频错，而且会
直接摧毁师傅在客户面前的信任。这是本 Skill 最关键的确认节点，必须停下来等
用户（师傅）确认诊断准确。

**输入来源**：用户提供的现场照片 + 一句话问题描述（+ 问题类型，如有）

**做什么**：Agent 用原生 vision 读照片，结合描述做诊断，输出一张
**诊断确认卡**：

```
问题类型：     [漏水 / 堵塞 / 腐蚀 / 水压 ...]
受影响部件：   [如：墙内 PEX 管接头]
墙内 / 管内现状： [X-ray 镜头要画的内容，1-2 句]
衰变后果：     [decay 镜头要画的内容] · 衰变可视性：[高 / 低]
旁白脚本：     [8-12 句口语短句，标注预计总时长 ≤ 目标时长]
目标时长：     [默认 60s]
声线方案：     [克隆师傅声线 / minimax-tts 通用 / 纯字幕]
署名信息：     [有 · {名字/电话/服务区} / 无 → 通用兑底]
视频引擎：     [Veo 3.1，失败降级 Kling 3.0 → Seedance]
```

> ⚠️ 等用户确认诊断与脚本准确后，再进入 Step 2。

**产出物**：`diagnosis_plan` Artifact（draft → verified）

## Step 2 · X-ray 关键帧

**目的**：X-ray 剖视是本 Skill 的核心卖点。这张关键帧决定观众信不信
「这就是我家墙里的那根管子」。它既是 Shot 2 X-ray 动画的输入锚点，也决定了
整条视频的视觉可信度。**本步不可跳过。**

**输入来源**：Step 1 的 `diagnosis_plan`（决定画什么）+ 用户原始照片
（决定机位构图，保证与真照片连续）

**做什么**：用 `image-generation`（banana-2 / Imagen4 4K）把真照片风格化成
X-ray 剖视关键帧——保留原照片的机位与构图，「剖开」墙体 / 管壁，露出
`diagnosis_plan` 里描述的内部现状。

**问题类型决定画法**：

| diagnosis_plan 问题类型 | X-ray 关键帧怎么画 |
|---|---|
| 漏水 | 剖开墙体，显示水迹渗入龙骨 / 保温层 |
| 堵塞 | 剖开管壁，显示内壁堆积物 / 异物卡点 |
| 腐蚀 | 剖开管段，显示金属锈蚀 / 管壁变薄 |
| 水压 | 剖视管路，显示节点处水流受阻示意 |

> ⚠️ 等用户确认 X-ray 看着对、且与原照片能连上后，再进入 Step 3。

**产出物**：`xray_keyframe` Artifact（draft → verified）

## Step 3 · 出片（5 镜头编排）

**目的**：核心交付物。前两步确认的诊断、脚本、X-ray 关键帧，在这一步全部
转化为成片。用户感知是「出片」一步，Agent 内部编排 5 个镜头。

**输入来源**：Step 2 的 `xray_keyframe` + 用户原始照片 + `diagnosis_plan`

**内部编排**：

| 镜头 | 内容 | 用到的原子 skill |
|---|---|---|
| Shot 1 | 原照片 zoom-in 动效 + 红圈/标签标注「问题在这」 | video-generation (i2v) + remotion |
| Shot 2 | X-ray 关键帧驱动的剖视动画——展示墙内/管内现状 | video-generation (i2v) |
| Shot 3 | 衰变时间轴：3 月 → 6 月 → 1 年「不修会怎样」 | image-generation (gpt-image-2 出 3 张渐进衰变图) → i2v + remotion 时间轴标签 |
| Shot 4 | 切回原照片 + 正确修复做法图解叠加 | remotion |
| Shot 5 | 师傅署名卡 / 通用 CTA 兑底卡 | remotion |

**衰变可视性分叉**（Shot 3）：`diagnosis_plan` 标记衰变可视性为「高」→ 用
渐进衰变动画；标记为「低」（如低水压）→ 改用「正常 vs 异常」对比静帧 +
数据标注，不强行生成无说服力的动画。

**旁白**：声线方案为「克隆」→ `create-voice` 克隆师傅声线 → `tts` 生成旁白；
无样本 → 降级 minimax-tts 通用声线；仍不要 → 纯字幕无旁白。

**音频**：`search-audio` 取 BGM（+ 少量 SFX）→ `ffmpeg` 按 EBU R128 混音，
旁白存在时对 BGM 做 ducking。（无对白时不使用 add-audio-cues。）

**合成**：`ffmpeg` concat 5 个镜头 + 转场，烧入 remotion 图层与字幕，
输出 9:16 成片。

**降级**：视频引擎 Veo 3.1 失败 → Kling 3.0 → Seedance 互切。仍全部失败
→ 以 degraded 状态结束，保留 X-ray 关键帧与已生成的镜头素材。

> ⚠️ 等用户确认成片满意。不满意 → 回到对应 Step 修改后重新输出 draft。

**产出物**：`xray_storyteller_video` Artifact（pending → done → verified / degraded）

## Artifact 定义

### diagnosis_plan（诊断思路）

```json
{
  "slot": "diagnosis_plan",
  "status": "draft / verified",
  "content": {
    "problem_type": "leak / clog / corrosion / pressure",
    "affected_component": "墙内 PEX 管接头",
    "internal_state": "水正沿龙骨渗入保温层",
    "decay_outcome": "6 个月后龙骨霉变、墙面塌陷",
    "decay_visibility": "high / low",
    "narration_script": ["短句1", "短句2", "..."],
    "narration_duration_s": 58,
    "target_duration_s": 60,
    "voice_plan": "clone / minimax_tts / captions_only",
    "signature": {
      "has_branding": true,
      "name": "...", "phone": "...", "service_area": "..."
    },
    "engine": "Veo 3.1"
  }
}
```

### xray_keyframe（X-ray 剖视关键帧）

```json
{
  "slot": "xray_keyframe",
  "status": "draft / verified",
  "content": {
    "image_url": "...",
    "model": "banana-2",
    "spec": "9:16",
    "source_photo_url": "...",
    "cutaway_method": "wall_section / pipe_wall / pipe_segment / pipe_path"
  }
}
```

### xray_storyteller_video（成片 · 核心交付）

```json
{
  "slot": "xray_storyteller_video",
  "status": "pending / done / verified / degraded",
  "content": {
    "video_url": "... / null",
    "engine": "Veo 3.1 / Kling 3.0 / Seedance",
    "duration": "60s",
    "spec": "9:16",
    "shots": ["annotate", "xray", "decay", "repair", "signature"],
    "voice_used": "clone / minimax_tts / captions_only",
    "quality_tier": "ok / degraded"
  }
}
```

> ⚠️ 每个 Artifact 的 status 只有从 draft 变成 verified 后，Agent 才能进入
> 下一步。不满意修改后重新输出 draft，再次等待确认。

## 已确认决策

| 决策 | 方案 |
|---|---|
| 现场照片 | 必须由用户提供（信任锚点） |
| 问题描述 | 必须由用户提供（辅助诊断） |
| 生图工具 | banana-2（X-ray 风格化）+ gpt-image-2（衰变帧组，多图编辑一致性最强） |
| 视频引擎 | Veo 3.1 主力，失败降级 Kling 3.0 → Seedance |
| 旁白 | 克隆师傅声线（create-voice + tts），降级 minimax-tts → 纯字幕 |
| 署名卡 | 可选输入，无品牌信息时通用 CTA 兑底 |
| 后期 | remotion 做标注/字幕/时间轴/署名卡；ffmpeg concat + 混音 + 成片 |
| 做不了什么 | 超过 ~75s 的视频 / 没有现场照片 / 没有问题描述 / 安全攸关的具体维修操作指令 / v1 仅水管，HVAC·电工·屋顶后续扩展 / 真人实拍 talking-head |
