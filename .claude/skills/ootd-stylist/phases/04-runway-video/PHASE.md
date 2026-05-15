# Phase 04: 走秀视频（可选）

## Goal

把用户选定承载视频的那一套穿搭穿在主体身上「走起来」，按确认的视频风格产出一条 9:16 竖版走秀 OOTD 视频。这是**可选**终端交付物 —— 仅当用户在 Phase 02 确认门选择生成视频时才进入本阶段。

## Required Inputs

- 已 verified 的 `outfit_frame`，取其中 `selected_for_video: true` 对应那一套的首帧图 card
- 视频风格（`video_style`，Phase 02 确认门已确认；未指定则由场景 + `style_profile` 推断）
- 视频时长（可选；默认 ≤15s 单段，最长 30s 走拼接）
- `ARTIFACT_CONTRACT_PATH`

## Required Slot / Schema Loads

用内置 read 工具从本 skill 根目录读取：

- `schemas/ootd_video.schema.json`
- `templates/ootd_video.minimum.json`

读上游 artifact：

```bash
dl artifact read --slot=outfit_frame
```

## Required Companion Resources

- `references/frame-and-video.md` —— 走秀视频引擎规格、视频风格调色板、时长分叉、降级链

显式用内置 read 工具加载该方法论。

## Methodology

1. 动作固定为走秀（runway walk）：主体正面走向镜头 + 转身展示，以选定的 `outfit_frame` 那张图为锚点。
2. **视频风格**：按 Phase 02 确认的 `video_style`（时尚大片 / 街拍随性 / 居家温馨 / 复古胶片 / 小清新 / 赛博霓虹 …），决定背景、打光、调色、镜头语言 —— 见 `references/frame-and-video.md` 的视频风格调色板。
3. 引擎 Seedance 2.0，按视频时长分叉：≤15s 单段直出；15–30s 出多段按走秀节奏拼接。
4. 音画同出（短视频默认带 BGM / 脚步音效）。
5. 降级：拼接失败 → 退回 ≤15s 单段；单段仍失败 → `ootd_video` 以 `degraded` 收尾，保留 `outfit_plan` 与 `outfit_frame` 作为可交付下限。

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

required 的三个 slot（`style_profile` / `outfit_plan` / `outfit_frame`）verified 后工作流即完成；`ootd_video` 作为可选交付物，产出时一并 verified。交付或 publish 策略归外层编排，不在本 skill 内。
