# Phase 03: 旁白配音

## Goal

按 `voice_plan` 把 `narration_script` 转成配音——整段一次性 TTS、ASR
吐 word-level SRT，师傅试听确认。**这条音频从此不可变，是下游 SRT-anchored
切分的主时间轴。**

> 为什么 voiceover 单独成 Phase 且先于 storyboard：克隆声线 / TTS 任何
> 环节崩了，回 Phase 02 改脚本路径干净，不让 Phase 04 视频生成的钱花在
> 错配音上。

## Phase 契约（输入 → 输出 → 锁定）

- **进入条件（输入）**：**verified** `narration_script` + `diagnosis_plan`
  的 `voice_plan` / `voice_sample_url` / `voice_id` + `ARTIFACT_CONTRACT_PATH`。
- **本 Phase 产出（输出）**：`voiceover` artifact（draft → verified），含
  `voiceover_url` / `srt_url` / `T_voice`。
- **锁定 + 出口**：执行步骤跑完（**含 Step 4 写 + Step 5 finalize
  `voiceover`**）+ 试听 gate 师傅「继续」→ 加载
  `phases/04-storyboard/PHASE.md`。**`voiceover` 没 finalize 成 verified，
  Phase 04 的进入条件不满足、进不去。**

## Required Inputs

- verified `narration_script`
- `diagnosis_plan.voice_plan` / `voice_sample_url` / `voice_id`
- `ARTIFACT_CONTRACT_PATH`

## Required Slot / Schema Loads

- `schemas/voiceover.schema.json`
- `templates/voiceover.minimum.json`

## 执行步骤

加载完本文档 + schema 后，按序执行：

1. **克隆声线**（仅 `voice_plan: clone`）：load `create-voice`，输入
   `voice_sample_url` 走 clone 路径 → `voice_id` + `voice_vendor`。样本
   质量差 → 提示重录或经师傅同意降级。
2. **整段 TTS**：load `tts`。`clone` → 用 Step 1 的 `voice_id`；
   `minimax_tts` → 用 `diagnosis_plan.voice_id`（§3.5 师傅试听选定）。
   `text` = `narration_script` 正文（verbatim 带 marker，不剥）。输出
   `voiceover_url`；`T_voice` 用 `ffprobe` 量出（不要拿 ASR 末段 cue.end 推）。
   **脚本冻结（红线）**：`narration_script` 是 Phase 02 已 verified 的
   冻结输入——任何重配（改语速 / 情绪 / model 档）都**只换 TTS 参数、
   verbatim 复用同一份脚本**，**绝不重新生成脚本**。要改脚本只能师傅
   在试听 gate 明确选「回 Phase 02」。
3. **ASR 吐 SRT**：load `audio-transcription`，`audio_url` = `voiceover_url`，
   `output_format=srt` → `srt_url`（下游 single source of truth）。
   cue 数为 0 → 重试 1 次，仍失败上报师傅。
4. **写 `voiceover` artifact**：按 `voiceover.schema.json` + minimum 模板
   `dl artifact write --slot=voiceover`——`content[0].text` = Overview +
   Audio 试听 + Subtitles 表的 markdown；`srt_url` / `voiceover_url` /
   `T_voice` / `voice_id` / `voice_plan` / `cue_count` 全部填齐。
5. **自检 + finalize**：自检（`voiceover_url` 到位（captions_only 除外）/
   `srt_url` 到位且 cue 数 >0 / `T_voice` ffprobe 量出且 ≤ target_duration
   + 5s 容差 / clone 时 voice_id 来自 Step 1）→ 全过 →
   `dl artifact finalize --slot=voiceover --mode=verify`，`voiceover` 进
   **verified**（Phase 04 的前置条件，少了这步 Phase 04 进不去）。
6. **试听 gate**（mandatory）→ 见下方「试听 gate」，把 verified
   `voiceover` 呈师傅。
7. 师傅在试听 gate 选「继续」→ **本 Phase 完成**，立即加载
   `phases/04-storyboard/PHASE.md`（Next Phase Entry），**不回 Steps 重跑**。

> `captions_only` 时：跳过 Step 1-2，`voiceover_url` 置 null，`T_voice`
> 按字数 × 语速估算，`srt_url` 由脚本 + 估算时长生成，直接进 Step 4。

## 试听 gate（mandatory，进 Phase 04 前）

把 verified `voiceover`（T_voice / 声线 / 试听链接 / 逐 cue 字幕表）呈
师傅，逐 cue 扫念错 / 术语差。师傅可选：

1) 继续 —— **本 Phase 完成**：立即加载 `phases/04-storyboard/PHASE.md`，
   **不回本 Phase 的 Steps 重跑配音**
2) 重配（改语速 / 情绪）—— 回 Step 3.2，**脚本不动、verbatim 复用**
3) 重克隆声线 —— 回 Step 3.1，**脚本不动**
4) 改某 cue 文本 —— patch `voiceover` 后重 verify 再呈
5) 改脚本 —— 回 Phase 02（targeted 编辑，不是从头重写）

**红线：选 2 / 3 绝不重生成 `narration_script`**——只换 TTS 参数 / 声线，
新配音念的还是原脚本那段词。只有师傅明确选 5 才改脚本。

> **防死循环（红线）**：师傅选 1 = 本 Phase 收尾，**立即跳 Next Phase
> Entry 加载 Phase 04**——绝不在师傅选 1 后还回 Steps 重跑配音。只有
> 师傅明确选 2–5 才在本 Phase 内循环。

## 配音失败 fallback 阶梯

重试 1 次 → 调 TTS 参数（语速 / 情绪 / model 档）→ 重克隆 / 换样本 →
降级 voice_plan（clone → minimax_tts → captions_only，标 degraded）→
退一步回 Phase 02 拆短脚本。

## Current Pi CLI Patterns

```bash
dl clone-voice --sample-url=<voice_sample_url>          # 仅 clone
dl generate-tts --voice-id=<voice_id> --text=<script>   # 整段 TTS
dl transcribe --audio-url=<voiceover_url> --output-format=srt
cat <<'EOF' | dl artifact write --slot=voiceover --content-type=application/json --content-file=- --contract='<ARTIFACT_CONTRACT_PATH>'
<serialized voiceover JSON>
EOF
dl artifact finalize --slot=voiceover --mode=verify --contract='<ARTIFACT_CONTRACT_PATH>'
```

## Output Slot

- `voiceover`（draft → verified）

## Next Phase Entry

    phases/04-storyboard/PHASE.md
