# AGENTS.md

Vue 3 + Vite SPA (circuit training timer). UI copy is Chinese (`zh-CN`). Package manager: **pnpm** (`packageManager`: pnpm@11.18.0).

## Commands

```bash
pnpm install
pnpm dev       # Vite dev server
pnpm build     # → dist/
pnpm preview
pnpm test      # vitest (pure utils / voice prompts)
```

No lint/typecheck scripts. CI: `.github/workflows/ci.yml` (test + build on push/PR).

## Layout

| Path | Role |
|------|------|
| `src/main.js` | App bootstrap; SW registered only when `import.meta.env.PROD` |
| `src/App.vue` | Shell: composables, timer/summary overlay, fullscreen/wake-lock/keyboard/mute |
| `src/router.js` | Editor routes (`createWebHistory`) |
| `src/composables/` | Workout engine, presets, audio, settings, toast, actions, storage, `useEscClose` |
| `src/pages/` | 页面级路由组件：首页/详情/编辑/训练/总结 |
| `src/components/` | 通用组件：`PresetCard`、`NumInput`、`FlipClock`、`FlipDigit` |
| `src/utils/schedule.js` | Pure `buildSchedule` |
| `src/utils/presetFormat.js` | Normalize / import parse / duration helpers |
| `src/utils/time.js` | `formatMMSS` (shared by `FlipClock` + `workout.fmt`) |
| `src/components/*View.vue` | Routed or overlay screens |
| `src/data/presets.json` | Builtin presets |
| `src/data/defaults.json` | New-draft defaults + `newExercise` |
| `public/` | PWA manifest, `sw.js`, icons, `_redirects` (SPA fallback) |
| `src/styles/main.css` | Global styles (no CSS framework) |

## Architecture (easy to break)

- **View modes** on `workout.view`: `'editor' | 'timer' | 'summary'`，与路由同步：
  `view` 变为 `timer`/`summary` 时 `App.vue` 自动跳转 `/train`、`/summary`；
  `router.js` 守卫禁止无训练会话时直接进入这两个页面。所有页面（含训练/总结）
  都是独立路由，`App.vue` 用 vue-router 官方
  `<RouterView v-slot>` + `<Transition name="page">` 做页面过渡。
- **Edit isolation**: `PresetEditView` keeps a **local `draft`**. It must not call `workout.loadPreset` on open (`useWorkout` no longer exposes it). Only `actions.startConfig(draft)` / `savePreset` commit. New-draft autosave → `ct3-new-draft` (not the old `ct3-config`).
- **另存为 ≠ 编辑**: `forkPreset` immediately copies into custom presets (name modal on detail). Edit only opens `/edit/:key` for existing custom presets.
- Cross-view state comes from module-level singleton composables (`usePresets`/`useSettings`/`useToast`/`useWorkout`), no provide/inject. `useActions()` assembles shared actions from those singletons.
- **Timer** (`useWorkout.js`): `requestAnimationFrame` + `performance.now()`. Pause excluded; skip adjusts timeline offset. Tab gap `>500ms` → catch-up **without** beeps/voice. Unpause re-prompts current step.
- Call `audio.prime()` in the user gesture that starts a workout (iOS AudioContext). Single mute flag in `useSettings` → `useAudio`.
- Stopping/going home while fullscreen must `exitFullscreen()` — `body.fs` leaves a blank page otherwise.
- `vite-plugin-vue-devtools` only in `mode === 'development'` (conditional spread in `vite.config.js`).
- `sw.js`: navigation requests are network-first; static assets cache-first with background update. SW registration lives in `main.js` (production only). SPA fallback via `public/_redirects`.

## Persistence

| Key | Contents |
|-----|----------|
| `ct3-presets` | Custom presets `{ [id]: { name, icon, exercises, rounds, ... } }` |
| `ct3-new-draft` | Unsaved **new** editor draft only |
| `ct3-settings` | `{ muted }` |

Builtin presets: static JSON (`key`). Custom keys: `name-timestamp`. Export: `{ v: 1, name, exercises, rounds, restBetweenRounds, warmupEnabled, warmupSeconds, icon?, exportedAt }`. Parse via `parseImportPayload`.

## Schedule model

`buildSchedule()`: optional warmup → per round (work + optional rest) → optional `roundRest` between rounds. Types: `warmup | work | rest | roundRest`.

Voice copy: `useVoicePrompts.js` (near-end at 5s; ~60ms delay after `speechSynthesis.cancel` on Chrome).

## Conventions

- Icons: `@iconify/vue` with `mdi:*` (picker list in `PRESET_ICONS`).
- User-facing strings in Chinese.
- Prefer extending composables/utils over new global stores.
- Pure logic → `src/utils/*` + vitest; keep components thin.
