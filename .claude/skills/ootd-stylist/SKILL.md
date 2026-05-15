---
name: ootd-stylist
description: >-
  从一张主体照片出发，检测风格特性、按用户给定的场景匹配 3 套穿搭方案，为选定的 1-3 套搜真实
  产品（商品图 + 购买链接）并生成走秀首帧图，并可选地产出一条 9:16 竖版走秀 OOTD 视频
  （单套走秀或多套换装 montage，最长 30s）。
  Use when a user uploads a person / cartoon / object-character photo and asks
  what to wear, asks for an outfit suggestion or styling plan, wants shoppable
  product picks, or wants an OOTD runway video for a specific occasion. Do NOT
  use for body reshaping, multi-person photos, or videos longer than 30s.
allowed-tools: Read(*) Bash(dl artifact:*)
compatibility: "Pi-safe artifact-backed workflow; image search, image generation and video generation are runtime-provided capabilities."
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

- 风格检测 → 穿搭匹配 → 产品溯源 → 穿搭首帧图 → 走秀视频的五阶段方法论
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

输入是一张主体照片（真人 / 卡通虚拟形象 / 物体角色）加一个场景。流程产出：3 套穿搭方案清单 → 用户选定的 1-3 套各自的真实产品（商品图 + 购买链接）+ 一张 9:16 走秀首帧图 → 可选的一条 9:16 走秀 OOTD 视频（单套走秀或多套换装 montage，≤30s，用户在确认门选择生成时才产出）。核心卖点是穿搭推荐准、单品可直接买，图与视频是把方案直观呈现出来。

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
       [确认门] 选 1-3 套出图 · 选 1-3 套进视频 + 视频风格
    -> product_picks (verified)        每个单品的真实产品：商品图 + 购买链接
         [确认门] 产品是否对
      -> outfit_frame (verified, 1-3 张)   人物图 + 产品图 → 首帧图
           [确认门] 首帧满意 · 是否进入视频生成
        -> ootd_video (verified)   ← 可选；单套走秀 / 多套换装 montage
```

每个 artifact 的 `status` 只有从 `draft` 变 `verified` 后才能进下一阶段；每个阶段都有显式确认门，用户确认后才加载下一阶段。不满意修改后重新输出 `draft` 再次校验。`ootd_video` 是可选交付物。

## Intake / 进入流程

用户首次触发本 skill 时，agent 必须**主动招呼**：先收齐必须输入，预告完整交付物，让用户知道有哪些可选项，再加载 Phase 01。不要等用户自己问、不要默默等输入。

**1. 主动邀请上传主体照片：**
> "我来帮你搭~ 先发我一张主体照片：你自己 / 卡通形象 / 物体角色都行，建议**全身正面、单人、清晰**。"

**2. 主动问场景：**
> "这套穿搭是去哪儿穿的？通勤 / 约会 / 旅行 / 运动 / 派对 / 面试 / 居家 / 校园 / 逛街 / 节日 —— 或者你自己描述具体场合。"

**3. 主动预告完整交付物 + 可选项**，让用户提前知道流程能给到什么、要不要视频 / 混剪：
> "完整流程：① 给你出 **3 套穿搭建议**（基础百搭 / 进阶亮点 / 大胆尝试）；② 你选 1-3 套，我会给每个单品**搜真实产品**（商品图 + 购买链接 + 参考价）；③ 生成对应的**走秀首帧图**；④ **可选**：要不要一条 OOTD 视频？选 1 套 = 单段走秀，选 2-3 套 = **换装 montage**（每套一段 + 特效转场 + 连续 BGM）。视频风格也能选：时尚大片 / 街拍随性 / 居家温馨 / 复古胶片 / 小清新 / 赛博霓虹。"

**4. 主动提示可选输入**（不强求，用户给了就用，没给按场景推断）：
> "也可以一开始就告诉我：想要的风格（比如美拉德、多巴胺）、必须穿的单品（比如这条裙子）、季节 —— 不说也行。"

**5. 必须输入硬卡：**

- 没传主体照片 → 不加载 Phase 01，再问一次照片，告知用户为何必要（"没图我没法做风格检测"）。
- 没说场景 → 不加载 Phase 01，再问一次场景，告知用户为何必要（"场景决定穿搭基调，没法默认"）。
- 收齐 ① 主体照片 + ② 场景 后，加载 `phases/01-style-detection/PHASE.md`。可选输入（风格 / 单品 / 季节 / 是否要视频 / 视频风格）即使未在 intake 给出，也在 **Phase 02 确认门**再问一次。

**Intake 阶段不写 artifact**，是 Phase 01 之前的纯对话收集。Phase 01 之后所有产出都按 `artifact_contract.json` 走 artifact 流。

## Phase Entry Map

| Phase | Entry file | Output slot |
|---|---|---|
| 01 | `phases/01-style-detection/PHASE.md` | `style_profile` |
| 02 | `phases/02-outfit-matching/PHASE.md` | `outfit_plan` |
| 03 | `phases/03-product-sourcing/PHASE.md` | `product_picks` |
| 04 | `phases/04-outfit-frame/PHASE.md` | `outfit_frame` |
| 05 | `phases/05-runway-video/PHASE.md` | `ootd_video` |

按交接链逐阶段加载 `PHASE.md`，不要把全部方法论堆在本文件里。

## Required Inputs

| 输入 | 缺失时 |
|---|---|
| 主体照片（真人 / 卡通 / 物体角色） | 必须让用户提供，不能跳过 |
| 场景 | 必须问用户，不设默认场景 |

可选输入：风格偏好、必含单品、季节、视频风格、视频时长（单段 ≤15s，多套换装 montage 最长 30s）。

Phase 02 确认门收集两个用户决策：① 给 3 套里的哪几套（1-3 套）做产品溯源 + 生成首帧图 ② 是否生成 OOTD 视频、给哪几套（1-3 套）进视频、用什么视频风格。

## Completion Definition

This workflow is complete when all required completion predicates pass:

- `slot_verified(style_profile)`
- `slot_verified(outfit_plan)`
- `slot_verified(product_picks)`
- `slot_verified(outfit_frame)`

`ootd_video` 是可选交付物：仅当用户在 Phase 02 确认门选择生成视频时才产出，产出时一并 `slot_verified(ootd_video)`。

The skill ends here. Publish or delivery policy belongs to outer orchestration.

## Failure and Partial Completion

降级阶梯：`retry` → `alternate`（备选模型 / 参数）→ `degrade` → `partial_finalize` → `emit_failure_metadata`。

- 产品溯源失败：某单品搜不到 → 该 card `media.state=failed` 并保留文字描述；runtime 无图片搜索能力 → `product_picks` 降级为文字占位记录。
- 出图失败：GPT 图像生成 → 降级 Banana 2 → 某张仍失败则该张以 `media.state=failed` 记录，不阻塞其余张。
- 视频失败（仅当用户选了要视频）：Seedance 2.0 换装 montage 拼接失败 → 退回单段走秀 → 仍失败则 `ootd_video` 以 `degraded` 收尾。
- 最小可交付物是 `outfit_plan`：即使产品溯源、图像或视频失败，用户至少拿到穿搭方案清单。
- 终端无法达成时，输出结构化失败元数据，不要假装成功。

## Constraints

- 提供基于搜索的商品图与购买链接，但不保证库存 / 价格实时准确，不做下单 / 支付；链接有效性依赖搜索结果质量。
- 不做身材改造 / 瘦身 / 美颜 / 整形；在主体原本形象上做穿搭。
- 一次只处理一个主体，不做多人合影。
- 侧脸严重 / 模糊 / 遮挡严重的照片退回要求重传。
- 不做超过 30s 的视频，不做精确还原用户上传的某件实物衣服。
- artifact 规则是承重的：`write` / `finalize` / `validate` 缺 `--contract` 即视为未正确绑定契约。
