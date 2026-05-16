# Skills Delta Spec

## Modified Requirements

### Requirement: Project skill registration should minimize manual steps

桌面端用户在添加 `项目 Skills` 工作区时，应优先通过选择项目目录完成主要输入，并在保存后立即得到扫描结果。

#### Scenario: choose root path first

- Given 用户打开“添加项目”弹窗
- When 用户先选择项目根目录
- Then 界面自动填充一个默认项目名称

#### Scenario: add project auto scans

- Given 用户提供了有效的项目名称与根目录
- When 用户确认添加项目
- Then PromptHub 自动选中新项目并立即执行扫描

### Requirement: Project views should provide a stable visual anchor

`项目 Skills` 页面中的项目条目和项目头部应展示明确的项目标识，且头部边界需要在多栏布局中对齐。

#### Scenario: missing project icon

- Given 项目没有自定义图标
- When 用户查看项目列表或项目详情头部
- Then 界面展示项目名称首字母作为标识

### Requirement: Local store sources should behave like real import/update sources

桌面端用户把本地文件夹作为 Skill Source 接入商店后，导入、更新与详情预览应读取磁盘上的最新 `SKILL.md`，而不是把本地路径误当作远程 URL，也不应只依赖内置 registry。

#### Scenario: import from local store source

- Given 用户在 Skill 商店中选中了一个本地文件夹 Source
- And Source 中的 skill 已显示在目录中
- When 用户在详情页点击“导入到我的 Skills”
- Then PromptHub 应读取该本地 skill 文件夹中的最新 `SKILL.md`
- And 应将其导入我的 Skills，而不是因为只查询内置 registry 而无效

#### Scenario: update installed local-source skill

- Given 用户已经从本地文件夹 Source 导入了一个 skill
- And 用户随后修改了该本地 skill 文件夹中的 `SKILL.md`
- When 用户在 Source 详情页检查更新或执行更新
- Then PromptHub 应读取本地文件内容并更新已安装 skill
- And 不得把本地文件路径当作仅支持 `http/https` 的远程 URL 处理

#### Scenario: preview local source should reflect source content

- Given 用户已经安装过一个来自本地 Source 的 skill
- And 已安装副本中的内容旧于本地 source 中的最新 `SKILL.md`
- When 用户再次打开该 Source 的详情页
- Then 详情预览应优先展示本地 source 中的最新内容
- And 不应默认被已安装副本中的旧内容覆盖
