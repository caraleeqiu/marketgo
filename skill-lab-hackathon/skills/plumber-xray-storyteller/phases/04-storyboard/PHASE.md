# Phase 04: 分镜生成（3 批次）

## Goal

产出 `storyboard`——固定 5 镜头 SRT-anchored 切分 + prep（X-ray 关键帧 /
衰变帧 / remotion 图层）+ 视频生成 + 后处理，每镜头回填 compose-ready
`video_url`。3 批次之间用户 gate 卡同步点。

## Required Inputs

- verified `voiceover`（`voiceover_url` / `srt_url` / `T_voice`）
- verified `diagnosis_plan`（scene_type / problem_type / problem_point /
  internal_state / decay_outcome / decay_visibility / engine / signature）
- `ARTIFACT_CONTRACT_PATH`

## Required Slot / Schema Loads

- `schemas/storyboard.schema.json`
- `templates/storyboard.minimum.json`

## 批次 A · 切 5 镜头 → Gate 1

镜头结构固定（`annotate` / `xray` / `decay` / `repair` / `signature`）。
按 `voiceover.srt_url` word-level 时间戳把 5 个 beat 映射到 5 个镜头时间
区间：Beat N 首词 SRT `start` = Shot N `start_time`（**直接读，不累加**）；
`duration` = 下一镜 start − 本镜 start（末镜 = T_voice − start）。

invariant：`start_time[0]===0` / `start_time[4]+duration[4] ≈ T_voice
±0.05s` / 严格递增 / 单镜头 duration ≤ engine i2v 上限（可灵 3.0 基准，
超了批次 C 用 ffmpeg 慢放 / 定格补足）。

**Gate 1**：MD 表格 preview 5 镜头切分结构，师傅确认。

## 批次 B · prep → Gate 2

1. **X-ray 关键帧（inline mandatory 子门）**：load `image-generation` 用
   `gpt-image-2`（banana-2 fallback）。输入 source_photo_url + scene_type
   + problem_type + internal_state + problem_point；保留原照片机位 / 构图,
   按「scene_type 决定剖什么表面 + problem_type/internal_state 决定露出
   什么」两轴组合，**信息图风格**。**两道判官**：agent 自检（构图配准 /
   剖对 problem_point / 内部对齐 internal_state / 风格合规）→ 不过自己
   重生成；师傅确认（连得上现实 / 管路合理 / 严重度不夸大）。**未拿到
   师傅 OK 不往下。**
2. **衰变帧 / 对比静帧**：Shot 3 是 Shot 2 关键帧的「时间续集」。可选先
   load `external-research` / `browser-use` / `stock-media` 搜【实际效果
   真照片】做视觉参考（不进片）。`decay_visibility: high` → `gpt-image-2`
   基于 X-ray 关键帧编辑出 3 张渐进衰变图；`low` → 对比静帧 / remotion
   数据动画。
3. **remotion 图层 spec**：Shot 1 标注 overlay / Shot 3 时间轴标签 /
   Shot 4 修复图解 / Shot 5 署名卡（3 档，见 `docs/conventions.md`）。
   所有叠层按 `voiceover.srt_url` 的 **word-level 时间戳定时**（镜头内
   音画对齐）；字幕固定底部、叠层避开底部安全区。
4. **写 video prompt**：写入各镜头 `text`；末尾统一 append「9:16 竖版，
   动画信息图 / motion-graphics 风格，明确区别于真实拍摄」。

**Gate 2**：师傅整体审 prompts + 衰变帧 + remotion spec。

## 批次 C · 生成 + 后处理 → Gate 3

每镜头 生成 → 后处理 → patch storyboard：

| Shot | 生成 | 后处理 |
|---|---|---|
| 1 annotate | `video-generation` i2v（真照片）| ffmpeg trim + 叠 annotation_overlay + mux voiceover slice |
| 2 xray | L2 remotion 扫描转场 + L3 remotion 动效（i2v 可选微动）| ffmpeg trim + mux voiceover slice |
| 3 decay | remotion 衰变过渡 + 时间轴标签（i2v 可选微动）| ffmpeg trim + mux voiceover slice |
| 4 repair | `video-generation` i2v（真照片）| ffmpeg trim + 叠 repair_overlay + mux voiceover slice |
| 5 signature | `remotion` 渲染署名卡 | ffmpeg trim + mux voiceover slice / BGM-only |

**4 个转场（全归 remotion）**：1→2 X 光扫描擦除 · 2→3 无缝时间快进 ·
3→4 反向扫描 / 溶解 · 4→5 干净淡出。voiceover slice 用
`-ss <start_time> -t <duration>` 现 seek，**不预切上传**。

**视频生成失败 fallback**：重试 → 换引擎（可灵 → Veo → Seedance）→
降级到关键帧定格 + remotion 动效，标该镜头 degraded；**不重写整 storyboard**。

**Gate 3**：师傅确认 storyboard 终版。师傅 OK → **本 Phase 完成**，立即
加载 `phases/05-compose/PHASE.md`，**不回批次 A/B/C 重做**；师傅要改 →
按 `docs/conventions.md` §4 重入矩阵在受影响范围内局部重入。

> **防死循环（红线）**：师傅在 Gate 1/2/3 确认通过后，**绝不**回本 Phase
> 已完成的批次重跑。只有师傅明确选「改 / 重做」才按重入矩阵局部循环。

## Current Pi CLI Patterns

```bash
dl generate-image --model=gpt-image-2 ...     # X-ray 关键帧 / 衰变帧
dl generate-video ...                          # Shot 1/4 i2v
dl remotion ...                                # 转场 / 动效 / 标注 / 署名卡
dl ffmpeg ...                                  # trim / overlay / mux
cat <<'EOF' | dl artifact write --slot=storyboard --content-type=application/json --content-file=- --contract='<ARTIFACT_CONTRACT_PATH>'
<serialized storyboard JSON>
EOF
dl artifact finalize --slot=storyboard --mode=verify --contract='<ARTIFACT_CONTRACT_PATH>'
```

## Output Slot

- `storyboard`（draft → verified）

## Next Phase Entry

    phases/05-compose/PHASE.md
