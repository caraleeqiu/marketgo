# Phase 02: 旁白脚本

## Goal

把 verified `diagnosis_plan` 转成一段**极短**的旁白脚本——按 5 镜头节拍
组织，每 beat 对应一个镜头，让 Phase 04 的 SRT 切分能干净映射。

> 旁白是视觉叙事的辅助，不是主角。最重的产出物是 X-ray 剖视动画。一条
> 60s 视频的旁白控制在 8–12 句口语短句。

## Required Inputs

- verified `diagnosis_plan`（§3.3 problem / §3.4 decay_outcome / §3.5
  voice_plan）
- `ARTIFACT_CONTRACT_PATH`

## Required Slot / Schema Loads

- `schemas/narration_script.schema.json`
- `templates/narration_script.minimum.json`

## Required Companion Resources

- `docs/conventions.md`（句长红线 / TTS 可念性 / 确认节点）

## 5 镜头节拍结构

| Beat | 对应镜头 | 讲什么 | 约束 |
|---|---|---|---|
| 1 | Shot 1 annotate | 一个具体事实 punch 出问题在哪 | 反套路 hook，不问候 |
| 2 | Shot 2 xray | `internal_state`（墙内 / 管内现状）| 只描述现状，不教修 |
| 3 | Shot 3 decay | `decay_outcome`（不修后果）| 讲后果，制造紧迫感 |
| 4 | Shot 4 repair | 修复**方向 / 概念**（非操作步骤）| **零维修操作指令**（红线）|
| 5 | Shot 5 signature | 短 CTA：找专业的看看 | 一句话收尾 |

每 beat 1–3 句。`captions_only` 时脚本仍写（作字幕文本），只是 Phase 03
不跑 TTS。

## 写作纪律（hard guidance）

- **反套路 hook**：Beat 1 第一句不用问候 / 问句 / generic claim，用具体
  事实 / 部件 / 现象直接 punch。
- **短句**：中文 ≤25 字 / 句常态、>40 字必拆；英文 ≤15 词 / 句常态、
  >25 词必拆；长短交替。
- **零维修操作指令**（红线）：Beat 4 只到「这个接头需要换新、重做密封」
  概念层，不到「关总阀、用管钳拆……」操作层。判据：外行看完不应觉得
  「我自己能修」。
- **TTS 可念性 spell-out**：管径分数 / 压力单位 / 缩写 / 温度一律 spell
  out（`1/2 inch` → `half inch`，`PSI` → `P S I`）。
- **声线 marker**：`voice_plan ≠ captions_only` 时嵌入暂停 `<#X#>` +
  情绪 parenthesized interjection；具体语法 Phase 03 load `tts` 时读。
- 每个「墙里发生了什么」的判断都要能追溯到 verified `diagnosis_plan`。

## 整体确认 gate（进 Phase 03 前）

自检（5 beat / Beat 4 零操作指令 / 句长红线 / spell-out / 8–12 句 /
marker 已嵌）全过后，把完整 5 beat 脚本呈师傅确认。**未拿到 OK 不进
Phase 03。**

## Current Pi CLI Patterns

```bash
cat <<'EOF' | dl artifact write --slot=narration_script --content-type=application/json --content-file=- --contract='<ARTIFACT_CONTRACT_PATH>'
<serialized narration_script JSON>
EOF
dl artifact finalize --slot=narration_script --mode=verify --contract='<ARTIFACT_CONTRACT_PATH>'
```

## Output Slot

- `narration_script`（draft → verified）

## Next Phase Entry

    phases/03-voiceover/PHASE.md
