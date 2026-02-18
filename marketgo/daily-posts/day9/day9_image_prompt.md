# Day 9 视觉素材生成提示词

## 主图: 功能演示截图

### Midjourney/DALL-E 提示词

```
A clean product dashboard screenshot showing a 30-day content calendar interface, minimal design with calendar grid layout, each day contains a post title and platform icon (Twitter, Xiaohongshu), purple and white color scheme, modern SaaS UI design, subtle shadows, "Day 9/30" badge in top right corner, --ar 16:9 --style modern --v 6
```

### 中文提示词 (通义千问/文心一格)

```
产品界面截图,展示一个30天内容日历,简洁的网格布局,每一天显示发布标题和平台图标(Twitter、小红书),紫白配色,现代SaaS界面设计,微妙阴影,右上角有"Day 9/30"标识,16:9比例,现代风格
```

---

## 辅助图: Before/After 对比

### Midjourney 提示词

```
Split-screen comparison image, left side shows empty blank calendar interface with text "Before", right side shows filled 30-day content calendar with colorful post entries and text "After", clean modern UI, purple accent color, arrows pointing from left to right, --ar 16:9 --style clean
```

### 中文提示词

```
左右对比图,左侧显示空白的日历界面标注"之前",右侧显示填满30天内容的日历带彩色条目标注"之后",简洁现代界面,紫色强调色,从左到右的箭头,16:9比例,简洁风格
```

---

## 演示GIF要求 (屏幕录制)

**时长**: 30秒以内
**分辨率**: 1920x1080 或 16:9
**帧率**: 30fps

**演示步骤** (建议实际录屏):
1. (0-5秒) 显示空白的 marketgo 界面
2. (5-10秒) 点击 "创建新项目" 按钮
3. (10-15秒) 快速填写项目名称 "My SaaS Launch"
4. (15-20秒) 选择平台 (Twitter + 小红书)
5. (20-25秒) 点击 "生成30天计划" 按钮
6. (25-30秒) 展示生成的30天日历视图,缓慢滚动浏览

**录屏工具推荐**:
- macOS: CleanShot X, Screen Studio
- Windows: OBS Studio, ShareX
- 跨平台: Loom

**后期处理**:
- 添加鼠标点击高亮效果
- 关键步骤添加简短文字说明
- 导出为 GIF (< 10MB) 或 MP4

---

## 社交媒体适配尺寸

### Twitter/X
- **帖子图**: 1200x675 (16:9)
- **视频**: 1280x720, MP4, < 512MB

### 小红书
- **帖子图**: 1242x1660 (3:4) 或 1242x1242 (1:1)
- **视频**: 1080x1920 (9:16 竖屏)

### Indie Hackers
- **帖子图**: 1200x630 (接近16:9)

---

## 配色方案 (保持品牌一致性)

**主色**:
- Primary Purple: #8B5CF6
- Background: #FFFFFF
- Text: #1F2937

**辅助色**:
- Success Green: #10B981 (用于"完成"状态)
- Warning Orange: #F59E0B (用于"进行中")
- Neutral Gray: #6B7280 (用于占位符)

---

## 字体建议

**英文**: Inter, SF Pro Display
**中文**: PingFang SC, 思源黑体
**代码**: JetBrains Mono (如果展示技术细节)

---

## 品牌元素

**Logo 位置**: 左上角
**Day Badge**: 右上角,"Day 9/30",紫色背景白色文字
**水印** (可选): 右下角小字 "marketgo.app" (如果有域名)

---

## 实际操作建议

如果暂时没有真实产品界面:

### 方案 A: 使用设计工具快速制作
用 Figma/Canva 创建简单的日历 mockup:
1. 创建 7x5 网格 (周一到周日 × 5周)
2. 填充前30天的示例内容
3. 添加简单的平台图标
4. 导出为PNG

### 方案 B: 代码生成日历截图
使用 HTML + CSS 快速构建一个静态日历页面,然后截图:
```html
<!-- 简单的30天日历HTML示例 -->
<div class="calendar">
  <div class="day">Day 1: Launch announcement</div>
  <div class="day">Day 2: Problem statement</div>
  <!-- ...继续到 Day 30 -->
</div>
```

### 方案 C: 使用现成的日历组件
借用开源日历组件 (FullCalendar.js) 快速搭建演示界面

---

## 真实性提示

记住 Day 9 的主题是 "Ship fast > Ship perfect":
- **不要过度美化** - 界面可以有点粗糙
- **可以保留小瑕疵** - 让人看出这是真实的早期版本
- **手绘标注也OK** - 用简单的箭头和文字说明功能
- **重点是功能在工作** - 不是设计有多精美

这种真实感反而会增加可信度和共鸣!
