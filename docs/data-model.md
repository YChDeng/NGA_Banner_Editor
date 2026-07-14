# Banner Block/Slot 数据模型

> 文档定位：本文面向开发者，说明 `BannerModel` 的内部数据结构、身份和生命周期。版头作者需要的 comment 扩展写法、配对规则和完整示例请见 [Block/Slot 扩展语法规范](./extension-syntax.md)。

## 总览

`BannerModel` 是一次 BBCode 快照的规范化、只读语义模型，唯一公开解析入口为 `buildBannerModel(text)`。渲染器在每次资源更新时直接构建该模型，并以 `BannerModel` 作为 current state；UI 不再调用 `parseResourceCatalog` 或 `projectCatalog`。

模型根包含 `generation`、`snapshot`、全文 `range`、`rootBlock`、扁平的 `blocks` / `slots` / `styleBlocks`、`defaultDeclarations`、`diagnostics` 和 `tokensById`。

## Block 与路径

Block 是逻辑容器。目录 comment 的前缀栈（`++名称` / `--名称`）与逆序后缀栈（`名称++` / `名称--`）共同形成完整 legacy 路径。对普通 image/text/url，完整 `pathParts` 的最后一级是 Slot 名，之前所有段（包括普通 resource comment 所在段）都是 Block。

同一父 Block 下同名 Block 按逻辑路径合并。每段目录在源码中的打开/关闭声明记录在 `sourceOccurrences`，所以一个 Block 可以对应多个源码来源；重命名仍可利用 token 与 paired token 范围批量编辑。Block 的 `logicalId` 只依赖父逻辑路径和名称，不依赖位置或字段值。

没有命名 comment 的资源进入虚拟 Block“未分类”。它没有可编辑源码声明，使用保留逻辑 ID `__system_uncategorized__`。

## Slot 单源码与重复诊断

Slot 由“父逻辑路径 + 类型 + 名称”唯一标识，并且正常情况下只有一个 `source`。图片、URL、文本分别形成 Slot；路径最后一级是 Slot 名。

若再次出现相同键，后来的来源不会合并，也不会覆盖首个 Slot 的有效 source，而是加入 `slot.conflicts`，并产生带精确源码 range、行号、Slot ID 和冲突 source 的 `duplicate-slot` 诊断。轻量 UI 视图仍展示冲突资源卡，便于定位和处理。

未分类资源没有可声明的稳定名称，因此按来源种类和源码起点区分，避免把所有匿名资源误报为重复；它们仍归属同一个虚拟容器。

## StyleBlock

`[comment // 名称!属性]` 不形成 Slot，而形成名称为该 comment 名称的 `StyleBlock`。通常其父 Block 为完整 `pathParts.slice(0, -1)`；实现上以 `!属性` comment 自身所在段作为 StyleBlock 名并移除该段，其余前缀、后缀段保持原顺序作为父路径，因此 suffix 极端场景也遵循同一规则。资源 source 保留 `attr` 字段和编辑方式。

## 图片默认声明

`[comment // #名称!图片 = 值]` 是默认声明。相同名称重复声明时遵循源码顺序，后者生效。前一声明记录 `shadowedByTokenId`，后一声明记录 `shadowsTokenId`，并生成 warning 级 `shadowed-default` 诊断；该提示不阻止默认值应用。删除后一个声明并重新解析后，前一个声明自然恢复生效。

默认值按路径末级 Slot 名匹配图片 Slot。Slot 的派生值状态 `valueState` 为三态：

- `disabled`：值为空；即使存在有效默认值也保持关闭；
- `default`：值非空且严格等于有效默认值，表示启用默认；
- `manual`：其他非空值，表示启用手动值。无默认值时只会派生出 `disabled` 或 `manual`。

状态是派生结果，不作为可编辑源码真值保存。

## 身份、fingerprint 与生命周期

逻辑身份和内容变化严格分离：

- `logicalId` / `stableId` 由逻辑父路径、类型、名称生成，字段值变化不会改变；
- `contentFingerprint` 由 source range 对应的当前文本切片生成，用于内容比较；
- 冲突资源的轻量 view stable ID 在逻辑 ID 后附加冲突序号，正常资源保持逻辑 stable ID，以维持定位、滚动锚点和折叠状态。

`generation` 是整个 `snapshot` 的哈希。所有 range 都是该快照中的 UTF-16 半开区间 `[start, end)`，仅在 generation 对应的 snapshot 生命周期内有效。`sliceModelRange(model, range)` 会先验证 generation 和边界，再执行切片。编辑发生后必须重新解析；旧 generation 的 range 不得用于替换。UI 的替换验证仍同时检查 generation、边界、期望文本和区间重叠。

## 轻量视图派生和目录消费

渲染器只从 `model.slots`、`model.styleBlocks`、各 Slot 的 `source/conflicts` 及 `model.diagnostics` 派生资源卡绑定和 fingerprint 输入。这些对象是无解析逻辑、无独立生命周期的轻量 view 数据；源码真值、generation、token、range 和诊断始终来自当前 `BannerModel`。目录树直接遍历 `BannerModel.rootBlock`，视觉上呈现为 Block 节点 → Slot/StyleBlock 叶节点，资源卡挂在对应叶节点下，因此保留完整旧路径层级；旧 `pathParts` 不再是目录树唯一底层模型。`projectCatalog` 若保留，仅用于测试或迁移验证，不进入运行时渲染器。

Block 菜单名称由 `sourceOccurrences` 的 token 驱动。Slot 与 StyleBlock 的 `source` 显式保存 `nameTokenId`、`nameToken`、`pairedNameTokenId` 和 `pairedNameToken`：普通 Slot 使用普通 name token，suffix Slot 使用 suffix open token 及其 paired close token，StyleBlock 使用 `!属性` name token。菜单重命名直接消费这些模型引用；未分类 source 不含 name token，因此不可重命名。叶节点 key 包含节点种类、Slot 类型和逻辑 ID，避免同父 Block/Slot 同名或不同类型 Slot 同名时冲突。
