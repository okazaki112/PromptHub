<div align="center">
  <img src="./docs/imgs/icon.png" alt="PromptHub Logo" width="128" height="128" />
  
  # PromptHub
  
  **🚀 一款包含 Prompt 管理、Skill 管理、Agent 资产管理的一站式 AI 工具箱**
  
  *高效管理提示词 · 一键分发 Skills · 一站式管理 Agent 资产 · 云同步 · 备份恢复 · 版本管理*
<img width="1356" height="902" alt="QQ20260516-121033-HD" src="https://github.com/user-attachments/assets/4859724f-d6e7-49f9-9f70-37ae4bbb7d1b" />

  <br/>
  
  <!-- Badges -->
  [![GitHub Stars](https://img.shields.io/github/stars/legeling/PromptHub?style=for-the-badge&logo=github&color=yellow)](https://github.com/legeling/PromptHub/stargazers)
  [![GitHub Forks](https://img.shields.io/github/forks/legeling/PromptHub?style=for-the-badge&logo=github)](https://github.com/legeling/PromptHub/network/members)
  [![Downloads](https://img.shields.io/github/downloads/legeling/PromptHub/total?style=for-the-badge&logo=github&color=blue)](https://github.com/legeling/PromptHub/releases)
  
  [![Version](https://img.shields.io/badge/preview-v0.5.6--beta.1-8B5CF6?style=for-the-badge)](https://github.com/legeling/PromptHub/releases)
  [![License](https://img.shields.io/badge/license-AGPL--3.0-blue?style=for-the-badge)](./LICENSE)
  [![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen?style=for-the-badge)](https://github.com/legeling/PromptHub/pulls)
  
  <br/>
  
  <!-- Tech Stack -->
  ![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=white)
  ![Electron](https://img.shields.io/badge/Electron-47848F?style=flat-square&logo=electron&logoColor=white)
  ![React](https://img.shields.io/badge/React-61DAFB?style=flat-square&logo=react&logoColor=black)
  ![TailwindCSS](https://img.shields.io/badge/Tailwind-38B2AC?style=flat-square&logo=tailwind-css&logoColor=white)
  ![SQLite](https://img.shields.io/badge/SQLite-003B57?style=flat-square&logo=sqlite&logoColor=white)
  
  <br/>
  
  <!-- Platform Support -->
  ![macOS](https://img.shields.io/badge/macOS-000000?style=flat-square&logo=apple&logoColor=white)
  ![Windows](https://img.shields.io/badge/Windows-0078D6?style=flat-square&logo=windows&logoColor=white)
  ![Linux](https://img.shields.io/badge/Linux-FCC624?style=flat-square&logo=linux&logoColor=black)
  
  <br/>
  
  [简体中文](./README.md) · [繁體中文](./docs/README.zh-TW.md) · [English](./docs/README.en.md) · [日本語](./docs/README.ja.md) · [Deutsch](./docs/README.de.md) · [Español](./docs/README.es.md) · [Français](./docs/README.fr.md)

</div>

<br/>

<div align="center">
  <a href="https://github.com/legeling/PromptHub/releases">
    <img src="https://img.shields.io/badge/📥_立即下载-Releases-blue?style=for-the-badge&logo=github" alt="Download"/>
  </a>
</div>

<br/>

> 💡 **为什么选择 PromptHub？**
>
> PromptHub 不只是 Prompt 管理器，也是围绕 Prompt、SKILL.md 与 Agent 资产的本地优先工作台。你可以集中整理提示词、扫描并分发 Skills 到 Claude Code、Cursor、Windsurf、Codex 等 15+ AI 工具，并通过云同步、备份恢复与版本管理维护个人或项目级 AI 资产。

---

## 目录

- [你可以怎么用 PromptHub](#how-to-use-prompthub)
- [截图](#screenshots)
- [功能特性](#features)
- [桌面版下载与安装](#install-and-deploy)
- [快速开始](#quick-start)
- [命令行 CLI](#cli)
- [自部署网页版](#self-hosted-web)
- [Star History](#star-history)
- [路线图](#roadmap)
- [更新日志](#changelog)
- [贡献与开发](#contributing)
- [技术栈](#tech-stack)
- [仓库结构](#project-structure)
- [文档与 SSD 工作流](#docs-workflow)
- [许可证](#license)
- [支持](#support)
- [赞助支持](#sponsor)
- [QQ 交流群](#qq-group)

---

<div id="how-to-use-prompthub"></div>

## 你可以怎么用 PromptHub

| 形态 | 适合谁 | 核心价值 |
| ---- | ------ | -------- |
| 桌面版 | 大多数个人用户、提示词重度使用者、AI 编程工作流使用者 | 本地优先的主工作区，集中管理 Prompt、Skill 与项目级 AI 资产 |
| 自部署网页版 | 需要浏览器访问、个人自托管、想把 Web 当备份源 / 恢复源的用户 | 轻量浏览器工作区，可作为桌面版同步目标 |
| CLI | 有批量处理、自动化脚本、流水线集成需求的用户 | 直接操作本地 PromptHub 数据与 Skill 仓库 |

如果你第一次接触 PromptHub，推荐顺序是：

1. 先安装桌面版，把 Prompt 和 Skills 管起来。
2. 有跨设备或浏览器访问需求时，再接入 WebDAV 或自部署 Web。
3. 有自动化需求时，再引入 CLI。

<div id="screenshots"></div>

## 📸 截图

<div align="center">
  <p><strong>主界面</strong></p>
  <img src="./docs/imgs/1-index.png" width="80%" alt="主界面"/>
  <br/><br/>
  <p><strong>Skill 商店</strong></p>
  <img src="./docs/imgs/10-skill-store.png" width="80%" alt="Skill 商店"/>
  <br/><br/>
  <p><strong>Skill 详情与平台安装</strong></p>
  <img src="./docs/imgs/11-skill-platform-install.png" width="80%" alt="Skill 详情与平台安装"/>
  <br/><br/>
  <p><strong>Skill 文件编辑与版本对比</strong></p>
  <img src="./docs/imgs/12-skill-files-version-diff.png" width="80%" alt="Skill 文件编辑与版本对比"/>
  <br/><br/>
  <p><strong>数据备份</strong></p>
  <img src="./docs/imgs/4-backup.png" width="80%" alt="数据备份"/>
  <br/><br/>
  <p><strong>主题与背景设置</strong></p>
  <img src="./docs/imgs/5-theme.png" width="80%" alt="主题与背景设置"/>
  <br/><br/>
  <p><strong>版本对比</strong></p>
  <img src="./docs/imgs/8-version-compare.png" width="80%" alt="版本对比"/>
</div>

<div id="features"></div>

## ✨ 功能特性

### 📝 Prompt 管理

- 创建、编辑、删除，支持文件夹和标签分类
- 自动保存历史版本，支持查看、对比和回滚
- 模板变量 `{{variable}}`，复制、测试或分发时动态填充
- 快速收藏常用 Prompt，一键访问
- 全文搜索、附件与多媒体预览

### 🧩 Skill 分发与管理

- **技能商店**：内置 20+ 精选技能（来自 Anthropic、OpenAI 等）
- **多平台安装**：一键安装到 Claude Code、Cursor、Windsurf、Codex、Kiro、Gemini CLI、Qoder、QoderWork、CodeBuddy 等 15+ 平台
- **本地扫描**：自动发现本地已有 SKILL.md，预览选择后导入
- **软链接/复制模式**：支持 Symlink 同步编辑或独立复制
- **平台目标目录**：支持为每个平台覆写 Skills 目录，扫描与分发保持一致
- **AI 翻译与润色**：沉浸式 / 全文翻译技能内容，辅助阅读和编辑
- **标签筛选**：按标签快速过滤技能

### 🤖 项目与 Agent 资产

- 扫描项目中的 `.claude/skills`、`.agents/skills`、`skills`、`.gemini` 等常见目录
- 统一管理个人库、本地仓库和项目里的 AI 资产，不用在多个工具目录来回切换
- 用本地优先存储、云同步和备份恢复维护 Prompt、Skill 与项目级资产

### 🧪 AI 测试与生成

- 内置 AI 测试，支持 **国内外主流服务商**
- 覆盖各类主流大语言模型、各类开源及闭源模型
- 同一 Prompt 多模型并行测试对比
- 支持各类图像生成模型性能测评
- AI 生成技能内容、智能润色

### 💾 数据与同步

- 所有数据存储在本地，隐私安全有保障
- 全量备份与恢复（`.phub.gz` 压缩格式）
- WebDAV 云同步（坚果云、Nextcloud 等）
- 支持自部署 PromptHub Web 作为桌面版备份源 / 恢复源
- 支持启动同步 + 定时同步

### 🎨 界面与安全

- 多视图模式：卡片、画廊、列表
- 深色/浅色/跟随系统，多种主题色
- 支持自定义背景图片，把本地图片设成桌面背景
- 7 种语言支持
- Markdown 渲染与代码高亮
- 跨平台：macOS / Windows / Linux
- **主密码保护** - 支持设置应用级主密码
- **私密文件夹** - 私密文件夹内容加密存储（Beta）

<div id="install-and-deploy"></div>

## 📥 桌面版下载与安装

如果你只是想开始使用 PromptHub，优先从桌面版开始。

### 下载

从 [Releases](https://github.com/legeling/PromptHub/releases) 下载最新预览版本 `v0.5.6-beta.1`：

| 平台    | 下载                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| ------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Windows | [![Windows x64](https://img.shields.io/badge/Windows_x64-0078D6?style=for-the-badge&logo=windows&logoColor=white)](https://github.com/legeling/PromptHub/releases/download/v0.5.6-beta.1/PromptHub-Setup-0.5.6-beta.1-x64.exe) [![Windows arm64](https://img.shields.io/badge/Windows_arm64-0078D6?style=for-the-badge&logo=windows&logoColor=white)](https://github.com/legeling/PromptHub/releases/download/v0.5.6-beta.1/PromptHub-Setup-0.5.6-beta.1-arm64.exe)      |
| macOS   | [![macOS Apple Silicon](https://img.shields.io/badge/macOS_Apple_Silicon-000000?style=for-the-badge&logo=apple&logoColor=white)](https://github.com/legeling/PromptHub/releases/download/v0.5.6-beta.1/PromptHub-0.5.6-beta.1-arm64.dmg) [![macOS Intel](https://img.shields.io/badge/macOS_Intel-000000?style=for-the-badge&logo=apple&logoColor=white)](https://github.com/legeling/PromptHub/releases/download/v0.5.6-beta.1/PromptHub-0.5.6-beta.1-x64.dmg)          |
| Linux   | [![Linux AppImage](https://img.shields.io/badge/Linux_AppImage-FCC624?style=for-the-badge&logo=linux&logoColor=black)](https://github.com/legeling/PromptHub/releases/download/v0.5.6-beta.1/PromptHub-0.5.6-beta.1-x64.AppImage) [![Linux deb](https://img.shields.io/badge/Linux_deb-FCC624?style=for-the-badge&logo=linux&logoColor=black)](https://github.com/legeling/PromptHub/releases/download/v0.5.6-beta.1/prompthub_0.5.6-beta.1_amd64.deb)                   |
| 预览通道 | [![Preview Prereleases](https://img.shields.io/badge/Preview_Prereleases-8B5CF6?style=for-the-badge&logo=github&logoColor=white)](https://github.com/legeling/PromptHub/releases?q=prerelease%3Atrue) |

> 💡 **安装建议**
>
> - **macOS**：Apple Silicon（M1/M2/M3/M4）下载 `arm64`，Intel Mac 下载 `x64`
> - **Windows**：绝大多数电脑下载 `x64`；只有 Windows on ARM 设备才下载 `arm64`
> - **预览通道**：预览构建发布在 GitHub `Prereleases`；应用内启用「预览版通道」后只会检查 prerelease 构建
> - **回到稳定版**：如需恢复 stable 更新检查，请先关闭预览版通道；PromptHub 不会自动从较新的预览版降级到较旧的稳定版

### macOS 通过 Homebrew 安装

```bash
brew tap legeling/tap
brew install --cask prompthub
```

### Homebrew 用户升级

如果你是通过 Homebrew 安装的，后续升级必须优先使用 Homebrew，不要和应用内更新混用：

```bash
brew update
brew upgrade --cask prompthub
```

如果 Homebrew 已同步到新版本，但本地安装状态异常，可以重新安装当前版本：

```bash
brew reinstall --cask prompthub
```

> 💡 **说明**
>
> - **通过 DMG/EXE 手动安装的用户**：优先使用应用内「检查更新」或前往 Releases 手动下载
> - **通过 Homebrew 安装的用户**：优先使用 `brew upgrade --cask prompthub`，不要再走应用内下载 DMG 的升级路径
> - 混用两种升级方式可能导致 Homebrew 记录的版本与实际安装状态不一致

### macOS 首次启动

由于应用未经过 Apple 公证签名，首次打开时可能会提示 **"PromptHub 已损坏，无法打开"** 或 **"无法验证开发者"**。

**解决方法（推荐）**：打开终端，执行以下命令绕过公证检查：

```bash
sudo xattr -rd com.apple.quarantine /Applications/PromptHub.app
```

> 💡 **提示**：如果应用安装在其他位置，请将路径替换为实际安装路径。

**或者**：打开「系统设置」→「隐私与安全性」→ 向下滚动找到安全性部分 → 点击「仍要打开」。

<div align="center">
  <img src="./docs/imgs/install.png" width="60%" alt="macOS 安装提示"/>
</div>

### 从源码运行桌面版

```bash
git clone https://github.com/legeling/PromptHub.git
cd PromptHub
pnpm install

# 启动桌面开发环境
pnpm electron:dev

# 构建桌面版
pnpm build

# 如需构建自部署 Web
pnpm build:web
```

> `pnpm build` 在仓库根默认只构建桌面版；Web 需要显式执行 `pnpm build:web`。

<div id="quick-start"></div>

## 🚀 快速开始

### 1. 创建你的第一个 Prompt

点击「新建」按钮，填写标题、描述、`System Prompt`、`User Prompt` 和标签。

### 2. 使用变量模板

在 Prompt 中使用 `{{变量名}}` 语法定义变量：

```bash
请将以下 {{source_lang}} 文本翻译成 {{target_lang}}：

{{text}}
```

### 3. 把 Skills 纳入工作区

- 从技能商店添加常用 Skills
- 扫描本地或项目中的 `SKILL.md`
- 导入后在「我的 Skills」中继续编辑、翻译、版本对比与分发

### 4. 一键分发到 AI 工具

- 选择 Claude Code、Cursor、Windsurf、Codex、Gemini CLI 等目标平台
- PromptHub 会按平台目录把 Skill 安装到对应位置

> 💡 **当前支持的平台**：Claude Code、GitHub Copilot、Cursor、Windsurf、Kiro、Gemini CLI、Trae、OpenCode、Codex CLI、Roo Code、Amp、OpenClaw、Qoder、QoderWork、CodeBuddy

### 5. 做好同步与备份

- 可选配置 WebDAV，实现多设备同步
- 或在 `设置 -> 数据` 中接入自部署 PromptHub Web 作为备份源 / 恢复源

<div id="cli"></div>

## 命令行 CLI

PromptHub 同时提供 GUI 和 CLI。CLI 适合脚本化管理、批量导入导出、自动化扫描和本地工作流集成。

### 桌面版用户直接使用

> ⚠️ **当前行为**
>
> - 桌面版安装后并首次启动一次应用：PromptHub 会自动安装 `prompthub` 命令
> - 重新打开一个终端窗口后：就可以直接使用 `prompthub --参数`
> - 源码运行 / 构建后的 CLI bundle：仍然保留，适合开发和调试

```bash
prompthub --help
prompthub prompt list
prompthub skill list
prompthub skill scan
prompthub --output table prompt search SEO --favorite
```

> 💡 **提示**
>
> - 如果你刚安装完桌面版，请先启动一次 PromptHub
> - 如果当前终端还识别不到 `prompthub`，请关闭并重新打开终端

### 从源码运行 CLI

```bash
pnpm --filter @prompthub/desktop cli:dev -- --help
pnpm --filter @prompthub/desktop cli:dev -- prompt list
pnpm --filter @prompthub/desktop cli:dev -- skill list
pnpm --filter @prompthub/desktop cli:dev -- skill scan
pnpm --filter @prompthub/desktop cli:dev -- skill install ~/.claude/skills/my-skill
```

### 使用构建后的 CLI bundle

```bash
pnpm build
node apps/desktop/out/cli/prompthub.cjs --help
node apps/desktop/out/cli/prompthub.cjs prompt list
node apps/desktop/out/cli/prompthub.cjs skill list
```

### 常用全局参数

- `--output json|table`：切换 JSON 或表格输出
- `--data-dir /path/to/user-data`：显式指定 PromptHub 的 `userData` 目录
- `--app-data-dir /path/to/app-data`：显式指定应用数据根目录

### 支持的资源命令

- `prompt list|get|create|update|delete|search`
- `skill list|get|install|scan|delete|remove`

### 说明

- CLI 直接读写 PromptHub 的本地数据库和受管 Skill 仓库
- 桌面版会在首次启动时自动安装 shell 命令包装器
- 如果你移动了应用安装位置，再次启动 PromptHub 会自动刷新命令包装器路径

<div id="self-hosted-web"></div>

## 🌐 自部署网页版

PromptHub Web 是轻量自部署浏览器工作区，不是官方 SaaS 云服务。它适合：

- 想在浏览器里访问自己的 PromptHub 数据
- 想把自部署 Web 当成桌面版的备份源 / 恢复源
- 不想只依赖 WebDAV，希望有一个更直观的单机自托管界面

### Docker Compose 快速启动

在仓库根目录执行：

```bash
cd apps/web
cp .env.example .env
docker compose up -d --build
```

最少需要关注这几个配置：

- `JWT_SECRET`：至少 32 位随机字符串，用于登录鉴权
- `ALLOW_REGISTRATION=false`：建议保持关闭，避免初始化后继续开放注册
- `DATA_ROOT`：PromptHub Web 的数据根目录；应用会在其下写入 `data/`、`config/`、`logs/`、`backups/`

默认访问地址：`http://localhost:3871`

### 首次初始化

- 新实例首次访问时会进入 `/setup`，而不是登录页
- 第一个用户会被创建为管理员
- 首个管理员创建完成后，公开注册默认关闭，不适合作为开放注册的多人 SaaS

### 桌面版接入 PromptHub Web

桌面版进入 `设置 -> 数据` 后，可以直接配置：

- 自部署 PromptHub URL
- 用户名
- 密码

配置完成后，桌面版可以执行：

- 测试连接
- 上传当前本地工作区到自部署网页版
- 从自部署网页版下载并恢复
- 启动时自动拉取
- 定时后台推送

### 数据存放与备份

请备份整个数据根目录，而不只是 SQLite 文件。默认 Compose 示例里建议至少备份：

```bash
apps/web/data
apps/web/config
apps/web/logs
```

其中会包含：

- `data/prompthub.db`
- `data/prompts/...`
- `data/skills/...`
- `data/assets/...`
- `config/settings/...`
- `backups/...`
- `logs/...`

如果你只是想快速部署，上面的内容已经够用了；更细的部署、升级、备份、GHCR 镜像和开发说明见 [`docs/web-self-hosted.md`](./docs/web-self-hosted.md)。

<div id="star-history"></div>

## Star History

<a href="https://star-history.com/#legeling/PromptHub&Date">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="https://api.star-history.com/svg?repos=legeling/PromptHub&type=Date&theme=dark" />
    <source media="(prefers-color-scheme: light)" srcset="https://api.star-history.com/svg?repos=legeling/PromptHub&type=Date" />
    <img alt="Star History Chart" src="https://api.star-history.com/svg?repos=legeling/PromptHub&type=Date" />
  </picture>
</a>

<div id="roadmap"></div>

## 路线图

### v0.5.5 (当前稳定版) 🚀

- [x] **Skill 商店更新检测**：商店下载的 Skill 记录安装内容哈希，可检测远端 `SKILL.md` 是否更新并支持安全更新
- [x] **Skill 整份文档翻译**：AI 翻译现在围绕完整 `SKILL.md` 工作，支持全文翻译和沉浸式对照模式，并把译文 sidecar 保存在本地 repo 内
- [x] **数据目录切换真正生效**：切换数据目录后会通过桌面 relaunch 重新应用 `userData` 路径，不再出现“看似切换成功、实际未生效”的假象
- [x] **AI 测试与翻译错误反馈更清楚**：模型测试提示会直接显示“XX 模型测试成功/失败”，翻译未配置/超时/504 也会明确告诉用户原因
- [x] **网页版媒体与同步修复**：Docker/Web 环境支持图片、视频上传，并修复普通文件夹被误判为私密、登录密码无法修改等问题

### v0.4.9

- [x] **安全加固**：SSRF 防护重写、deleteAll 确认参数、URL 协议校验、版本字段验证
- [x] **架构重构**：skill-installer God Class 拆分为 6 个子模块 + 1 个 facade barrel
- [x] **Skill 元数据编辑修复**：编辑描述后不再被磁盘旧值覆盖，自动回写 SKILL.md frontmatter
- [x] **数据库迁移修复**：迁移失败不再误标为完成，防止后续启动跳过失败迁移
- [x] **代码质量**：消除 `any` 类型、异步化文件操作、循环引用防护、seed 竞态修复、720 测试全绿

### v0.4.8

- [x] **AI 工作台实装**：模型管理、端点编辑、连接测试与场景默认模型已接入真实设置链路
- [x] **skills.sh 社区商店接入**：社区榜单、每周安装量、GitHub Star 与商店详情已集成到 PromptHub
- [x] **Prompt / Skill 历史版本删除**：支持清理不再需要保留的单条历史记录
- [x] **Skill 手动修改回写**：重新打开详情页时会从本地 `SKILL.md` 同步最新元数据与内容
- [x] **备份与 WebDAV 修复**：统一备份导入格式，补齐 Skill 的 WebDAV 上传与恢复链路
- [x] **数据目录与迁移表达修复**：设置页显示真实数据目录，并明确提示迁移后需重启切换
- [x] **大规模 Skill 性能优化**：本地数百个 Skill 的列表和画廊视图改为分批渲染，并补上性能预算测试

### v0.4.3

- [x] **Skill 技能商店**：内置 20+ 精选 AI 代理技能，来自 Anthropic、OpenAI 等官方源
- [x] **多平台安装**：支持一键安装 SKILL.md 到 Claude Code、Cursor、Windsurf、Codex、Qoder、CodeBuddy 等 15+ 平台
- [x] **本地扫描预览**：自动发现本地已有 SKILL.md，支持预览选择后批量导入
- [x] **软链接/复制模式**：支持 Symlink 同步编辑或独立复制到各平台
- [x] **AI 技能翻译**：支持沉浸式翻译和全文翻译，方便阅读英文技能
- [x] **AI 技能生成**：支持 AI 生成技能内容和智能润色
- [x] **技能标签筛选**：侧边栏标签快速过滤技能
- [x] **清晰的工作流**：「添加到库」→「安装到平台」，添加后自动弹出平台选择

### v0.3.x

- [x] **多层级文件夹**：支持分层嵌套与拖拽管理
- [x] **版本控制系统**：像管理代码一样管理 Prompt，支持历史对比与一键回滚
- [x] **变量模板系统**：支持 `{{variable}}` 语法，自动生成填充表单，支持复制前预览
- [x] **多模型实验室**：内置国内外主流服务商，支持多模型并行对比测试与响应时间分析
- [x] **跨设备同步**：支持 WebDAV 增量同步与全量备份，数据高度可控
- [x] **极致阅读体验**：支持 Markdown 全场景渲染、代码高亮、双语对照模式
- [x] **多维高效管理**：文件夹、标签、收藏、使用次数统计、全文评分搜索
- [x] **多视图模式**：提供卡片、精简列表、画廊三种视图，适配不同使用场景
- [x] **系统深度集成**：全局快捷键唤起、最小化到系统托盘、暗黑模式支持
- [x] **更新镜像加速**：内置多个 GitHub 加速镜像，解决国内用户下载更新缓慢的问题
- [x] **安全与隐私**：主密码保护、私密文件夹加密存储，所有数据坚持本地优先

### 未来规划

- [ ] **浏览器扩展**：在网页端（如 ChatGPT/Claude）直接调取 PromptHub 库，实现无缝工作
- [ ] **移动端应用**：支持手机端查看、搜索与简单的编辑同步
- [ ] **插件系统**：支持用户自定义扩展 AI 供应商或本地模型（如 Ollama）集成
- [ ] **批量导出与转换**：支持将提示词导出为常用 AI 工具支持的特定格式
- [ ] **增强型变量**：支持选择框、动态日期等更复杂的变量类型
- [ ] **技能市场**：支持用户上传和分享自己创建的技能

<div id="changelog"></div>

## 更新日志

查看完整的更新日志：**[CHANGELOG.md](./CHANGELOG.md)**

### 最新版本 v0.5.5 (2026-05-05)

**Skill / AI**

- 🧩 **商店 Skill 更新检测与冲突保护**：商店下载的 Skill 会保存安装时内容哈希与版本，可检查远端 `SKILL.md` 是否变化，并在本地修改与远端更新同时存在时提示冲突
- 🌍 **完整 `SKILL.md` AI 翻译**：Skill 翻译改为针对完整文档生成 sidecar 译文，支持全文翻译与沉浸式对照显示，描述区和正文区始终基于同一份文档版本渲染
- 💬 **AI 测试与翻译错误提示优化**：模型测试结果会直接显示“XX 模型测试成功/失败”；翻译模型未配置、请求超时或网关返回 `504` 时，也会直接提示具体原因

**桌面 / Desktop**

- 🗂️ **数据目录切换真正重启生效**：切换数据目录后现在会通过专用 relaunch IPC 重启应用并重新应用 `userData` 路径，选择当前已生效目录时也不会再误报待重启
- 🎞️ **视频保存边界收紧**：视频保存现在只接受主进程文件选择器刚返回的目标路径，并限制到受支持的视频扩展名，避免 renderer 直接写入任意本地路径
- 🔄 **平台部署隐藏内部 sidecar**：Skill 平台 symlink 安装改为只链接 canonical `SKILL.md`，不会把 `.prompthub` 翻译 sidecar 暴露到外部平台技能目录

**Web / Docs**

- 🌐 **媒体上传与显示修复**：Web/Docker 环境支持图片、视频选择上传，并能显示桌面同步来的 `local-image://` / `local-video://` 媒体
- 🔐 **同步私密状态与密码修复**：桌面数据同步到网页端时，不再把缺失 `visibility` 的普通文件夹误判为私密；自托管 Web 设置页也新增登录密码修改入口
- 🌍 **发版文档重同步**：重新整理 README、多语言 README、CHANGELOG 与官网 release metadata，使最终 `v0.5.5` 说明与实际交付内容一致

> [查看完整更新日志](./CHANGELOG.md)

<div id="contributing"></div>

## 贡献与开发

### 贡献入口

- 根 `CONTRIBUTING.md`：GitHub 自动发现的贡献入口
- `docs/contributing.md`：当前有效的 canonical 贡献指南
- `docs/README.md`：对外文档索引
- `spec/README.md`：内部 SSD / spec 索引

<div id="tech-stack"></div>

### 技术栈

| 类别 | 技术 |
| ---- | ---- |
| 桌面端 Runtime | Electron 33 |
| 桌面端前端 | React 18 + TypeScript 5 + Vite 6 |
| 自部署 Web | Hono + React + Vite |
| 样式 | Tailwind CSS 3 |
| 状态管理 | Zustand |
| 数据层 | SQLite、`better-sqlite3`、`node-sqlite3-wasm` |
| Monorepo 包 | `packages/shared`、`packages/db` |

<div id="project-structure"></div>

### 仓库结构

```text
PromptHub/
├── apps/
│   ├── desktop/   # Electron 桌面端 + CLI
│   └── web/       # 自部署 Web
├── packages/
│   ├── db/        # 共享数据层
│   └── shared/    # 共享类型、常量与协议
├── docs/          # 对外文档
├── spec/          # 内部 SSD / spec 系统
├── website/       # 官网相关资源
├── README.md
├── CONTRIBUTING.md
└── package.json
```

<div id="docs-workflow"></div>

### 常用开发命令

| 场景 | 命令 |
| ---- | ---- |
| 桌面端开发 | `pnpm electron:dev` |
| Web 开发 | `pnpm dev:web` |
| 桌面端构建 | `pnpm build` |
| Web 构建 | `pnpm build:web` |
| 桌面端 lint | `pnpm lint` |
| Web lint | `pnpm lint:web` |
| 桌面端全量测试 | `pnpm test -- --run` |
| Web 全量验证 | `pnpm verify:web` |
| CLI 源码运行 | `pnpm --filter @prompthub/desktop cli:dev -- --help` |
| E2E | `pnpm test:e2e` |
| 发布前桌面门禁 | `pnpm test:release` |

### 文档与 SSD 工作流

- `docs/` 负责仓库访客、用户、部署者和贡献者可读说明
- `spec/` 负责内部 SSD、稳定领域文档、稳定逻辑、固定资产、架构和活跃变更
- 非 trivial 改动应先建立 `spec/changes/active/<change-key>/`
- 每个重要变更至少包含 `proposal.md`、`specs/<domain>/spec.md`、`design.md`、`tasks.md`、`implementation.md`
- 完成后同步稳定事实到 `spec/`，同步对外契约到 `docs/` 或根 `README.md`

完整贡献规范、测试门禁与提交约束见 [`docs/contributing.md`](./docs/contributing.md)。

<div id="license"></div>

## 许可证

本项目采用 [AGPL-3.0 License](./LICENSE) 开源协议。

<div id="support"></div>

## 支持

- **问题反馈**: [GitHub Issues](https://github.com/legeling/PromptHub/issues)
- **功能建议**: [GitHub Discussions](https://github.com/legeling/PromptHub/discussions)

## 致谢

- [Electron](https://www.electronjs.org/) - 跨平台桌面应用框架
- [React](https://react.dev/) - UI 框架
- [TailwindCSS](https://tailwindcss.com/) - CSS 框架
- [Zustand](https://zustand-demo.pmnd.rs/) - 状态管理
- [Lucide](https://lucide.dev/) - 图标库

## 贡献者

感谢所有为 PromptHub 做出贡献的开发者！

<a href="https://github.com/legeling/PromptHub/graphs/contributors">
  <img src="https://contrib.rocks/image?repo=legeling/PromptHub" alt="Contributors" />
</a>

---

<div align="center">
  <p><strong>如果这个项目对你有帮助，请给个 ⭐ 支持一下！</strong></p>
  <p><strong>If this project helps you, please give it a ⭐!</strong></p>
  
  <a href="https://www.buymeacoffee.com/legeling" target="_blank">
    <img src="https://cdn.buymeacoffee.com/buttons/v2/default-yellow.png" alt="Buy Me A Coffee" height="50" />
  </a>
</div>

---

<div id="sponsor"></div>

## 赞助支持 / Sponsor

如果 PromptHub 对你的工作有帮助，欢迎请作者喝杯咖啡！

If PromptHub is helpful to your work, feel free to buy the author a coffee!

<div align="center">
  <table>
    <tr>
      <td align="center">
        <img src="./docs/imgs/donate/wechat.png" width="200" alt="WeChat Pay"/>
        <br/>
        <b>微信支付 / WeChat Pay</b>
      </td>
      <td align="center">
        <img src="./docs/imgs/donate/alipay.jpg" width="200" alt="Alipay"/>
        <br/>
        <b>支付宝 / Alipay</b>
      </td>
    </tr>
  </table>
</div>

---

<div id="qq-group"></div>

## QQ 交流群

欢迎加入 PromptHub QQ 交流群，一起反馈问题、交流使用方式和讨论新功能。

- 群号：`704298939`

<div align="center">
  <img src="./docs/imgs/qq-group.jpg" width="320" alt="PromptHub QQ 交流群二维码"/>
  <p><strong>扫码加入 PromptHub QQ 交流群</strong></p>
</div>

<div id="backers"></div>

## 💖 致谢支持者 / Backers

感谢以下朋友对 PromptHub 的捐赠支持：

| 日期       | 支持者 | 金额     | 留言                             |
| :--------- | :----- | :------- | :------------------------------- |
| 2026-01-08 | \*🌊   | ￥100.00 | 支持优秀的软件！                 |
| 2025-12-29 | \*昊   | ￥20.00  | 感谢您的软件！能力有限，小小支持 |

**联系邮箱 / Contact**: legeling567@gmail.com

感谢每一位支持者！你们的支持是我持续开发的动力！

Thank you to every supporter! Your support keeps me motivated to continue development!
