# 跨阶段约定（Conventions）

PHASE.md 持有命令权威，本文件持有跨阶段共享的格式约定、Fallback 阶梯、
确认节点总览。reasoning methodology only——不含命令路由。

## 1. 格式约定速查

| 维度 | 约定 |
|---|---|
| 核心交付 | 9:16 竖版诊断科普短视频，45–90s |
| 镜头结构 | 固定 5 镜头：annotate / xray / decay / repair / signature |
| 总时长 | 默认 60s，可选 45s / 90s；硬上限 90s |
| Canvas | 1080×1920 / 30fps / yuv420p / H.264 |
| 单镜头时长 | ~5–25s；单次 i2v 调用 ≤ engine 上限（可灵 3.0 基准），超了 ffmpeg 慢放 / 定格补足 |
| 视频引擎（i2v）| `可灵 3.0` 主力（只服务 Shot 1/4），降级 `Veo 3.1` → `Seedance 2.0-fast`；实际最优引擎测试时验证 |
| 生图 | `gpt-image-2`（X-ray 关键帧 + 衰变帧组，信息图风格 + 文字 + 多图一致性）；`banana-2` fallback |
| 旁白声线 | §3.5 师傅 4 选 1：克隆声线 / minimax-tts（search-voice 选）/ 纯字幕 / 音画同出；声线必须定义 |
| 旁白长度 | 8–12 句口语短句（60s 基准），按 target_duration 缩放 |
| 句长红线 | 中文 ≤25 字 / 句常态、>40 字必拆；英文 ≤15 词 / 句常态、>25 词必拆 |
| TTS 可念性 | 管径分数 / 压力单位 / 缩写 / 温度一律 spell out |
| 字幕烧录 | SRT / 无衬线白文 / 半透明黑底；captions_only 强制；固定底部安全区 |
| 音量 | Voiceover 1.0 / BGM 0.85（旁白存在时 ducking）/ SFX 0.4–0.7 |
| SRT-anchored 时间模型 | `start_time` + `duration` 双字段，不存 end_time；remotion 叠层按 word-level SRT 定时 |
| 真照片镜头 | Shot 1 / Shot 4 必须基于师傅真照片，只 zoom / 标注 / 叠加，不重绘 |
| AI 镜头 | Shot 2 / Shot 3 统一动画信息图视觉语言，不冒充真实 footage |
| 转场 | 4 个全归 remotion，有意义地标记「实拍 ↔ 信息图」切换 |
| 音频架构 | 口播驱动 → 音画分开；音画同出仅 §3.5 师傅可选 + §8 灾难兜底 |
| 署名卡 3 档 | 品牌图+文字 → 个性化品牌卡；仅文字 → 纯文字排版卡；啥都没 → 通用 CTA 卡。不伪造品牌 |

## 2. Fallback 阶梯

共享阶梯：`retry` → `alternate`（换引擎 / 参数）→ `degrade` →
`partial_finalize` → `emit_failure_metadata`。

| 场景 | 处理 |
|---|---|
| 照片太糊 / 看不清 | 提示师傅补拍 / 换角度；不用糊图硬上 |
| 诊断师傅说不对 | 补描述 / 换角度重诊断；绝不带错诊断进 Phase 02 |
| 克隆声线失败 | 重试 → 调参 → 重克隆 / 换样本 → 经师傅同意降 minimax_tts → captions_only，标 degraded |
| X-ray 关键帧师傅始终不满意 | 重写 prompt 重生成；多次仍不行 → banana-2 fallback |
| 单镜头视频生成失败 | retry → 换引擎 → 降级到关键帧定格 + remotion 动效；整片标 degraded；不重写整 storyboard |
| 衰变帧组一致性差 | gpt-image-2 重生；仍差 → decay_visibility 降 low 走对比静帧 |
| BGM / SFX 搜不到 | 跳过该层，原因记 meta.notes；不强塞错调音频 |
| 音画分开核心链路灾难性失败 | 降级到音画同出（声线必须定义；模型不支持指定声线则退回单独配音 mux），标 degraded |
| 预算耗尽 mid-pipeline | finalize 已完成的，剩下降级到最简形态，ship 时标 degraded |

**核心原则**：不重写整 storyboard；per-shot 换引擎 / 降级到静帧 +
remotion；全部 fallback 走过仍失败 → 整片标 `quality_tier="degraded"`，
降级原因记 `final.content[0].meta.notes`，照常 ship。**不假装部分成功是
终态成功；不把「问用户」当最终 fallback。**

## 3. 用户（师傅）确认节点总览（13 个）

🔴 mandatory 子门（Phase 内关键点）｜🟠 Phase hard gate（结尾，过了才进
下一 Phase）｜🟡 inline 子门（生成即确认）

| Phase | 节点 | 类型 | 师傅确认什么 |
|---|---|---|---|
| 01 | 照片 triage 四分叉 | 🔴 | 照片合格吗（PASS 才进）|
| 01 | 诊断 + 问题点定位 | 🔴 | scene_type / problem_type / problem_point |
| 01 | 衰变后果 | 🔴 | agent 联网搜 general 规律起草 → 师傅调到这个个案 |
| 01 | 声线方案 | 🔴 | 4 选 1（克隆 / 通用试听选 / 纯字幕 / 音画同出）|
| 01 | 整体确认 | 🟠 | 整个 diagnosis_plan 锁定 |
| 02 | 整体确认 | 🟠 | 5 beat 旁白脚本 |
| 03 | 师傅试听 | 🟠 | 配音 + 逐 cue 扫一遍 |
| 04 | Gate 1 | 🟠 | 5 镜头切分结构（MD 表格 preview）|
| 04 | X-ray 关键帧 | 🟡 | 核心卖点，生成即确认（两道判官）|
| 04 | Gate 2 | 🟠 | prompts + 衰变帧 + remotion spec |
| 04 | Gate 3 | 🟠 | storyboard 终版 |
| 05 | 可选层拍板 | 🔴 | 字幕 / BGM / SFX 要哪些 |
| 05 | promote 前确认 | 🟠 | 最终成片 → promote |

**每个 Phase 都有结尾 hard gate——没有 Phase 自动往下走。** 微观 step
（问题描述 / 衰变后果 / 署名 / 时长引擎等）的产出滚入所属 Phase 结尾的
整体确认 gate，由师傅一次性扫过，不单独打断。

> 注：本表是 workflow 路由事实（哪些点必须等师傅）。审批密度 / checkpoint
> 暂停的具体交互风格由 runtime policy 决定，不在本 skill 包内。
