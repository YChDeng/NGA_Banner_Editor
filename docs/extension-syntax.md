# Block/Slot 扩展语法规范

本文面向 NGA 版头作者，说明如何使用 `[comment // $...]` 为图片、文本、链接和属性资源命名，并在编辑器中组织为区块（Block）和槽位（Slot）。这些扩展标记仍然是普通 comment，只用于编辑器的分类、定位和编辑，不改变 NGA 对版头 BBCode 的渲染结果。

BBCode 源码是唯一真值。资源树、槽位状态、默认值和诊断信息均由当前完整源码派生。手工修改、移动、插入或删除源码后，编辑器会重新解析全文，不依赖旧资源树继续推断。

## 1. 术语和基本规则

- **Banner**：一份完整的版头 BBCode 文本，也是一次解析的根对象。
- **Block**：资源树中的逻辑容器，可以由前缀目录、普通资源名称和后缀目录共同形成，不保存资源值。
- **Slot**：可编辑资源的叶节点，包括 ImageSlot、TextSlot 和 LinkSlot。
- **StyleBlock**：由 `!属性` 声明形成的属性编辑项，不是第四种 Slot。
- **实际值**：图片、链接或文本当前用于渲染的值。清空实际值不会删除 Slot 结构。
- **默认声明**：`#名称!图片 = 值`，为同名 ImageSlot 提供可选默认图片值。

扩展 comment 必须使用 `$` 命名空间前缀。没有 `$` 前缀的 comment 是普通注释，不参与 Block/Slot 解析：

```bbcode
[comment // 这是普通注释]
```

解析 comment 时，会去除 `//` 后的前导空白；首个语义字符必须是 `$` 才会进入扩展命名空间。`$` 不属于名称，名称会继续去除首尾空白。

## 2. 语法速查

### 2.1 目录和资源命名

| 用途 | 语法 |
| --- | --- |
| 普通资源命名 | `[comment // $名称]` |
| 前缀目录打开 | `[comment // $++名称]` |
| 前缀目录关闭 | `[comment // $--名称]` |
| 后缀目录打开 | `[comment // $名称++]` |
| 后缀目录关闭 | `[comment // $名称--]` |
| 文本槽位 | `[comment // $名称!文本]` |
| 属性区块 | `[comment // $名称!属性]` |
| 图片默认值 | `[comment // $#名称!图片 = 图片值]` |

`++` 或 `--` 位于名称前方时表示前缀目录，位于名称后方时表示后缀目录。打开和关闭标记的名称必须完全一致，并且每一类目录都必须按照后开先关的顺序关闭。

### 2.2 同一行关联

命名 comment 必须与目标资源位于同一行。换行后，comment 不会跨行等待资源，目标通常会进入“未分类”。

```bbcode
[comment // $首页][url=https://example.com]进入首页[/url]
[comment // $图标][img]https://example.com/icon.webp[/img]
```

## 3. 路径构造

发现图片、文本或链接资源时，解析器按以下顺序构造路径：

1. 按打开顺序加入所有前缀目录名称。
2. 加入资源的普通名称。
3. 按后缀目录的打开顺序反向加入名称。
4. 路径最后一级是 Slot 名称，之前的所有级别都是 Block。

可概括为：`前缀打开顺序 + 资源名称 + 后缀逆序`。

### 3.1 前缀目录

```bbcode
[comment // $++导航]
[comment // $首页][url=https://example.com]进入首页[/url]
[comment // $--导航]
```

路径为 `\导航\首页`：Block 为“导航”，LinkSlot 为“首页”。

### 3.2 后缀目录

```bbcode
[comment // $++导航]
[comment // $地址++]
[comment // $首页][url=https://example.com]进入首页[/url]
[comment // $地址--]
[comment // $--导航]
```

路径为 `\导航\首页\地址`：Block 为“导航”和“首页”，LinkSlot 为“地址”。

### 3.3 嵌套后缀目录

```bbcode
[comment // $++导航]
[comment // $交互++]
[comment // $悬停++]
[comment // $首页][img]hover.webp[/img]
[comment // $悬停--]
[comment // $交互--]
[comment // $--导航]
```

后缀目录打开顺序为“交互 → 悬停”，加入路径时反向排列为“悬停 → 交互”。路径为 `\导航\首页\悬停\交互`，其中“导航”“首页”“悬停”是 Block，“交互”是 ImageSlot。

前缀和后缀使用独立的目录栈，但都必须后开先关。以下写法会产生交叉关闭诊断：

```bbcode
[comment // $++甲]
[comment // $++乙]
[comment // $--甲]
[comment // $--乙]
```

正确顺序应先关闭“乙”，再关闭“甲”。

## 4. 三类 Slot

### 4.1 ImageSlot

`img` 和包含图片值的 `dybg` 都会形成 ImageSlot。普通命名 comment 必须位于同一行目标资源之前。

```bbcode
[comment // $背景][style dybg 1;0;0;0;0;https://example.com/bg.webp]
[comment // $图标][img]https://example.com/icon.webp[/img]
```

`dybg` 的图片值是六个分号分隔值中的第六段，前五段依次表示缩放、位置 X、位置 Y、活动量 X 和活动量 Y。

空图片仍然是有效的 ImageSlot：

```bbcode
[comment // $背景][style dybg 1;0;0;0;0;]
[comment // $图标][img][/img]
```

清空图片只清空图片值，不删除 comment，也不改动 `dybg` 的前五个参数。

### 4.2 LinkSlot

LinkSlot 的实际值是 `[url=...]` 开始标签中的内容；结束标签和链接显示文字不属于可编辑链接值。

```bbcode
[comment // $官网][url=https://example.com]访问官网[/url]
[comment // $备用入口][url=]尚未启用[/url]
```

### 4.3 TextSlot

TextSlot 使用 `!文本` 声明，必须位于同一行、且位于已经打开的 `[style ...]` 标签内：

```bbcode
[style color #112233 font 1.2][comment // $标题!文本]欢迎访问[/style]
[style color #112233][comment // $副标题!文本][/style]
```

第一行的文本值为“欢迎访问”，第二行为纯文本空值。文本范围从 comment 结束处开始，到匹配的 `style` 关闭标签之前结束。comment、文本和关闭标签必须在同一行；找不到匹配的 style 关闭标签时会报告错误。

当前解析器还会从包裹 TextSlot 的 style 中解析可编辑的 `color` 和正数 `font`，但这两个字段不改变 TextSlot 的值判定。

## 5. StyleBlock

`[comment // $名称!属性]` 会读取同一行随后出现的第一个非关闭、非 comment 标签，形成 StyleBlock：

```bbcode
[comment // $主容器!属性][style background #202020 color #ffffff width 80]
[comment // $固定尺寸!属性][fixsize width 90 180 height 18 background #202020 #303030]
```

StyleBlock 是具名属性编辑项，不参与三类 Slot 的重复键或三态判断。如果 `!属性` 后同一行没有可读取的属性标签，会报告缺少属性标签。

当前界面支持编辑以下属性：

- `fixsize`：宽度下限、宽度上限、高度、外背景色和内背景色。
- 常见 `style` 属性：`background`、`color`、`width`、`height`、`border-radius`、`line-height`、`left`、`right`、`top`、`bottom`、`rotate`、`font` 和 `align`。
- `filter-drop-shadow`：阴影颜色、X、Y 和模糊值。
- `dybg`：缩放、位置 X/Y、活动量 X/Y 和图片链接。
- 未列出的属性：按“属性名 + 一个值”解析。

## 6. 图片默认值和三态

图片默认声明的语法是：

```bbcode
[comment // $#图标!图片 = https://example.com/default.webp]
```

默认声明是文档级声明，不受所在位置的前缀或后缀目录栈限制。它只按 ImageSlot 的最终名称严格匹配，不按完整路径匹配，也不作用于 LinkSlot、TextSlot 或 StyleBlock。

同名默认声明重复出现时，源码靠后的声明生效，较早声明产生 `shadowed-default` 警告：

```bbcode
[comment // $#图标!图片 = old.webp]
[comment // $#图标!图片 = new.webp]
[comment // $图标][img]new.webp[/img]
```

默认声明本身不会自动修改图片；执行“使用默认值”操作后，才会将当前有效默认值写入 ImageSlot。

槽位状态完全由实际值和当前有效默认值派生，不需要额外标记：

- `disabled`：实际值为空。即使存在非空默认值，也保持禁用。
- `default`：实际值非空，并且与当前有效默认值逐字符相等。
- `manual`：实际值非空，但不等于当前有效默认值。没有默认声明的非空值也属于此状态。

空默认值虽然会被记录，但不能提供有意义的启用值；空图片仍然是 `disabled`。

## 7. Block 合并、Slot 冲突和重命名

同一逻辑路径的 Block 会合并，因此一个 Block 可以由源码中多组分离的打开/关闭标记共同形成。Slot 的唯一键是“父 Block 逻辑路径 + 资源类型 + Slot 名称”。不同资源类型即使同名，也不是同一个 Slot。

同一唯一键重复出现时，后者不会覆盖前者，而会保存为冲突来源，并产生 `duplicate-slot` 错误。

例如，以下两段共同形成 Block `\Pg1_穗穗\版头左侧菜单\icon-01`，其下分别是 ImageSlot“悬停效果”和 LinkSlot“URL”：

```bbcode
[comment // $++Pg1_穗穗]
[comment // $++版头左侧菜单]
[comment // $悬停效果++]
[comment // $icon-01][style dybg 1;2;3;4;5;https://example.com/icon-hover.webp]
[comment // $悬停效果--]
[comment // $--版头左侧菜单]
[comment // $--Pg1_穗穗]

[comment // $++Pg1_穗穗]
[comment // $++版头左侧菜单]
[comment // $URL++]
[comment // $icon-01][url=https://example.com/topic]进入主题[/url]
[comment // $URL--]
[comment // $--版头左侧菜单]
[comment // $--Pg1_穗穗]
```

重命名规则：

- 重命名 Block 会修改该逻辑 Block 的所有源码来源；有配对开闭标记时会同时修改两端。
- suffix 形成的 Slot 使用 suffix 打开标记作为名称来源，重命名时会同时修改配对的关闭标记。
- 普通 Slot 使用普通命名 comment 重命名。
- “未分类”是没有可编辑声明的虚拟 Block，不能在目录树中重命名。

重命名只修改 comment 名称，不修改资源实际值。

## 8. 诊断和编辑安全

解析器会报告以下结构或资源问题：

- prefix 或 suffix 未闭合。
- 关闭标记没有对应的打开标记。
- 关闭名称不匹配或发生交叉关闭。
- `!属性` 后缺少属性标签。
- `!文本` 不在可匹配的 style 包裹中，或找不到同一行的关闭标签。
- 重复的图片默认声明被后声明覆盖，产生 `shadowed-default` 警告。
- 同一父路径、类型和名称重复，产生 `duplicate-slot` 错误。

未命名的 `dybg`、`img` 和 `url` 会进入“未分类”。这通常不是语法错误，但无法通过目录树重命名。

每次解析都会记录完整源码快照并生成 `generation`。可编辑字段同时记录范围和 `expected` 原文。执行替换前会检查：

- 当前源码仍对应同一 `generation`。
- 目标范围仍在当前源码中且没有越界。
- 同一批替换的范围不相互重叠。
- 目标范围中的文字仍等于 `expected`。

任一检查失败时，编辑器不会把旧位置写入新源码，而会要求根据最新全文重新解析。

## 9. 编辑器资源操作

代码模式编辑完整 BBCode；高级模式根据当前源码派生资源树和详情编辑器。图片管理器中的图片卡片可以拖到 ImageSlot 行或图片详情卡片，放置后只替换图片 URL 范围，保留 `img` 或 `dybg` 的其他结构。

清空操作只替换实际值为空串；“使用默认值”只对存在默认声明的 ImageSlot 写入当前有效默认值。所有资源操作完成后都会重新解析源码，并恢复当前资源选择和滚动位置。

## 10. 限制和最佳实践

当前限制：

- 命名 comment 与图片、链接、`!属性` 目标必须在同一行。
- `!文本` 的 comment、文本值和匹配的 style 关闭标签必须在同一行。
- 已命名 `img` 的完整开始标签、内容和 `[/img]` 必须在同一行。
- 名称按原字符匹配；默认声明不按完整路径区分，同名 ImageSlot 会共享同一文档级默认值。
- 名称不会转义扩展语法。名称应避免以 `++` 开头、以 `++` 或 `--` 结尾，或包含 `!文本`、`!属性` 等标记片段。
- 扩展语法只组织编辑器资源，不校验 NGA 是否支持具体 BBCode 标签或属性值。

最佳实践：

- 每个目录标记后开先关，并在局部区域内完整配对。
- 让命名 comment 紧贴目标资源，保持同一行。
- 为同一父 Block 下的同类型 Slot 使用唯一名称。
- 集中放置默认声明，避免空值和无意的重复声明。
- 大段手工修改后先刷新解析并处理错误，再继续使用资源面板。

## 11. 综合示例

以下示例展示默认图片、属性区块、图片、文本、链接和 suffix Slot：

```bbcode
[comment // $#图片!图片 = https://example.com/desktop-default.webp]
[comment // $++示例版头]
[comment // $主容器!属性][fixsize width 90 180 height 24 background #202020 #303030]
[comment // $++头部]
[comment // $Logo][img]https://example.com/logo.webp[/img]
[style color #ffffff font 1.2][comment // $标题!文本]欢迎来到示例版头[/style]
[comment // $--头部]
[comment // $++导航]
[comment // $首页][url=https://example.com]进入首页[/url]
[comment // $图片++]
[comment // $桌面][style dybg 1;0;0;0;0;https://example.com/desktop-default.webp]
[comment // $图片--]
[comment // $--导航]
[comment // $--示例版头]
```

解析结果：

- `\示例版头` 是 Block。
- `\示例版头\主容器` 是 StyleBlock，不是 Slot。
- `\示例版头\头部\Logo` 是 ImageSlot。
- `\示例版头\头部\标题` 是 TextSlot。
- `\示例版头\导航\首页` 是 LinkSlot。
- `\示例版头\导航\桌面\图片` 的末级“图片”是 ImageSlot，“桌面”是 Block。
- 图片默认声明按最终 Slot 名“图片”匹配；实际值等于默认值时，状态为 `default`。