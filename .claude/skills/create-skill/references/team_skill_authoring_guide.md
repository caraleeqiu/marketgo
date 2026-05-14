# 面向团队的 Skill 使用与创建指南

本文面向非技术背景同事，说明现在一个复杂 skill 是怎么组织、怎么运行的，以及如何把一份 SOP 文档或一段聊天需求转成新的可复用 skill。

这里用 `create-complex-music-video-from-music` 作为例子。它是一个复杂音乐视频生产 skill，目标是从一首已经确定的音乐出发，完成音频分析、创意方案、视觉参考、分镜、片段生成、对口型、剪辑合成，最后交付成片。

## 1. Skill 是什么

可以把 skill 理解成“给 Agent 用的标准作业流程”。它不是一句提示词，也不是单个工具，而是一套可复用的工作说明，包含：

- 什么情况下应该使用它。
- 需要先读哪些规则、模板和检查清单。
- 每一步应该产出什么中间结果。
- 哪些结果必须被校验后才能进入下一步。
- 最终什么状态才算完成。

一个成熟 skill 的价值是：同类任务不再靠 Agent 临场发挥，而是按稳定流程推进，减少漏步骤、错模型、错格式、产物停留在草稿等问题。

## 2. 复杂 Skill 的典型结构

以复杂 MV skill 为例，文件夹大致由几类内容组成：

```text
create-complex-music-video-from-music/
  SKILL.md
  schemas/
    artifact_contract.json
    audio_analysis.schema.json
    creative_proposal.schema.json
    visual_config.schema.json
    reference_list.schema.json
    storyboard.schema.json
    final_video.schema.json
  phases/
    01-audio-analysis/PHASE.md
    02-creative-proposal/PHASE.md
    03-visual-config/PHASE.md
    04-reference-pack/PHASE.md
    05-storyboard/PHASE.md
    06-segment-production/PHASE.md
    07-final-assembly/PHASE.md
  templates/
  references/
  scripts/
```

每一类文件的作用如下：

- `SKILL.md`：总入口。说明这个 skill 什么时候用、整体流程是什么、哪些规则不能违反。
- `schemas/artifact_contract.json`：完成标准。定义有哪些中间产物、哪个阶段生产、哪个阶段使用、怎么校验、最终交付物是什么。
- `schemas/*.schema.json`：每个中间产物的数据格式。它让 Agent 不能随便写“看起来差不多”的内容。
- `phases/*/PHASE.md`：每个阶段的执行说明。复杂任务不会都写在一个大文件里，而是按阶段拆开，Agent 做到哪一步就读哪一步。
- `templates/*.json` 或 `templates/*.md`：最小有效示例或填写骨架，帮助 Agent 产出格式正确的内容。
- `references/*.md`：方法论、提示词设计、质量检查要求等补充材料。
- `scripts/`：必要时放本地辅助脚本，例如音频节拍锚点选择。

## 3. Artifact 是什么

artifact 可以理解成“工作流里的正式交接物”。复杂任务不是靠聊天记录往下传，而是把关键结果写成结构化 artifact。

更具体地说，artifact 解决三个问题：

- 记录：把阶段结果保存成正式数据，而不是散落在聊天里。
- 交接：让下一个阶段明确知道应该读取哪个结果，不能靠猜。
- 校验：用 schema 和 contract 检查格式、必填字段和完成条件。

复杂 MV skill 的 artifact 流是：

```text
audio_analysis
  -> creative_proposal
    -> visual_config
      -> reference_list
        -> storyboard
          -> final_video
```

这些名字可以理解为：

- `audio_analysis`：歌曲分析，包括歌词、段落、节拍、时间点和 timing audit。
- `creative_proposal`：创意方案，包括故事方向、角色、情绪、镜头语言。
- `visual_config`：视觉设定，包括风格、画幅、分辨率、字幕偏好等。
- `reference_list`：角色、场景、道具等参考图清单，含质量检查和选中理由。
- `storyboard`：逐段分镜，包含每段起止时间、画面、是否对口型、引用哪些参考图。
- `final_video`：最终成片信息，是终端交付物。

### 3.1 Slot、Schema 和 Contract

artifact 体系里有三个常见词：

- `slot`：一个正式位置，类似表单里的一个栏目。比如 `storyboard` 就是一个 slot。
- `schema`：这个 slot 必须长什么样。比如 storyboard 必须有总时长、片段列表、每段起止时间、视频 URL 等字段。
- `contract`：整个工作流的完成规则。它定义有哪些 slot、谁先谁后、哪个 slot 是最终交付物、什么时候算完成。

可以用一个简单比喻理解：

- slot 是“要交的文件夹”。
- schema 是“每个文件夹里必须有哪些材料”。
- contract 是“整套项目什么时候可以归档”。

artifact 有几个重要状态：

- `draft`：已经写入，但还不能作为正式交接物。
- `verified`：通过 CLI 和 schema 校验，可以被后续阶段使用。
- `promoted`：最终交付物被提升为本次工作流的正式结果。

注意：CLI 的 `verify` / `promote` 只是“系统校验和持久化成功”，不等于用户已经接受作品。用户最后的 accept / revise 是外层交付环节。

### 3.2 Artifact 和聊天记录的区别

聊天记录适合解释过程，但不适合作为复杂工作流的正式状态。原因是：

- 聊天内容可能很长，后续步骤容易遗漏重点。
- 同一个信息可能在多轮里被改过，最终版本不一定清楚。
- 聊天里的“我已经完成”不等于系统真的保存了结果。
- 后续工具需要结构化数据，不能稳定读取自然语言总结。

artifact 则要求 Agent 把结果写成明确的数据，并且通过校验。只有被验证的 artifact，才应该被下一阶段当作可信输入。

### 3.3 为什么不能停在 Draft

`draft` 表示“已经写了一版”，但还没证明它符合规则。对于复杂 MV，这会带来实际风险：

- `audio_analysis` 如果还是 draft，storyboard 的时间点可能没有可靠依据。
- `reference_list` 如果还是 draft，后续可能误用未选中或质量不合格的图。
- `storyboard` 如果还是 draft，Phase 07 可能拿到缺 URL、缺时长或缺片段规格的数据。
- `final_video` 如果没有 promote，系统不能把它视为本次任务的正式交付物。

所以复杂 skill 通常要求：中间交接物必须 `verified`，最终交付物必须 `promoted`。

### 3.4 Artifact 和前端渲染

不是所有 artifact 都是用户要看的最终作品。比如 `create-skill` 自己的
`skill_brief`、`skill_structure`、`skill_source_package` 和
`skill_validation_report` 是内部审阅和校验材料，重点是结构清楚、可验证、可审计。

但如果一个 skill 会产出用户可见 artifact，它的数据结构需要按当前 artifact 协议来组织（详见 `docs/artifact_protocol.md`，对应权威协议《Artifact 协议规范 0508》）。简单说三层：

- **content_layout**：`single`（单条） / `list`（有序列表） / `grid`（均匀网格） / `form`（键值摘要），决定数据怎么排列。
- **component_type**：`card`（实体卡） / `markdown`（长文） / `code`（代码片段） / `image` / `video` / `music` / `form_field`，决定每条数据的原子单元长什么样。
- **detail**：仅 segment artifact 用 `{ "variant": "media_player" }`，其他 artifact 固定 `null`。

旧名 `form_summary` / `card_grid` / `item_list` / `timeline` 已被本协议取代，不要再当 schema 字段使用；`media_player` 仍然存在，但只能出现在 segment artifact 的 `detail.variant` 里，不是顶层 renderer family。

这里不要求 skill 写 UI 组件，也不要求写 `rendererProps` 这类重复展示对象。真正需要的是把不可缺的语义字段写进 schema 或稳定输出里，例如列表项、标题、描述、时间段、媒体 URL、状态、选择理由等。slot 名字和字段展示方式可以由前端映射，但前端不应该从一大段自然语言里猜关键结构。

## 4. 复杂 MV Skill 如何运行

复杂 MV skill 按阶段推进。每个阶段都有固定输入、固定输出和不允许跳过的检查。

### Phase 01: 音频分析

目标：理解歌曲。Agent 会分析音频、歌词、段落、节拍、开始结束点，并记录时间边界依据。

产物：`audio_analysis`

关键点：

- 后续所有分镜时间都要基于这里的音频时间。
- 如果 ASR 或歌词时间有漂移，需要记录 timing audit。

### Phase 02: 创意方案

目标：把音乐理解转成 MV 的故事和视觉叙事方向。

产物：`creative_proposal`

关键点：

- 不在这里生成图片或视频。
- 这个阶段只定方向，例如角色、世界观、情绪变化、叙事结构。

### Phase 03: 视觉配置

目标：确定视觉风格和最终交付规格。

产物：`visual_config`

关键点：

- 包括画幅、分辨率、字幕偏好、整体风格、质量约束等。
- 在 Dramaland 这类需要用户确认的产品里，关键交付规格应该尽早确认；在自动化项目里，可以由 Agent 按规则自行决策。

### Phase 04: 参考图包

目标：生成或选择角色、场景、道具参考图。

产物：`reference_list`

关键点：

- 不能只因为图片生成成功就算完成。
- 角色图要检查脸和主体是否清晰、比例是否一致、风格是否能延续。
- 场景和道具要检查空间、材质、主体是否正确。
- 多候选图要记录为什么选择某一张。

### Phase 05: 分镜

目标：把整首歌拆成一段段可生产的视频 segment。

产物：`storyboard` 草稿

关键点：

- 每段要有精确起止时间。
- 每段要说明画面、镜头、角色、场景、是否对口型、使用哪些参考图。
- 对口型段也必须有 keyframe plan，即使只有一张关键帧图。

### Phase 06: 片段生产

目标：根据 storyboard 生成每段视频，并把结果回填到 storyboard。

产物：`storyboard` verified

关键点：

- 模型选择在这个阶段才确认，因为这时才知道要用普通视频、对口型、关键帧图、分辨率和时长策略。
- 视频模型如果要求整数秒，应该用 `ceil(storyboard.duration)` 向上取整生成。例如目标是 4.7 秒，就先请求 5 秒视频，再裁剪回 4.7 秒。
- 音频永远按 storyboard 的精确时间裁剪，不能为了凑整数秒去裁音频。
- 对口型不能直接拿角色设定图当 lip-sync 输入。要先用角色、场景、道具生成该 segment 专属的正脸表演图，再用这张图做 lip-sync。
- 每段要记录实际渲染规格，例如宽高、fps、请求时长、裁剪后时长、是否需要最终归一化。

### Phase 07: 最终合成

目标：把所有片段合成成片，挂上全曲音频和字幕。

产物：`final_video`

关键点：

- 合成前要 probe 每个片段的宽高、fps、SAR、编码和音频信息。
- 如果来源混杂或片段很多，先逐段或小批量 normalize，再 concat，最后 mux 全曲音频。
- 最终 `final_video` 需要 `verify_and_promote`，这才是本 workflow 的正式完成点。

## 5. 运行时为什么要这么严格

复杂生成任务最容易出问题的地方不是某一步不会做，而是“交接不清楚”：

- 图片生成了，但没有选中理由，后面不知道该用哪张。
- storyboard 写了，但时间不精确，视频和音频对不上。
- lip-sync 用了角色设定图，结果画面不像真实段落。
- artifact 只是 draft，Agent 却以为可以进入下一阶段。
- 模型选择太早，用户还不知道价格、能力和限制。

所以现在的复杂 skill 会强制：

- 每个阶段先读规则、schema、模板和相关 atomic skill。
- 每个阶段只做自己负责的事。
- 每个正式交接物必须写入 artifact 并校验。
- 终端交付物必须 promote。
- 用户确认和模型选择要在信息足够的阶段进行，而不是开头凭空猜。

## 6. 如何用 SOP 创建一个新的 Skill

如果团队已经有一份 SOP，可以用 `create-skill` 把它转成新的 skill。

`create-skill` 本身也是一个 skill。它的工作不是“帮你写一段提示词”，而是把团队流程整理成一个可运行、可校验、可审计的 skill 源文件包。

当前 `create-skill` 的最终产出是一个新的或更新后的 skill 源文件包，通常包含：

- `SKILL.md`
- `schemas/artifact_contract.json`
- 必要的 `schemas/*.schema.json`
- 必要的 `templates/*.minimum.json`
- 如果是复杂流程，还会有 `phases/*/PHASE.md`
- 可选的 `references/*.md`
- 可选的 `scripts/`
- 一个 `skill_source_package` manifest，记录实际生成或修改了哪些文件
- 一个 `skill_validation_report`，记录校验结果

换句话说，它不是只输出一段提示词，而是产出一个可以放进 skills 目录使用的完整文件夹。

### 6.1 Create-Skill 会产出哪些正式 Artifact

`create-skill` 自己也使用 artifact 管理创建过程。它有四个核心 artifact：

```text
skill_brief
  -> skill_structure
    -> skill_source_package
      -> skill_validation_report
```

它们分别代表：

- `skill_brief`：需求简报。说明这个 skill 要解决什么问题、什么时候触发、输入输出是什么、边界和非目标是什么。
- `skill_structure`：结构设计。决定它是 atomic skill 还是 composition skill，要有哪些文件、阶段、slot、schema 和验证计划。
- `skill_source_package`：源文件包清单。记录实际生成或修改了哪些 skill 文件；这是 create-skill 的终端交付 artifact，但只有静态校验通过或仅有可接受警告后才 promote。
- `skill_validation_report`：校验报告。记录 schema、模板、frontmatter、artifact contract、未支持命令等检查是否通过。

团队可以把这四个 artifact 当作创建新 skill 的四份审阅材料：

- 先看 `skill_brief`：确认问题和边界对不对。
- 再看 `skill_structure`：确认流程拆分、阶段和产物设计是否合理。
- 再看 `skill_source_package`：确认最终生成了完整文件夹，而不是只有说明。
- 最后看 `skill_validation_report`：确认它不是口头完成，而是通过了静态检查。

### 6.2 Create-Skill 的运行顺序

create-skill 通常按这个顺序工作：

1. 读取 SOP 或聊天需求，整理需求边界。
2. 写入并 verify `skill_brief`。
3. 设计 skill 结构，决定 atomic / composition、阶段、artifact 槽位和完成标准。
4. 写入并 verify `skill_structure`。
5. 按结构实际创建或更新文件，例如 `SKILL.md`、schema、template、phase 文档。
6. 写入并 verify `skill_source_package`。
7. 做静态检查；如果结果是 `pass` 或 `warn`，再 promote `skill_source_package`。
8. 写入并 verify `skill_validation_report`，记录校验状态和 package 是否已 promote。

这个顺序的重点是：先确认“要做什么”和“怎么组织”，再写文件，最后校验。不要直接从 SOP 跳到写一堆文件，否则容易产出结构不完整、没有完成条件或不能被后续 Agent 稳定执行的 skill。

### 6.3 Create-Skill 当前不会做什么

当前 Pi 环境里的 `create-skill` 是 artifact-backed source authoring workflow，也就是“用 artifact 管理的 skill 源文件创建流程”。它不会把未来的 skill-forge 命令当成当前执行路径。

这意味着：

- 它会创建或更新 skill 文件夹。
- 它会记录 source package manifest。
- 它会做本地静态校验。
- 它不会依赖尚未实现的 `dl skill draft-create`、`dl skill compile`、`dl skill activate` 等命令。
- 新 skill 是否被 runtime 重新加载或发布，是外层系统行为，不属于 create-skill 自己的完成条件。

这个边界很重要：create-skill 的完成标准是“源文件包已经生成并通过校验”，不是“线上产品已经发布并开始使用”。

### 6.4 SOP 文档应该提供什么

给 create-skill 的 SOP 越清楚，生成的 skill 越稳定。建议 SOP 至少包含：

```md
# SOP 名称

## 目标
这个流程要稳定解决什么问题？

## 适用场景
什么时候应该使用这个流程？
什么时候不应该使用？

## 输入
开始前需要哪些材料、链接、文件、用户选择或系统数据？

## 最终交付物
最后应该交付什么？格式是什么？谁会使用？

## 工作步骤
按顺序列出步骤。每一步说明：
- 目标
- 需要的输入
- 应该产出的中间结果
- 是否需要用户确认
- 失败时怎么处理

## 关键检查点
哪些内容必须检查后才能继续？
例如：格式、数量、质量、价格、版权、用户确认。

## 中间产物
哪些结果需要被保存，供后续步骤使用？

## 完成标准
什么状态才算完成？
什么情况只能算部分完成？

## 示例
给 1-2 个真实例子，包括输入和期望输出。

## 禁止事项
哪些捷径、错误做法或不允许的行为必须避免？
```

### 6.5 通过聊天创建 Skill

如果没有完整 SOP，也可以直接和 Agent 聊。推荐这样发起：

```text
请使用 create-skill，把下面这个流程整理成一个可复用 skill。

目标：
...

适用场景：
...

输入：
...

最终交付物：
...

步骤：
1. ...
2. ...
3. ...

关键检查点：
...

禁止事项：
...

请优先创建 artifact-backed skill。如果流程复杂，请拆成 phases；如果流程很线性，可以创建 atomic skill。
```

如果信息不足，Agent 会先整理 `skill_brief`，必要时追问关键缺口。然后它会继续做：

```text
skill_brief
  -> skill_structure
    -> skill_source_package
      -> skill_validation_report
```

这些阶段分别代表：

- `skill_brief`：确认需求边界、适用场景、目标 runtime、非目标。
- `skill_structure`：决定是 atomic skill 还是 composition skill，设计文件结构、阶段、artifact 槽位和验证计划。
- `skill_source_package`：实际写出 skill 文件，并把文件清单作为终端 artifact；静态校验通过或仅有可接受警告后才 promote。
- `skill_validation_report`：做静态检查，确认 schema、模板、artifact 规则和不支持命令没有问题。

### 6.6 什么时候用 atomic，什么时候用 composition

用 atomic skill 的情况：

- 步骤少。
- 中间结果不多。
- 不需要跨多轮或多阶段保存大量 artifact。
- 最终只交付一个简单结果。

用 composition skill 的情况：

- 流程很长。
- 有多个阶段和多个中间产物。
- 后续阶段必须依赖前面阶段的正式结果。
- 需要调用多个 atomic skills，例如图像生成、视频生成、字幕、ffmpeg。
- 需要严格定义完成标准。

复杂 MV 就是 composition skill。

## 7. 团队评审一个新 Skill 时看什么

非技术同事不需要审代码实现，但可以审这些问题：

- 名称和描述是否清楚，能不能判断什么时候该用。
- 适用场景和不适用场景是否明确。
- 最终交付物是否清楚。
- 每个阶段是否有明确输入和输出。
- 是否写清楚哪些节点需要确认关键信息。
- 中间产物是否足够支撑后续步骤。
- 质量检查是否具体，而不是“生成好看的图”“做一个不错的视频”。
- 失败或部分完成时有没有交代怎么处理。
- 是否避免把产品层规则硬写进通用 skill。比如“是否问用户”通常是 Dramaland 的 runtime 行为；skill 里更适合写“这个环节需要确认哪些信息”。

## 8. 常见误区

### 误区 1：把 skill 当成提示词

提示词通常只能描述一次任务。skill 应该沉淀可复用流程、产物结构、校验规则和完成标准。

### 误区 2：只写步骤，不写产物

复杂流程最重要的是每一步交接什么。没有 artifact，Agent 容易靠聊天上下文猜下一步。

### 误区 3：过早决定模型

模型选择通常应该发生在信息足够的阶段。比如 MV 的视频模型选择，要等 storyboard、lip-sync 需求、分辨率、时长和价格约束明确后再定。

### 误区 4：把用户接受当成系统校验

`verify` 和 `promote` 代表系统产物有效，不代表用户喜欢或已经接受。用户 review 是另外一层。

### 误区 5：通用 skill 写死某个产品行为

同一个 skill 可能被 Dramaland 和 ilands 共用。skill 应该写清楚“这个环节需要确认哪些信息”，而不是总是写“必须询问用户”。是否真的询问用户，由具体产品 runtime 决定。

## 9. 最简工作建议

如果你要让团队把一个新流程做成 skill，最省事的方式是：

1. 先写一页 SOP，按“目标、输入、步骤、产物、检查点、完成标准”组织。
2. 发给 Agent，并明确要求“使用 create-skill 创建 artifact-backed skill”。
3. 让 Agent 先产出 `skill_brief` 和 `skill_structure` 给团队看。
4. 团队确认流程边界后，再让 Agent 写完整 source package。
5. 最后看 `skill_validation_report`，确认没有 draft 交付、没有跳过 artifact 校验、没有把未来命令当成当前执行路径。

这样创建出来的 skill，才更接近一个可运行、可审计、可复用的团队流程，而不是一次性的聊天经验。


