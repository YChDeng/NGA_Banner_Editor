# Block/Slot 扩展语法规范

本文面向 NGA 版头作者，说明如何用 `[comment // ...]` 给图片、链接、文本和属性标签命名并组织目录。扩展标记只供本编辑器归类、定位和编辑资源；它们仍是普通 comment，不改变 NGA 对版头的渲染结果。

BBCode 源码是唯一真值。目录树、状态、默认值和诊断都是从当前完整源码派生的；作者手工修改、移动、插入或删除任何片段后，编辑器都会重新解析全文，不依赖旧目录树继续推断。

## 1. 适用范围与术语

- **Banner**：一份完整的版头 BBCode 文本，也是一次解析的根。
- **Block**：资源树中的逻辑容器。它可以由 prefix、普通资源名和 suffix 共同形成，但不保存资源值。
- **Slot**：可编辑资源的叶节点。当前有 **ImageSlot**（图片）、**TextSlot**（文本）、**LinkSlot**（链接）三种。
- **StyleBlock**：由 `!属性` 声明的具名属性编辑项；它是属性标签的视图，不是第四种 Slot。
- **默认声明**：`#名称!图片 = 值`，为同名 ImageSlot 提供可选默认图片值。
- **槽位结构**：由 comment 名称和目录栈决定的 Block/Slot 路径。即使实际值为空，结构仍然存在。
- **实际值**：`dybg` 的第六段、`img` 标签内容、`url=` 值或 `!文本` 后的文本。清空实际值不会删除 Slot。

## 2. comment 标记总览

所有扩展都写在 `[comment // ...]` 中，名称会去除首尾空白。

目录与命名：

- 普通命名：`[comment // 名称]`，命名同一行中随后出现的图片或链接资源。
- prefix 打开：`[comment // ++名称]`
- prefix 关闭：`[comment // --名称]`
- suffix 打开：`[comment // 名称++]`
- suffix 关闭：`[comment // 名称--]`

资源特性：

- 文本：`[comment // 名称!文本]`
- 属性：`[comment // 名称!属性]`
- 图片默认声明：`[comment // #名称!图片 = 图片值]`

`++` / `--` 位于名称前方时是 prefix，位于名称后方时是 suffix。打开和关闭标记的名称必须完全一致。

## 3. 路径构造

对图片、链接和文本，解析器在发现资源时按以下顺序构造路径：

1. 依 prefix 的打开顺序加入全部 prefix 名称；
2. 加入资源的普通名称；
3. 依 suffix 的打开顺序取反，加入全部 suffix 名称；
4. 最后一级是 Slot，之前所有级都是 Block。

可记作：`prefix 打开顺序 + resource name + suffix 逆序`。

### 3.1 没有 suffix

```bbcode
[comment // ++导航]
[comment // 首页][url=https://example.com]进入[/url]
[comment // --导航]
```

完整路径是 `\导航\首页`：Block 为 `导航`，LinkSlot 为 `首页`。

### 3.2 一个 suffix

```bbcode
[comment // ++导航]
[comment // 地址++]
[comment // 首页][url=https://example.com]进入[/url]
[comment // 地址--]
[comment // --导航]
```

完整路径是 `\导航\首页\地址`：Block 为 `导航 → 首页`，LinkSlot 为 `地址`。

### 3.3 嵌套 suffix

```bbcode
[comment // ++导航]
[comment // 交互++]
[comment // 悬停++]
[comment // 首页][img]hover.webp[/img]
[comment // 悬停--]
[comment // 交互--]
[comment // --导航]
```

suffix 依次打开 `交互`、`悬停`，加入路径时反转为 `悬停`、`交互`。完整路径是 `\导航\首页\悬停\交互`；其中 `导航 → 首页 → 悬停` 是 Block，ImageSlot 名为 `交互`。

prefix 和 suffix 分别使用独立的栈，但各自都必须后开先关。下面是交叉关闭错误：

```bbcode
[comment // ++甲]
[comment // ++乙]
[comment // --甲]
[comment // --乙]
```

关闭 `甲` 时当前栈顶是 `乙`，因此会报告交叉关闭。正确顺序应先 `--乙`，再 `--甲`。suffix 同理。

## 4. 三种 Slot

资源 comment 与目标资源必须在同一行。换行会使它们失去关联；此时目标资源通常进入“未分类”，而命名 comment 不会跨行等待资源。

### 4.1 ImageSlot

`dybg` 和 `img` 都形成 ImageSlot。普通 comment 必须位于同一行目标资源之前。

```bbcode
[comment // 背景][style dybg 1;0;0;0;0;https://example.com/bg.webp]
[comment // 图标][img]https://example.com/icon.webp[/img]
```

`dybg` 固定读取六个以分号分隔的值：缩放、位置 X、位置 Y、活动量 X、活动量 Y、图片链接。图片实际值是第六段。

空图片仍是有效 Slot：

```bbcode
[comment // 背景][style dybg 1;0;0;0;0;]
[comment // 图标][img][/img]
```

清空图片只清空图片值，不删除 comment，也不改动 `dybg` 的前五个参数。

### 4.2 LinkSlot

链接取 `[url=...]` 开始标签中的值；结束标签及显示文字不属于可编辑链接值。

```bbcode
[comment // 官网][url=https://example.com]访问官网[/url]
[comment // 备用入口][url=]尚未启用[/url]
```

两行分别是非空和空 LinkSlot。comment 与 `[url=...]` 必须同一行。

### 4.3 TextSlot

文本使用 `!文本`，且必须被同一行、在 comment 之前已经打开的 `[style ...]` 包裹：

```bbcode
[style color #112233 font 1.2][comment // 标题!文本]欢迎访问[/style]
[style color #112233][comment // 副标题!文本][/style]
```

第一行的值是“欢迎访问”，第二行是空值。文本范围从 comment 结束处开始，到对应的 style 关闭标签之前结束。comment、文本和该关闭标签必须在同一行；没有可匹配的 style 关闭标签时会报告错误。当前从包裹 style 中额外解析可编辑的 `color`（3 或 6 位十六进制）和正数 `font`；这不改变 TextSlot 的值判定。

## 5. StyleBlock（`!属性`）

`[comment // 名称!属性]` 读取同一行随后出现的第一个非关闭、非 comment 标签，并形成 StyleBlock：

```bbcode
[comment // 主容器!属性][style background #202020 color #ffffff width 80]
[comment // 固定尺寸!属性][fixsize width 90 180 height 18 background #202020 #303030]
```

StyleBlock 是具名属性编辑项，不是 Slot，因此不参与 ImageSlot / TextSlot / LinkSlot 的重复键或三态判断。若 `!属性` 后同一行没有属性标签，会报告“未找到 !属性 后面的属性标签”。

当前解析器会把标签原始内容整体保留，并拆出这些字段供界面编辑：

- `fixsize`：`width` 的下限和上限、`height`、`background` 的外背景色和内背景色；其他键按一个后续值读取。
- 一般标签（常见为 `style`）：`background`、`color`、`width`、`height`、`border-radius`、`line-height`、`left`、`right`、`top`、`bottom`、`rotate`、`font`、`align`。
- `filter-drop-shadow`：从分号值中解析阴影颜色、X、Y、模糊。
- `dybg`：解析缩放、位置 X/Y、活动量 X/Y、图片链接。
- 未列出的键：按“键 + 一个值”读取。

## 6. 图片默认声明

语法如下：

```bbcode
[comment // #图标!图片 = https://example.com/default.webp]
```

默认声明是文档级声明，不受它所在位置的 prefix/suffix 栈限制。它按 **ImageSlot 最终名称** 严格匹配，区分字符差异；不匹配完整路径，也不作用于 LinkSlot、TextSlot 或 StyleBlock。

同名声明出现多次时，源码靠后的声明生效，较早声明产生 `shadowed-default` warning：

```bbcode
[comment // #图标!图片 = old.webp]
[comment // #图标!图片 = new.webp]
[comment // 图标][img]new.webp[/img]
```

这里有效默认值是 `new.webp`。删除后一条声明并重新解析，`old.webp` 会恢复为有效默认值。声明本身不会自动改写图片；“默认”操作才会把当前有效默认值写入图片值。

空默认值在语法上会被记录：

```bbcode
[comment // #图标!图片 = ]
```

但它不提供有意义的启用默认值。由于空图片总是优先判定为 `disabled`，图片值为空时不会成为 `default`；界面执行“默认”也只会写入空串，结果仍是 `disabled`。因此作者应避免空默认声明。

## 7. Slot 三态与源码操作

状态完全由实际值和当前有效默认值派生，不需要、也不存在额外状态标记：

- `disabled`：实际值是空串（或不存在）。即使有非空默认值，也仍为禁用。
- `default`：实际值非空，并且与当前有效默认值逐字符严格相等。
- `manual`：其他非空值。没有默认声明的非空值也属于此状态。

操作到源码的映射：

- **清空**：把资源实际值替换为空串；保留 comment、标签结构和其他参数，重解析后为 `disabled`。
- **默认**：仅对有默认声明的图片，把实际值替换为当前有效默认值；非空且相等时为 `default`。
- **手动填写**：直接把输入写入实际值；非空且不等于有效默认值时为 `manual`。若手填内容恰好等于默认值，重解析后仍会判定为 `default`。

## 8. Block 合并、Slot 单来源与冲突

同一逻辑路径的 Block 会合并，所以一个 Block 可以来自源码中多组分离的打开/关闭标记。Slot 则按“父 Block 逻辑路径 + 资源类型 + Slot 名”唯一标识，正常情况下只有一个有效来源。

重复出现同一 Slot 唯一键时，后者不会覆盖或合并前者，而会保存在冲突来源中，并产生 `duplicate-slot` error。不同资源类型即使同名也不是同一个键。

下面两个分离区段把同一逻辑 Block `\Pg1_穗穗\版头左侧菜单\icon-01` 合并起来，并在其中提供两个不同 Slot：

```bbcode
[comment // ++Pg1_穗穗]
[comment // ++版头左侧菜单]
[comment // 悬停效果++]
[comment // icon-01][style dybg 1;2;3;4;5;https://example.com/icon-hover.webp]
[comment // 悬停效果--]
[comment // --版头左侧菜单]
[comment // --Pg1_穗穗]

[comment // ++Pg1_穗穗]
[comment // ++版头左侧菜单]
[comment // URL++]
[comment // icon-01][url=https://example.com/topic]进入主题[/url]
[comment // URL--]
[comment // --版头左侧菜单]
[comment // --Pg1_穗穗]
```

第一段路径为 `\Pg1_穗穗\版头左侧菜单\icon-01\悬停效果`，第二段为 `\Pg1_穗穗\版头左侧菜单\icon-01\URL`。两段共同形成 Block `icon-01`；其下分别是 ImageSlot `悬停效果` 和 LinkSlot `URL`，因此没有重复冲突。

## 9. 重命名语义

- 重命名 Block 时，编辑器会修改该逻辑 Block 的所有源码来源；每个来源如有配对的开闭标记，开和闭会一起改名。
- suffix 形成最终 Slot 名时，Slot 的命名来源是 suffix 打开标记；重命名该 Slot 会同时修改配对的 suffix 关闭标记。
- 普通 Slot 使用其普通命名 comment 重命名。
- “未分类”是没有可编辑声明的虚拟 Block。未分类资源没有命名 token，不能在目录树中改名；应先在源码中添加合法 comment。

重命名只改 comment 中的名称，不改实际资源值。

## 10. 错误与诊断

解析器会报告以下结构或资源问题：

- **未闭合**：解析结束时 prefix 或 suffix 打开标记仍留在栈中。
- **关闭没有对应开始**：关闭时该类栈为空。
- **关闭名称不匹配（错名）**：栈非空，但关闭名称不在当前打开栈中。
- **交叉关闭**：关闭名称存在于栈中但不是栈顶，违反后开先关。
- **缺属性标签**：`!属性` 后同一行没有可读取的开始标签。
- **文本关闭标签错误**：`!文本` 未处于可匹配的 style 包裹中，或同一行找不到对应 style 关闭标签。
- **默认覆盖 warning**：同名图片默认声明中，较早者被后者覆盖；不阻止后者应用。
- **重复 Slot error**：同一父路径、类型和名称再次出现；后者保留为冲突，不覆盖首个来源。

未命名的 `dybg`、`img`、`url` 会进入“未分类”，这通常不是栈错误，但意味着无法通过目录重命名。

## 11. 编辑范围安全与重解析

每次解析都记录当前完整源码快照，并生成 `generation`，可理解为这版源码的指纹。每个可编辑值还记录当时的 `expected` 原文。执行替换前，编辑器会确认：

- 当前源码仍对应同一 generation；
- 目标范围仍合法且不与同批替换交叉；
- 目标范围中的文字仍等于 expected。

任一检查失败时，不会冒险把旧位置写入新源码。手工编辑、移动、插入或删除源码后，应以最新全文完整重解析，重新取得路径、状态、诊断和编辑范围；旧解析结果中的位置不能继续使用。

## 12. 当前限制与最佳实践

当前限制：

- comment 与图片、链接、`!属性` 目标标签必须同一行。
- `!文本` 的 comment、值和匹配的 style 关闭标签必须同一行；只认 comment 前仍打开的 style。
- `img` 的完整开始标签、内容和 `[/img]` 必须同一行才能作为已命名资源关联；跨行内容可能仅被未分类扫描发现。
- 名称按原字符匹配；默认声明不按完整路径区分，同名 ImageSlot 会共享同一文档级默认值。
- 解析器不为名称转义特殊语法。名称应避免以 `++` 开头、以 `++` / `--` 结尾，或包含 `!文本`、`!属性` 等会被识别为标记的片段。
- 扩展语法只组织编辑器资源，不校验 NGA 是否支持某个 BBCode 标签或属性值。

最佳实践：

- 每个打开标记后开先关，并让一组目录标记在局部区段内完整配对。
- 让 comment 紧贴目标资源，保持在同一行，减少意外关联。
- 为同一父 Block 下的同类型 Slot 使用唯一名称。
- 默认声明集中放置，并避免空值和无意的重复声明。
- 大段手改后先刷新解析、处理 error，再从资源面板继续编辑。

## 13. 从零开始的综合示例

以下示例可直接复制；所有资源关联都在同一行，prefix/suffix 均正确配对：

```bbcode
[comment // #图片!图片 = https://example.com/desktop-default.webp]
[comment // ++示例版头]
[comment // 主容器!属性][fixsize width 90 180 height 24 background #202020 #303030]
[comment // ++头部]
[comment // Logo][img]https://example.com/logo.webp[/img]
[style color #ffffff font 1.2][comment // 标题!文本]欢迎来到示例版头[/style]
[comment // --头部]
[comment // ++导航]
[comment // 首页][url=https://example.com]进入首页[/url]
[comment // 图片++]
[comment // 桌面][style dybg 1;0;0;0;0;https://example.com/desktop-default.webp]
[comment // 图片--]
[comment // --导航]
[comment // --示例版头]
```

最终树逐项解释：

- Block `\示例版头`：由最外层 prefix 创建。
- StyleBlock `\示例版头\主容器`：`!属性` 读取同一行的 `fixsize`；它不是 Slot。
- Block `\示例版头\头部`：由 `头部` prefix 创建。
- ImageSlot `\示例版头\头部\Logo`：无 suffix，普通名 `Logo` 是末级 Slot。
- TextSlot `\示例版头\头部\标题`：文本值位于同一行 style 包裹中。
- Block `\示例版头\导航`：由 `导航` prefix 创建。
- LinkSlot `\示例版头\导航\首页`：链接实际值是 `https://example.com`。
- ImageSlot `\示例版头\导航\桌面\图片`：路径按 prefix `示例版头、导航` + 普通名 `桌面` + 逆序 suffix `图片` 构造；末级 `图片` 是 Slot，`桌面` 因而成为 Block。
- 图片默认声明按最终 Slot 名 `图片` 匹配该 ImageSlot。其实际值与默认值严格相等，因此状态为 `default`；普通资源 comment 名 `桌面` 不参与默认匹配。
