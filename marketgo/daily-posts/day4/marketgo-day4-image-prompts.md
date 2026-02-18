# marketgo Day 4 配图 Prompts

## 🎨 方案 A：AI 图片生成 (Midjourney/DALL-E/Gemini Imagen)

### 图片 1：Dashboard 主界面展示

**Midjourney/DALL-E Prompt:**
```
A clean, minimal marketing dashboard interface screenshot, dark mode, modern UI design, showing a simple weekly content calendar with 3 scheduled posts, next 30 days timeline preview, and one prominent "Create New" button, flat design, purple and blue gradient accents, professional SaaS product, 4k, high quality, screenshot style --ar 16:9 --v 6
```

**简化版 (Gemini Imagen):**
```
Clean minimal marketing dashboard, dark mode, simple calendar showing weekly posts, 30-day timeline, one create button, purple blue gradient, modern SaaS UI, screenshot style
```

**中文版 (如果用中文 AI):**
```
简洁的营销仪表板界面，深色模式，现代化UI设计，显示本周内容日历（3个已排程帖子），未来30天时间线预览，一个醒目的"创建新内容"按钮，扁平化设计，紫蓝渐变色调，专业SaaS产品风格，高质量截图效果
```

---

### 图片 2：复杂工具 vs marketgo 对比图

**Midjourney/DALL-E Prompt:**
```
Split screen comparison: LEFT side showing a cluttered, overwhelming marketing tool interface with 20+ tabs, multiple sidebars, popup windows, messy UI, stressed user; RIGHT side showing marketgo's clean single-screen dashboard, minimal design, calm user, labeled "BEFORE" and "AFTER", infographic style, high contrast, modern design --ar 16:9 --v 6
```

**简化版:**
```
Before/after split screen, left: cluttered marketing tool with 20 tabs and popups, right: clean marketgo single screen dashboard, infographic style, high contrast
```

**中文版:**
```
对比图，左侧：杂乱的营销工具界面，20多个标签页，多个侧边栏，弹窗，用户焦虑；右侧：marketgo简洁的单屏仪表板，极简设计，用户轻松，标注"之前"和"之后"，信息图风格，高对比度
```

---

### 图片 3：功能区域标注图

**Midjourney/DALL-E Prompt:**
```
Marketing dashboard UI with 3 highlighted sections labeled with clean annotations: "This week's content - ready to post" (top section with calendar cards), "Next 30 days - auto-scheduled" (middle timeline), "Create new - 2 clicks" (bottom CTA button), modern interface, purple highlights, clean typography, product feature showcase style --ar 16:9 --v 6
```

**简化版:**
```
Dashboard with 3 annotated sections: weekly content calendar, 30-day timeline, create button, clean labels, purple highlights, modern UI
```

**中文版:**
```
仪表板界面，3个突出显示的区域并带有清晰标注："本周内容-准备发布"（顶部日历卡片）、"未来30天-自动排程"（中间时间线）、"创建新内容-2次点击"（底部按钮），现代界面，紫色高亮，清晰字体
```

---

## 🎨 方案 B：Figma/Canva 设计模板

### 设计规范

**配色方案:**
- 主色：`#7C3AED` (紫色)
- 辅色：`#3B82F6` (蓝色)
- 背景：`#0F172A` (深色)
- 文字：`#F1F5F9` (浅灰白)
- 强调：`#10B981` (绿色 - 成功状态)

**字体:**
- 标题：Inter Bold 24-32px
- 正文：Inter Regular 14-16px
- 标注：Inter Medium 12-14px

**布局:**
- 宽度：1200px
- 高度：630px (Twitter 最佳尺寸)
- 内边距：40px
- 圆角：12px (卡片)

---

### 图片 1 布局：

```
┌─────────────────────────────────────────┐
│  marketgo Dashboard                      │
│                                          │
│  ┌──────────────────────────────────┐   │
│  │  This Week (3 posts scheduled)   │   │
│  │  ┌─────┐ ┌─────┐ ┌─────┐        │   │
│  │  │Mon  │ │Wed  │ │Fri  │        │   │
│  │  └─────┘ └─────┘ └─────┘        │   │
│  └──────────────────────────────────┘   │
│                                          │
│  Next 30 Days ████████████░░░░░         │
│                                          │
│  [ + Create New Content ]                │
│                                          │
│  "Clean. Simple. No BS."                 │
└─────────────────────────────────────────┘
```

---

### 图片 2 布局：

```
┌──────────────┬──────────────┐
│   BEFORE     │    AFTER     │
├──────────────┼──────────────┤
│ ╔══════════╗ │              │
│ ║Tab1│Tab2│ │  marketgo    │
│ ╠══════════╣ │              │
│ ║Sidebar│  │ │  ┌────────┐ │
│ ║       │  │ │  │Content │ │
│ ║       │  │ │  └────────┘ │
│ ║[Popup]│  │ │              │
│ ╚══════════╝ │  [Create]   │
│              │              │
│ 20 tabs      │  1 screen   │
│ 50 buttons   │  2 clicks   │
│ 3 hours      │  0 learning │
└──────────────┴──────────────┘
```

---

### 图片 3 布局：

```
┌─────────────────────────────────────────┐
│            ┌──────────────────────┐     │
│            │ This week's content  │←─┐  │
│            │ ready to post        │  │  │
│            └──────────────────────┘  │  │
│                                      │  │
│  ┌────────────────────────────────┐ │  │
│  │ Next 30 days - auto-scheduled  │←─┤  │
│  │ ████████████████░░░░░░░░       │ │  │
│  └────────────────────────────────┘ │  │
│                                      │  │
│         ┌──────────────┐            │  │
│         │ Create new   │←───────────┘  │
│         │  2 clicks    │               │
│         └──────────────┘               │
└─────────────────────────────────────────┘
```

---

## 🎨 方案 C：HTML/CSS 生成 (可直接截图)

### 使用方法：
1. 复制下面的 HTML 代码
2. 保存为 `.html` 文件
3. 在浏览器打开
4. 截图 (Cmd+Shift+4 on Mac)

### 图片 1 代码：

```html
<!DOCTYPE html>
<html>
<head>
<style>
* { margin: 0; padding: 0; box-sizing: border-box; }
body {
  font-family: 'Inter', -apple-system, sans-serif;
  background: #0F172A;
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  padding: 40px;
}
.dashboard {
  width: 1200px;
  background: linear-gradient(135deg, #1E293B 0%, #0F172A 100%);
  border-radius: 24px;
  padding: 60px;
  box-shadow: 0 20px 60px rgba(0,0,0,0.5);
}
h1 {
  color: #F1F5F9;
  font-size: 36px;
  margin-bottom: 40px;
  font-weight: 700;
}
.week-section {
  background: #1E293B;
  border-radius: 16px;
  padding: 30px;
  margin-bottom: 30px;
  border: 1px solid #334155;
}
.week-title {
  color: #94A3B8;
  font-size: 14px;
  margin-bottom: 20px;
  text-transform: uppercase;
  letter-spacing: 1px;
}
.posts {
  display: flex;
  gap: 20px;
}
.post-card {
  flex: 1;
  background: linear-gradient(135deg, #7C3AED 0%, #3B82F6 100%);
  border-radius: 12px;
  padding: 20px;
  color: white;
}
.day {
  font-size: 12px;
  opacity: 0.9;
  margin-bottom: 8px;
}
.post-title {
  font-size: 16px;
  font-weight: 600;
}
.timeline {
  background: #1E293B;
  border-radius: 16px;
  padding: 30px;
  margin-bottom: 30px;
  border: 1px solid #334155;
}
.timeline-bar {
  height: 12px;
  background: #334155;
  border-radius: 6px;
  overflow: hidden;
  margin-top: 15px;
}
.timeline-fill {
  width: 70%;
  height: 100%;
  background: linear-gradient(90deg, #7C3AED 0%, #3B82F6 100%);
}
.create-btn {
  background: linear-gradient(135deg, #10B981 0%, #059669 100%);
  color: white;
  font-size: 18px;
  font-weight: 600;
  padding: 20px 40px;
  border-radius: 12px;
  border: none;
  cursor: pointer;
  width: 100%;
  transition: transform 0.2s;
}
.create-btn:hover {
  transform: translateY(-2px);
}
.tagline {
  text-align: center;
  color: #7C3AED;
  font-size: 24px;
  font-weight: 700;
  margin-top: 40px;
  letter-spacing: 1px;
}
</style>
</head>
<body>
<div class="dashboard">
  <h1>marketgo Dashboard</h1>

  <div class="week-section">
    <div class="week-title">This Week (3 posts scheduled)</div>
    <div class="posts">
      <div class="post-card">
        <div class="day">Monday 10:00 AM</div>
        <div class="post-title">Week 1 Progress Update</div>
      </div>
      <div class="post-card">
        <div class="day">Wednesday 10:00 AM</div>
        <div class="post-title">Feature Sneak Peek</div>
      </div>
      <div class="post-card">
        <div class="day">Friday 10:00 AM</div>
        <div class="post-title">Dashboard Reveal</div>
      </div>
    </div>
  </div>

  <div class="timeline">
    <div class="week-title">Next 30 Days - Auto-scheduled</div>
    <div class="timeline-bar">
      <div class="timeline-fill"></div>
    </div>
  </div>

  <button class="create-btn">+ Create New Content</button>

  <div class="tagline">Clean. Simple. No BS.</div>
</div>
</body>
</html>
```

---

## 📝 使用建议

### 推荐方案：

**如果你有设计经验：**
→ 用 **Figma/Canva** (方案 B)，最灵活

**如果想快速生成：**
→ 用 **HTML 代码** (方案 C)，直接截图即可

**如果想要真实感：**
→ 用 **AI 生成** (方案 A)，但可能需要多次调整

---

## 🎯 图片优化技巧

### 发布前检查：

1. **尺寸优化**
   - Twitter: 1200x675px (16:9)
   - Instagram: 1080x1080px (1:1)

2. **文字可读性**
   - 在手机上能看清
   - 对比度足够高
   - 字体不小于 14px

3. **品牌一致性**
   - 统一配色
   - 统一字体
   - 统一风格

4. **添加水印**
   - 右下角加 "marketgo" 或你的 logo
   - 不要太显眼，但要可见

---

## 🚀 快速生成工具

**在线工具推荐：**
1. **Canva** - canva.com (最简单)
2. **Figma** - figma.com (最专业)
3. **Excalidraw** - excalidraw.com (手绘风格)
4. **Shots.so** - shots.so (mockup 截图美化)

**AI 生成工具：**
1. **Midjourney** - midjourney.com (最强)
2. **DALL-E 3** - ChatGPT Plus
3. **Gemini Imagen** - 你已经有 API Key！

---

## 💡 Gemini 生成图片脚本

需要我写一个 Python 脚本，用你的 Gemini API 生成这3张图片吗？

就像之前的 Day 3 图片生成脚本一样！
