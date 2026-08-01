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

- 首页浏览系统预设 / 我的预设，支持搜索
- 详情页：开始训练；**另存为**一键复制到「我的预设」；仅自定义预设可**编辑**
- 编辑页支持拖拽排序动作、选图标、导入/导出 JSON、直接开始或保存
- 计时中：空格暂停，`Ctrl+S` 跳过，`Ctrl+F` 全屏；可分别静音蜂鸣/语音
- 支持安装为 PWA（浏览器「安装应用」）

## 数据

保存在浏览器 `localStorage`：

| Key | 内容 |
|-----|------|
| `ct3-presets` | 自定义预设 |
| `ct3-new-draft` | 新建方案未保存草稿 |
| `ct3-settings` | 静音等设置 |

导出 JSON：`{ v: 1, name, exercises, rounds, restBetweenRounds, warmupEnabled, warmupSeconds, icon?, exportedAt }`。
