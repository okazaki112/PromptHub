# Delta Spec

## Added

- `spec/issues/` 必须同时支持 active 与 archive 两层，用于区分仍在跟踪的问题和已关闭归档的问题记录。
- 仓库当前 GitHub issue 状态应有一个可从 `spec/` 内直接访问的记录入口，而不是完全依赖外部 GitHub 页面临时查看。

## Modified

- `spec/issues/active/` 的职责从“内部质量问题”扩展为“仍在跟踪的问题”，包括内部问题文档和当前 open GitHub issue 快照。
- `spec/issues/archive/` 的职责定义为“已关闭或仅保留历史参考价值的问题记录”。

## Removed

- 无。

## Scenarios

- 当贡献者需要查看当前仍在处理的仓库问题时，应能从 `spec/issues/README.md` 进入 `spec/issues/active/github-open.md`。
- 当贡献者需要查看仓库已关闭问题的历史上下文时，应能从 `spec/issues/README.md` 进入 `spec/issues/archive/github-closed.md`。
- 当内部仍有未收敛的质量风险时，这些内容仍可继续保留在 `spec/issues/active/quality.md`，不与 GitHub issue 快照混淆。
