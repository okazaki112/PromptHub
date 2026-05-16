# Design

## Summary

项目级 Skill 管理将引入“项目”这一新的 Skill 组织维度，但不取代现有 `my-skills / distribution / store` 三段式结构。

本轮建议采用：

- 左侧 Skill 导航新增一级入口：`Projects`
- 在 `Projects` 入口内管理“项目列表 -> 项目详情 -> 项目 Skill 列表`
- 项目 Skill 默认不自动进入 PromptHub Skill 库
- 用户显式选择“纳入库”后，才转换为现有库内 Skill 生命周期

## Why Left Nav Is The Right Entry

现有 Skill 左侧栏已经是一级工作区导航：

- My Skills
- Favorites
- Distribution
- Pending
- Store

“项目级 Skill”在语义上并不是 Skill 列表里的一个普通过滤条件，而是一个新的工作空间：

- 它有自己的容器（项目）
- 有自己的发现方式（扫描项目目录）
- 有自己的生命周期（直接管理 vs 纳入库）

因此更适合作为左侧 Skill 区的一级入口，而不是 `my-skills` 下的一个标签筛选。

## UI Information Architecture

### Left Sidebar (Skill mode)

当前：

- My Skills
- Favorites
- Distribution
- Pending
- Store

建议改为：

- My Skills
- Projects
- Favorites
- Distribution
- Pending
- Store

其中：

- `Projects` 进入一个新的项目级 Skill 页面
- `My Skills` 仍只代表 PromptHub 库内 Skill
- `Projects` 与 `My Skills` 明确分开，避免把“项目直接管理”与“库内分发”混淆

### Projects Page Layout

推荐双栏布局：

- 左栏：项目列表
  - 项目名
  - 根目录
  - Skill 数量
  - 最近扫描时间
- 右栏：选中项目详情
  - 项目基础信息
  - 扫描目录列表
  - 项目 Skill 列表
  - 顶部操作：重新扫描 / 添加扫描目录 / 打开项目目录

### Project Skill Card Actions

每个项目 Skill 提供两组动作：

- 直接管理
  - 查看详情
  - 编辑文件
  - 翻译
  - 版本快照
  - 安全扫描
- 转入库内
  - 纳入库
  - 纳入库并分发

## Data Model

建议新增轻量模型，而不是直接把项目 Skill 混进 `skills` 表。

### New Entity: SkillProject

- `id`
- `name`
- `root_path`
- `scan_paths` (JSON array)
- `created_at`
- `updated_at`
- `last_scanned_at`

### New Entity: ProjectSkillIndex (optional)

如果需要持久化扫描结果，可新增：

- `id`
- `project_id`
- `name`
- `description`
- `version`
- `author`
- `local_path`
- `skill_md_path`
- `last_seen_at`
- `imported_skill_id` (nullable)

但第一版也可以不持久化索引，只持久化项目目录，扫描结果在进入项目页时实时生成。

## Reuse Existing Capabilities

可直接复用：

- `scanLocalPreview(customPaths)`
- `SkillScanPreview`
- 本地 repo 文件读写与版本快照
- Skill 翻译 sidecar
- Skill 安全扫描

需要补的新能力：

- 项目目录注册/删除/重命名
- 项目页与项目 Skill 详情页
- “项目 Skill 直接管理”不经过库内 Skill 的 UI 路由
- 从项目 Skill 显式纳入库的动作

## Recommended Delivery Phases

### Phase 1

- 新增 Projects 左侧入口
- 支持登记项目目录
- 支持配置项目扫描目录
- 支持扫描并列出项目 Skill
- 支持从项目 Skill 执行“纳入库”

### Phase 2

- 项目 Skill 直接详情页
- 项目 Skill 直接编辑/翻译/版本化/安全扫描

### Phase 3

- 项目 Skill 与库内 Skill 的双向状态关联
- 批量纳入库 / 批量分发

## Tradeoffs

### 方案 A：Projects 作为左侧一级入口

优点：

- 用户心智最清晰
- 容易扩展项目列表和项目详情
- 不污染现有 `my-skills`

缺点：

- 左侧导航会增加一个入口

### 方案 B：Projects 作为 My Skills 内筛选

优点：

- 改动更小

缺点：

- 用户会误以为项目 Skill 已经是库内 Skill
- 不利于表达“直接管理 / 纳入库”两条不同生命周期

结论：优先方案 A。
