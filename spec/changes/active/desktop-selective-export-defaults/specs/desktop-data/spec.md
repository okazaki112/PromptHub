# Spec Delta: 选择性导出范围与媒体打包口径（desktop-data 域）

### FR-SEXP-001 版本历史默认勾选
设置 → 数据 → 备份与恢复 → 选择性导出勾选清单首次呈现时，「版本历史」必须处于已选中状态（与 Prompts、文件夹、媒体、背景图、AI 配置、系统设置、规则、Skill 一致）。用户仍可主动取消。

### FR-SEXP-002 默认范围端到端生效
在未做任何勾选改动的前提下点击「导出」，导出范围必须包含版本历史：`import-with-prompthub.json` 的 `payload.versions` 非空，且 zip 内存在 `versions/` 目录。反向：取消「版本历史」后不得包含版本数据。

### FR-SEXP-003 背景图独立开关
勾选清单新增「背景图」项且默认选中。开启时 zip 的 `images/` 必须包含当前桌面背景图文件（设置中的引用文件名，经安全规范化）；关闭时不得包含该文件。设置未选背景图时，开启该项也不产生任何图片条目。背景图开关与「媒体」开关互不影响。

### FR-SEXP-004 媒体项只打包被引用图片
勾选「媒体」时，zip 的 `images/` 只包含被本次导出的 Prompt 引用到的图片文件；未被引用的文件（含历史背景残留）不得进入备份。磁盘上缺失的引用文件跳过而不中断导出。文件名必须是不含分隔符的裸 basename，越界名（`../`、绝对路径、嵌套路径、空字节）必须被拒绝。

### MOD-SEXP-001 其它目录口径不变
`videos/`、`prompts/`、`versions/`、`skills/`、`rules/`、`config/` 仍为整目录递归拷贝（`collectDirFiles`）。本轮只收紧图片目录。

### MOD-SEXP-002 备份 zip 的图片目录不是恢复输入
无论 `images/` 内容如何裁剪，恢复流程只消费 `import-with-prompthub.json`；Prompt 媒体由 payload 内 base64 经 `image:saveBase64` 落盘，背景图引用由 `payload.settings.state.backgroundImageFileName` 恢复。因此 FR-SEXP-004 不改变任何可恢复数据。
