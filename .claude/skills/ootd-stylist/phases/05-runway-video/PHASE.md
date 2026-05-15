# Phase 05: 走秀视频（可选）

## Goal

把用户选定进入视频的那些套穿搭（1-3 套）做成一条 9:16 竖版走秀 OOTD 视频。选 1 套 = 单段走秀；选 2-3 套 = **换装 montage**（一套接一套穿，每套一段 + 特效转场 + 一条连续 BGM 铺满）。这是**可选**终端交付物 —— 仅当用户在 Phase 02 确认门选择生成视频时才进入本阶段。

## Required Inputs

- 已 verified 的 `outfit_frame`，取其中 `selected_for_video: true` 对应那些套的首帧图 card
- 已 verified 的 `outfit_plan`，读 `selected_for_video` 决策
- 视频风格（`video_style`，Phase 02 确认门已确认；未指定则由场景 + `style_profile` 推断）
- 视频时长（可选；默认每套一段 ≤15s，多套 montage 拼接到最长 30s）
- `ARTIFACT_CONTRACT_PATH`

## Required Slot / Schema Loads

用内置 read 工具从本 skill 根目录读取：

- `schemas/ootd_video.schema.json`
- `templates/ootd_video.minimum.json`

读上游 artifact：

```bash
dl artifact read --slot=outfit_frame
dl artifact read --slot=outfit_plan
```

## Required Companion Resources

- `references/frame-and-video.md` —— 走秀视频引擎规格、视频风格调色板、换装 montage 结构、时长分叉、降级链

显式用内置 read 工具加载该方法论。

## Methodology

1. 取 `selected_for_video: true` 的套数 N：
   - **N = 1** → 单段走秀：主体正面走向镜头 + 转身展示，以该套首帧图为锚点。
   - **N = 2-3** → 换装 montage：每套一个 segment（走秀 / 定格展示），按走秀节奏在 segment 接缝处加**特效转场**（卡点切换 / 旋转 / 定格 / 滑动），全片铺一条**连续 BGM**。每段以对应套的 `outfit_frame` card 为锚点。
2. **视频风格**：按 Phase 02 确认的 `video_style` 决定背景、打光、调色、镜头语言 —— 见 `references/frame-and-video.md` 的视频风格调色板；走秀动作本身不变。
3. 引擎 Seedance 2.0：单段直出（≤15s）；换装 montage 走多段拼接路径（每套一段，最长 30s）。
4. 把 `bgm` 与 `transition_style` 记进 `ootd_video`。
5. 降级：拼接失败 → 退回单段（取首选那一套）；单段仍失败 → `ootd_video` 以 `degraded` 收尾，保留 `outfit_plan`、`product_picks` 与 `outfit_frame` 作为可交付下限。

## Current Pi CLI Patterns

```bash
cat <<'EOF' | dl artifact write --slot=ootd_video --content-type=application/json --contract='<ARTIFACT_CONTRACT_PATH>' --content-file=-
<serialized ootd_video JSON>
EOF
dl artifact finalize --slot=ootd_video --mode=verify \
  --contract='<ARTIFACT_CONTRACT_PATH>'
```

## 确认门（Confirmation Gate）

`ootd_video` 成片后，确认用户是否满意；不满意直接重跑（成片不设额外硬节点，循环重跑即可）。

## Output Slot

- `ootd_video`（可选终端交付物，verified / degraded）

## Completion

required 的四个 slot（`style_profile` / `outfit_plan` / `product_picks` / `outfit_frame`）verified 后工作流即完成；`ootd_video` 作为可选交付物，产出时一并 verified。交付或 publish 策略归外层编排，不在本 skill 内。
