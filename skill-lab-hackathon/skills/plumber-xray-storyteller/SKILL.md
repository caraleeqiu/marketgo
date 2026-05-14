---
name: plumber-xray-storyteller
description: >-
  把蓝领师傅（v1 聚焦水管工）的一张工地问题照片，做成一条可直接发社媒的
  9:16 竖版「诊断科普」短视频（45–90s）。当师傅上传现场问题照片 + 一句话
  描述、想给客户讲清楚墙 / 管 / 地里看不见的问题与不修后果时加载。产出
  固定 5 镜头成片（标注 → X 光剖视 → 衰变推演 → 修复图解 → 师傅署名卡）的
  terminal artifact。师傅用中文或英文触发均可，skill 全程跟随师傅的语言。
  Do NOT use 用于：社媒发布、安全攸关的具体维修操作指令、真人实拍
  talking-head、水管以外工种（HVAC / 电工等）。
allowed-tools: Read Write Edit Bash
compatibility: "Pi composition skill；编排原子媒体 skill（media-download / search-voice / create-voice / tts / audio-transcription / external-research / browser-use / stock-media / image-generation / video-generation / remotion / ffmpeg / create-subtitles / search-audio）。运行时 reload 属外部。"
metadata:
  ilands:
    applicable-to: [creation]
    priority: 3.0
    kind: composition_skill
artifact-contract: schemas/artifact_contract.json
entry_skill_ref: "platform/plumber-xray-storyteller"
---

# Plumber's X-Ray Storyteller

把一张工地问题照片，变成师傅那句「我跟你讲，这墙里面……」的可发社媒视频。

## What This Skill Owns

- shared bootstrap（artifact 契约解析、首个 phase 入口加载）
- shared CLI discipline（`dl artifact` + `dl` 原子 skill 调用纪律）
- shared schema discipline（5 个 slot schema + minimum 模板）
- shared artifact 协议 discipline（用户可见 slot 渲染协议）
- artifact flow + phase 路由
- 核心理念与红线（workflow 路由层面的硬约束）

## What This Skill Does Not Own

- approval / checkpoint 密度策略
- publish policy（发社媒是 terminal artifact 完成后的下游 stage）
- budget / safety-cap governance
- 通用 runtime pause / resume、heartbeat、`__workflow_progress`

这些属 runtime policy 或 system prompt 配置，不进 skill 包。

## Overview

**输入**：师傅的现场问题照片（必须）+ 一句话问题描述（必须）+ 可选的
声线样本 / 署名信息。
**产出**：一条 9:16 竖版、45–90s 的诊断科普短视频（terminal artifact
`final`，promotable）。
**形态**：固定 5 镜头——`annotate`（真照片标注）→ `xray`（AI 信息图剖视
动画）→ `decay`（AI 衰变推演）→ `repair`（真照片修复图解）→ `signature`
（师傅署名卡）。
**中间 artifact**：`diagnosis_plan` → `narration_script` → `voiceover` →
`storyboard` → `final`，每个由师傅显式确认后才进下一 Phase。

**开场握手**：Phase 01 第一步先做开场握手——师傅触发可能只是一句模糊
的话（「我想做一条蓝领的知识视频」/「I want a blue-collar explainer
video」），skill 先说清能做 / 做不了什么、拿到「继续」确认，再告诉师傅
要给什么（照片 + 一句话描述 + 可选声线 / 署名）。详见
`phases/01-diagnosis-binding/PHASE.md` 开场握手段。

**语言无关**：skill 全程**跟随师傅的语言**（中 / 英）。本包 PHASE.md /
SOP 里的 prompt 模板、确认卡都是中文示例——实际呈给师傅时用师傅触发时
所用的语言；旁白脚本的句长红线中英各有标准（见 `docs/conventions.md`）。
路由层是语义匹配，中英触发都能命中本 description。

## 核心理念（地基，不可违反）

1. **真照片是信任锚点**——AI 不扮演师傅本人。真照片必须出现在 Shot 1 /
   Shot 4，AI 只渲染相机拍不到的东西。没有合格现场照片就没有视频。
2. **诊断先行**——X-ray / decay / 旁白全部从 `diagnosis_plan` 派生；
   诊断错 = 整片错 + 摧毁信任。
3. **师傅是事实源，agent 是可视化工**——诊断本身不联网；联网只为
   §3.4 起草衰变规律 / §6.2 找视觉参考，从不当结论，师傅确认才算数。
4. **旁白先于分镜**——`voiceover` 单独成 Phase 且先于 `storyboard`，
   不让视频生成的钱花在错配音上。
5. **不出安全攸关的维修操作指令**——只到「问题是什么 / 不修后果 /
   修复概念」，不到「你自己怎么动手修」。
6. **SRT-anchored 时间模型**——5 镜头按 voiceover 的 word-level SRT 切，
   存 `start_time` + `duration`，不存 end_time、不累加。
7. **动画信息图统一视觉语言**——AI 镜头 + remotion 叠层统一 flat 信息图
   风格；remotion 为主、i2v 为辅，能用代码做的就用代码做。
8. **口播驱动 → 音画分开**——主路径音画分开；音画同出仅 §3.5 师傅可选 +
   §8 灾难兜底，两种情况声线都必须定义。

## 红线（绝对不要）

- 旁白出具体维修操作步骤 · AI 镜头冒充真实 footage · 科普风格跑偏
  （恐怖 / 猎奇 / 科幻炫技 / 夸大严重度）· 把 Shot 1/4 做成 AI 重绘假照片
  · 出未经诊断确认的 claim · 没拿到师傅确认就推进下一 Phase。

## 修改重入（最小重入原则）

师傅在任何 gate 提修改，**不要从头重跑**。先判断改动的 **blast radius**
（沿 artifact 依赖链 `diagnosis_plan → narration_script → voiceover →
storyboard → final` + 字段级依赖），**只从最窄的受影响节点重入**，沿链
往下只重做受影响的部分。不在 blast radius 里的产物（已 verified
artifact / 已确认的 X-ray 关键帧 / 已生成的镜头 video_url）一律**复用**。

只有改 `diagnosis_plan` 的**核心视觉绑定**（problem_type / scene_type /
problem_point / internal_state / decay）才真的全片重 derive；其余一律
局部重入。完整重入矩阵见 `docs/conventions.md` §4。

## Required Bootstrap

进入任何 Phase 前：

1. 解析本 skill 根目录的 `schemas/artifact_contract.json`，把其绝对路径
   作为 `ARTIFACT_CONTRACT_PATH` 带下去。
2. 用内置 `read` 工具加载 `phases/01-diagnosis-binding/PHASE.md` 作为
   首个 phase 入口。
3. 每个 Phase 按 `PHASE.md` 的 "Required Slot / Schema Loads" 加载对应
   `schemas/<slot>.schema.json` + `templates/<slot>.minimum.json`。
4. 跨阶段约定参考 `docs/conventions.md`（格式约定 / Fallback 阶梯 /
   13 个师傅确认节点）。

## Artifact CLI Primer

本 skill 通过 `dl artifact ...` 读写 artifact 工作集。

```bash
cat <<'EOF' | dl artifact write --slot=<slot> --content-type=application/json --content-file=- --contract='<ARTIFACT_CONTRACT_PATH>'
<serialized-json>
EOF
dl artifact read --slot=<slot>
dl artifact finalize --slot=<slot> --mode=verify --contract='<ARTIFACT_CONTRACT_PATH>'
```

规则：

- `write` 首写 / 全量替换；`patch-json` 仅做增量结构更新（JSONPath-lite，
  `--operations` 不是 `--patch`，ops 仅 `set` / `merge` / `append` / `delete`，
  **不传 `--contract`**，patch 后该 slot 回到 draft，须再 finalize）。
- `--content` 永远是字符串。`write` / `finalize` 用同一个
  `ARTIFACT_CONTRACT_PATH`。
- 一个 slot `write` 成功后，下一个非 read 动作就是该 slot 的
  `finalize --mode=verify`。
- 终端 slot `final` 在 Phase 05 静态验证通过后用
  `finalize --mode=verify_and_promote` 提升。
- 语法不确定用 `dl artifact --help` / `dl artifact finalize --help`。

## Shared Schema Discipline

- 首次写某 slot 前，用内置 `read` 加载该 slot 的 `schemas/<slot>.schema.json`。
- 从 `templates/<slot>.minimum.json` 起手——minimum 模板是验证下限，不是
  丰富度上限。
- 字面修复 AJV 报错，不要发明替代字段形状。
- 跨字段语义即使 schema 没强制也要保持一致。

## Shared Artifact 协议 Discipline

5 个 slot 都是**用户可见** artifact，走渲染协议（wrapper + content_layout
+ content[] + detail）：

| slot | layout | component | is_segment |
|---|---|---|---|
| `diagnosis_plan` | single | markdown | false |
| `narration_script` | single | markdown | false |
| `voiceover` | single | markdown | false |
| `storyboard` | list（index_prefix `Shot`）| card（horizontal）| true → `detail.variant: media_player` |
| `final` | single | video | false |

- agent 写、用户应看见的长文走 `content.items.text`（如各镜头 video
  prompt、诊断卡正文），**不要藏进 additionalProperties**。
- 可见离散 meta（镜头类型 / 引擎 / 生成状态）走 `tags[]`。
- 纯下游 ID（`video_url` / `srt_url` / `provider_params` 等）走
  `content.items` 的 `additionalProperties: true`。
- wrapper 层 `additionalProperties: false`，严查 6 个 wrapper 字段。

## Artifact Flow

```text
diagnosis_plan  (Phase 01)
  -> narration_script  (Phase 02)
    -> voiceover  (Phase 03)
      -> storyboard  (Phase 04)
        -> final  (Phase 05, verified -> promoted)
```

## Phase Entry Map

| Phase | Entry file | Output slot |
|---|---|---|
| 01 | `phases/01-diagnosis-binding/PHASE.md` | `diagnosis_plan` |
| 02 | `phases/02-narration-script/PHASE.md` | `narration_script` |
| 03 | `phases/03-voiceover/PHASE.md` | `voiceover` |
| 04 | `phases/04-storyboard/PHASE.md` | `storyboard` |
| 05 | `phases/05-compose/PHASE.md` | `final` |

逐 Phase 按 handoff 链推进，不要把全部方法论堆在根文件。

## Completion Definition

工作流完成当全部 completion predicate 通过：

- `slot_verified(diagnosis_plan)`
- `slot_verified(narration_script)`
- `slot_verified(voiceover)`
- `slot_verified(storyboard)`
- `slot_promoted(final)`

skill 到此结束。发社媒 / 交付策略属外层编排。

## Failure and Partial Completion

共享 fallback 阶梯：`retry` → `alternate`（换引擎 / 参数）→ `degrade`
→ `partial_finalize` → `emit_failure_metadata`。

- per-shot 视频生成失败：换引擎 → 降级到关键帧定格 + remotion 动效；
  **不重写整 storyboard**。
- 克隆声线失败：降级 minimax_tts → captions_only，整片标 degraded。
- 音画分开核心链路灾难性失败：降级到音画同出（声线必须定义）。
- 全部 fallback 走过仍失败 → 整片标 `quality_tier="degraded"`，降级
  原因记 `final.content[0].meta.notes`，照常 ship。详见 `docs/conventions.md`。

Do not add runtime recovery or pause/resume instructions to this package.
