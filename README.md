# 桌面便签 (DesktopTicket)

跨平台桌面便利贴应用，支持 Windows 和 macOS。

## 功能

- 创建、编辑、删除便签
- 自定义标题、内容、背景颜色、字体、字号
- 桌面便签可拖动、可固定位置
- 调节透明度（20%~100%），防止遮挡桌面
- 自由调整便签大小
- 右键菜单快速操作（编辑/透明度/删除）
- 数据本地持久化存储

## 技术栈

- Electron 31
- React 18 + TypeScript
- Vite + electron-vite
- electron-store（JSON 文件存储）

## 环境要求

- Node.js >= 18
- npm >= 9

## 安装依赖

```bash
npm install
```

> 如果网络较慢，可使用代理：
> ```bash
> HTTP_PROXY=http://127.0.0.1:7897 HTTPS_PROXY=http://127.0.0.1:7897 npm install
> ```

## 开发模式

```bash
npm run dev
```

启动后会打开 Electron 窗口，进入设置页面。修改代码后会自动热更新。

## 构建打包

先执行 `electron-vite build` 编译源码，再用 `electron-builder` 打包为可执行文件：

```bash
# Windows 打包（生成 .exe 安装包）
npm run build:win

# macOS 打包（生成 .dmg 安装包）
npm run build:mac

# Linux 打包
npm run build:linux
```

打包产物在 `release/` 目录下。

> 如果只想编译不打包，运行：
> ```bash
> npm run build
> ```
> 编译产物在 `out/` 目录下。

## 项目结构

```
desktopticket/
├── package.json
├── electron.vite.config.ts       # 构建配置
├── tsconfig.json                 # TypeScript 配置
├── src/
│   ├── main/                     # Electron 主进程
│   │   ├── index.ts              # 入口，创建主窗口
│   │   ├── store.ts              # 数据存储（electron-store）
│   │   └── ipc.ts                # IPC 通信 + 桌面便签窗口管理
│   ├── preload/                  # 预加载脚本
│   │   ├── index.ts              # 主窗口 preload
│   │   └── note.ts               # 桌面便签窗口 preload
│   └── renderer/                 # React 前端
│       ├── index.html            # 主窗口 HTML
│       ├── note.html             # 桌面便签 HTML
│       └── src/
│           ├── types.ts          # 类型定义
│           ├── App.tsx           # 根组件
│           ├── main.tsx          # 主窗口入口
│           ├── desktop.tsx       # 桌面便签入口
│           ├── components/
│           │   ├── SettingsPage.tsx   # 设置页面
│           │   ├── NoteEditor.tsx     # 便签编辑器
│           │   ├── NoteList.tsx       # 便签列表
│           │   ├── ColorPicker.tsx    # 颜色选择器
│           │   └── DesktopNote.tsx    # 桌面便签内容
│           └── styles/               # CSS 样式
```

## 使用说明

1. 启动应用后进入**设置页面**
2. 点击 **+ 新建便签** 创建便签
3. 在右侧编辑器中设置标题、内容、颜色、字体、字号、透明度等
4. 勾选 **固定位置** 可禁止拖动便签
5. 点击 **保存** 保存设置
6. 点击 **显示到桌面** 便签会出现在桌面上
7. 桌面便签可拖动（未固定时）、可调整大小
8. 右键桌面便签可：编辑 / 调节透明度 / 删除

## 数据存储

便签数据存储在用户目录下：

- Windows: `%APPDATA%/desktopticket/config.json`
- macOS: `~/Library/Application Support/desktopticket/config.json`
