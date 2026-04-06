# Focus Grove - 番茄专注森林

## 1. Concept & Vision

Focus Grove 是一个将专注力培养与数字花园培育相结合的沉浸式番茄钟应用。它不仅仅是一个计时器，更是一个见证你成长与坚持的可视化世界。每一次专注都是一颗种子的萌发，每一个坚持的日子都让这片森林更加茂盛。整体氛围宁静、治愈、有成就感，让用户在专注中感受到生命的律动与时间的价值。

## 2. Design Language

### Aesthetic Direction
灵感来源于北欧极简主义与日式侘寂美学的融合——大量留白、柔和的自然色系、优雅的字体、流畅的动效。界面如同一张精心设计的杂志页面，干净但不冷淡，高级但有温度。

### Color Palette
```
Primary:        #2D5A4A (深森林绿 - 主色调)
Secondary:      #8FB89A (苔藓绿 - 次要元素)
Accent:         #E8A87C (暖杏橙 - 强调与互动)
Background:     #FAF8F5 (暖白 - 主背景)
Surface:        #FFFFFF (纯白 - 卡片背景)
Text Primary:   #2C3E2D (墨绿 - 主文字)
Text Secondary: #7A8B7A (灰绿 - 次要文字)
Success:        #6AAF75 (草绿 - 成功状态)
Warning:        #E6B566 (琥珀 - 警告)
Tomato Red:     #E07B6C (番茄红 - 番茄钟相关)
Tree Colors:    #4A7C59, #5D9B6D, #7BC47F, #A8D5A2 (树的成长色阶)
```

### Typography
- **Headings**: "Outfit" (Google Fonts) - 现代几何感，无衬线
- **Body**: "Inter" (Google Fonts) - 极佳可读性
- **Monospace/Numbers**: "JetBrains Mono" (计时器数字)
- **Fallback**: system-ui, -apple-system, sans-serif

### Spatial System
- Base unit: 8px
- Spacing scale: 4, 8, 12, 16, 24, 32, 48, 64, 96px
- Border radius: 4px (small), 8px (medium), 16px (large), 24px (xl), 9999px (pill)
- Container max-width: 1200px
- Card padding: 24px

### Motion Philosophy
- 所有过渡: 300ms cubic-bezier(0.4, 0, 0.2, 1)
- 页面进入: fade + translateY(10px), staggered 80ms
- 悬停效果: scale(1.02), 阴影提升
- 成功反馈: scale pulse (1 -> 1.05 -> 1), 配合颜色闪烁
- 加载状态: 优雅的骨架屏 + shimmer 动画
- 计时器: 流畅的圆环进度动画，无跳跃

### Visual Assets
- Icons: Lucide Icons (线性风格，2px stroke)
- 树木/植物: CSS/SVG 绘制的扁平化插画风格
- 装饰: 极简几何形状（圆、线条），不喧宾夺主
- 无 emoji，使用 SVG 图标替代

## 3. Layout & Structure

### Page Architecture
单页应用，左侧固定导航 + 右侧内容区的经典后台布局，但经过现代化演绎。

```
+------------------+----------------------------------------+
|                  |                                        |
|    Navigation    |              Main Content              |
|    (Sidebar)     |                                        |
|                  |                                        |
|   Logo           |   +-----------------------------+      |
|   Nav Items      |   |                             |      |
|   Tree Garden    |   |      Dynamic Content        |      |
|   (Mini view)    |   |                             |      |
|                  |   |                             |      |
|   Stats Summary  |   +-----------------------------+      |
|                  |                                        |
+------------------+----------------------------------------+
```

### Navigation Items
1. **Timer** - 番茄钟主界面
2. **Tasks** - Todo List 与 Done List
3. **Garden** - 我的森林（可视化成就）
4. **Stats** - 数据统计
5. **Settings** - 设置

### Responsive Strategy
- Desktop (>1024px): 侧边栏展开 + 宽内容区
- Tablet (768-1024px): 侧边栏收起为图标 + 窄内容区
- Mobile (<768px): 底部标签导航，全屏内容

## 4. Features & Interactions

### 4.1 Pomodoro Timer (核心)

**计时模式**
- Focus (专注): 25分钟（可自定义）
- Short Break (短休息): 5分钟
- Long Break (长休息): 15分钟
- 每4个番茄后触发长休息

**计时器交互**
- 大型圆形进度环，直径280px
- 中心显示剩余时间 (MM:SS)
- 当前模式标签 (专注中 / 休息中)
- 下方：开始 / 暂停 / 重置 按钮组
- 跳过按钮（跳过当前阶段）

**番茄计数**
- 显示今日番茄数: "🍅 × 4" (用番茄图标替代)
- 每个完成的番茄有微小庆祝动效

**状态流转**
- 点击开始 → 计时进行中
- 计时结束 → 自动切换下一阶段 + 通知 + 音效
- 可手动暂停，暂停时计时保持
- 重置回到当前阶段初始状态

**Session Link**
- 开始计时时可关联一个 Todo Item
- 完成后该 Item 自动标记为已完成并移入 Done List
- 界面显示关联任务的名称

### 4.2 Todo List

**Todo Item 结构**
```
[ ] 完成任务名称                    [标签]  [优先级]  [操作]
    创建于: 2024-01-15 14:30
```

**功能**
- 创建: 输入框 + 回车创建
- 编辑: 点击内容进入编辑模式
- 完成: 点击复选框 → 移入 Done List
- 删除: 滑动或点击删除按钮
- 标签: 自定义标签系统 (工作、学习、生活、健康)
- 优先级: P1/P2/P3 (高/中/低)

**筛选与排序**
- 按状态: 全部 / 待完成 / 已完成
- 按标签筛选
- 按优先级排序
- 按创建时间排序

**Done Item 结构**
```
[x] 完成的任务名称        标签        完成时间: 14:35
    专注时长: 25分钟
```

### 4.3 Done List

**内容**
- 所有已完成的任务
- 完成的时刻
- 关联的专注时长

**批量操作**
- 可恢复误完成的任务
- 可彻底删除记录
- 可归档（移到历史记录）

### 4.4 Statistics (数据统计)

**今日视图**
- 今日番茄数（大数字突出）
- 今日专注总时长
- 今日完成任务数
- 专注时段分布图 (柱状图，24小时)

**本周视图**
- 周番茄数
- 周累计时长
- 日均番茄数
- 本周 vs 上周对比 (+15% ↑)

**本月视图**
- 月番茄数
- 月累计时长
- 日均/周均趋势
- 热力图 (每天的专注强度)

**本年视图**
- 年番茄总数
- 年累计时长
- 月度柱状图
- 总完成任务数

**数据图表**
- 使用简洁的柱状图和折线图
- 配色与整体风格一致
- 悬停显示具体数值

### 4.5 Garden System (娱乐核心)

**虚拟森林**
- 3D透视感的森林场景（CSS 3D transforms）
- 每颗树代表一个成就/里程碑
- 树有5个成长阶段：种子 → 幼苗 → 小树 → 成树 → 茂盛树

**解锁条件**
- 种子 (1): 完成第一个番茄
- 幼苗 (5): 累计完成5个番茄
- 小树 (25): 累计完成25个番茄
- 成树 (100): 累计完成100个番茄
- 茂盛树 (365): 累计完成365个番茄

**连续专注系统**
- 每日打卡: 每天至少完成1个番茄 = 打卡成功
- 连续打卡: 连续打卡天数显示
- 连续7天: 解锁 "一周绿荫" 成就
- 连续30天: 解锁 "月下森林" 成就，可种植特殊树种
- 连续100天: 解锁传说成就

**Trees Collection**
- Default Tree (默认)
- Cherry Blossom (樱花树) - 连续30天解锁
- Autumn Maple (枫树) - 连续100天解锁
- Ancient Oak (古橡树) - 累计1000番茄解锁
- Moon Tree (月树) - 隐藏成就

**交互**
- 点击树木查看详情（种植日期、关联成就）
- 悬停树木有轻微浮动动画
- 每次解锁新树有庆祝动效（粒子效果）

### 4.6 Streak & Achievements

**Streak Display**
- 主界面显示当前连续天数
- 火焰图标 + 数字
- 打破记录时有特别动画

**Achievements (徽章系统)**
- First Focus - 完成第一个番茄
- Early Bird - 早上6点前开始专注
- Night Owl - 晚上11点后完成专注
- Week Warrior - 连续7天
- Month Master - 连续30天
- Year Champion - 连续365天
- Tree Planter - 种植5棵树
- Forest Keeper - 拥有完整森林

### 4.7 Settings

- 专注时长设置 (15-60分钟)
- 短休息时长 (3-15分钟)
- 长休息时长 (10-30分钟)
- 长休息间隔 (2-6个番茄)
- 音效开关
- 通知开关
- 数据导出 (JSON)
- 数据导入
- 主题: 跟随系统 / 浅色 / 深色 (预留)

## 5. Component Inventory

### Timer Circle
- Default: 灰色底环 + 彩色进度
- Active: 进度环动画推进
- Paused: 进度环停止，颜色变淡
- Complete: 圆环填满 + 脉冲动画

### Nav Item
- Default: 灰色图标 + 文字
- Hover: 背景浅色 + 图标颜色变深
- Active: 左侧指示条 + 主色背景

### Todo Item
- Default: 白色背景，淡淡阴影
- Hover: 阴影加深，显示操作按钮
- Editing: 展开编辑框
- Completed: 文字划线，颜色变淡

### Stat Card
- 大数字 + 标签
- 下方趋势指示 (↑↓)
- 悬停轻微上浮

### Tree Component
- CSS绘制的简化树形
- 5个生长阶段对应不同形态
- 悬停轻微摇摆

### Achievement Badge
- 圆形图标 + 名称
- Locked: 灰度 + 锁图标
- Unlocked: 彩色 + 光泽效果

### Button Variants
- Primary: 深绿背景，白色文字
- Secondary: 边框按钮
- Ghost: 无边框，悬停显示背景
- Danger: 红色调，用于删除

### Input Fields
- Default: 浅灰边框
- Focus: 主色边框 + 阴影
- Error: 红色边框 + 错误文字

## 6. Technical Approach

### Tech Stack
- **Framework**: 纯 HTML + CSS + Vanilla JavaScript (无框架依赖)
- **Storage**: LocalStorage (本地存储)
- **Charts**: 手写简单图表（避免大库）
- **Icons**: Lucide Icons (CDN)
- **Fonts**: Google Fonts (Outfit, Inter, JetBrains Mono)

### Data Model

```javascript
// App State
{
  settings: {
    focusDuration: 25,
    shortBreakDuration: 5,
    longBreakDuration: 15,
    longBreakInterval: 4,
    soundEnabled: true,
    notificationsEnabled: true
  },

  timer: {
    mode: 'focus' | 'shortBreak' | 'longBreak',
    timeRemaining: number,
    isRunning: boolean,
    currentSessionId: string | null
  },

  todos: [
    {
      id: string,
      content: string,
      tag: string,
      priority: 'p1' | 'p2' | 'p3',
      createdAt: timestamp,
      completedAt: timestamp | null,
      focusDuration: number | null
    }
  ],

  stats: {
    dailyStats: {
      [date: string]: {
        tomatoes: number,
        totalFocusTime: number,
        tasksCompleted: number
      }
    }
  },

  garden: {
    unlockedTrees: [
      {
        id: string,
        type: string,
        unlockedAt: timestamp,
        associatedAchievement: string
      }
    ],
    currentStreak: number,
    longestStreak: number,
    lastActiveDate: string
  },

  achievements: [
    {
      id: string,
      name: string,
      description: string,
      unlockedAt: timestamp | null
    }
  ]
}
```

### File Structure
```
/
├── index.html
├── styles/
│   └── main.css
├── scripts/
│   ├── app.js          (主应用逻辑)
│   ├── timer.js        (计时器模块)
│   ├── todos.js        (待办事项模块)
│   ├── stats.js        (统计模块)
│   ├── garden.js       (森林/成就模块)
│   └── storage.js      (数据持久化)
└── SPEC.md
```

### Notification Strategy
- 使用 Web Notifications API
- 降级: 如果不支持，显示可视提示

### Performance Considerations
- 使用 requestAnimationFrame 实现平滑计时
- 防抖处理频繁操作
- 懒加载非首屏内容
- 最小化 DOM 操作
