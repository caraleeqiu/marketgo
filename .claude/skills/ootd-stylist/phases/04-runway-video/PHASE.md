# Phase 04: 走秀视频

## Goal

把选定穿搭穿在主体身上「走起来」，产出一条 9:16 竖版走秀 OOTD 视频。这是终端交付物。

## Required Inputs

- 已 verified 的 `outfit_frame`
- 视频时长（可选输入；默认 ≤15s 单段，最长 30s 走拼接）
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

- `references/frame-and-video.md` —— 走秀视频引擎规格、时长分叉、降级链

显式用内置 read 工具加载该方法论。

## Methodology

1. 动作固定为走秀（runway walk）：主体正面走向镜头 + 转身展示，以 `outfit_frame` 形象为锚点。
2. 引擎 Seedance 2.0，按视频时长分叉：≤15s 单段直出；15–30s 出多段按走秀节奏拼接。
3. 音画同出（短视频默认带 BGM / 脚步音效）。
4. 降级：拼接失败 → 退回 ≤15s 单段；单段仍失败 → `ootd_video` 以 `degraded` 收尾，保留 `outfit_plan` 与 `outfit_frame` 作为可交付下限。
5. 成片不设硬确认节点；不满意直接重跑。

## Current Pi CLI Patterns

```bash
cat <<'EOF' | dl artifact write --slot=ootd_video --content-type=application/json --contract='<ARTIFACT_CONTRACT_PATH>' --content-file=-
<serialized ootd_video JSON>
EOF
dl artifact finalize --slot=ootd_video --mode=verify \
  --contract='<ARTIFACT_CONTRACT_PATH>'
```

## Output Slot

- `ootd_video`（终端交付物）

## Completion

四个 slot 全部 verified 后，工作流完成。交付或 publish 策略归外层编排，不在本 skill 内。
