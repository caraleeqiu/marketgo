---
name: ootd-stylist
description: >-
  从一张主体照片出发，检测风格特性、按用户给定的场景匹配 3 套穿搭方案、生成穿搭首帧图，
  最终交付一份单品清单和一条 9:16 竖版走秀 OOTD 视频（最长 30s）。
  Use when a user uploads a person / cartoon / object-character photo and asks
  what to wear, asks for an outfit suggestion or styling plan, or wants an OOTD
  runway video for a specific occasion. Do NOT use for buyable shopping links,
  body reshaping, multi-person photos, or videos longer than 30s.
allowed-tools: Read(*) Bash(dl artifact:*)
compatibility: "Pi-safe artifact-backed workflow; image/video generation are runtime-provided capabilities."
metadata:
  ilands:
    applicable-to: [creation]
    priority: 2.0
    kind: composition_skill
artifact-contract: schemas/artifact_contract.json
entry_skill_ref: "platform/ootd-stylist"
---

# OOTD 穿搭视频生成器

## What This Skill Owns

- 风格检测 → 穿搭匹配 → 穿搭首帧图 → 走秀视频的四阶段方法论
- artifact 流与阶段交接规则
- 共享的 CLI 纪律、schema 纪律、artifact 协议纪律
- 完成契约与失败降级阶梯

## What This Skill Does Not Own

- approval / checkpoint / 暂停问用户的策略密度
- publish 策略与 runtime reload
- 模型预算治理
- 通用 pause / resume 机制

确认节点在本 skill 里描述为「该环节需要确认哪些信息」；是否真的暂停询问用户，由产品 runtime 决定。

## Overview

输入是一张主体照片（真人 / 卡通虚拟形象 / 物体角色）加一个场景。流程产出三个中间 artifact 和一个终端交付物：穿搭方案清单 + 一条 9:16 走秀 OOTD 视频（≤30s）。核心卖点是穿搭推荐准，视频是把方案直观呈现出来。

## Required Bootstrap

写任何 artifact 前，先从本 skill 目录读取：

1. `schemas/artifact_contract.json`，把它的绝对路径作为 `ARTIFACT_CONTRACT_PATH` 一路带下去。
2. 当前阶段要写的 slot 的 schema 与 `templates/*.minimum.json`。
3. 当前阶段 `PHASE.md` 指向的 `references/*.md` 方法论。

## Artifact CLI Primer

本 skill 通过 `dl artifact ...` 使用 artifact 工作集。

```bash
cat <<'EOF' | dl artifact write --slot=<slot> --content-type=application/json --contract='<ARTIFACT_CONTRACT_PATH>' --content-file=-
<serialized-json>
EOF
dl artifact finalize --slot=<slot> --mode=verify \
  --contract='<ARTIFACT_CONTRACT_PATH>'
dl artifact read --slot=<slot>
```

增量更新已有 JSON slot 用 `patch-json`：

```bash
cat <<'EOF' | dl artifact patch-json --slot=<slot> --operations-file=-
[{"op":"set","path":"content[0].status","value":"verified"}]
EOF
```

Rules:

- `--content` 永远是字符串，写入前先序列化 JSON。
- `write` 用于首次写入或整体替换；`patch-json` 只用于对已有 JSON slot 的增量结构更新。
- `patch-json` 是 JSONPath-lite，不是 RFC 6902：用 `--operations` 不是 `--patch`；路径写 `field`、`nested.field`、`items[0].field`，不写 `/field`；支持的 op 只有 `set` / `merge` / `append` / `delete`。
- 不要给 `patch-json` 传 `--contract`；patch 后用 `ARTIFACT_CONTRACT_PATH` 对该 slot 单独 finalize。
- `write` 成功后，紧接着的非读取动作必须是对同一 slot 的 `finalize --mode=verify`。
- CLI 的 verify / promote 只是持久化与校验，不等于用户接受。accept / revise 归外层 runtime。
- 工具结果没证明之前，不要声称某个 slot 已写入、verified 或完成。

## Artifact Flow

```text
style_profile (verified)
  -> outfit_plan (verified)
    -> outfit_frame (verified)
      -> ootd_video (verified)
```

每个 artifact 的 `status` 只有从 `draft` 变 `verified` 后才能进下一阶段。不满意修改后重新输出 `draft` 再次校验。

## Phase Entry Map

| Phase | Entry file | Output slot |
|---|---|---|
| 01 | `phases/01-style-detection/PHASE.md` | `style_profile` |
| 02 | `phases/02-outfit-matching/PHASE.md` | `outfit_plan` |
| 03 | `phases/03-outfit-frame/PHASE.md` | `outfit_frame` |
| 04 | `phases/04-runway-video/PHASE.md` | `ootd_video` |

按交接链逐阶段加载 `PHASE.md`，不要把全部方法论堆在本文件里。

## Required Inputs

| 输入 | 缺失时 |
|---|---|
| 主体照片（真人 / 卡通 / 物体角色） | 必须让用户提供，不能跳过 |
| 场景 | 必须问用户，不设默认场景 |

可选输入：风格偏好、必含单品、季节、视频时长（默认 ≤15s 单段，最长 30s 走拼接）。

## Completion Definition

This workflow is complete when all required completion predicates pass:

- `slot_verified(style_profile)`
- `slot_verified(outfit_plan)`
- `slot_verified(outfit_frame)`
- `slot_verified(ootd_video)`

The skill ends here. Publish or delivery policy belongs to outer orchestration.

## Failure and Partial Completion

降级阶梯：`retry` → `alternate`（备选模型 / 参数）→ `degrade` → `partial_finalize` → `emit_failure_metadata`。

- 出图失败：GPT 图像生成 → 降级 Banana 2 → 仍失败则 `outfit_frame` 停在 draft。
- 视频失败：Seedance 2.0 拼接失败 → 退回 ≤15s 单段 → 仍失败则 `ootd_video` 以 `degraded` 收尾。
- 最小可交付物是 `outfit_plan`：即使图像或视频失败，用户至少拿到穿搭方案清单。
- 终端无法达成时，输出结构化失败元数据，不要假装成功。

## Constraints

- 做不了真实购买链接，不保证推荐单品真实存在或可购买。
- 不做身材改造 / 瘦身 / 美颜 / 整形；在主体原本形象上做穿搭。
- 一次只处理一个主体，不做多人合影。
- 侧脸严重 / 模糊 / 遮挡严重的照片退回要求重传。
- 不做超过 30s 的视频，不做精确还原某件实物衣服。
- artifact 规则是承重的：`write` / `finalize` / `validate` 缺 `--contract` 即视为未正确绑定契约。
