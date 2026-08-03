# Tailwind CSS 逐步迁移方案

## 目标

把 `src/styles/main.css` 中散落的组件样式逐步迁移为 Tailwind utilities，最终形成
“设计令牌（`@theme`）+ 少量不可 utility 化残留”的工程化结构。迁移时尽量保持
视觉一致，但**不再要求每次改动都做全量像素对比**——UI 变化可接受（2026-08-03
更新：截图对比降级为按需抽查，门禁以测试 + 构建为准）。

## 约束与现状

- Tailwind v4（`tailwindcss@4` + `@tailwindcss/vite`），无需 `tailwind.config.js`。
- **不启用 preflight**：只 `@import 'tailwindcss/theme'` 与
  `'tailwindcss/utilities'`，避免任何元素默认样式被重置。
- 既有 CSS 已按级联层组织：
  - 元素级规则（`*`、`body`、`#app`、`input[...]` 等）→ `@layer base`
  - 组件级规则（`.card`、`.btn`、`.timer-*` 等）→ `@layer components`
  - Tailwind utilities → `@layer utilities`
- `@theme` 令牌先映射既有 CSS 变量（同一数据源），迁移过程中不改变 `:root` 的值：

  | 令牌 | 取值 | 用法示例 |
  |------|------|----------|
  | `--color-bg/surface/surface-2` | `var(--bg/--surface/--surface2)` | `bg-surface-2` |
  | `--color-line/line-bright` | `var(--border/--border-bright)` | `border-line` |
  | `--color-ink/ink-2` | `var(--text/--text2)` | `text-ink-2` |
  | `--color-accent/accent-2/cyan/work/rest/warm/danger` | 对应变量 | `bg-work`、`text-danger` |
  | `--radius-control` | `var(--radius-sm)` = 10px | `rounded-control` |
  | `--radius-card` | `var(--radius)` = 16px | `rounded-card` |

## 为什么这样分层

CSS 级联层中，**未分层（unlayered）规则优先于任何层内规则**。若既有样式保持未分层，
Tailwind utilities 将永远无法覆盖它们（例如 `input` 的背景、`.btn` 的内边距）。
把元素级规则放入 `base`、组件规则放入 `components` 后：

- 迁移过程中即使新旧 class 短暂并存，utilities（`utilities` 层）也能正确覆盖；
- 渲染结果不变，因为层内规则在迁移前没有任何冲突。

## 每个迁移块的标准流程

1. 选定一个区块（组件或视图），先列出其全部 class 与对应计算样式。
2. 在模板中把 class 替换为 Tailwind utilities：
   - 优先使用 `@theme` 语义令牌（`bg-surface-2`、`rounded-control`）；
   - 默认刻度外的精确值用 arbitrary value（`text-[0.85rem]`、`w-[38px]`、
     `opacity-[0.45]`）；
   - 伪元素/动画关键帧等无法 utility 化的，用 arbitrary variant
     （如 `[&::-webkit-inner-spin-button]:appearance-none`）或保留最小 CSS。
     > 文档中的类名示例不会生成工具类：`tailwind.css` 已用 `@source not`
     > 排除 `docs/`、`AGENTS.md`、`README.md`。新增含类名示例的文件时，
     > 记得同步补充排除规则。
3. **同一提交内**删除该区块对应的 `main.css` 规则，不留死代码。
4. 验证（门禁）：

   ```bash
   pnpm test
   pnpm build
   ```

   `pnpm test` 与 `pnpm build` 必须通过。全量截图对比（
   `node scripts/visual-snapshot.mjs before/after/diff`）仅在需要确认布局
   变化范围时按需执行，不再作为每次修改的强制步骤。
5. 提交。

## 迁移顺序（从依赖少到多）

1. ✅ `NumInput.vue`（含 `.num-input`/`.dot`/`.val`/`.unit`）— 已完成，2026-08-03
2. ✅ 全局小工具：`.spacer`、`.hidden-input`
3. ✅ 按钮体系（Home/Detail/Timer/Summary/App）：`.btn` 系列、`.fs-btn`、
   `.icon-btn`、`.top-actions`。工具类组合集中在 `src/utils/twClasses.js`；
   `.btn` 系列 CSS 暂保留——编辑页仍在使用，随编辑页迁移一起删除。
4. ✅ 弹窗体系：`.modal-*`、`.export-filename`、`.modal-box .field-label`
   （`@keyframes modal-in` 保留，由 `animate-[modal-in_0.22s_ease]` 引用）
5. ✅ 首页：`.section-head`、`.preset-*`（卡片、图标、耗时标签、新建卡）— 已完成
6. ✅ 详情页：`.detail-*`、`.ex-*`、`.c-*`、`.back-link`、`.start-btn` — 已完成
7. ✅ 编辑页：`.edit-*`、`.ex-row`、`.toggle-*`、`.icon-picker`、`.card`，
   并删除 `.btn` 系列残留 CSS。身份卡主行文字存在约 1px 的抗锯齿偏移
   （~1300px / 40 万像素），按“微小差异可忽略”接受。
8. ✅ 计时器：`.timer-*`、`.status-*`、`.flip-*`、`.p-*`。布局/圆点/按钮用
   utilities；状态岛（阶段 CSS 变量）、倒计时大数字、翻牌时钟机械结构、
   关键帧保留为组件内 `<style>`（TimerView/FlipClock/FlipDigit 各自内聚）。
9. ✅ 总结页、Toast、过渡动画：总结页全 utilities；Toast 用 utilities；
   `.bg-glow` 相位光晕与 `.fade-*` 过渡移入 App.vue `<style>`。
10. 收尾（进行中）：`main.css` 已从 ~1586 行缩减到 165 行，仅剩
    `@theme`、`@layer base` 元素规则、`@keyframes modal-in`、响应式与
    reduced-motion。`:root` 令牌值收敛进 `@theme` 为可选优化（当前 @theme
    引用 :root 变量，保持单一数据源）。计时器/总结页为交互视图，静态截图
    已通过 dev-only 的 `?demo=timer` / `?demo=summary` 钩子（App.vue，
    仅 `import.meta.env.DEV` 生效）配合截图脚本验证：计时器除倒计时数字
    （两次截图时刻不同）外 0 差异，总结页 0 差异。验证用旧版基线由
    `git archive HEAD` + 临时 dev server 生成。

## 不可 utility 化（允许保留为最小 CSS）

- `@keyframes`（翻牌动画、弹窗入场、fade 过渡）
- 复杂 `background-image` 渐变组合、`backdrop-filter`
- 伪元素复杂状态（如 `.toggle-track::after`）
- 浏览器私有属性组合（如隐藏 number spinner 的伪元素规则）

这些规则可保留在 `@layer components` 或对应组件的 `<style>` 中，并在本文件中登记。

## 完成标准

- 模板中不再出现遗留的组件 class（除上述登记项）；
- `@layer components` 内无残留规则；
- `pnpm test` 17 个用例通过、`pnpm build` 成功；
- 截图对比仅作抽查：UI 变化（包括细微文字偏移、间距/配色调整）可接受，
  前提是页面结构与交互逻辑正常。

> 目标约定（2026-08-03 更新）：允许 UI 变化，不强制像素级一致；提交前必须
> 通过测试与构建。

## 工具链注意事项

- 本机 pnpm 11.13.0 被官方标记为 broken release（`@pnpm/exe` 无二进制），
  `pnpm test`/`pnpm build` 可能直接报错。已验证的替代执行方式：
  `./node_modules/.bin/vite build` 与 `./node_modules/.bin/vitest run`。
  长期建议升级 `packageManager` 到可用版本（如 11.18.0）并同步 CI。
- `scripts/cdp-shot.mjs` 提供零依赖 CDP 交互截图（点击“开始训练”等），
  用于计时器/总结页验证；启动无头 Chrome 需要提升权限。
- 交互视图回归的推荐方式：`?demo=timer` / `?demo=summary`（dev 构建）
  配合 `scripts/visual-snapshot.mjs` 的 `VISUAL_BASE`/`VISUAL_ONLY`。

## 迁移踩坑记录（重要）

- **`border-none` 与 `border` 的冲突**：Tailwind v4 中 `border-none` 通过
  `--tw-border-style: none` 生效，即使同时存在 `border`（只设宽度/样式引用），
  边框仍会消失。公共按钮 base 不要放 `border-none`，由各变体显式决定。
- **`text-base` 会同时设置 line-height**：v4 的 `text-base` 带
  `line-height: 1.5`，旧样式只设 `font-size: 1rem`（继承 normal）。精确还原时
  用 `text-[1rem]`（arbitrary 只设 font-size）。
- **尺寸变体需要 `!`**：`BTN_SM`/`BTN_LG` 与 base 的 padding/font-size/radius
  冲突，Tailwind 生成顺序不确定，用 `px-3!` 等 important 变体保证覆盖。
- **body 垂直居中放大 1px 级差异**：页面任何元素高度变化 2px 都会让全部内容
  整体位移 1px，截图 diff 会出现在整个页面而非改动元素本身，排查时先确认
  是否有全局位移。
- **级联顺序决定“实际生效值”**：如编辑页图标块同时带 `.detail-icon`
  （radius 12px）和 `.edit-identity-icon`（radius 10px），后定义的
  `.detail-icon` 胜出，实际是 12px。迁移时以截图/渲染结果为准，不能只看类名
  字面值；跨视图复用的类删除前要 `rg` 确认没有其他使用点。
