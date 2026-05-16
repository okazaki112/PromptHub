# Design

## Overview

把 `spec/issues/` 明确拆成三层：

- `spec/issues/README.md`：总入口与同步说明。
- `spec/issues/active/`：仍在跟踪的问题，包括当前 open GitHub issues 快照与内部质量跟踪。
- `spec/issues/archive/`：已关闭 GitHub issues 快照与未来可归档的问题文档。

这次只做文档级同步，不引入脚本，不改变 GitHub issue workflow。

## Affected Areas

- Data model:
- 无运行时数据模型变更，仅新增 spec 文档结构。

- IPC / API:
- 无。

- Filesystem / sync:
- 无产品同步逻辑变更；仅同步 GitHub issue 元数据到仓库内文档。

- UI / UX:
- 无产品 UI 变更。

## Tradeoffs

- 静态 Markdown 快照简单直接、容易审阅，但需要后续人工刷新。
- 先把 active/archive 结构和当前 issue 状态落地，比直接做自动化更小、更稳，也更符合这次“先记录下来”的目标。
