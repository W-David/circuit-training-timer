# 循环训练计时器

Vue 3 + Vite 单页应用：预设、自定义编排、计时、语音/蜂鸣提示。界面文案为中文。

## 开发

需要 [pnpm](https://pnpm.io/) 11+。

```bash
pnpm install
pnpm dev      # 开发服务器（监听局域网，终端会显示 Network 地址）
pnpm build    # 产出 dist/
pnpm preview  # 预览构建结果
pnpm test     # 单元测试
```

样式已接入 Tailwind CSS，逐步迁移的步骤见
[`docs/tailwind-migration.md`](docs/tailwind-migration.md)。

## 使用说明

- 首页浏览系统预设 / 我的预设；支持「保存备份 / 加载备份」整机备份
- 详情页：开始训练；**另存为**一键复制到「我的预设」；仅自定义预设可**编辑**
- 编辑页支持动作排序（桌面拖拽 / 移动端上下按钮）、选图标、导入/导出 JSON、直接开始或保存
- 计时中：空格暂停，`Ctrl+S` 跳过，`Ctrl+F` 全屏；顶部可一键静音
- 支持安装为 PWA（浏览器「安装应用」）

## 部署

纯静态 SPA，`pnpm build` 后上传 `dist/` 即可。路由为 **hash 模式**
（`#/` 前缀），纯静态托管无需 SPA 回退；`public/404.html` 提供风格统一的
404 页面。

- **Cloudflare Pages**：连接仓库 → 框架预设 Vite → 输出目录 `dist`（`_redirects` 自动生效）
- **EdgeOne Makers**（腾讯）：连接仓库或 CLI 上传 `dist/`，控制台开启 SPA 模式
- **GitHub Pages**：仓库已内置 `.github/workflows/pages.yml`，推送 `main` 后
  自动构建发布到 `https://<用户名>.github.io/circuit-training-timer/`；
  首次需在 Settings → Pages 把 Source 设为 **GitHub Actions**
- 其他静态托管：直接上传 `dist/` 即可（hash 路由不依赖服务端 rewrite）

> 子路径部署：GitHub Pages 构建时通过 `VITE_BASE=/circuit-training-timer/`
> 注入资源前缀（见 `pages.yml`）；其他子路径托管可照此设置环境变量。

## 数据

保存在浏览器 `localStorage`：

| Key | 内容 |
|-----|------|
| `ct3-presets` | 自定义预设 |
| `ct3-new-draft` | 新建预设未保存草稿 |
| `ct3-settings` | 静音等设置 |

单预设导出 JSON：`{ v: 1, name, exercises, rounds, restBetweenRounds, warmupEnabled, warmupSeconds, icon?, exportedAt }`。全量备份：`{ v: 1, type: 'ct3-backup', presets: {...}, exportedAt }`。
