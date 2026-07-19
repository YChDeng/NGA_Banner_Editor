# NGA Banner Editor

NGA Banner Editor 是一个基于 Electron 的本地 NGA 版头 BBCode 编辑器。项目提供版头预览、源码编辑、资源化编辑、NGA 帖子导入与发布，以及图片上传和管理功能。

## 核心功能

- 使用项目内的 NGA JavaScript、CSS 和兼容层在本地预览 BBCode。
- 使用 Monaco Editor 编辑完整源码，支持 BBCode 语法高亮、诊断、搜索、右键菜单、撤销和重做。
- 通过代码模式和高级模式编辑同一份 BBCode 源码。
- 高级模式提供区块（Block）/槽位（Slot）资源树和详情面板，可编辑图片、链接、文本、`dybg` 参数及常见样式属性。
- 资源树支持搜索、类型筛选、排序、定位、目录折叠、多级目录吸顶、悬浮提示和右键重命名。
- 资源修改使用当前源码快照和原子事务写回，并在重新解析后恢复当前资源和滚动位置。
- 登录 NGA 后可以按帖子地址导入已有帖子，编辑后发布修改；登录状态显示在窗口顶部。
- 嵌入式图片管理器使用独立的图片帖子上下文，支持正文与附件合并、命名、去重、上传和删除。
- 静态图片上传前转换为无水印 WebP；GIF 保持 GIF 格式并关闭水印。
- 图片卡片可以拖到图片槽位（ImageSlot）行或图片详情区域替换 URL；文本槽位、链接槽位、属性区块和目录节点不是图片拖放目标。

## 快速开始

### 环境要求

- Node.js
- npm
- 登录、帖子操作和远程图片加载需要网络连接。

### 安装和启动

```powershell
npm install
npm start
```

`npm start` 会先执行 `npm run build:renderer`，再启动 Electron。只构建渲染器资源时执行：

```powershell
npm run build:renderer
```

运行全部测试：

```powershell
npm test
```

项目没有单独的 `npm run build` 脚本。

## 使用流程

### 编辑本地 BBCode

1. 启动程序，在代码模式中粘贴或编辑 BBCode。
2. 点击“刷新”，重新解析源码并更新预览。
3. 切换到高级模式，在资源树中选择资源并编辑详情。
4. 需要直接修改结构或进行全文搜索时，返回代码模式使用 Monaco Editor。

### 导入和发布 NGA 帖子

1. 点击顶部的登录按钮，在登录窗口中完成 NGA 登录。
2. 在主编辑区输入帖子地址，例如 `read.php?tid=...`。
3. 点击“导入帖子”读取帖子正文。
4. 在代码模式或高级模式中修改内容。
5. 点击“发布修改”，确认后将内容写回已导入的帖子。
6. 点击“刷新”重新读取当前帖子并更新预览。

程序不会保存用户名和密码；登录状态由 Electron 的持久 session cookie 管理。当前主要支持编辑和发布已有帖子，新主题、回复和引用不是主要流程。

### 使用图片管理器

1. 在右侧图片管理区域输入图片帖子地址并导入。
2. 将本地图片拖到上传区域，或点击上传区域选择文件。
3. 静态图片会转换为 WebP 并使用无水印参数；GIF 保持 GIF 格式并关闭水印。
4. 上传后的图片会出现在图片资源卡片中，可编辑名称、查看 URL 或删除图片。
5. 将图片卡片拖到高级模式中的 ImageSlot 行或右侧图片详情区域，即可替换对应槽位的图片 URL。

图片管理器使用独立媒体上下文，不会改变主编辑器当前帖子的正文和资源树。上传、命名和删除操作受 NGA 请求冷却限制，操作期间相关控件会暂时冻结。

## 图片资源规则

图片 URL 的相对路径、完整路径和不同尺寸形式会归一为同一图片身份；正文和附件中的重复图片只保留一个规范资源。

NGA 删除附件时可能短暂产生文件名最后一个字符变为下划线的残留文件。这类路径不会重新加入图片资源列表。删除附件后，只有收到删除成功回应或确认附件不存在时，正文中的图片代码才会被清理。

图片拖放只替换 ImageSlot 的 URL 范围，不会破坏 `img` 或 `dybg` 的其他参数。TextSlot、LinkSlot、StyleBlock 和目录节点不会接受图片拖放。

## Block/Slot 扩展语法

资源面板使用 `[comment // $...]` 扩展标记组织资源。扩展标记仍是普通 comment，只供本编辑器归类、定位和编辑，不改变 NGA 的 BBCode 渲染。BBCode 源码是唯一真值，资源树和资源状态均由当前完整源码重新解析得到。

- **Block**：资源树中的逻辑容器，不保存资源值。
- **ImageSlot**：图片槽位，由 `img` 或包含图片值的 `dybg` 资源形成。
- **TextSlot**：由 `!文本` 声明形成的文本槽位。
- **LinkSlot**：由 `url` 标签链接值形成的链接槽位。
- **StyleBlock**：由 `!属性` 声明形成的属性编辑项，不是第四种槽位。

常用标记如下：

```bbcode
[comment // $名称]
[comment // $++Block名称]
[comment // $--Block名称]
[comment // $Block名称++]
[comment // $Block名称--]
[comment // $名称!文本]
[comment // $名称!属性]
[comment // $#图片名称!图片 = 默认图片URL]
```

完整语法请阅读 [Block/Slot 扩展语法规范](docs/extension-syntax.md)；模型对象、身份、范围和写回机制请阅读 [Banner Block/Slot 数据模型](docs/data-model.md)。

## 编辑安全约束

- BBCode 源码是编辑器唯一数据源，资源树不是第二份独立数据。
- 每次解析都会生成源码快照和 `generation`；写回前会验证 `generation`、范围、期望文本和区间重叠。
- 清空图片只清空实际图片值，保留资源声明和其他参数。
- 编辑源码后必须重新解析，旧解析结果中的范围不能继续用于写回。
- 扩展语法要求命名 comment 与目标资源位于同一行，其他限制见语法规范。

## 项目结构

```text
src/
  main.js               Electron 主进程和 NGA IPC 操作
  preload.js            安全暴露给渲染进程的 API
  index.html            主窗口和嵌入式图片管理器
  renderer.js           预览、资源树、详情编辑和拖放交互
  image-manager.js      图片加载、上传、命名、删除和拖放源
  banner-model.js       Block/Slot 规范模型、解析和诊断
  banner-model-view.js  从模型派生资源面板绑定
  editor-adapter.js     Monaco Editor 适配和 BBCode 高亮
  editor-transaction.js 文本编辑历史和原子替换
  app.css               主窗口、资源树和详情面板样式
  image-manager.css     图片管理器样式
  nga-shim.js            NGA 渲染脚本兼容层

docs/
  extension-syntax.md   Block/Slot 扩展语法规范
  data-model.md         BannerModel 开发者数据模型

img4.nga.178.com/
  本地保存的 NGA JavaScript/CSS 渲染资源
```

## 当前限制

- 当前以开发模式 Electron 应用运行，未提供打包安装器。
- 本地 NGA 渲染资源和远程图片地址的使用应遵守相应站点的条款。