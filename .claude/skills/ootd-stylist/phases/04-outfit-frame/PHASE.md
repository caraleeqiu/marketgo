# Phase 04: 穿搭首帧图

## Goal

给用户在 Phase 02 确认门选定的每一套（1-3 套）各生成一张 9:16 全身走秀站姿首帧图。用 Phase 03 搜到的真实产品图当视觉锚点，出图更准。这是 Phase 05 走秀视频的输入锚点。

## Required Inputs

- 已 verified 的 `outfit_plan`，含 `selected_for_frame` / `selected_for_video` 决策
- 已 verified 的 `product_picks`，每个单品的真实产品图
- Phase 01 的主体照片
- `ARTIFACT_CONTRACT_PATH`

## Required Slot / Schema Loads

用内置 read 工具从本 skill 根目录读取：

- `schemas/outfit_frame.schema.json`
- `templates/outfit_frame.minimum.json`

读上游 artifact：

```bash
dl artifact read --slot=outfit_plan
dl artifact read --slot=product_picks
```

## Required Companion Resources

- `references/frame-and-video.md` —— 首帧图出图方式（三类主体）与 prompt 骨架

显式用内置 read 工具加载该方法论。

## Methodology

1. 从 `outfit_plan` 取所有 `selected_for_frame: true` 的套（1-3 套），每套出一张首帧图，写成 `outfit_frame` grid 里的一张 card。
2. 用 GPT 图像生成出图：把用户主体照片当主体一致性参考图，把 `product_picks` 里该套对应的产品图当服装外观参考图 —— 主体锁长相体型、产品锁服装外观，只换装。
3. 按主体类型走对应出图方式（真人 / 卡通 / 物体），见 `references/frame-and-video.md`。
4. 若 Phase 02 已选定 `video_style`，首帧图的背景与调性应与之一致，保证首帧到视频的视觉连贯。
5. `product_picks` 里某单品是 `media.state=failed`（没搜到产品图）→ 该单品退回纯文字描述驱动；某张整体出图失败 → 降级 Banana 2，仍失败则该 card 用 `media.state=failed` 标记，不阻塞其余张。

## Current Pi CLI Patterns

```bash
cat <<'EOF' | dl artifact write --slot=outfit_frame --content-type=application/json --contract='<ARTIFACT_CONTRACT_PATH>' --content-file=-
<serialized outfit_frame JSON>
EOF
dl artifact finalize --slot=outfit_frame --mode=verify \
  --contract='<ARTIFACT_CONTRACT_PATH>'
```

## 确认门（Confirmation Gate）

`outfit_frame` 写入后是 `draft`。进入 Phase 05 前必须确认：

1. **首帧图是否满意** —— 不满意则改 prompt 重跑对应的 card，重新输出 `draft`，循环。
2. **是否进入视频生成** —— 看 `outfit_plan` 里有没有 `selected_for_video: true` 的套：
   - 有 → 用户确认后 finalize `outfit_frame` 为 `verified`，加载 Phase 05。
   - 没有（用户在 Phase 02 选了不要视频）→ finalize `outfit_frame` 为 `verified`，**工作流在此收尾**，`ootd_video` 不产出。

## Output Slot

- `outfit_frame`（verified，含 1-3 张首帧图）

## Next Phase Entry

仅当存在 `selected_for_video: true` 的套时，load：

    phases/05-runway-video/PHASE.md

using the built-in read tool from the same skill root. 否则工作流完成。
