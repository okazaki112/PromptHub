# Spec Delta: 选择性导出范围默认值（desktop-data 域）

### FR-SEXP-001 版本历史默认勾选
设置 → 数据 → 备份与恢复 → 选择性导出勾选清单首次呈现时，「版本历史」必须处于已选中状态（与 Prompts、文件夹、媒体、AI 配置、系统设置、规则、Skill 一致）。用户仍可主动取消。

### FR-SEXP-002 默认范围端到端生效
在未做任何勾选改动的前提下点击「导出」，导出的范围必须包含版本历史：`import-with-prompthub.json` 的 `payload.versions` 非空集合，且 zip 内存在 `versions/` 目录（桌面端）。反向：用户取消「版本历史」后导出不得包含版本数据。

### MOD-SEXP-001 媒体项的打包口径（现状记录，非本轮变更）
勾选「媒体」时，zip 的 `images/`（及 `videos/`）目录内容 = 磁盘 `data/assets/images`（含旧路径回退）整目录递归拷贝，不按「是否被导出内容引用」过滤。因此存放于同一目录的桌面背景图必然随备份导出；`import-with-prompthub.json` 的 `payload.images` 只包含被 Prompt 引用的图片，两者口径不同。
