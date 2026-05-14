# Phase 05: 合成出片

## Goal

把 `storyboard` 的 5 个 compose-ready 镜头拼成 `final`——normalize + 拼接
+ 可选层（字幕 / 音频）+ verify + promote。这是 terminal artifact。

## Required Inputs

- verified `storyboard`（每镜头 `video_url` 已 compose-ready）
- `voiceover`（`srt_url`）/ `diagnosis_plan`（继承元数据）
- `ARTIFACT_CONTRACT_PATH`

## Required Slot / Schema Loads

- `schemas/final.schema.json`
- `templates/final.minimum.json`

## Steps

1. **可选层拍板（mandatory 子门）**：合成前和师傅拍板——字幕烧录（A 烧 /
   B 不烧；`captions_only` 时强制烧）；BGM（C `search-audio` 库内搜 / D 不要）；
   SFX（E `search-audio` 搜剖视 / 衰变音效 / F 不要）。
2. **Normalize + 拼接 timeline**（必做）：5 镜头来自不同生成路径，concat
   前 normalize 到 `1080×1920 / 30fps / yuv420p / H.264`。用 `ffmpeg`
   Resize + Simple Concat；每镜头已含 voiceover slice，concat 后音轨 =
   完整旁白自动重组。
3. **字幕烧录**（可选 / captions_only 强制）：load `create-subtitles`，
   `srt_content` = `voiceover.srt_url` 内容（**不重跑 ASR**），
   `delivery=burned_video`，无衬线白文 + 半透明黑底。
4. **音频增强**（按 Step 1 拍板）：BGM load `search-audio` bgm 库 →
   ffmpeg EBU R128 混音 + 旁白存在时对 BGM ducking（BGM 0.85 / voiceover
   1.0）；SFX load `search-audio` sfx 库 → ffmpeg 对应镜头时间点 mux
   （0.4–0.7）。无对白时不用 `add-audio-cues`。
5. **Self-check**（mandatory）：总时长 ≈ T_voice ±0.5s / aspect_ratio
   9:16 / Shot 1·4 基于真照片未重绘 / 字幕语种一致 / 任何 fallback 走过 →
   `quality_tier=degraded` / 署名 verbatim 正确。

## promote gate（mandatory，终端）

先 `write` + `finalize --mode=verify`（不 promote），把 verified `final`
（成片 URL / 总时长 / 启用的可选层 / quality_tier）呈师傅。师傅 OK →
`finalize --mode=verify_and_promote`。skill 到此完成。

> 社交文案（标题 / caption / hashtag）可选，patch 进 `final.content[0].meta.social_copy`；
> 发布本身不在本 skill 范围。

## 音画同出降级档（§8 灾难兜底）

音画分开核心链路灾难性失败（多镜头全挂 / 合成崩 / SRT-anchored 结构出
不来）→ 降级到音画同出：真照片 + 浓缩 prompt 喂音画同出引擎直出简化
视频；**声线必须定义**（取 `diagnosis_plan` 已确认声线；模型不支持指定
声线则退回「单独配音 mux」，绝不随机声线）；标 `quality_tier=degraded`，
`meta.notes` 记原因，照常 ship。

## Current Pi CLI Patterns

```bash
dl ffmpeg ...                                  # normalize + concat + mix
dl render-caption ...                          # 字幕烧录（create-subtitles）
dl knowledge search --domain=bgm ...           # search-audio
cat <<'EOF' | dl artifact write --slot=final --content-type=application/json --content-file=- --contract='<ARTIFACT_CONTRACT_PATH>'
<serialized final JSON>
EOF
dl artifact finalize --slot=final --mode=verify --contract='<ARTIFACT_CONTRACT_PATH>'
# 师傅确认后：
dl artifact finalize --slot=final --mode=verify_and_promote --contract='<ARTIFACT_CONTRACT_PATH>'
```

## Output Slot

- `final`（draft → verified → promoted）— terminal

## Completion

`slot_promoted(final)` 达成即 skill 完成。发社媒 / 交付属外层编排。
