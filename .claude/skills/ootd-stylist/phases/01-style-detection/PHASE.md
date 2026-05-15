# Phase 01: 风格检测

## Goal

读主体照片，判断主体类型并检测风格特性，产出一张用户可审阅、可改气质标签的风格检测卡。穿搭推荐准不准，全看这一步对不对。

## Required Inputs

- 用户上传的主体照片（真人 / 卡通虚拟形象 / 物体角色）—— 由 SKILL.md 的 Intake 阶段主动招呼收集；未到位则不应加载本 PHASE
- `ARTIFACT_CONTRACT_PATH`

## Required Slot / Schema Loads

用内置 read 工具从本 skill 根目录读取：

- `schemas/style_profile.schema.json`
- `templates/style_profile.minimum.json`

## Required Companion Resources

- `references/style-detection.md` —— 三类主体各检测哪些维度

显式用内置 read 工具加载该方法论。

## Methodology

1. 判断主体类型（真人 / 卡通 / 物体），按 `references/style-detection.md` 选对应检测维度。
2. 图太糊 / 角度差 / 多人入镜 / 信息不足 → 退回让用户补充，不硬猜。
3. 把检测结果填成 5 个 form_field：主体类型、关键特征、气质标签、适配色系、适配版型。
4. 这一步需要确认的信息：用户对气质标签是否认可（可手动改）。

## Current Pi CLI Patterns

```bash
cat <<'EOF' | dl artifact write --slot=style_profile --content-type=application/json --contract='<ARTIFACT_CONTRACT_PATH>' --content-file=-
<serialized style_profile JSON>
EOF
dl artifact finalize --slot=style_profile --mode=verify \
  --contract='<ARTIFACT_CONTRACT_PATH>'
```

气质标签被修改后，用 `patch-json` 增量更新再 finalize：

```bash
cat <<'EOF' | dl artifact patch-json --slot=style_profile --operations-file=-
[{"op":"set","path":"content[2].value","value":"清冷"}]
EOF
```

## Output Slot

- `style_profile`

## Next Phase Entry

After success, load:

    phases/02-outfit-matching/PHASE.md

using the built-in read tool from the same skill root.
