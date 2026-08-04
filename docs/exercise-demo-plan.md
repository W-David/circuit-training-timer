# 训练动作示意动画 — 方案文档

> 状态：**待评审**（尚未实施，未改动任何源码）
> 日期：2026-08-04
> 关联：`TimerView` / `PresetEditView` / `presetFormat.js` / `public/`（PWA 离线资源）

---

## 1. 背景与目标

当前训练动作只有 `{ name, work, rest }`，训练页只显示中文动作名。用户常遇到「动作名字认识、姿势不确定」的问题。

**目标**：在训练过程中为动作提供**姿势示意动画**，让用户扫一眼就能做对；自定义动作可在编辑器中手动绑定示意。

**已确认的选型方向**：

| 项 | 决策 |
| ---- | ------ |
| 动画形态 | 双帧静态图切换（起/止两个姿势交替） |
| 素材来源 | [free-exercise-db](https://github.com/yuhonas/free-exercise-db)（**Unlicense 公有领域**，可商用） |
| 覆盖范围 | 内置预设预填 `demoId` + 编辑器可选动作库 |
| 展示位置 | 训练页为主（work 阶段展示当前动作，rest 展示下一动作）；详情页可选缩略图 |
| 离线策略 | 精选资源全部自托管进 `public/`，随 SW 缓存 |

---

## 2. 调研结论：同类项目怎么做

| 项目 / 方案 | 做法 | 对我们的启示 |
| --- | --- | --- |
| LogPress（`hasaneyldrm/exercises-dataset`，18.8k★） | 1324 个动作各配 180×180 GIF 动图 | 业界主流是 GIF；但媒体 © Gym visual，**商用须另行授权**，弃用 |
| `ExerciseDB / exercisedb-api`（555★） | 11000+ 动作，GIF/视频 | 需联网 API，违背本 App 离线优先，弃用 |
| `yuhonas/free-exercise-db`（1.7k★） | 873 动作，**每个动作 2 张姿势 JPG**（`0.jpg` 起始 / `1.jpg` 结束），**Unlicense** | **采用**：许可干净、离线可控、体积可控 |
| Seconds / Nike Training Club 等商业 App | 视频 + 动作分解 | 有版权，仅作交互参考 |

**形态对比（已收敛）**：

| 方案 | 优点 | 缺点 | 结论 |
| --- | --- | --- | --- |
| GIF | 动感强、最常见 | 体积大；优质库版权受限 | ✗ |
| WebM/MP4 | 画质/体积好 | 实现与预加载重 | ✗ |
| **双帧静态图** | 许可干净、实现简单、体积小 | 动感弱；库缺部分 HIIT 动作 | **✓ 采用** |
| Lottie 矢量 | 体积小可主题化 | 健身动作现成库几乎没有 | ✗ |
| 仅图标 | 成本最低 | 无示意价值 | 仅作无图回退 |

---

## 3. 现状与约束（代码库现状）

| 现状 | 影响 |
| --- | --- |
| 动作模型仅 `{ name, work, rest }` | 需要新增 `demoId` 字段并端到端透传 |
| `normalizeExercise` / `cloneConfig` / `exportPreset` 会丢弃未知字段（`src/utils/presetFormat.js`） | 不改这些，`demoId` 会丢失 |
| 训练页 `TimerView.vue` 只渲染名称 + 图标（图标按阶段类型硬编码） | 需要新增示意组件挂载点 |
| 编辑页 `PresetEditView.vue` 维护本地 `draft`，通过 `cloneConfig` / `startConfig` / `savePreset` 提交 | 新字段必须进 draft 与 clone 路径 |
| `buildSchedule`（`src/utils/schedule.js`）纯函数只产时间步 `{ name, seconds, type, exIndex, round }` | **不改 schedule**；运行时用 `exIndex` 反查 `exercises[i].demoId` |
| **坑**：rest 步的 `exIndex` 指向**刚结束**的动作，不是下一个 | rest 预览示意必须用「下一个 work 步」解析 |
| `public/` 静态资源 SW cache-first（`sw.js`） | 图片放 `public/exercise-demos/` 即可离线 |
| `useWorkout` 暴露 `exercises`、`flat`、`cur`、`displayName` 等 | 训练页可直接取当前动作的 `demoId` |
| UI 文案为中文（`zh-CN`） | 目录/选择器文案用中文 |
| 无 lint/typecheck 脚本；测试为 vitest（`pnpm test`）；构建 `pnpm build` | 验证用这两条命令 |

---

## 4. 数据模型设计

### 4.1 动作对象（新增字段）

```js
// exercise
{
  name: string,       // 中文名
  work: number,       // 1–600 秒
  rest: number,       // 0–600 秒
  demoId: string | null   // 新增，free-exercise-db 的 id，如 "Bodyweight_Squat"
}
```

- **不存图片 URL**：路径由 `demoId` 推导，避免冗余与脏数据
- `demoId` 需匹配目录（见 §5）中的合法 id；非法值视为 null
- 旧数据（无 `demoId`）完全兼容

### 4.2 需要透传 `demoId` 的路径（缺一即丢字段）

| 位置 | 改动 |
| --- | --- |
| `src/utils/presetFormat.js` → `normalizeExercise` | 校验并保留合法 `demoId` |
| `src/utils/presetFormat.js` → `cloneConfig` | 复制 `demoId` |
| `src/utils/presetFormat.js` → `parseImportPayload` | 允许可选 `demoId`（v1 保持兼容） |
| `src/composables/useActions.js` → `exportPreset` | 导出时附加 `demoId`（可选字段） |
| `src/composables/usePresets.js` | 持久化透传（现有逻辑会存整对象，需确认） |
| `src/composables/useWorkout.js` | 启动时 `exercises.value = n.exercises.map(e => ({ ...e }))` 已透传，确认即可 |
| 相关 vitest（`presetFormat.test.js` / `usePresets.test.js`） | 补充 `demoId` 用例 |

### 4.3 Schedule 保持不变

`buildSchedule` 仍只产时间步；示意解析放在**运行时/组件层**：

```js
// 当前 work 步：exercises[flat[cur].exIndex]?.demoId
// 休息预览：找到「下一个 type==='work' 的步」再取其 exIndex 反查
```

---

## 5. 动作目录与素材资源

### 5.1 目录元数据 `src/data/exerciseCatalog.json`

精选约 **40–80 条**（非全量 873），供编辑器挑选：

```json
{
  "id": "Bodyweight_Squat",
  "nameZh": "徒手深蹲",
  "nameEn": "Bodyweight Squat",
  "tags": ["腿", "自重"]
}
```

- 搜索：`nameZh` / `nameEn` 子串匹配
- 筛选：按 `tags`（部位：腿/胸/背/核心/肩/手臂/心肺/拉伸）
- 由脚本从 free-exercise-db 数据生成初版，人工校对中文名

### 5.2 静态资源布局

```bash
public/exercise-demos/{id}/0.jpg   起始姿势
public/exercise-demos/{id}/1.jpg   结束姿势
```

- **同步脚本** `scripts/sync-exercise-demos.mjs`（新增）：
  - 读取 `exerciseCatalog.json` 中的 id 列表
  - 从 `https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/{id}/0.jpg` 下载两帧到 `public/exercise-demos/{id}/`
  - 幂等：已存在且大小一致则跳过；支持 `--only` 指定 id
- 体积估算：单帧约 38KB → 每动作约 76KB；50 个动作约 **4MB**（可接受，离线友好）

### 5.3 解析工具 `src/utils/exerciseDemo.js`（新增）

```js
isValidDemoId(id)          // 是否在 catalog 中（正则 + 白名单）
demoFrameUrls(id)          // → ['/exercise-demos/Bodyweight_Squat/0.jpg', '…/1.jpg']
findCatalogEntry(id)       // catalog 条目
suggestDemoByName(nameZh)  // 名称模糊推荐（弱提示，不自动覆盖已有 demoId）
```

纯函数 → vitest 覆盖。

---

## 6. 内置预设动作映射表

以下为 `src/data/presets.json` + `defaults.json` 全部动作的去重结果与映射建议（**已核对 free-exercise-db 实存 id**）：

| 预设中的动作名 | 候选 `demoId` | 说明 |
| --- | --- | --- |
| 深蹲 / 徒手深蹲 | `Bodyweight_Squat` | ✓ 精确对应 |
| 俯卧撑 / 标准俯卧撑 | `Pushups` | ✓ |
| 上斜俯卧撑 | `Incline_Push-Up` | ✓ |
| 钻石俯卧撑 | — | 库内无 Diamond 类，**暂无** |
| 派克肩推 | — | 库内无 Pike Push-Up，**暂无** |
| 引体向上 / 引体向上/划船 | `Band_Assisted_Pull-Up` | 无纯自重引体，先取最接近项（可后续换） |
| 卷腹 | `Crunches` | ✓ |
| 俄罗斯转体 | `Russian_Twist` | ✓ |
| 平板支撑 | `Plank` | ✓ |
| 平板肩触 | — | 库内无 Shoulder Tap，**暂无** |
| 登山跑 | `Mountain_Climbers` | ✓ |
| 深蹲跳 | `Freehand_Jump_Squat` | ✓ |
| 弓步蹲 / 交替弓步蹲 | `Bodyweight_Walking_Lunge` | ✓ |
| 臀桥 / 行进臀桥 | `Butt_Lift_Bridge` | ✓（行进版无，先用原地版） |
| 悬垂举腿 | `Hanging_Leg_Raise` | ✓ |
| 自行车卷腹 | `Air_Bike` | ✓ |
| 波比跳 | — | 库内无，**暂无**（见 §6.2） |
| 开合跳 | — | 库内无，**暂无** |
| 高抬腿 / 原地高抬腿 / 高抬腿冲刺 | — | 库内无，**暂无** |
| 冲刺跑 / 原地冲刺跑 | — | 库内无直接对应，**暂无** |
| 换腿跳 | — | **暂无** |
| 站立出拳 | — | **暂无** |
| 下犬式 | — | 库内无对应瑜伽体位，**暂无** |
| 猫牛式 | `Cat_Stretch` | 近似（猫伸展），可配 |
| 鸽子式(左/右) | — | **暂无** |
| 婴儿式 | `Childs_Pose` | ✓ |

### 6.2 缺失动作的处理策略

- 波比跳 / 开合跳 / 高抬腿等 HIIT 招牌动作是**主要缺口**
- 首版：UI 正常显示名称，示意位隐藏（组件容错，见 §7.1）
- 后续：按**同一目录格式**（`public/exercise-demos/{id}/{0,1}.jpg`）自备 2 张公有领域/自制图，无需改架构

---

## 7. UI 设计

### 7.1 `ExerciseDemo.vue`（新增组件）

| 行为 | 规格 |
| --- | --- |
| Props | `demoId`、`paused`、可选 `label`、可选 `size` |
| 动画 | 700–900ms 双帧交叉淡入（`opacity` 过渡，CSS 实现） |
| 暂停 | `paused=true` 时停止切换，保留当前帧 |
| 无障碍 | `prefers-reduced-motion`（`main.css` 已有全局约定）→ 只显示第 0 帧 |
| 容错 | `demoId` 为空 / 图片加载失败 → **不渲染或极轻占位**，不撑乱布局、不报错 |

### 7.2 训练页 `TimerView.vue`

- 挂载位置：状态岛与倒计时之间，高度约 120–160px，**倒计时保持主视觉**
- `work`：显示 `exercises[exIndex].demoId`
- `rest`：显示**下一个 work 步**的示意（注意 rest 的 `exIndex` 是刚结束的动作）
- `warmup` / `roundRest`：不显示
- 暂停时传 `paused`，动画停止

### 7.3 编辑器 `PresetEditView.vue` + `DemoPicker.vue`（新增）

- 每行动作行尾：示意缩略（双帧小图）/「选择示意」按钮 / 清除按钮
- `DemoPicker` 弹层：中英文搜索 + 部位标签筛选 + 点选写入 `demoId`
- **改名不自动改 `demoId`**；可在确认后展示「名称相近推荐」（`suggestDemoByName`）供用户手动确认

### 7.4 详情页 `PresetDetailView.vue`（可选，建议一并做）

- 动作列表每行加小缩略图，与训练体验一致，成本低

---

## 8. 文件改动清单

| 路径 | 作用 |
| --- | --- |
| `src/data/exerciseCatalog.json` | **新增** 精选目录（id / nameZh / nameEn / tags） |
| `src/data/presets.json` | 可匹配动作预填 `demoId` |
| `src/data/defaults.json` | 无需改（newExercise 无示意）；若新增示例动作按需 |
| `src/utils/presetFormat.js` + `presetFormat.test.js` | `demoId` 规范化 / clone / import |
| `src/composables/useActions.js` | 导出附加 `demoId` |
| `src/composables/usePresets.js` + test | 持久化透传确认 |
| `src/composables/useWorkout.js` | 确认 exercises 拷贝透传 |
| `src/utils/exerciseDemo.js` + test | **新增** id 校验 / 帧 URL / 名称推荐 |
| `src/components/ExerciseDemo.vue` | **新增** 双帧切换组件 |
| `src/components/DemoPicker.vue` | **新增** 示意选择器 |
| `src/pages/TimerView.vue` | 挂载 `ExerciseDemo`（work/rest 逻辑） |
| `src/pages/PresetEditView.vue` | 动作行示意绑定入口 |
| `src/pages/PresetDetailView.vue` | 动作行缩略图（可选） |
| `scripts/sync-exercise-demos.mjs` | **新增** 拉取/同步双帧图 |
| `public/exercise-demos/**` | 双帧图（脚本产物） |
| `AGENTS.md` | 补充 `exercise.demoId` 约定与 rest 预览注意点 |
| `docs/exercise-demo-plan.md` | 本文档（实施后更新状态） |

---

## 9. 详细执行步骤

> 每阶段可独立提交与验证；遵循 AGENTS.md「纯逻辑进 utils + vitest、组件保持薄」的原则。

### 阶段 0：准备与核对（无代码）

- [ ] 确认 `exerciseCatalog.json` 收录范围（建议先覆盖内置预设全部动作 + 热门自重动作）
- [ ] 用 `scripts/sync-exercise-demos.mjs` 试拉 2–3 个动作验证目录结构与图片尺寸
- 验证：`ls public/exercise-demos/Bodyweight_Squat/` 含 `0.jpg` `1.jpg`

### 阶段 1：数据地基（demoId 全链路 + 目录 + 资源）

- [ ] `src/utils/presetFormat.js`：`normalizeExercise` 校验保留 `demoId`；`cloneConfig` 复制；`parseImportPayload` 允许可选字段
- [ ] `src/utils/presetFormat.test.js`：补用例（合法/非法/缺失/roundtrip）
- [ ] `src/composables/useActions.js`：`exportPreset` 附加 `demoId`
- [ ] 确认 `usePresets` / `useWorkout` 透传；补 test 断言
- [ ] 新增 `src/utils/exerciseDemo.js` + vitest
- [ ] 新增 `src/data/exerciseCatalog.json`（脚本生成初版 + 人工校对中文名）
- [ ] 新增 `scripts/sync-exercise-demos.mjs`，执行下载全部目录 id
- [ ] `presets.json` 预填可匹配动作的 `demoId`
- 验证：`pnpm test`；`ls public/exercise-demos | wc -l` ≈ 目录条数

### 阶段 2：训练展示

- [ ] 新增 `src/components/ExerciseDemo.vue`（双帧切换 / paused / reduced-motion / 容错）
- [ ] `TimerView.vue`：work 阶段挂载当前动作示意；rest 阶段挂载**下一 work 步**示意；warmup/roundRest 隐藏
- 验证：`pnpm dev` 手动跑内置预设，逐阶段检查 work/rest/暂停/切步；`pnpm build`

### 阶段 3：编辑绑定

- [ ] 新增 `src/components/DemoPicker.vue`（搜索 / 标签筛选 / 选择 / 清除）
- [ ] `PresetEditView.vue`：动作行加示意缩略与绑定入口；写入/清除 `demoId`
- 验证：创建自定义预设 → 绑定示意 → 保存 → 重新打开仍保留 → 导出 → 导入保留

### 阶段 4：收尾

- [ ] `PresetDetailView.vue` 动作行缩略图（可选）
- [ ] `AGENTS.md` 补充约定
- [ ] 更新本文档状态为「已实施」
- 验证：`pnpm test` + `pnpm build` 全绿；SW 离线场景手测（Network offline 后刷新）

---

## 10. 明确不做（首版）

- 不全量打包 873 个动作资源
- 不接入 Gym visual / ExerciseDB 等版权或联网素材
- 不修改 `buildSchedule` 步进结构与导出 v 版本
- 不加新全局 store（沿用 composables 单例）
- 不为缺失动作硬绑不相关示意
- 不把图片二进制写入 localStorage / 导出 JSON（只存 `demoId`）

---

## 11. 风险与缓解

| 风险 | 缓解 |
| --- | --- |
| HIIT 招牌动作（波比/开合跳/高抬腿）无图 | 首版接受空示意；目录格式预留，后续自备 2 帧图即可补 |
| 包体积上涨（约 4MB） | 精选集 + 仅 vendor 目录内 id；SW cache-first 不重复下载 |
| 旧自定义预设无 `demoId` | 完全兼容，编辑时可补选 |
| rest 阶段绑错动作 | 统一用「下一 work 步」解析；加单元测试锁定 |
| free-exercise-db 上游改动 | 同步脚本固定依赖 `main` 分支 + 幂等下载；资源入库后即冻结 |
| 引体向上等「近似映射」观感不符 | 映射表内注明候选性质，可随时更换 id |

---

## 12. 验收标准

- [ ] 带 `demoId` 的内置动作，训练 work 阶段可见双帧切换示意
- [ ] 暂停时示意动画停止；`prefers-reduced-motion` 下静止显示第 0 帧
- [ ] rest 阶段显示**下一动作**示意（若有）；warmup/roundRest 无示意
- [ ] 无 `demoId` 的动作：布局正常、无报错、示意位隐藏
- [ ] 编辑器可搜索/绑定/清除示意；保存、导出、再导入后 `demoId` 不丢
- [ ] 离线（SW）场景下已缓存的示意仍正常显示
- [ ] `pnpm test`、`pnpm build` 全绿

---

## 13. 参考资料

- free-exercise-db 数据（Unlicense）：<https://github.com/yuhonas/free-exercise-db>
  - 单动作 JSON 示例：`exercises/Bodyweight_Squat.json`（含 `images: ["Bodyweight_Squat/0.jpg", "Bodyweight_Squat/1.jpg"]`）
  - 镜像/CDN：`https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/{id}/0.jpg`
- 版权受限对照（勿用）：`hasaneyldrm/exercises-dataset`（媒体 © Gym visual）、`exercisedb-api`
