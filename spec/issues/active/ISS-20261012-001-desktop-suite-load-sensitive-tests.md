# ISS-20261012-001: 桌面全量单测存在负载敏感偶发失败

## Status

- State: open
- Created: 2026-10-12
- Severity: 低（测试可靠性缺陷，非产品缺陷）
- Owner surface: `apps/desktop/tests`
- Related change: `spec/changes/active/desktop-selective-export-defaults`

## Symptom

全量单测（本机 Windows，30 个 `tests/unit/main/*` 文件因缺少符号链接权限长期失败）在并发压力下会额外偶发失败，隔离复跑必过。2026-10-12 两次全量各命中一条，且分属不同成因：

| 轮次 | 额外失败 | 报错 |
| --- | --- | --- |
| `task-plan/v064-bgexport-full.log` | `skill-library-import-modal.test.tsx > ignores repeated custom target picker clicks while a folder picker is pending` | `expect(element).toBeDisabled()` 收到可用按钮 |
| `task-plan/v064-bgexport-full2.log` | `rules-workspace.test.ts > deduplicates concurrent initial snapshots for global rules on first read` | `EPERM: operation not permitted, rename ... .tmp -> CLAUDE.md`（`packages/core/src/rules-workspace.ts:234`） |

对照基线 `task-plan/v063-full2.log`（30 failed files / 106 failed tests）：第二轮全量失败文件集合与基线完全一致，仅失败用例数 +1；两条额外用例单独复跑均通过（modal 5/5、`rules-workspace` 该用例 687ms 通过）。

## Root cause

1. **计时竞争断言**：`skill-library-import-modal.test.tsx:178-206` 用真实 `setTimeout(50)` 让 picker promise 延迟落地，然后在 `user.dblClick` 之后立即断言按钮处于禁用态。`userEvent` 每个指针步骤都会让出宏任务，50ms 墙钟在高负载下可能先触发，按钮恢复可用 ⇒ 断言按机器负载而非代码逻辑失败。违反 `AGENTS.md` §12「Flaky time-based tests」与 §7.1「no timing dependencies」。
2. **Windows 临时目录重命名争用**：`writeTextFileAtomic` 采用「写临时文件 + rename」，在同机大量临时文件并发读写时 rename 可被 `EPERM` 拒绝。该文件本身已有基线失败（symlink 权限），说明测试环境处于权限/争用敏感区。

## Suggested fix

1. modal 用例改为由测试持有 resolver（同文件下一个用例已用 `let resolvePicker` 模式）或使用 `vi.useFakeTimers()` + 显式推进；并补「pending 期间禁用」与「resolve 后恢复」双相位断言，使禁用态成为被测行为而非竞态副产品。
2. `writeTextFileAtomic` 的 rename 增加有界重试（短退避 + 重试上限，超限才抛错），或在测试中隔离每条用例的临时根目录，避免跨用例争用同一目录。

## Repro / verification notes

- 复现方式：全量并发跑；单文件跑必过（已实测）。
- 频率实测（同一台 Windows 机器，4 次全量）：
  - `v064-bgexport-full.log`：modal 计时用例失败。
  - `v064-bgexport-full2.log`：`rules-workspace` rename 用例失败（EPERM）。
  - `v064-bgrestore-full.log`：两条均通过，失败集合与基线完全一致（106 条）。
  - `v064-bgrestore-final.log`：`rules-workspace` rename 用例再次失败（EPERM，`packages/core/src/rules-workspace.ts:234`），失败文件集合仍与基线逐文件一致。
  即 rename 争用类偶发约 2/4 次，且始终落在基线已失败的 `tests/unit/main/*` 文件内。
- 与备份口径改动无因果关系：改动文件清单不含 `packages/core`，且被测组件不依赖 `database-backup` / `data-export` 代码路径。
