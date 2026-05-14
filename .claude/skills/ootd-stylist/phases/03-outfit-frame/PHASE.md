# Phase 03: 穿搭首帧图

## Goal

把选定的那套穿搭穿到主体身上，产出一张 9:16 全身走秀站姿首帧图。这是 Phase 04 走秀视频的输入锚点 —— 视频里主体长什么样、穿什么，全靠这张图定。

## Required Inputs

- 已 verified 的 `outfit_plan`，以及用户选定的那套
- Phase 01 的主体照片
- `ARTIFACT_CONTRACT_PATH`

## Required Slot / Schema Loads

用内置 read 工具从本 skill 根目录读取：

- `schemas/outfit_frame.schema.json`
- `templates/outfit_frame.minimum.json`

读上游 artifact：

```bash
dl artifact read --slot=outfit_plan
```

## Required Companion Resources

- `references/frame-and-video.md` —— 首帧图出图方式（三类主体）与 prompt 骨架

显式用内置 read 工具加载该方法论。

## Methodology

1. 用 GPT 图像生成出图；把用户主体照片作为参考图传入，强约束长相 / 体型 / 角色识别特征一致，只替换服装。
2. 按主体类型走对应出图方式（真人 / 卡通 / 物体），见 `references/frame-and-video.md`。
3. 出图失败 → 降级 Banana 2；仍失败 → `outfit_frame` 停在 draft，把失败原因写进领域字段。
4. 这一步需要确认的信息：用户对首帧图是否满意（不满意改 prompt 重跑）。

## Current Pi CLI Patterns

```bash
cat <<'EOF' | dl artifact write --slot=outfit_frame --content-type=application/json --contract='<ARTIFACT_CONTRACT_PATH>' --content-file=-
<serialized outfit_frame JSON>
EOF
dl artifact finalize --slot=outfit_frame --mode=verify \
  --contract='<ARTIFACT_CONTRACT_PATH>'
```

## Output Slot

- `outfit_frame`

## Next Phase Entry

After success, load:

    phases/04-runway-video/PHASE.md

using the built-in read tool from the same skill root.
