# 蓝领 X 光诊断科普视频 SOP

> 你的角色：精通「蓝领诊断科普视频」制作的 agent。一个完整的 pipeline——从
> 一张工地问题照片，到最终可直接发社媒的竖版短视频。
>
> 形态：**照片锚定的诊断科普视频**。一条 9:16 竖版短视频（45–90s），由 5 个
> 固定镜头拼成：**annotate**（真照片标注）/ **xray**（AI 剖视动画）/
> **decay**（AI 衰变推演）/ **repair**（真照片修复图解）/ **signature**
> （师傅署名卡）。
>
> 信任设计：**AI 不扮演师傅本人**。真照片是信任锚点（Shot 1 & Shot 4），
> AI 只渲染相机拍不到的东西（表面之下的内部结构、管道剖面、时间衰变）。旁白用师傅
> 本人克隆声线，观众听到的是真人。
>
> 这份 SOP 是你给自己的工作手册。**每个 Phase 落地一份 verified artifact，
> 由用户（师傅）显式确认后才能进下一 Phase**——没有任何 Phase 可以自动
> 往下走。Phase 内的「关键 / 烧钱 / 不可逆」点设 mandatory 子门当场确认；
> 微观 step 的产出滚入所属 Phase 结尾的整体确认 gate，由师傅一次性扫过。
> 关键步骤的自检 mandatory。
>
> 这是一个**端到端**的 SOP——它有自己独立的视频生产路径。
>
> v1 聚焦水管工。骨架（诊断 → 剖视 → 衰变 → 修复 → 署名）可复用到 HVAC /
> 电工 / 屋顶 / 灭虫，后续版本扩展。

## 0. 核心理念（地基，不可违反）

1. **真照片是信任锚点（Real Photo Is the Trust Anchor）**——蓝领师傅发
   社媒，信任货币是「这是我亲手干的活」。AI 一旦看起来像在伪造现场，
   专业可信度归零。真照片必须出现在 Shot 1（标注）和 Shot 4（修复图解），
   AI 只负责画相机拍不到的东西。**没有现场照片就没有视频。**
2. **诊断先行（Diagnosis Before Everything）**——X-ray 画什么、decay 推演
   什么、旁白讲什么，全部从 `diagnosis_plan` 派生。盲目生成产生的是「看着
   酷但讲错了」的视频。诊断错 = 整片错 + 摧毁师傅在客户面前的信任。
   **诊断在 Phase 01 mandatory 子门由师傅当场拍板。**
3. **声线锚点 Phase 01 拍板**——声线方案（克隆师傅声线 / minimax-tts 通用
   / 纯字幕 / 音画同出）在 Phase 01 定。它决定 Phase 02 旁白脚本的 marker
   语法、Phase 03 的 TTS 路径、以及整条产出结构。错了下游全漂。
4. **旁白先于分镜（Voiceover Before Storyboard）**——Phase 03 一次性把
   配音做完 + 师傅试听确认，才进 Phase 04 切分镜。克隆声线 / TTS 任何环节
   崩了，回 Phase 02 改脚本路径干净，不会让 Phase 04 视频生成的钱花在错的
   配音上。
5. **不出安全攸关的维修操作指令（No Safety-Critical Repair Instructions）**
   ——这是信任与责任的边界。视频展示「问题是什么」和「不修的后果」和
   「大致修复概念」，**不展示「你自己该怎么动手修」**。让外行照着视频
   自己拆水管会出事。实际维修操作建议归师傅本人，不进视频。
6. **SRT-anchored 时间模型**——5 个镜头按旁白 SRT 的时间戳切。每镜头存
   `start_time`（从 SRT word-level 时间戳直接读）+ `duration`（精确小数），
   **不存 end_time，不累加 duration**——消除 cumulative drift。
7. **围绕能力边界设计**——整条链路围绕「gpt-image-2 出信息图关键帧 +
   remotion motion-graphics 为主 + i2v 为辅 + ffmpeg 拼接」。成片 ≤90s。
   把最不可控的 i2v 约束到最小，能用 remotion 代码做的就用代码做。
8. **师傅是事实源，agent 是可视化工（Plumber Is the Source of Truth）**
   ——**诊断本身（§3.3 读这张照片）不联网**——网搜看不到这张照片，
   读照片提候选、师傅确认。**联网只用于两处「起草 / 参考」，从不当结论**：
   ① §3.4 起草衰变预测——搜「这类问题一般怎么发展、多久」的 general
   规律做草稿，师傅再把规律**调到这个具体个案**；② §6.2 搜【实际效果
   的真照片】做视觉参考 / 现实锚定，真照片不进片、进片的是据它生成的
   动画科普版。两处都是「翻参考书起草」，**师傅确认才是结论**。这与
   knowledge-video「agent 联网研究建 fact inventory 当事实源」正好相反
   ——我们的 fact inventory 是师傅 verified 的 `diagnosis_plan`。
9. **动画信息图统一视觉语言（One Infographic Visual Language）**——所有
   AI 生成镜头（Shot 2/3）和所有 remotion 叠层（标注 / 图解 / 时间轴 /
   署名卡）统一用**动画信息图 / motion-graphics 风格**：flat、克制、
   图示化，像教科书插图 / 产品爆炸图。不是照片级写实、不是恐怖猎奇、
   不是科幻炫技。好处有三：① 风格自检可靠（信息图是清晰的视觉类别）
   ② 一致性强（自由度低，重生成 / 动起来都稳）③ 把活从不可控的 i2v
   挪给可控的 remotion。真照片（Shot 1/4）+ 信息图（其余）= 全片一套
   连贯的「实拍 + 信息图」语言。
10. **口播驱动 → 音画分开（Voiceover-Driven, Audio-Visual Separated）**
    ——主路径**音画分开**：voiceover 单独成 Phase（克隆/选定声线 + TTS +
    ASR 出 word-level SRT），视觉单独生成，Phase 05 合成。Phase 04 即使
    用带原生音频的引擎，其音频一律丢弃。**音画同出**是 §3.5 师傅可选的
    第 4 条路（产出简化结构）+ §8 灾难降级兜底——两种情况下**声线都必须
    定义**，绝不让模型随机配音。

## 1. 铁律（最高优先级）

### 1.1 红线（绝对不要）

- **旁白出具体维修操作步骤**——「先关总阀，再用扳手拆开 X」这类教外行
  动手的内容一律不进脚本。只讲「问题是什么 + 不修的后果 + 该找专业的修」
- **AI 生成的镜头冒充真实 footage**——Shot 2 / Shot 3 是明确的信息图 /
  剖视 / 推演视觉风格，不做成「像是拍出来的」，避免观众分不清真假
- **科普风格跑偏**——AI 镜头做成恐怖 / 恶心猎奇（霉菌怼脸吓人）/ 科幻
  发光炫技 / 夸大严重度制造恐慌。判据：「这张图师傅敢不敢直接甩给客户看」
- 用「大家好」「今天教大家」「你家水管是不是也……」这类客套 / 套路开场
- **出未经 Phase 01 诊断确认的 claim**——旁白里每个关于「墙里发生了什么」
  的判断都必须能追溯到 verified `diagnosis_plan`
- **句子过长**——旁白单句中文 >40 字 / 英文 >25 词，TTS 念出来平板
- **数字 / 单位 / 缩写写成不可念形式**（`1/2"` / `PSI` / `3/4 inch` /
  `60 PSI`）——TTS 念错就废
- 把 Shot 1 / Shot 4 做成 AI 重绘的「假照片」——这两个镜头必须基于师傅
  上传的真照片，只做 zoom / 标注 / 图解叠加
- 衰变可视性低（如低水压）还硬做衰变动画——没说服力，改对比静帧
- **没拿到师傅明确确认就 promote / 推进下一 phase**——每 phase 切换都是
  hard gate

### 1.2 必须做到

- **真照片做 Shot 1 / Shot 4 的锚点**——zoom / 标注 / 图解叠加都在真照片
  上做，不重绘
- **诊断在 Phase 01 子门由师傅当场拍板**——`problem_type` +
  `affected_component` + `internal_state` 缺一不可，agent 自己推断没经过
  师傅确认 = 不算过
- **声线方案在 Phase 01 拍板**——有没有音频样本、走克隆还是降级，
  Phase 01 定死
- **Phase 03 配音师傅必须试听**——整段配音 + SRT cue 表呈给师傅，逐 cue
  扫念错 / 术语差，通过才进 Phase 04
- **X-ray 关键帧在批次 B inline 确认**——X-ray 剖视错了 Shot 2 整段废，
  生成后立即 inline 呈给师傅，不等到 Gate 2
- **旁白 TTS 可念性 spell-out**——数字 / 单位 / 缩写一律 spell out
  （`1/2 inch` → `half inch`，`PSI` → `P S I` 或 `pounds per square inch`）
- **署名信息 verbatim 写入**——师傅给的名字 / 电话 / 服务区一字不改进
  signature 卡
- 5 镜头严格 SRT-anchored：`start_time[0] === 0`，
  `start_time[4] + duration[4] ≈ T_voice ±0.05s`，`start_time` 严格递增

### 1.3 工作纪律

- 严格按 5 个 Phase 顺序执行，不跳步
- **关键 mandatory 自检**：
  - Phase 01（绑定 diagnosis + §3.1 照片子门 + §3.3 诊断子门 +
    §3.4 衰变子门 + §3.5 声线子门）
  - Phase 02 Step 2.5（红线扫一遍：无维修操作指令 + spell-out + 反套路 +
    短句）
  - Phase 03 Step 3.4（voiceover_url + srt_url + T_voice 全部到位）
  - Phase 04 三个 user gate（5 镜头切分结构 / X-ray 关键帧 + prompts /
    终版）
  - Phase 05 Step 5.5（最终合成 self-check）
- Phase 01 一旦绑定 diagnosis（photo / problem / decay / voice /
  signature / duration / engine），**下游 Phase 不允许重新决定**——改这里
  = 全片重做
- 视频生成失败的 fallback：**per-shot 换引擎 / 降级到静帧 + remotion /
  标 `quality_tier="degraded"`**，不重写整 storyboard
- 每 Phase 产出 artifact 持久化，跨心跳可读回继续

## 2. 工作流总览（5 Phase / 5 个 artifact）

| Phase | 任务 | 写入 artifact | 用户确认 gate |
|---|---|---|---|
| 01 | 诊断绑定（现场照片 / 问题诊断 / 衰变后果 + 可视性 / 声线方案 / 署名信息 / 目标时长 / 视频引擎） | `diagnosis_plan`（新建） | ✅ 照片 triage(§3.1) + 诊断+问题点(§3.3) + 衰变预测子门(§3.4) + 声线子门(§3.5) + 整体确认(§3.9) |
| 02 | 旁白脚本（5 镜头节拍 / 反套路 + 短句 / TTS 可念性 spell-out / 零维修操作指令）→ 嵌入声线 marker | `narration_script`（新建） | ✅ 整体确认(§4.7) |
| 03 | 克隆师傅声线 + 整段 TTS + ASR 吐 SRT | `voiceover`（新建，含 voiceover_url + srt_url + T_voice + voice_id） | ✅ 试听 gate(§5.5) |
| 04 | 切 5 镜头 → prep（X-ray 关键帧 + 衰变帧 + remotion 图层）→ 视频生成 + 后处理 | `storyboard`（新建，每镜头 video_url 逐段回填） | ✅ Gate 1 切分结构(§6.1.3) + X-ray 关键帧 inline 子门(§6.2.1) + Gate 2 prompts(§6.2.5) + Gate 3 终版(§6.3.1) |
| 05 | 拼接 + 字幕烧录 + 音频（BGM + SFX）+ promote | `final`（新建，promoted） | ✅ 可选层拍板(§7.1) + promote 前确认(§7.6) |

**5 个最终 artifact**：`diagnosis_plan` / `narration_script` / `voiceover` /
`storyboard` / `final`。每个 artifact 的具体内容见附录 A。

> Phase 01 的决策**贯穿所有后续 Phase**——`problem_type` 决定 X-ray 与
> decay 画法；`voice_plan` 决定 Phase 02 marker 语法和 Phase 03 TTS 路径；
> `signature` 进入 Shot 5；`target_duration` 是 SRT 切分的总预算；`engine`
> 决定单镜头时长上限。**改这里 = 全片重做。**

## 3. Phase 01：诊断绑定（照片 / 诊断 / 衰变 / 声线 四道子门）

所有「全片绑定」的决定都在这一步定下来。**诊断是核心**——四道 mandatory
子门由师傅当场拍板。Phase 02–05 引用这些决定，**不允许重新决定**。

**产出**：新建 `diagnosis_plan`，记录现场照片 / 问题诊断 / 衰变后果 +
可视性 / 声线方案 / 署名信息 / 目标时长 / 视频引擎。

### 3.1 现场照片摄入（mandatory 子门：拍摄须知前置 + triage 四分叉）

**现场照片是信任锚点，没有合格照片整个 Skill 不成立。** 本步分三段：
开场前置拍摄须知 → 收图 → VLM triage 四分叉。

#### 3.1.1 开场：前置告知拍摄须知（师傅传图前就说清楚）

Skill 一启动，**先于一切**把拍照要求告诉师傅，别等他传了不合格的图
再返工：

```
拍一张问题照片发我，要求：
1) 近 —— 问题点占画面 1/3 以上，别站太远
2) 清 —— 对焦清楚，别糊
3) 亮 —— 光线够，暗就开手电补光
4) 单 —— 一张照片只拍一个问题点（想讲好几个问题？一条视频先讲一个，
   你可以分几次做，反而能拿到好几条视频）
5) 带环境 —— 留一点周围，让我看出是墙 / 地 / 裸露管 / 器具
6) 真实 —— 必须现场实拍，不能是图纸 / 网图 / 截图 / AI 图

再配一句话说问题（比如「水槽下面接头在滴水」）。
```

#### 3.1.2 收图：VLM triage 四问

师傅上传后（直接传图 / 给社媒 URL → `media-download` 抓成持久化 CDN
URL），agent 用原生 vision 问自己 4 个问题：

1. 这是**真实现场照片**吗？（排除截图 / 图纸 / 网图 / AI 图）
2. 能识别出 **`scene_type`** 吗？（wall / floor / exposed_pipe / fixture）
3. 有**一个清晰的问题主体**吗？在画面**哪个位置**？（→ `subject_location`）
4. 问题区域**够清楚**吗？（对焦 / 光线 / 距离）

#### 3.1.3 四分叉（输入层分叉，全部回环收束到 PASS）

| 分叉 | 触发条件 | 处理 |
|---|---|---|
| **① PASS 可诊断** | 真实 + scene_type 可判 + 单一清晰主体 + 够清 | 记 `subject_location`，进 §3.2 |
| **② RESHOOT 补拍** | 真照片、主体看得出，但太远 / 糊 / 暗 | 按 §3.1.1 须知指出**缺哪条**，请师傅补拍 → 重新 triage |
| **③ DISAMBIGUATE 指认** | 一张拍了整个区域、多个可能问题点 | VLM 列出看到的候选，请师傅选 / 裁切到要讲的那个 → 重新 triage |
| **④ REJECT 不可用** | 不是真实照片 / 完全没有水管相关主体 | 硬拒绝 + 说明原因 + 重发 §3.1.1 须知 → 重新 triage |

> ②③④ 都**回环**到师傅再 triage，最终所有路径收束到 ① PASS。
> **REJECT 是硬拒绝**——图纸 / 网图 / AI 图 / 糊图绝不能进，这是「真照片
> 是信任锚点」的底线。

**未到 PASS 不进 §3.2。**

### 3.2 问题描述

师傅必须给一句话问题描述（如「楼上洗手间下面的天花板在滴水」）。
**单靠照片做 VLM 诊断容易误判**——描述是诊断的必要辅助输入。

### 3.3 诊断 + 问题点定位（mandatory 子门：师傅当场拍板）

**这是本 Skill 最关键的确认节点。** Agent 用原生 vision 读照片，结合
问题描述做诊断，输出：

- `scene_type`：X-ray 要剖开哪种表面——`wall`（墙体 / 天花板）/
  `floor`（地面 / 地板）/ `exposed_pipe`（裸露管段）/ `fixture`（器具
  设备：马桶 / 水槽 / 热水器）四选一
- `problem_type`：`leak`（漏水）/ `clog`（堵塞）/ `corrosion`（腐蚀）/
  `pressure`（水压）四选一
- `affected_component`：受影响的具体部件（如「墙内 PEX 管接头」/
  「水槽下裸露存水弯」/「卫生间地面排水管」）
- `problem_point`：**精确问题点**在画面里的位置——Shot 1 圈哪、Shot 2
  剖哪、Shot 4 图解指哪，全靠它
- `internal_state`：表面之下的现状，1–2 句——**这是 Shot 2 X-ray 要画
  的内容**

> `scene_type` 和 `problem_type` 是两条**正交**的轴：`scene_type` 决定
> Shot 2 **剖开什么表面**，`problem_type` + `internal_state` 决定剖开后
> **露出来看到什么**。同一个 `leak` 可能发生在墙里、地下、或一段裸露
> 水管上——剖法完全不同。

#### problem_type 怎么定：两个信号 → agent 提候选 → 师傅是权威

agent **不「知道」problem_type，只「提候选」**。靠两个信号：

- **信号 1**：师傅一句话描述（「接头在滴水」→ 指向 `leak`）
- **信号 2**：VLM 读照片证据（锈迹 / 铜绿 → `corrosion`；水痕 → `leak`；
  积水 → `clog`）

两信号一致 → 高置信，提给师傅确认。**两信号冲突**（描述说漏水、照片
锈得厉害）→ 不自己拍板，把冲突摊给师傅。描述模糊 + 照片证据弱（典型
是 `pressure`）→ 直接问师傅。**始终：师傅在本子门确认才算数。**

#### 主问题选择：一条视频一个问题（或一条因果链）

定位到主体后，agent 判断这个主体上是不是有多个问题——**条件触发，
只有真检测到多个独立问题才打断师傅**：

- 只看到一个问题 → 不问，正常走诊断
- 看到一条**因果链**（锈穿 → 所以漏）→ 当**一个故事**讲，不问——这
  正好是 Shot 2 X-ray 最好的素材
- 看到**多个独立问题** → 才问师傅：「这根管子上我看到 2 个问题：
  ① …… ② ……。这条视频先讲哪个？另一个可以再跑一次。」师傅选定的
  进 `problem_type`，其余记进 `diagnosis_plan.other_problems_noted`

#### 问题点定位（problem_point）：agent 提候选，师傅确认

**agent 单靠照片判断不出漏点，也不该假装能**——水会跑，看到水的地方
往往不是漏点本身。这一步是「agent 提候选 + 师傅一键确认 / 纠正」。

agent 按 `problem_type` 找视觉证据：

| `problem_type` | 找什么证据 | 证据靠谱度 |
|---|---|---|
| `leak` | 水渍 / 水痕 / 滴落轨迹 / 潮湿发深区 / 白色矿物结垢 | ⚠️ 中——看到水 ≠ 漏点 |
| `clog` | 积水液面 / 返水 / 可见异物 | 高 |
| `corrosion` | 锈迹 / 铜绿 / 管壁变色 / 鼓包 / 剥落 | 高——证据在原位 |
| `pressure` | 几乎无视觉证据 | ✗ 低——必须靠师傅描述 |

agent 在照片上标一个**候选问题点**（生成带红点标记的照片），说明依据
和不确定性。看不出证据时（水压 / 墙后漏 / 地下漏）→ agent 老实说
「照片上看不出明确痕迹」，请师傅指认 / 描述，**不瞎猜**。

呈给师傅（诊断卡 + 带标记的照片）：

```
诊断初版 ↓
[带红色候选问题点标记的照片]

拍的是：      <scene_type>（X-ray 会剖开这种表面）
问题类型：    <problem_type>
受影响部件：  <affected_component>
问题点：      <problem_point 文字描述> —— 我先标在红点处
表面之下现状：<internal_state>

⚠️ 看到水 / 痕迹的地方不一定是问题点本身。请确认：
1) 诊断准、红点对 —— 锁定
2) 诊断对，但问题点是别处（指 / 描述）—— 我重新标
3) 诊断要调（指出哪点）—— 重新诊断
4) 完全不对 —— 换角度重诊断 / 补充描述
```

师傅纠正了问题点（「水渍在这、漏点其实在上面那个接头」）→ 记下「表面
痕迹 vs 实际问题点」的落差——**这个落差本身就是 Shot 2 X-ray 最有
说服力的内容**。

**没拿到明确「准 + 红点对」不进 §3.4**——诊断 / 问题点错 = X-ray
画错 = 整片错。

### 3.4 衰变后果 + 可视性（mandatory 子门：师傅是预测的权威）

衰变是**关于未来的预测**——零可见证据，比诊断更不能让 agent 拍板。
**师傅是预测的权威**。流程是「agent 联网搜 general 规律起草 → 师傅把
规律调到这个个案确认」：

1. load `external-research` 搜「这类问题（`problem_type`）一般怎么发展、
   多久」的 general 规律
2. 据此起草 `decay_outcome`，**明说这是按一般规律搜来的草稿，不是结论**
3. 师傅把 general 规律**调到这个具体个案**确认（「网上说铜管能用 50 年，
   但这水质半年就穿」）——师傅确认的版本才是真相源

输出：

- `decay_outcome`：衰变后果 + 大致时间线（如「半年渗水、一年锈穿喷水」）
  ——**这是 Shot 3 要画的内容**；时间刻度由师傅定，不写死
- `decay_visibility`：`high`（衰变视觉戏剧，如漏水→霉变→塌陷）/
  `low`（衰变不直观，如低水压）

呈给师傅：

```
不修会怎样？（我按一般规律搜 + 猜了一版，你纠正）↓
我搜到的一般规律：<search 摘要>
我的草稿：       <decay_outcome 草稿>

这个发展和时间线，放到你这个具体情况，对吗？
1) 差不多 —— 锁定
2) 不对（程度 / 时间线）—— 师傅给准的版本
```

师傅确认的版本 = `decay_outcome` 真相源。**没拿到明确确认不进 §3.5。**

> `decay_visibility` 是结构变量——`high` → Shot 3 用渐进衰变动画；
> `low` → Shot 3 改用「正常 vs 异常」对比静帧 + 数据标注，不硬做无说服力
> 的动画。

### 3.5 声线方案（mandatory 子门：师傅拍板）

**声线方案决定下游 marker 语法、TTS 路径、以及整条产出结构，必须
Phase 01 定死。** 4 条路由师傅选：

```
旁白用谁的声音？
1) 我上传一段我自己的录音 —— 克隆我的声线（最高信任，推荐）
2) 用通用 AI 旁白声线 —— 我搜 2-3 个候选给你试听
3) 不要旁白，纯字幕
4) 音画同出 —— 一个模型出画带音（快 / 简单，但拿不到克隆声线和
   严格 5 镜头结构，产出简化结构）

（选 1 请把音频样本一并发我）
```

- **选 1** → `voice_plan: "clone"`，样本存 `voice_sample_url`。样本没到位
  = 不算过（补样本 / 改选）
- **选 2** → `voice_plan: "minimax_tts"`。load `search-voice` 按师傅描述
  搜 **2-3 个候选**，直接用库内 sample_url 让师傅**试听 + 选定**（光看
  voice_id 名字推断音色不靠谱），选定的存 `voice_id`
- **选 3** → `voice_plan: "captions_only"`
- **选 4** → `voice_plan: "av_joint"`（音画同出）。**声线仍必须定义**：
  走选 1 或选 2 的声线确定流程定下声线，只是产出走 §6 / §8 的音画同出
  简化分支。**绝不让模型随机配音。**

**任一路：声线 / voice_id 没定 = 不算过。**

### 3.6 署名信息（可选输入，3 档优雅降级）

Shot 5 是最低风险镜头——**所有署名输入都可选，视频永远跑得通**。
两个可选输入：

- **`brand_image`**：logo / **师傅本人真实头像** / 工程车照片——任何
  **真实**的品牌视觉（师傅真头像是真照片，不违反「AI 不扮演师傅」，
  反而加信任）
- **文字信息**：名字 / 电话 / 服务区（可只给一部分）

3 档降级：

| 师傅给了什么 | Shot 5 出什么 |
|---|---|
| 品牌图 + 文字信息 | 品牌图 + 信息的个性化卡（`has_branding: true`）|
| 仅文字信息（无品牌图）| 纯文字排版的个性化卡（remotion 干净排版）|
| 啥都没给 | 通用 CTA 卡「这种墙里的事，越早找人看越省钱，找专业的看看」 |

> **红线：不伪造品牌。** 师傅没 logo → 绝不 AI 生成假 logo，用文字排版
> 或退到通用卡。`brand_image` 必须是师傅给的真东西，没有就不放。

### 3.7 目标时长 / 横竖比 / 视频引擎（Step 1.7）

- `target_duration`：默认 `60s`，可选 `45s` / `90s`（硬上限 90s）
- `aspect_ratio`：固定 `9:16`（社媒竖版）
- `engine`：i2v 主力 `可灵 3.0`（输入保真度最强，最适合「真照片→微动」），
  失败降级链 `Veo 3.1` → `Seedance 2.0-fast`。注：i2v 只服务 Shot 1/4，
  科普动画 Shot 2/3 走 remotion，不经视频引擎。**实际最优引擎以 mv.land
  测试为准。**

### 3.8 自检清单（mandatory）

- [ ] `source_photo_url` 已到位且通过 §3.1 triage（PASS）？
- [ ] 问题描述已收到？
- [ ] **诊断（含 `scene_type` / `problem_type` / `problem_point`）已经过
  §3.3 师傅拍板**（agent 自诊断没经过师傅 = 不算过）？
- [ ] `decay_outcome` + `decay_visibility` 已定？
- [ ] **声线方案已经过 §3.5 师傅拍板**（clone → `voice_sample_url`；
  minimax_tts / av_joint → `voice_id` 已试听选定）？
- [ ] `signature.has_branding` 已定，有品牌信息时名字 / 电话 / 服务区
  verbatim 写入？
- [ ] `target_duration` / `aspect_ratio` / `engine` 已定？

任一不通过，回到对应 Step 完成。

### 3.9 整体确认（mandatory gate，进 Phase 02 前）

自检全部通过后，把完整 `diagnosis_plan` 呈给师傅做最后整体确认——
微观 step（问题描述 / 衰变后果 / 署名 / 时长引擎）的产出都在这里
一次性扫过：

```
诊断绑定完成 ↓

现场照片：    [source_photo_url]
拍的是：      <scene_type>
问题：        <problem_type> · <affected_component>
问题点：      <problem_point>
表面之下现状：<internal_state>
不修的后果：  <decay_outcome>（衰变可视性：<decay_visibility>）
旁白声线：    <voice_plan>
署名：        <signature 摘要 / 通用兑底>
时长/比例/引擎：<target_duration> · 9:16 · <engine>

这版绑定 OK 吗？锁定后下游 Phase 不再改这些。
1) OK 锁定 —— 进 Phase 02
2) 改某一项（指出哪项）—— 回对应 §3.x
```

**未拿到明确 OK 不进 Phase 02。**

## 4. Phase 02：旁白脚本（5 镜头节拍 + 反套路 + 短句 + TTS 可念性）

把 verified `diagnosis_plan` 转成一段**极短**的旁白脚本。脚本按 5 个镜头
的节拍组织，每个 beat 对应一个镜头——这让 Phase 04 的 SRT 切分能干净地把
每个 beat 映射到对应镜头的时间区间。

> **为什么旁白要极短**：本 Skill 不是剧本驱动型。最重的产出物是 X-ray
> 剖视动画，不是脚本。一条 60s 视频的旁白控制在 **8–12 句口语短句**——
> 旁白是视觉叙事的辅助，不是主角。

**产出**：新建 `narration_script`，含按 5 beat 组织的脚本正文（已嵌入声线
marker，零维修操作指令）。

### 4.1 5 镜头节拍结构

| Beat | 对应镜头 | 旁白讲什么 | 约束 |
|---|---|---|---|
| Beat 1 | Shot 1 annotate | 用一个具体事实 punch 出问题在哪 | 反套路 hook，不问候 |
| Beat 2 | Shot 2 xray | 墙内 / 管内正在发生什么（`internal_state`） | 只描述现状，不教修 |
| Beat 3 | Shot 3 decay | 不修的后果（`decay_outcome`） | 讲后果，制造紧迫感 |
| Beat 4 | Shot 4 repair | 正确的修复方向是什么（概念，非操作步骤） | **零操作指令**（红线） |
| Beat 5 | Shot 5 signature | 短 CTA：找专业的看看 | 一句话收尾 |

每个 beat 1–3 句。`voice_plan: "captions_only"` 时脚本仍要写——它会作为
字幕文本，只是 Phase 03 不跑 TTS。

### 4.2 反套路 + 短句（写作纪律 hard guidance）

**反套路 hook（Beat 1）**：第一句**不要**用问候 / 问句 / generic claim。
用一个具体事实 / 部件 / 现象直接 punch。

| ❌ 套路 hook | ✅ 反套路 hook |
|---|---|
| 「你家天花板是不是也漏水？」 | 「这块天花板上的水渍，三天大了一圈。」 |
| 「今天教大家认识水管问题。」 | 「这个接头，里面已经在渗水。」 |

**短句优先**：
- 中文 ≤25 字 / 句为常态，**>40 字必须拆**
- 英文 ≤15 词 / 句为常态，**>25 词必须拆**
- 节奏长短交替

**反套路收尾（Beat 5）**：不用「希望对你有帮助」「记得点赞」；用一句
直接的 CTA 收（「这种墙里的事，越早找人看越省钱。」）。

### 4.3 零维修操作指令（红线，写脚本时就守住）

Beat 4 讲「修复方向」**只到概念层**，不到操作层：

| ❌ 操作指令（禁止） | ✅ 修复概念（允许） |
|---|---|
| 「关掉总阀，用管钳拆下旧接头，缠生料带……」 | 「这个接头需要换成新的，并且重新做密封。」 |
| 「你可以自己买个 X 装上」 | 「这是个需要专业工具的活儿。」 |

判据：看完 Beat 4，外行**不应该**觉得「我自己能修」。

### 4.4 TTS 可念性 spell-out（写脚本时就处理）

| 红线 | ❌ 写法 | ✅ 写法 |
|---|---|---|
| 管径分数 | `1/2"` / `3/4 inch` | `half inch` / `three quarter inch` |
| 压力单位 | `60 PSI` | `sixty P S I` / `sixty pounds per square inch` |
| 缩写 | `PEX` / `PVC` | `P E X` / `P V C`（空格强制逐字） |
| 温度 | `140°F` | `one forty Fahrenheit` / `华氏 140 度` |

### 4.5 嵌入声线 marker

`voice_plan` ≠ `captions_only` 时，在脚本里嵌入声线 marker：
- **暂停**：`<#X#>`（`<#0.3#>` 句间 / `<#0.8#>` beat 转折 / `<#1.2#>`
  数据炸弹之后让后果「沉底」）
- **情绪**：inline parenthesized interjection（`(顿)` / `(轻叹)`）
- 具体 marker 语法以 Phase 03 load `tts` skill 时读到的为准

### 4.6 自检清单（mandatory）

- [ ] 脚本按 5 beat 组织，每 beat 对应一个镜头？
- [ ] **Beat 4 零维修操作指令**——外行看完不会觉得「我自己能修」？
- [ ] 每个「墙里发生了什么」的判断都能追溯到 verified `diagnosis_plan`？
- [ ] Beat 1 是反套路 hook（具体事实 punch，不是问候 / 问句）？
- [ ] **句长红线**：无 >40 字（中）/ >25 词（英）的句子？
- [ ] 数字 / 单位 / 缩写都已 spell out？
- [ ] 总句数 8–12 句（60s 基准，按 `target_duration` 缩放）？
- [ ] 声线 marker 已嵌入（`captions_only` 除外）？

### 4.7 整体确认（mandatory gate，进 Phase 03 前）

自检全部通过后，把完整 5 beat 脚本呈给师傅确认——这是配音前最后一道
关：

```
旁白脚本完成（5 beat / <句数> 句 / 估算 <s>）↓

Beat 1 · Shot 1 标注：  <脚本片段>
Beat 2 · Shot 2 X光：   <脚本片段>
Beat 3 · Shot 3 后果：  <脚本片段>
Beat 4 · Shot 4 修复：  <脚本片段>
Beat 5 · Shot 5 署名：  <脚本片段>

脚本 OK 吗？（确认后会用这段去配音）
1) OK —— 进 Phase 03 配音
2) 改某个 beat（指出哪个 + 怎么改）—— 我重写
3) 整体语气 / 节奏不对 —— 说方向，我重写
```

**未拿到明确 OK 不进 Phase 03。**

## 5. Phase 03：旁白配音（克隆声线 + TTS + ASR）

按 `voice_plan` 把 `narration_script` 转成配音。先克隆声线（如需），整段
一次性 TTS，ASR 上游直接吐 SRT，让师傅试听 + 逐 cue 扫一遍。**任何环节
崩了，回 Phase 02 改脚本路径干净。**

**产出**：新建 `voiceover`，含 `voiceover_url` / `srt_url` / `T_voice`
（ffprobe 量出）/ `voice_id` / `voice_plan` / `cue_count`。

> `voice_plan: "captions_only"` 时：跳过 Step 3.1–3.2，不跑 TTS。
> `voiceover_url` 置 `null`，`T_voice` 由 `narration_script` 估算
> （按字数 × 语速），`srt_url` 由脚本 + 估算时长生成。直接进 Step 3.5。

### 5.1 Step 3.1 — 克隆声线（仅 `voice_plan: "clone"`）

load `create-voice` skill：
- 输入 `diagnosis_plan.voice_sample_url`（师傅的录音样本）
- 走 clone 路径，输出 `voice_id` + `voice_vendor`

样本质量差（背景噪音大 / 时长不足）→ 提示师傅重录，或降级到
`minimax_tts`（需师傅同意）。

### 5.2 Step 3.2 — 整段 TTS

load `tts` skill：
- `voice_plan: "clone"` → 用 Step 3.1 的 `voice_id`
- `voice_plan: "minimax_tts"` → 用 `diagnosis_plan.voice_id`（§3.5 师傅
  试听选定的声线）
- `text` = `narration_script` 正文（**verbatim 带 marker 提交，不剥**）
- 输出 `voiceover_url` ← TTS 返回的 audio_url
- `T_voice` ← `ffprobe` 量出（**不要拿 ASR 末段 cue.end 推**——可能漏尾
  静音）

### 5.3 Step 3.3 — ASR 吐 SRT

load `audio-transcription` skill：
- `audio_url` = Step 3.2 的 `voiceover_url`
- `output_format=srt`（关键参数——让上游直接返回 SRT）
- 输出 `srt_url`，作为 `voiceover` artifact 的 single source of truth

cue 数 sanity：解析后 cue 数为 0 → 重试 1 次；仍失败上报师傅。

### 5.4 Step 3.4 — 自检（mandatory）

- [ ] `voiceover_url` 到位（`captions_only` 除外）？
- [ ] `srt_url` 到位，cue 数 > 0？
- [ ] `T_voice` 由 ffprobe 量出，且 ≤ `target_duration` + 5s 容差？
- [ ] `voice_plan: "clone"` 时 `voice_id` 来自 Step 3.1 克隆产出？

### 5.5 Step 3.5 — 师傅试听（mandatory，进 Phase 04 前）

把 verified voiceover 呈给师傅：

```
配音已生成 ↓

总时长 T_voice: <s>
声线: <voice_plan>（clone 时标注「你的克隆声线」）

[整段配音试听](<voiceover_url>)

字幕：
| # | 时间 | 文本 |
|---|---|---|
| 1 | 0:00 – 0:04 | … |
| ... |

要进入 Phase 04（分镜）吗？
1) 继续
2) 重配（改语速 / 情绪）—— 回 Step 3.2
3) 重克隆声线 —— 回 Step 3.1
4) 改某 cue 文本（指出 cue # 和改成什么）—— patch 后重 verify 再呈
5) 改脚本（回 Phase 02）
```

### 5.6 配音失败 fallback 阶梯

1. **重试 1 次**（瞬时网络 / quota 抖动多数能过）
2. **调 TTS 参数**：语速 / 情绪 / model 档
3. **重克隆 / 换样本**：克隆声线抖 / 哑 → 提示师傅重录样本
4. **降级 voice_plan**：克隆始终失败 → 经师傅同意降到 `minimax_tts`；
   仍不行 → `captions_only`，整片标 `quality_tier="degraded"`
5. **退一步改 script**：脚本太长 / marker 太密 → 回 Phase 02 拆短

## 6. Phase 04：分镜生成（3 批次：切分 → prep → 生成）

**产出**：新建 `storyboard`。5 个固定镜头的 segment 列表 + 每镜头 prep 后
的 references / prompt + compose-ready `video_url`。`voiceover_url` /
`srt_url` / `T_voice` 已在 Phase 03 产出，**Phase 04 直接消费、不再做
TTS / ASR**。

**3 批次结构**（每批次之间用户 gate 卡同步点）：

```
批次 A · 切 5 镜头     → Gate 1 · MD 表格 preview 结构确认
批次 B · prep          → Gate 2 · X-ray 关键帧 + prompts 确认
批次 C · 生成 + 后处理 → Gate 3 · storyboard 终版确认
```

### 6.1 批次 A · 切 5 镜头（Step 4.1）

**镜头结构固定**——不像变长 segment 的 skill，本 Skill 永远是 5 个镜头：
`annotate` / `xray` / `decay` / `repair` / `signature`。批次 A 的工作是
把这 5 个镜头**按旁白 SRT 锚定到时间轴**。

#### 6.1.1 Step 4.1.1 — SRT-anchored 切分

按 `voiceover.srt_url` 的 word-level 时间戳，把 Phase 02 的 5 个 beat
映射到 5 个镜头的时间区间：

1. Beat N 的第一个 word 在 SRT 里的 `start` = Shot N 的 `start_time`
   （**直接读出，不累加**）
2. Shot N 的 `duration` = Shot (N+1) 的 `start_time` − Shot N 的
   `start_time`；最后一镜 `duration = T_voice − start_time`

**每镜头填这些字段**（`video_prompt` 留空，留到批次 B）：

| 字段 | 内容 |
|---|---|
| `shot_number` | 1–5 |
| `shot_type` | `annotate` / `xray` / `decay` / `repair` / `signature` |
| `start_time` | 从 SRT 直接读（精确小数，Shot 1 === 0） |
| `duration` | 精确秒数（不累加） |
| `source` | Shot 1/4 = `real_photo`；Shot 2/3 = `ai_generated`；Shot 5 = `remotion_card` |
| `references[]` 占位 | 见 6.1.2 |
| `subtitle` | 该镜头对应的旁白文本片段 |

**核心 invariant**：
- `start_time[0] === 0`
- `start_time[4] + duration[4] ≈ T_voice ±0.05s`
- `start_time` 严格递增
- 相邻一致性 `start_time[i] + duration[i] ≈ start_time[i+1] ±0.01s`
- 单镜头 `duration` ≤ `engine` 的 i2v 上限（可灵 3.0 基准；超了在
  批次 C 用 ffmpeg 慢放 / 定格补足，或拆子镜头）

#### 6.1.2 references 占位规则

| Shot | source | references[] 占位 |
|---|---|---|
| Shot 1 annotate | real_photo | `{source_photo, url:<diagnosis_plan.source_photo_url>}` + `{annotation_overlay, url:""}`（remotion 产出） |
| Shot 2 xray | ai_generated | `{xray_keyframe, url:""}`（批次 B gpt-image-2 产出，**强制**） |
| Shot 3 decay | ai_generated | `decay_visibility=high` → `{decay_frames, url:""}`（批次 B gpt-image-2 产出 3 帧）；`low` → `{comparison_stills, url:""}` |
| Shot 4 repair | real_photo | `{source_photo, url:<...>}` + `{repair_overlay, url:""}`（remotion 产出） |
| Shot 5 signature | remotion_card | `{signature_card, url:""}`（批次 B remotion 产出） |

#### 6.1.3 Step 4.2 — Gate 1（MD 表格 preview 结构确认）

写完 storyboard v1 + finalize verify 后，用 markdown 表格 preview：

```
| # | 类型 | 时间 | 时长 | source | subtitle 片段 |
|---|---|---|---|---|---|
| 1 | annotate  | 0:00 – 0:08 | 8.2s | real_photo    | "…" |
| 2 | xray      | 0:08 – 0:24 | 16.0s| ai_generated  | "…" |
| 3 | decay     | 0:24 – 0:42 | 18.0s| ai_generated  | "…" |
| 4 | repair    | 0:42 – 0:54 | 12.0s| real_photo    | "…" |
| 5 | signature | 0:54 – 1:00 | 6.0s | remotion_card | "…" |

总时长: 末镜 end = <T>s（T_voice = <T_voice>s, 偏差 <±0.05s>）✓

结构 OK 吗？
1) OK —— 进批次 B
2) 改某镜头的 duration / 切分
3) 重新切（回 Step 4.1.1）
```

**未拿到明确 OK 不进批次 B。**

### 6.2 批次 B · prep（Step 4.4）

> **批次 B 做三件事**：① 生成 X-ray 关键帧（核心，inline 确认）
> ② 生成衰变帧 / 对比静帧 ③ 写各镜头 video prompt + remotion 图层 spec。

#### 6.2.1 Step 4.4.1 — X-ray 关键帧（核心，inline mandatory 子门）

X-ray 剖视是本 Skill 的核心卖点，关键帧错了 Shot 2 整段废。Shot 2 用
**3 层拆解**做，每层用最可控的工具，把不可控的 i2v 约束到最小：

| 层 | 工具 | 做什么 |
|---|---|---|
| **L1 关键帧** | gpt-image-2 | 信息图风格的剖视关键帧，构图配准真照片（**本步**）|
| **L2 扫描转场** | remotion | X 光扫描线，真照片 → 信息图关键帧（§6.2.3 + §6.3）|
| **L3 内部动效** | **remotion 为主** | 锈蚀扩散 / 管壁变薄做成动画图示；i2v 仅作可选底层微动 / fallback（§6.2.4 + §6.3）|

**L1 关键帧生成流程**：

```
1) load image-generation skill，用 gpt-image-2（信息图风格 + 文字渲染 +
   多图编辑一致性最强；banana-2 作 fallback）
2) 输入：source_photo_url + scene_type + problem_type + internal_state
   + problem_point
3) prompt：保留原照片机位 / 构图 / problem_point 位置，按下方两轴组合
   「剖开」表面、露出内部现状。**风格：动画信息图（flat、克制、图示化，
   像教科书爆炸图），不是照片级写实**
4) 上传 CDN，patch 回 storyboard Shot 2 的 references.xray_keyframe.url
5) ★ 两道判官验收（见下）
6) 师傅 OK → 进 Step 4.4.2；改/重做 → 重写 prompt → 重生成 → 重新 patch
```

**X-ray 关键帧 = 两条正交轴的组合**：

**轴 1 — `scene_type` 决定剖开什么表面**：

| `scene_type` | 剖法 |
|---|---|
| `wall` | 剖开墙面 / 天花板，露出墙腔内的管路 |
| `floor` | 向下剖开地面 / 地板，露出楼板内或地下的管线 |
| `exposed_pipe` | 剖开管壁本身，露出管腔内部 |
| `fixture` | 剖开器具外壳（马桶 / 水槽 / 热水器），露出内部结构 |

**轴 2 — `problem_type` + `internal_state` 决定露出来看到什么**：

| `problem_type` | 露出什么 |
|---|---|
| `leak` | 水迹渗入周围材料（龙骨 / 保温层 / 楼板 / 地基） |
| `clog` | 管腔内壁堆积物 / 异物卡点 |
| `corrosion` | 金属锈蚀 / 管壁变薄 |
| `pressure` | 节点处水流受阻示意 |

prompt = 轴 1 的剖法模板 + 轴 2 的内部内容（取自 `internal_state`）。
例：`exposed_pipe` + `clog` = 剖开这段裸露水管的管壁，露出管腔内壁
堆积的矿物质 / 异物卡点；`wall` + `clog` 则是剖开墙面、露出墙内那段
管子再剖开它——两者的关键帧构图完全不同。

**两道判官验收（各查各的，叠起来补盲区）**：

**判官 1 — Agent 自检（给师傅看之前，滤掉明显废品）**：

- [ ] **构图配准**：关键帧 vs `source_photo_url`——机位 / 取景 / 主体一致？
- [ ] **剖对地方**：剖开的是 `problem_point` 处，不是别处？
- [ ] **内部对齐**：露出的内部 = `internal_state` 文字（说「锈蚀变薄」就得
  画变薄的锈管，不能画干净的、也不能画堆积物）？
- [ ] **风格合规**：是动画信息图风格，**不是**照片级写实 / 恐怖猎奇 /
  科幻发光？

任一不过 → agent **自己重生成**，不拿废品去烦师傅。

**判官 2 — 师傅确认（inline 子门，只有领域专家能判的）**：

```
Shot 2 X-ray 关键帧 ↓
[url]
画的是：<internal_state>
1) 这是我那根管子吗、剖开位置对吗 —— 连得上现实吗
2) 里面画的合不合理 —— 管路走向 / 结构符合水管常识吗
3) 严重程度对吗 —— 有没有夸大 / 淡化（不能夸大制造恐慌）
→ OK / 调一调 / 重做
```

**未拿到师傅明确 OK 不进 Step 4.4.2。**

#### 6.2.2 Step 4.4.2 — 衰变帧 / 对比静帧

Shot 3 是 Shot 2 X-ray 关键帧的「时间续集」——同一个剖视构图往后推时间。
做法和 Shot 2 同构：搜实际效果做参考 → 锚定生成动画科普版 → 两道判官。

**Step A — 搜实际效果做视觉参考（可选，现实锚定）**：按师傅 §3.4 确认的
`decay_outcome` 圈定关键词（师傅说「渗水」就搜 seeping，别搜 burst），
load `external-research` / `browser-use` / `stock-media` 抓几张**真实
照片**做参考。真照片**不进片**，只把生成锚在现实上。搜不到就跳过。

**Step B — 锚定生成动画科普版**：

- **`decay_visibility: high`**：load `image-generation`，用 **gpt-image-2**
  （多图编辑一致性最强），**基于 Shot 2 确认过的 X-ray 关键帧** + Step A
  参考，编辑出 **3 张渐进衰变图**（时间刻度按 `decay_outcome`），patch 回
  `references.decay_frames`。同一张底 = 天然一致
- **`decay_visibility: low`**：不硬做衰变动画——出「正常 vs 现状」**对比
  静帧** 或交给 remotion 做**数据动画**（压力表指针下掉等），patch 回
  `references.comparison_stills`

**Step C — 两道判官验收（在 §6.2.5 Gate 2 确认）**：

- **Agent 自检**：3 帧和 `decay_outcome` 对齐？信息图风格？和 Shot 2
  关键帧构图一致？
- **师傅确认**：恶化程度真实吗？有没有夸张吓人？

> Shot 3 的衰变预测在 §3.4 子门已被师傅锁死——衰变帧只是「画出已确认的
> 预测」，所以确认放 Gate 2 即可，不单设 inline 子门。

#### 6.2.3 Step 4.4.3 — remotion 图层 spec

为以下镜头写 remotion 组件 spec（数据驱动，师傅信息 / 标注文字当 props）：

- **Shot 1 annotation_overlay**：红圈 + 标签指向问题点（坐标 + 文字）
- **Shot 3 时间轴标签**（`high` 时）：3 月 / 6 月 / 1 年的时间戳浮层
- **Shot 4 repair_overlay**：修复概念图解叠加（箭头 + 简短文字）
- **Shot 5 signature_card**（3 档，见 §3.6）：品牌图 + 文字 → 个性化品牌
  卡；仅文字 → 纯文字排版个性化卡（不伪造 logo）；啥都没 → 通用 CTA 卡。
  统一套动画信息图视觉语言

**镜头内音画对齐**：所有 remotion 叠层（标注 / 时间轴标签 / kinetic 文字）
按 `voiceover.srt_url` 的 **word-level 时间戳定时**——旁白念到「水渍」红圈
才弹出，念到「半年」时间轴才跳——实现镜头内音画同步。

**字幕 vs 叠层位置协调**：Phase 05 烧录的字幕固定底部安全区；remotion
叠层一律避开底部（红圈 / 箭头放 problem_point 附近、时间轴标签放上方、
署名卡那段字幕避让或省略），两者不重叠。

#### 6.2.4 Step 4.4.4 — 写 video prompt（写入 `video_prompt`）

| Shot | prompt 写什么 |
|---|---|
| Shot 1 annotate | 真照片 i2v：缓慢 zoom-in 推向问题点，轻微镜头运动 |
| Shot 2 xray | L3 以 remotion 动效为主（锈蚀扩散 / 管壁变薄做成动画图示）；i2v 仅作可选底层微动——prompt 写「信息图关键帧的轻微底层动态」，约束到最小 |
| Shot 3 decay | `high`：3 张衰变帧 remotion 过渡推进 + 时间计数器（i2v 可选微动）；`low`：对比静帧 / remotion 数据动画 |
| Shot 4 repair | 真照片 i2v：稳定镜头，为 remotion 图解叠加留呼吸位 |
| Shot 5 signature | 纯 remotion 卡片，无需 video gen |

**每段 prompt 末尾统一 append**：「9:16 竖版，动画信息图 / motion-graphics
风格，flat 克制图示化，明确区别于真实拍摄」——守住「统一信息图视觉语言」
+「AI 镜头不冒充 footage」两条。

#### 6.2.5 Step 4.6 — Gate 2（X-ray 关键帧 + prompts 整体确认）

视频生成贵且慢。**生成前必须让师傅整体审一遍**——X-ray 关键帧在 4.4.1
已 inline 看过，这里整体审 prompts + 衰变帧 + remotion 图层 spec。

### 6.3 批次 C · 视频生成 + 后处理（Step 4.7）

每镜头经历 **生成 → 后处理 → patch storyboard** 三步。

| Shot | 生成 | 后处理 |
|---|---|---|
| Shot 1 annotate | `video-generation` i2v（真照片）| ffmpeg trim + 叠 remotion annotation_overlay + mux voiceover slice |
| Shot 2 xray | L2 remotion 扫描转场 + L3 remotion 动效（i2v 可选底层微动）| ffmpeg trim + mux voiceover slice |
| Shot 3 decay | remotion 衰变过渡 + 时间轴标签（i2v 可选微动）| ffmpeg trim + mux voiceover slice |
| Shot 4 repair | `video-generation` i2v（真照片）| ffmpeg trim + 叠 remotion repair_overlay + mux voiceover slice |
| Shot 5 signature | `remotion` 渲染署名卡 | ffmpeg trim + mux voiceover slice（或 BGM-only） |

**4 个转场（全归 remotion，有意义地标记「实拍 ↔ 信息图」切换，不用随机花哨效果）**：

| 转场 | 性质 | remotion 做什么 |
|---|---|---|
| Shot 1→2　实拍→信息图 | 「带你看进去」 | X 光扫描线擦除（§6.2.1 L2）|
| Shot 2→3　信息图→信息图 | 时间快进 | 同剖视底无缝过渡 + 时间加速感，不硬切 |
| Shot 3→4　信息图→实拍 | 「回到现实」 | 反向扫描 / 溶解 |
| Shot 4→5　实拍→署名卡 | 收尾 | 干净淡出 / 滑入 |

**voiceover slice mux**：用 `voiceover.voiceover_url` + ffmpeg
`-ss <start_time> -t <duration>` 现 seek 替换音轨，**不预切上传**。
`voice_plan: "captions_only"` 时本步不 mux 旁白，留到 Phase 05 配 BGM。

**ffmpeg 单遍合并示例**（trim + audio 替换）：

```bash
ffmpeg -y \
  -i <generated_shot> \
  -ss <start_time> -t <duration> -i <voiceover.voiceover_url> \
  -t <duration> -map 0:v:0 -map 1:a:0 \
  -c:v copy -c:a aac -b:a 192k -avoid_negative_ts make_zero \
  <output.mp4>
```

#### 6.3.1 Step 4.9 — Gate 3（storyboard 终版确认）

```
批次 C 完成（quality_tier=<normal|degraded>）。
你可以单击任一 Shot 进 media_player 预览 ↓

要进入 Phase 05（合成）吗？
1) 继续
2) 重生成 Shot N（不改 prompt / 关键帧）
3) 改 Shot N 的 prompt 或关键帧重新生成
4) 改切分（回 Step 4.1.1，推翻批次 A+B+C）
```

### 6.4 视频生成失败 fallback

1. **重试 1 次**
2. **换引擎**：可灵 3.0 → Veo 3.1 → Seedance 2.0-fast（仍在真实菜单里）
3. **降级到静帧**：i2v 始终失败 → 该镜头降级为关键帧定格 + remotion
   动效 + ken_burns，标该镜头 degraded
4. 整片标 `quality_tier="degraded"`，原因记 `final.meta.notes`，**不重写
   整 storyboard**

## 7. Phase 05：合成出片（拼接 + 可选层 + Promote）

Storyboard 里每镜头 `video_url` 已经是 **compose-ready segment**——
Phase 04 已 trim 到精确 duration + mux voiceover slice。本 Phase 只剩
**timeline 拼接** + 可选层。

```
storyboard shots（已 trim + voiceover-muxed）
    ↓ Step 5.2  normalize + concat
timeline.mp4
    ↓ Step 5.3  [可选] 字幕烧录
    ↓ Step 5.4  [可选] 音频增强（BGM + SFX）
    ↓ Step 5.5/5.6  self-check + write verified + 确认 + promote
final.mp4
```

### 7.1 Step 5.1 — 可选层拍板（mandatory 子门）

合成动手前先把可选层和师傅拍板：

```
[1] 字幕烧录
  A. 烧录字幕（voice_plan=captions_only 时强制；其他可选）
  B. 不烧字幕

[2] 音频增强
  🎵 BGM 背景音乐
    C. search-audio 库内搜 BGM（推荐）
    D. 不要 BGM
  🔊 SFX 音效（剖视「揭开」音、衰变「滴答」时间音等）
    E. search-audio 库内搜 SFX
    F. 不要 SFX

常见组合：
- 标准社媒片 → A + C（字幕 + BGM）
- 网感强 → A + C + E
- 纯净版 → A only
```

`voice_plan: "captions_only"` → 字幕烧录强制开启（A）。

### 7.2 Step 5.2 — Normalize + 拼接 timeline（必做）

5 个镜头来自不同生成路径，分辨率 / fps 可能漂移。**Concat 前 normalize
到 9:16 画布**：`1080×1920 / 30fps / yuv420p / H.264`。

用 `ffmpeg` skill 的 Resize + Simple Concat recipe。音频一并 concat——
每镜头已含对应 voiceover slice，concat 后 timeline 的 audio = 完整旁白
自动重组。

输出：`timeline.mp4`。

### 7.3 Step 5.3 — 字幕烧录（可选 / captions_only 时强制）

load `create-subtitles` skill：
- `source_url` = 上一步输出
- `srt_content` = `voiceover.srt_url` 的内容（**不要重跑 ASR**）
- `delivery = burned_video`

无衬线白文 + 半透明黑底。

### 7.4 Step 5.4 — 音频增强（按 Step 5.1 拍板的组合跑）

- **BGM**：load `search-audio` 在 bgm 库搜 → ffmpeg 按 EBU R128 混音，
  旁白存在时对 BGM 做 ducking（侧链压缩）。BGM volume 默认 `0.85`，
  voiceover `1.0`
- **SFX**：load `search-audio` 在 sfx 库搜剖视 / 衰变相关音效 → ffmpeg
  在对应镜头时间点 mux，SFX volume `0.4–0.7`

> 无对白时（`captions_only`）不使用 `add-audio-cues`——它面向有 dialogue
> 的视频。直接 search-audio + ffmpeg mix。

### 7.5 Step 5.5 — Self-check（mandatory）

- [ ] 总时长 ≈ `voiceover.T_voice`（ffprobe ±0.5s）？
- [ ] Aspect ratio = `9:16`（1080×1920）？
- [ ] Shot 1 / Shot 4 确实基于真照片，未被 AI 重绘？
- [ ] 字幕语种与脚本一致？`captions_only` 时字幕已烧录？
- [ ] 任何镜头走过 Phase 04 fallback / 任何可选层缺失 →
  `quality_tier="degraded"`？
- [ ] `signature.has_branding=true` 时 Shot 5 的名字 / 电话 / 服务区
  verbatim 正确？

### 7.6 Step 5.6 — Write Verified + 师傅确认 → Promote

先 verify（不 promote），呈给师傅：

```
已写入 verified final（quality_tier=<normal|degraded>）
成片 URL: <video_url>
总时长: <s>
启用的可选层: <字幕 / BGM / SFX / 无>

要 promote 这条最终成片吗？
1) Promote
2) 重做某可选层（回 5.3 / 5.4）
3) 改 storyboard 重新生成（回 Phase 04）
4) 标 degraded 但不 promote
```

师傅 OK → `dl artifact finalize --slot=final --mode=verify_and_promote`。
至此 skill 完成。

### 7.7 Step 5.7 — 社交文案（可选，meta 而非主线）

如果师傅计划发社媒，起草标题 + caption + hashtag 包，patch 进
`final.content[0].meta.social_copy`。**发布本身不在本 SOP 范围内。**

## 8. Fallback 阶梯（per-shot / per-Phase 的降级路径）

| 场景 | 处理 |
|---|---|
| Phase 01 师傅给的照片太糊 / 看不清问题 | 提示师傅补拍更清晰的照片或换角度；照片是信任锚点，不能用糊图硬上 |
| Phase 01 诊断师傅说不对 | 补充问题描述 / 换角度重诊断；**绝不带着错诊断进 Phase 02** |
| Phase 03 克隆声线失败 | 重试 → 调参 → 重克隆 / 换样本 → 经师傅同意降 `minimax_tts` → `captions_only`，标 degraded |
| Phase 04 X-ray 关键帧师傅始终不满意 | 重写 prompt 重生成；多次仍不行 → 换 banana / gpt-image-2 生图模型 |
| Phase 04 单镜头视频生成失败 | retry 1 次 → 换引擎 → 降级到关键帧定格 + remotion 动效；整片标 degraded；**不重写整 storyboard** |
| Phase 04 衰变帧组一致性差 | gpt-image-2 重生；仍差 → `decay_visibility` 降级为 `low` 走对比静帧 |
| Phase 05 BGM / SFX 搜不到合适的 | 跳过该层，原因记 `meta.notes`；不强塞错调音频 |
| **音画分开核心链路灾难性失败**（多镜头全挂 / 合成崩 / SRT-anchored 结构出不来）| **降级到音画同出**：真照片 + 浓缩 prompt 喂音画同出引擎直出简化视频；**声线必须定义**（取 `diagnosis_plan` 已确认声线；模型不支持指定声线则退回「单独配音 mux」，绝不随机声线）；标 `quality_tier="degraded"`，`meta.notes` 记原因 |
| 预算耗尽 mid-pipeline | finalize 已完成的，剩下的降级到最简形态，ship 时标 degraded |

**核心 fallback 原则**：
- 不重写整 storyboard
- per-shot 换引擎 / 降级到静帧 + remotion
- 全部 fallback 都试过仍失败 → 整片标 `quality_tier="degraded"`，降级
  原因记到 `final.content[0].meta.notes`，照常 ship

## 9. 完成规则（最终交付前 must-pass）

- 5 个 slot 全 verified：`diagnosis_plan` / `narration_script` /
  `voiceover` / `storyboard` / `final`；`final` 是唯一终端 artifact，
  必须 `verify_and_promote`
- 诊断 / 声线方案 / 署名信息 / 目标时长 / 引擎**全部对齐 Phase 01 的决定**
- **Shot 1 / Shot 4 基于师傅的真照片**，未被 AI 重绘
- **旁白零维修操作指令**——Beat 4 只到修复概念层
- Storyboard 5 镜头 **start_time + duration 双字段严格 SRT-anchored**：
  `start_time[0] === 0` / `start_time[4] + duration[4] ≈ T_voice ±0.05s`
  / 序列递增
- X-ray 关键帧经过批次 B inline 子门师傅确认
- Phase 04 三个 user gate 都拿到师傅明确 OK
- 成片 `aspect_ratio = 9:16`，总时长 ≤ 90s

## 10. Constraints（领域约束）

- **没有合格现场照片做不了**——真照片是信任锚点；不过 §3.1 triage 的图
  （图纸 / 网图 / AI 图 / 糊图 / 无法识别主体）一律硬拒绝，不硬上
- **目前支持 4 类工地图**——`wall`（墙体 / 天花板）/ `floor`（地面 /
  地板）/ `exposed_pipe`（裸露管段）/ `fixture`（器具设备）。不在这
  4 类内、或一张图框了多个问题点，回环要求师傅重拍 / 指认
- **一条视频只讲一个问题，或一条因果链**——多个独立问题 → 师傅选一个，
  其余分多次跑（§3.3 主问题选择）
- **诊断不联网搜索**——师傅是事实源，agent 是可视化工；联网做水管诊断
  有幻觉和责任风险（§0 理念 8）
- **没有问题描述做不了**——单靠照片 VLM 容易误判
- **不出安全攸关的具体维修操作指令**——只展示「问题是什么 / 不修的后果 /
  大致修复概念」，实际维修操作建议归师傅
- **不做真人实拍 talking-head 镜头**——AI 不扮演师傅本人，这是信任设计
  的底线
- **不强加硬性时长**下限——但成片 ≤90s（围绕短镜头拼接的能力边界）
- **不在本 SOP 内发布**——发社媒是下游单独 stage
- **v1 仅水管工**——骨架可复用到 HVAC / 电工 / 屋顶 / 灭虫，后续版本扩展
- **不在 SOP 里枚举 sub-skill 参数**（生图模型菜单 / 视频引擎选项 / TTS
  voice 列表等）——load 相关 skill 现场读它的文档

---

## 附录 A：5 个 artifact 装什么（自然语言描述）

每个 artifact 是 user-visible slot，按 Artifact 协议走 wrapper +
content_layout + content[] 形态。

### A.1 `diagnosis_plan`（Phase 01 产出，全片绑定）

**layout**：single + markdown + `is_segment=false`。

content[0] 装：
- `source_photo_url`：师傅上传 / media-download 抓取的现场照片（已过
  §3.1 triage PASS）
- `problem_description`：师傅给的一句话问题描述
- `subject_location`：§3.1 triage 阶段 VLM 标出的大致主体区域
- `scene_type`：`wall` / `floor` / `exposed_pipe` / `fixture`——决定
  Shot 2 X-ray 剖开什么表面（与 `problem_type` 正交）
- `problem_type`：`leak` / `clog` / `corrosion` / `pressure`
- `affected_component`：受影响的具体部件
- `problem_point`：师傅确认过的精确问题点位置（Shot 1 圈 / Shot 2 剖 /
  Shot 4 图解的锚点）
- `other_problems_noted`：多问题场景下师傅没选的其余问题（供 `final.meta`
  「再跑一次」提示）；单问题时为空
- `internal_state`：表面之下的现状（Shot 2 X-ray 要画的内容）
- `decay_outcome`：不修的后果（Shot 3 要画的内容）
- `decay_visibility`：`high` / `low`
- `voice_plan`：`clone` / `minimax_tts` / `captions_only` / `av_joint`（音画同出）
- `voice_sample_url`：师傅声线样本（仅 `clone`）
- `voice_id`：minimax_tts / av_joint 时师傅试听选定的声线 ID（clone 时
  Phase 03 产出）
- `signature`：`{has_branding, brand_image, name, phone, service_area}`
  ——`brand_image` 是师傅给的真实品牌视觉（logo / 真头像 / 工程车），
  可空；都不给时走通用 CTA 兑底
- `target_duration`：`45s` / `60s` / `90s`
- `aspect_ratio`：`9:16`（固定）
- `engine`：`可灵 3.0`（默认 i2v 主力，降级 Veo 3.1 → Seedance 2.0-fast）

下游所有 Phase 引用——改这里 = 全片重做。

### A.2 `narration_script`（Phase 02 产出，5 镜头节拍脚本）

**layout**：single + markdown + `is_segment=false`。

content[0] 装：
- `## Script`：按 5 beat 组织的脚本正文，每 beat 标注对应镜头；已嵌入
  声线 marker（`captions_only` 时无 marker）；零维修操作指令；反套路
  hook；短句；TTS 可念性 spell-out 已处理
- `beat_count`：固定 5
- `estimated_duration`：按字数 × 语速估算

### A.3 `voiceover`（Phase 03 产出，配音 + SRT）

**layout**：single + markdown + `is_segment=false`。

content[0] 装：
- `voiceover_url`：整段 TTS 输出（`captions_only` 时为 `null`）
- `srt_url`：ASR 直接吐的 SRT（`captions_only` 时由脚本 + 估算时长生成）
- `T_voice`：ffprobe 量出的总时长
- `voice_id` / `voice_vendor`：`clone` 时来自 create-voice 产出
- `voice_plan`：继承自 `diagnosis_plan`
- `cue_count`
- `text` markdown：Overview + Audio 试听 + Subtitles 表

### A.4 `storyboard`（Phase 04 产出，5 镜头分镜板）

**layout**：list（index_prefix='Shot'）+ card horizontal +
`is_segment=true`（`detail.variant='media_player'`）。每张 card 一个镜头，
固定 5 张。

每镜头 card 装：
- `shot_number`：1–5
- `shot_type`：`annotate` / `xray` / `decay` / `repair` / `signature`
- `start_time` + `duration`：SRT-anchored 双字段（**不存 end_time，
  不累加**）
- `source`：`real_photo` / `ai_generated` / `remotion_card`
- `video_prompt`：批次 B 写入的 video gen prompt
- `references[]`：见 6.1.2（X-ray 关键帧 / 衰变帧 / remotion 图层 URL）
- `provider_params`：完整 blob（engine 来自真实菜单）
- `subtitle`：该镜头对应的旁白文本片段
- `video_url`：批次 C 回填，compose-ready
- `voiceover_url` / `srt_url`：冗余携带（从 voiceover slot 复制）

### A.5 `final`（Phase 05 产出，最终视频 + 元数据）

**layout**：single + video + `is_segment=false`。promotable=true。

content[0] 装：
- `video_url`：最终视频 publicly accessible URL
- `duration`（秒）
- 继承自 `diagnosis_plan`：source_photo_url / problem_type / voice_plan /
  signature / aspect_ratio / engine
- 继承自其他 artifact：voiceover_url / subtitle_url（voiceover.srt_url）
- `bgm_url` / `sfx_urls`：Step 5.4 选定的音频
- `quality_tier`：`normal` / `degraded`（任何镜头走过 fallback 都标
  degraded）
- `created_at`：ISO 8601 时间戳
- `meta.social_copy`（可选）：标题 / caption / hashtag 包
- `meta.notes`（如有 fallback）：每个降级镜头 / 缺失可选层的原因

---

## 附录 B：格式约定速查

| 维度 | 约定 |
|---|---|
| 核心交付 | 一条 9:16 竖版诊断科普短视频，45–90s |
| 镜头结构 | 固定 5 镜头：annotate / xray / decay / repair / signature |
| 总时长 | 默认 60s，可选 45s / 90s；硬上限 90s |
| Aspect ratio | 固定 `9:16` |
| Canvas | 1080×1920 / 30fps / yuv420p / H.264 |
| 单镜头时长 | ~5–25s；单次 i2v 调用 ≤ engine 上限，超了 ffmpeg 慢放 / 定格补足 |
| 视频引擎（i2v） | `可灵 3.0` 主力（只服务 Shot 1/4），降级 `Veo 3.1` → `Seedance 2.0-fast`；测试时验证 |
| 生图（X-ray 关键帧 + 衰变帧组） | `gpt-image-2`（信息图风格 + 文字渲染 + 多图一致性最强）；`banana-2` 作 fallback |
| 旁白声线 | §3.5 师傅 4 选 1：克隆声线 / minimax-tts（search-voice 选）/ 纯字幕 / 音画同出；声线必须定义 |
| 旁白长度 | 8–12 句口语短句（60s 基准），按 target_duration 缩放 |
| 句长红线 | 中文 ≤25 字 / 句常态、>40 字必须拆；英文 ≤15 词 / 句常态、>25 词必须拆 |
| 字幕烧录 | SRT / 无衬线白文 / 半透明黑底；`captions_only` 时强制；固定底部安全区 |
| Voiceover volume | `1.0`（权威音轨） |
| BGM volume | 默认 `0.85`，旁白存在时对 BGM 做 ducking |
| SFX volume | `0.4`–`0.7` |
| SRT-anchored 时间模型 | `start_time` + `duration` 双字段，**不存 end_time**；remotion 叠层按 word-level SRT 定时 |
| 真照片镜头 | Shot 1 / Shot 4 必须基于师傅真照片，只做 zoom / 标注 / 叠加，不重绘 |
| AI 镜头 | Shot 2 / Shot 3 统一动画信息图视觉语言，不冒充真实 footage |
| 转场 | 4 个全归 remotion，有意义地标记「实拍 ↔ 信息图」切换 |
| 音频架构 | 口播驱动 → 音画分开；音画同出仅 §3.5 师傅可选 + §8 灾难兜底 |

---

## 附录 C：关键 skill 引用速查

| Skill / 操作 | 用途 | 在哪一 Phase |
|---|---|---|
| `media-download` | 师傅给社媒 / 网页 URL 时，把照片抓成持久化 CDN URL | Phase 01 §3.1（可选）|
| `search-voice` | minimax_tts / av_joint 路径搜 2-3 候选声线，师傅试听选定 | Phase 01 §3.5 |
| `external-research` / `browser-use` / `stock-media` | §3.4 搜衰变 general 规律做起草依据；§6.2 搜【实际效果真照片】做视觉参考（均不当结论 / 不进片）| Phase 01 §3.4 + Phase 04 §6.2 |
| `image-generation` | `gpt-image-2` 出 X-ray 关键帧 + 衰变帧组（信息图风格；`banana-2` fallback）| Phase 04 §6.2.1 / §6.2.2 |
| `create-voice` | 从师傅音频样本克隆声线，产出 voice_id | Phase 03 §5.1（仅 clone）|
| `tts` | 整段旁白脚本一发 TTS（带声线 marker）| Phase 03 §5.2 |
| `audio-transcription` | ASR + 时间戳，`output_format=srt` 直接吐 SRT | Phase 03 §5.3 |
| `video-generation` | i2v——只服务 Shot 1/4 真照片动效（`可灵 3.0` 主力 → `Veo 3.1` → `Seedance`）| Phase 04 §6.3 |
| `remotion` | **主力**：4 转场 / 内部动效 / 标注 / 时间轴 / 修复图解 / 署名卡（数据驱动 + word-level SRT 定时）| Phase 04 §6.2 + §6.3 |
| `ffmpeg` | trim / overlay / concat / mux audio / 慢放 / 定格 / normalize | 贯穿 Phase 04 + 05 |
| `create-subtitles` | 字幕烧录（消费 voiceover.srt_url）| Phase 05 §7.3 |
| `search-audio` | 库内搜 BGM + SFX | Phase 05 §7.4 |

共 12 个原子 skill。具体调用接口见各 skill 文档，本 SOP 不重复 sub-skill 参数。
**主动不用**：`lipsync` / `motion-control`（不做真人 / 数字人）· `music-generation`
（BGM 走 search-audio）· `add-audio-cues`（无对白不适用）等。

---

## 附录 D：用户（师傅）确认节点总览

🔴 mandatory 子门（Phase 内关键点，当场拍板）｜🟠 Phase hard gate（结尾，过了才进下一 Phase）｜🟡 inline 子门（生成即确认）

| Phase | 节点 | 类型 | 师傅确认什么 |
|---|---|---|---|
| 01 | §3.1 照片 triage 四分叉 | 🔴 | 照片合格吗（PASS 才进）|
| 01 | §3.3 诊断 + 问题点定位 | 🔴 | scene_type / problem_type / problem_point |
| 01 | §3.4 衰变后果 | 🔴 | agent 联网搜 general 规律起草 → 师傅把规律调到这个个案 |
| 01 | §3.5 声线方案 | 🔴 | 4 选 1（克隆 / 通用试听选 / 纯字幕 / 音画同出）|
| 01 | §3.9 整体确认 | 🟠 | 整个 diagnosis_plan 锁定 |
| 02 | §4.7 整体确认 | 🟠 | 5 beat 旁白脚本 |
| 03 | §5.5 师傅试听 | 🟠 | 配音 + 逐 cue 扫一遍 |
| 04 | §6.1.3 Gate 1 | 🟠 | 5 镜头切分结构（MD 表格 preview）|
| 04 | §6.2.1 X-ray 关键帧 | 🟡 | 核心卖点，生成即确认（两道判官）|
| 04 | §6.2.5 Gate 2 | 🟠 | prompts + 衰变帧 + remotion spec |
| 04 | §6.3.1 Gate 3 | 🟠 | storyboard 终版 |
| 05 | §7.1 可选层拍板 | 🔴 | 字幕 / BGM / SFX 要哪些 |
| 05 | §7.6 promote 前确认 | 🟠 | 最终成片 → promote |

共 13 个确认节点。每个 Phase 都有结尾 hard gate——**没有 Phase 自动往下走**。
