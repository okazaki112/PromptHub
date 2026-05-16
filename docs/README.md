# PromptHub Docs 索引

`docs/` 现在只保留面向仓库访客、用户、部署者、贡献者的说明文档。

仓库根目录仍保留少量平台约定文件，方便 GitHub 和发布平台直接识别：

- `README.md`
- `CONTRIBUTING.md`
- `CHANGELOG.md`
- `AGENTS.md`

其中根 `CONTRIBUTING.md` 只是 GitHub 的发现入口，当前有效的贡献指南仍是 `docs/contributing.md`。

内部需求、规格、设计、任务、实现、架构、问题追踪已经统一迁入 `spec/`。如果你要查 SSD 工作流或内部工程文档，请直接看 `spec/README.md`。

`spec/` 的内部结构参考 OpenSpec，并且比此前版本更完整：既有稳定 `spec/domains/`，也有活跃 delta specs、稳定逻辑、固定资产、archive、legacy 与模板目录，内部文档不再混放在 `docs/`。

## `docs/` 中应放什么

- 用户使用说明
- 部署与自部署文档
- 贡献指南与仓库协作说明（根 `CONTRIBUTING.md` 只做入口）
- 多语言 README
- 截图、图片和其他公开资源

## `docs/` 中不应放什么

- proposal / spec / design / tasks / implementation
- 内部 architecture 约束
- 内部 issue / quality tracking
- 活跃变更目录与历史变更档案

这些内容全部属于 `spec/`。

## 当前目录地图

```text
docs/
├── README.md
├── contributing.md
├── web-self-hosted.md
├── README.en.md
├── README.zh-TW.md
├── README.ja.md
├── README.de.md
├── README.es.md
├── README.fr.md
└── imgs/
```

## 内部文档入口

- `spec/README.md`
- `spec/domains/`
- `spec/logic/`
- `spec/assets/`
- `spec/architecture/`
- `spec/changes/active/`
- `spec/changes/archive/`
- `spec/changes/legacy/`
- `spec/issues/active/`
