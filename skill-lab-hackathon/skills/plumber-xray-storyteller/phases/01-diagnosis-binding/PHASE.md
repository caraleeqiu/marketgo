# Phase 01: 诊断绑定

## Goal

产出并经师傅确认 `diagnosis_plan`——把混乱输入（不同照片 / 问题 / 有无
声线样本 / 有无署名）收束成全片绑定的统一生产指令。**四道 mandatory
子门 + 整体确认 gate**。

## Required Inputs

- 师傅的现场问题照片（必须）+ 一句话问题描述（必须）
- 可选：声线音频样本、署名信息 / 品牌图
- `ARTIFACT_CONTRACT_PATH`

## Required Slot / Schema Loads

用内置 `read` 加载（与本文件同一 skill 根）：

- `schemas/diagnosis_plan.schema.json`
- `templates/diagnosis_plan.minimum.json`

## Required Companion Resources

- `docs/conventions.md`（格式约定 / Fallback / 确认节点）

## Sub-gates（按序，全部 mandatory）

### 子门 1 · 照片 triage 四分叉

1. **前置告知拍摄须知**（师傅传图前）：近 / 清 / 亮 / 单（一张照片一个
   问题点）/ 带环境 / 真实（不能是图纸·网图·截图·AI 图）。
2. 收图（直接传 / 社媒 URL → load `media-download` 抓持久 CDN URL）。
3. **VLM triage 四问**：真实照片？scene_type 可判？单一清晰主体（记
   `subject_location`）？够清楚？
4. **四分叉**（②③④ 回环重传，全部收束到 ① PASS）：

   | 分叉 | 触发 | 处理 |
   |---|---|---|
   | ① PASS | 真实 + scene_type 可判 + 单一主体 + 够清 | 进子门 2 |
   | ② RESHOOT | 真照片但太远 / 糊 / 暗 | 按须知指出缺哪条，请补拍 → 重 triage |
   | ③ DISAMBIGUATE | 一张框了整个区域 / 多问题点 | 列候选请师傅选 / 裁切 → 重 triage |
   | ④ REJECT | 非真实照片 / 无水管相关主体 | 硬拒绝 + 说明 + 重发须知 → 重 triage |

   **未到 PASS 不往下走。**

### 子门 2 · 诊断 + 问题点定位

agent 用原生 vision 读照片 + 描述，**提候选**（不是「知道」）：

- `scene_type` ∈ {wall, floor, exposed_pipe, fixture}——决定 Shot 2 剖
  哪种表面（与 problem_type 正交）。
- `problem_type` ∈ {leak, clog, corrosion, pressure}——两个信号定：师傅
  描述 + 照片证据；冲突就摊给师傅，不自己拍板。
- `affected_component` / `internal_state`（Shot 2 X-ray 要画的）。
- **主问题选择**：条件触发——只有真检测到多个独立问题才打断师傅选一个；
  因果链算一个故事；其余记 `other_problems_noted`。
- **problem_point 定位**：按 problem_type 找视觉证据，在照片上标候选
  红点；看不出（水压 / 墙后 / 地下）就老实说、请师傅指认，**不瞎猜**。
  生成带红点标记的照片 + 诊断卡呈师傅确认。

**没拿到「诊断准 + 红点对」不进子门 3。** 师傅纠正的版本才算数。

### 子门 3 · 衰变后果 + 可视性

衰变是**未来预测**，师傅是预测的权威：

1. load `external-research` 搜「这类 problem_type 一般怎么发展、多久」的
   general 规律。
2. 据此**起草** `decay_outcome`（明说是按一般规律搜的草稿，不是结论）。
3. 师傅把规律**调到这个具体个案**确认——师傅版本 = 真相源。
4. 定 `decay_visibility` ∈ {high, low}（low → Shot 3 走对比静帧 / 数据
   动画，不硬做衰变动画）。

### 子门 4 · 声线方案

师傅 4 选 1（**任一路声线 / voice_id 没定 = 不算过**）：

- `clone`——师傅传声线样本 → 存 `voice_sample_url`；样本没到位不算过。
- `minimax_tts`——load `search-voice` 搜 2-3 候选，师傅试听选定 → 存
  `voice_id`。
- `captions_only`——纯字幕无旁白。
- `av_joint`（音画同出）——仍走 clone / minimax_tts 流程定下声线，产出
  走 §6 / §8 简化分支；绝不随机配音。

### 微观 step（滚入整体确认，不单独打断）

`problem_description` / `decay_outcome` 已定 / 署名信息（可选，3 档优雅
降级，不伪造品牌）/ `target_duration`（默认 60s，可选 45/90s）/
`aspect_ratio`=9:16 / `engine`（默认 可灵 3.0）。

### 整体确认 gate（进 Phase 02 前）

自检全部通过后，把完整 `diagnosis_plan` 呈师傅整体确认。**未拿到明确
OK 不进 Phase 02。**

## Current Pi CLI Patterns

```bash
# media-download（师傅给 URL 时）
dl download-media --url=<social-or-web-url>
# 写 + 验 diagnosis_plan
cat <<'EOF' | dl artifact write --slot=diagnosis_plan --content-type=application/json --content-file=- --contract='<ARTIFACT_CONTRACT_PATH>'
<serialized diagnosis_plan JSON>
EOF
dl artifact finalize --slot=diagnosis_plan --mode=verify --contract='<ARTIFACT_CONTRACT_PATH>'
```

## Output Slot

- `diagnosis_plan`（draft → verified）

## Next Phase Entry

师傅整体确认后，用内置 `read` 加载：

    phases/02-narration-script/PHASE.md
