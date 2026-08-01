# 循环训练计时器

Vue 3 + Vite 单页应用：预设方案、自定义编排、计时、语音/蜂鸣提示。界面文案为中文。

## 开发

需要 [pnpm](https://pnpm.io/) 11+。

```bash
pnpm install
pnpm dev      # 开发服务器
pnpm build    # 产出 dist/
pnpm preview  # 预览构建结果
pnpm test     # 单元测试
```

## 使用说明

- 首页浏览系统预设 / 我的预设；支持「保存备份 / 加载备份」整机备份
- 详情页：开始训练；**另存为**一键复制到「我的预设」；仅自定义预设可**编辑**
- 编辑页支持动作排序（桌面拖拽 / 移动端上下按钮）、选图标、导入/导出 JSON、直接开始或保存
- 计时中：空格暂停，`Ctrl+S` 跳过，`Ctrl+F` 全屏；顶部可一键静音
- 支持安装为 PWA（浏览器「安装应用」）

## 部署

纯静态 SPA，`pnpm build` 后上传 `dist/` 即可。路由为 history 模式，平台需支持 SPA 回退（`public/_redirects` 已内置：`/* /index.html 200`）。

- **Cloudflare Pages**：连接仓库 → 框架预设 Vite → 输出目录 `dist`（`_redirects` 自动生效）
- **EdgeOne Makers**（腾讯）：连接仓库或 CLI 上传 `dist/`，控制台开启 SPA 模式
- 其他静态托管：确认支持将未知路径 rewrite 到 `index.html`；GitHub Pages 项目站需额外处理 `base` 与 404 兜底

## 数据

保存在浏览器 `localStorage`：

| Key | 内容 |
|-----|------|
| `ct3-presets` | 自定义预设 |
| `ct3-new-draft` | 新建方案未保存草稿 |
| `ct3-settings` | 静音等设置 |

单预设导出 JSON：`{ v: 1, name, exercises, rounds, restBetweenRounds, warmupEnabled, warmupSeconds, icon?, exportedAt }`。全量备份：`{ v: 1, type: 'ct3-backup', presets: {...}, exportedAt }`。
