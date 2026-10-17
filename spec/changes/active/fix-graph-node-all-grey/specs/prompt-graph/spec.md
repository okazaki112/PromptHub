# Delta Spec: prompt-graph · 节点配色的退化防护

## ADDED Requirements

### REQ-GC-1 高亮聚焦不得在目标不可见时压暗全图
- AC-1.1 当 `hoveredId ?? selectedPromptId` 指向的节点不在当前可见节点集（被 tag/folder 过滤、focus 子图外、已从 prompts 删除、数据重建竞态）时，节点着色 MUST 按"无高亮"处理，任何可见节点都不得被判定为 dimmed。
- AC-1.2 当高亮目标可见时，聚焦语义保持不变：目标高亮、其邻居正常上色、其余可见节点 dimmed。
- AC-1.3 高亮目标可见且为孤立点时无邻居，其余 dimmed 属预期，但目标自身 MUST 保持 selected/accent 色（不得一并变灰）。

### REQ-GC-2 folders 未就绪不得伪装成"无文件夹灰"
- AC-2.1 图谱在 `foldersLoaded === false` 且存在带 `folderId` 的提示节点时 MUST 显示加载态而非铺满中性灰节点，避免冷启动/切换数据灰闪。
- AC-2.2 `folder.fetchFolders` 成功时 MUST 置 `foldersLoaded=true`；失败时 MUST 保持 `false`（不得静默留下空 folders 让图谱永久灰），并保留错误日志。
- AC-2.3 无提示（`nodes.length===0`）时仍先显示既有空态，优先于加载态。

### REQ-GC-3 孤儿子树稳定上色
- AC-3.1 节点的 `folderId` 存在于 folders、但其祖先链缺失（父引用为孤儿）时，底色 MUST 解析为一个稳定的调色板颜色（同一孤儿根恒同色、不同根可不同色），不得退化为 `rootIndex<0` 中性灰。
- AC-3.2 能解析到真实根文件夹时，颜色语义仍是"根文件夹槽位"，不变。

### REQ-GC-4（保持）未分组中性灰
- 未分组（`folderId=null`）节点继续显示中性色，不纳入本次改动（非目标）。

## MODIFIED / REMOVED
- 无接口/契约移除。`FolderState` 仅增加只读字段 `foldersLoaded`。
