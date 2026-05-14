# 出图模板 · 三种复刻模式的 prompt 骨架

Step 2 用 Banana 2 出图。prompt 由 `plan` 拼出来，按 `replica_mode` 选骨架。

---

## 通用规格参数（拼在每条 prompt 末尾）

| 平台 | 加在 prompt 里的规格描述 |
|:---|:---|
| 小红书 | `3:4 vertical cover, 1080x1440, 小红书笔记封面风格` |
| Instagram 4:5 | `4:5 vertical, 1080x1350, Instagram feed cover, 高级氛围感` |
| Instagram 1:1 | `1:1 square, 1080x1080, Instagram grid cover` |
| YouTube | `16:9 horizontal thumbnail, 1920x1080, 高对比强冲击, 关键文字主体避开右下角` |

通用画质后缀：`高清, 锐利, 干净的排版, 文字清晰可读`

---

## 模式 A · `style_only` 风格复刻

只复刻视觉风格，主体和文字全新生成。

```
生成一张 [平台] 封面图。
版式：[reference_formula.layout]
构图：[reference_formula.composition]
配色：[reference_formula.color]
文字层级：[reference_formula.text_hierarchy]
情绪钩子：[reference_formula.emotion_hook]
—— 以上是要复刻的视觉风格 ——
主体内容：[user_content.subject 的文字描述，全新生成]
封面文字：主标题"[user_content.main_title]"，副标题"[user_content.sub_title]"
[规格参数] [画质后缀]
```

## 模式 B · `subject_swap` 主体替换

保留参考的版式 + 背景 + 文字布局，把主体换成用户上传的主体图。**需要把用户主体图作为输入图传给 Banana 2。**

```
[输入图：用户主体图]
把这张图里的主体放进以下封面版式：
版式：[reference_formula.layout]
主体位置与占比：[reference_formula.composition]
背景与配色：[reference_formula.color]
封面文字：主标题"[user_content.main_title]"，[文字层级与修饰描述]
保持用户主体的外形特征不变，只调整光线和背景使其融入封面。
[规格参数] [画质后缀]
```

## 模式 C · `template_match` 模板套用

版式 / 配色 / 字体层级 1:1 还原，只换文字和主体。

```
严格按以下模板生成 [平台] 封面，版式和配色精确还原：
版式：[reference_formula.layout]（精确位置、比例不变）
配色：[reference_formula.color]（色值尽量一致）
文字层级：[reference_formula.text_hierarchy]（字号字重排版位置一致）
—— 仅替换以下内容 ——
主体：[user_content.subject]
主标题文字："[user_content.main_title]"
副标题/角标："[user_content.sub_title]"
[规格参数] [画质后缀]
```

---

## 文字处理

- **默认（embed）**：prompt 里直接写明文字内容，让 Banana 2 出带字封面。
- **降级（blank_for_post）**：文字糊 / 错字 / 排版崩 → prompt 改为「在 [位置] 留出文字空间，不要生成文字」，出无字版，再给用户文字位置 + 字号建议。
- 中文文字尤其容易糊，主标题超过 12 字时优先考虑留白版。

## 出图失败降级链

```
Banana 2 出图
  ├─ 文字糊/错字 → 同模型出无字留白版
  ├─ 出图失败   → 切「即梦图片生成」重试
  └─ 仍失败     → cover_image 标 degraded，保留 plan 和参考公式，告知用户
```
