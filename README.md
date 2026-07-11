# NGA BBCode Preview

一个用于本地预览、整理和编辑 NGA 论坛 BBCode 的 Electron GUI 程序。

本项目主要面向复杂版头 BBCode，例如 `randomblock`、`fixsize`、`style`、`dybg`、`url`、`img`，以及基于 `[comment // ...]` 的资源目录整理。

## 功能

- 使用 Electron/Chromium 在本地预览 NGA BBCode。
- 复用下载到本地的 NGA 原始 JavaScript/CSS 渲染逻辑，而不是另写一套 BBCode 渲染器。
- 登录 NGA 后，可通过帖子链接导入已有帖子的 BBCode。
- 可将修改后的 BBCode 发布回已导入的帖子，发布前会进行确认。
- 从 BBCode 中提取图片、链接、文本和属性，生成目录式资源列表。
- 支持通过 `[comment // ...]` 标记组织资源目录。
- 可在资源列表中编辑图片链接、`dybg` 参数、URL、文本、`style` / `fixsize` 属性。
- 图片资源支持缩略图显示和悬停放大预览。

## 环境要求

- Node.js
- npm
- 登录、导入帖子、发布帖子以及远程图片加载需要网络连接。

## 安装

```powershell
npm install
```

## 运行

```powershell
npm start
```

程序启动后默认是空编辑区，不会自动加载本地示例。可以直接粘贴 BBCode，或登录后导入帖子链接。

## 基本使用

1. 运行 `npm start` 启动程序。
2. 将 BBCode 粘贴到编辑区，或登录后导入帖子链接。
3. 点击 `渲染/刷新` 查看预览。
4. 在资源列表中查看和编辑图片、链接、文本、属性。
5. 如果需要编辑已有 NGA 帖子：
   - 点击 `登录 NGA`，在弹出的登录窗口中完成登录。
   - 输入形如 `read.php?tid=...` 的帖子链接。
   - 点击 `导入帖子`。
   - 在本地修改 BBCode 或资源字段。
   - 点击 `发布修改`，确认后保存到帖子。

## 基于 Comment 的资源目录

资源列表会根据 NGA 注释标签推断路径。例如：

```bbcode
[comment // ++Pg1_穗穗]
[comment // ++版头左侧菜单]
[comment // 选中效果++]
[comment // icon-01][style ... dybg ...;./mon_202606/10/example.webp]
[comment // 选中效果--]
[comment // --版头左侧菜单]
[comment // --Pg1_穗穗]
```

上面的图片资源会被归类到：

```text
\Pg1_穗穗\版头左侧菜单\icon-01\选中效果
```

支持的资源类型：

- 图片：`dybg ...;URL` 和 `[img]URL[/img]`
- 链接：`[url=URL]...[/url]`
- 文本：`[comment // Name!文本]...[/...]`
- 属性：`[comment // Name!属性][style ...]` 或 `[fixsize ...]`

无法通过 comment 规则归类的资源会放入 `\未分类`。

## 属性解析

资源列表会解析常见 NGA 版头属性，例如：

```bbcode
[fixsize width 90 180 height 18 background #202020 #202020]
```

会拆分为：

- 宽度下限：`90`
- 宽度上限：`180`
- 高度：`18`
- 外背景色：`#202020`
- 内背景色：`#202020`

`style` 中的常见属性也会被拆分，例如 `width`、`height`、`left`、`top`、`color`、`filter-drop-shadow`、`dybg` 等。颜色值支持 8 位十六进制 alpha，例如 `#86ee8bDD`。

## 项目结构

```text
src/
  main.js       Electron 主进程，包含 NGA 登录、导入、发布相关 IPC
  preload.js    安全暴露给渲染进程的 API
  index.html    应用界面结构
  renderer.js   BBCode 渲染、资源目录、编辑交互
  app.css       应用布局和资源编辑样式
  nga-shim.js   在 Electron 中运行 NGA 脚本所需的兼容层

img4.nga.178.com/
  本地下载的 NGA JavaScript/CSS 文件，渲染器会直接使用
```

## 注意事项和限制

- 目前是开发模式 Electron 应用，还没有打包安装器。
- 发布功能主要支持“修改已有帖子”；新主题、回复、引用不是当前主要支持流程。
- 程序不会保存用户名和密码。登录状态由 Electron 的持久 session cookie 管理。
- NGA 源码文件只用于复现本地渲染效果。图片附件默认使用远程 https://img.nga.178.com/attachments 地址加载。公开分发镜像资源前，请自行确认来源站点的相关条款。
- `nga_editor/` 是开发过程中参考过的另一个项目，已被 `.gitignore` 忽略，本应用不依赖它。

## Git Ignore

仓库会忽略本地依赖、构建产物、编辑器历史、参考项目、临时示例和无关网页抓取资源。应用源码、package 文件和渲染所需资源目录会保留。
