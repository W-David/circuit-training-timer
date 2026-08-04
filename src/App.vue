<script setup>
import { Icon } from '@iconify/vue'
import { onMounted, onUnmounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useActions } from './composables/useActions.js'
import { useSettings } from './composables/useSettings.js'
import { useToast } from './composables/useToast.js'
import { useWorkout } from './composables/useWorkout.js'
import { SW_UPDATE_EVENT } from './plugins/serviceWorker.js'

const router = useRouter()
const route = useRoute()
const workout = useWorkout()
const { settings, toggleMute } = useSettings()
const actions = useActions()
const { toast, text: toastText } = useToast()

const isFullscreen = ref(false)
const updateReady = ref(false)

// --- 版本更新提示 ---
function onUpdateReady() {
  updateReady.value = true
}

function reloadToUpdate() {
  location.reload()
}

// --- Fullscreen ---
function applyFsClass() {
  document.body.classList.toggle('fs', !!document.fullscreenElement)
}

function toggleFullscreen() {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen()
      .then(() => {
        isFullscreen.value = true
        applyFsClass()
      })
      .catch(() => {})
  } else {
    document.exitFullscreen().then(() => {
      isFullscreen.value = false
      applyFsClass()
    })
  }
}

function onFS() {
  isFullscreen.value = !!document.fullscreenElement
  applyFsClass()
}

// --- Keyboard ---
function onKey(e) {
  if (workout.view.value !== 'timer') return
  if (e.repeat) return
  if (e.code === 'Space') {
    e.preventDefault()
    actions.pause()
  }
  if (e.code === 'KeyS' && e.ctrlKey) {
    e.preventDefault()
    actions.skip()
  }
  if (e.code === 'KeyF' && e.ctrlKey) {
    e.preventDefault()
    toggleFullscreen()
  }
}

// --- Wake Lock ---
let wakeLock = null

async function acquireWakeLock() {
  if (!('wakeLock' in navigator) || wakeLock) return
  try {
    wakeLock = await navigator.wakeLock.request('screen')
  } catch { /* 不支持或权限被拒 */ }
}

function releaseWakeLock() {
  if (wakeLock) {
    wakeLock.release().catch(() => {})
    wakeLock = null
  }
}

function onVis() {
  if (document.visibilityState === 'visible' && workout.view.value === 'timer' && !wakeLock) {
    acquireWakeLock()
  }
}

watch(workout.view, (v) => {
  if (v === 'timer') acquireWakeLock()
  else releaseWakeLock()
  // 训练/总结视图路由化：状态切换时同步到对应页面
  if (v === 'timer' && route.path !== '/train') router.push('/train')
  else if (v === 'summary' && route.path !== '/summary') router.push('/summary')
})

watch(
  () => route.path,
  (p) => {
    document.body.classList.toggle('timer-active', p === '/train')
  },
)

onMounted(() => {
  document.addEventListener('fullscreenchange', onFS)
  document.addEventListener('keydown', onKey)
  document.addEventListener('visibilitychange', onVis)
  window.addEventListener(SW_UPDATE_EVENT, onUpdateReady)
  // 开发调试：?demo=timer / ?demo=summary 直达计时/总结视图（仅 dev 构建生效，
  // 供 scripts/visual-snapshot.mjs 交互视图回归使用）
  if (import.meta.env.DEV) {
    const demo = new URLSearchParams(location.search).get('demo')
    if (demo === 'timer') {
      actions.startPreset('全身力量')
    } else if (demo === 'work') {
      actions.startConfig({
        name: '演示',
        icon: 'mdi:tune-variant',
        exercises: [{ name: '深蹲', work: 60, rest: 10 }],
        rounds: 1,
        restBetweenRounds: 0,
        warmupEnabled: false,
        warmupSeconds: 60,
      })
    } else if (demo === 'summary') {
      workout.view.value = 'summary'
    }
  }
})

onUnmounted(() => {
  document.removeEventListener('fullscreenchange', onFS)
  document.removeEventListener('keydown', onKey)
  document.removeEventListener('visibilitychange', onVis)
  window.removeEventListener(SW_UPDATE_EVENT, onUpdateReady)
  releaseWakeLock()
})
</script>

<template>
  <div
    class="bg-glow"
    :class="route.path === '/train' ? 'phase-' + workout.phaseCls.value : ''"
    aria-hidden="true"
  ></div>

  <Transition name="toast">
    <div
      v-if="toastText"
      class="toast fixed top-5 left-1/2 z-999 bg-(image:--grad-main) bg-accent text-white px-5 py-2 rounded-full text-[0.82rem] font-semibold pointer-events-none shadow-[0_10px_28px_-8px_rgba(124,111,247,0.6),inset_0_1px_0_rgba(255,255,255,0.25)]"
    >{{ toastText }}</div>
  </Transition>

  <Transition name="update">
    <div
      v-if="updateReady"
      class="fixed inset-x-0 bottom-6 z-999 flex justify-center px-4 pointer-events-none"
      role="status"
    >
      <div
        class="pointer-events-auto flex max-w-[min(92vw,26rem)] items-center gap-3 rounded-2xl border border-line bg-surface/90 px-3 py-2.5 shadow-[0_16px_40px_-12px_rgba(0,0,0,0.55)] backdrop-blur-md"
      >
        <Icon icon="mdi:update" class="size-5 shrink-0 text-accent" />
        <div class="min-w-0 flex-1 leading-tight">
          <p class="text-[0.82rem] font-semibold text-ink truncate">发现新版本</p>
          <p class="text-xs text-ink-2 truncate">刷新后即可体验最新内容</p>
        </div>
        <button
          class="shrink-0 rounded-full bg-(image:--grad-main) bg-accent px-3 py-1.5 text-xs font-semibold text-white cursor-pointer transition-all duration-200 hover:scale-105 hover:shadow-[0_6px_18px_-6px_rgba(124,111,247,0.7)] active:scale-95"
          @click="reloadToUpdate"
        >立即刷新</button>
        <button
          class="shrink-0 grid size-7 place-items-center rounded-full text-ink-2 cursor-pointer transition-colors duration-200 hover:bg-white/10 hover:text-ink"
          title="关闭"
          aria-label="关闭更新提示"
          @click="updateReady = false"
        >
          <Icon icon="mdi:close" class="size-4" />
        </button>
      </div>
    </div>
  </Transition>

  <div class="fixed top-4 right-4 z-50 flex gap-2" v-show="route.path === '/train' || route.path === '/summary'">
    <button
      class="size-9 rounded-[10px] border border-line bg-surface text-ink-2 cursor-pointer inline-flex items-center justify-center transition-all duration-200 opacity-50 p-0 font-[inherit] hover:opacity-100 hover:border-accent hover:text-ink hover:shadow-[0_4px_16px_-6px_rgba(124,111,247,0.5)] aria-pressed:opacity-100 aria-pressed:border-danger aria-pressed:text-danger"
      :title="settings.muted ? '开启声音' : '静音'"
      :aria-pressed="settings.muted"
      @click="toggleMute"
    >
      <Icon :icon="settings.muted ? 'mdi:volume-off' : 'mdi:volume-high'" />
    </button>
    <button
      class="size-9 rounded-[10px] border border-line bg-surface text-ink-2 cursor-pointer inline-flex items-center justify-center transition-all duration-200 opacity-50 p-0 font-[inherit] hover:opacity-100 hover:border-accent hover:text-ink hover:shadow-[0_4px_16px_-6px_rgba(124,111,247,0.5)] aria-pressed:opacity-100 aria-pressed:border-danger aria-pressed:text-danger"
      :title="isFullscreen ? '退出全屏' : '全屏'"
      @click="toggleFullscreen"
    >
      <Icon :icon="isFullscreen ? 'mdi:fullscreen-exit' : 'mdi:fullscreen'" />
    </button>
  </div>

  <button
    v-show="workout.view.value === 'editor'"
    class="size-9 rounded-[10px] border border-line bg-surface text-ink-2 cursor-pointer inline-flex items-center justify-center transition-all duration-200 opacity-50 p-0 font-[inherit] hover:opacity-100 hover:border-accent hover:text-ink hover:shadow-[0_4px_16px_-6px_rgba(124,111,247,0.5)] aria-pressed:opacity-100 aria-pressed:border-danger aria-pressed:text-danger fixed top-4 right-4 z-50"
    @click="toggleFullscreen"
    :title="isFullscreen ? '退出全屏' : '全屏'"
  >
    <Icon :icon="isFullscreen ? 'mdi:fullscreen-exit' : 'mdi:fullscreen'" />
  </button>

  <RouterView v-slot="{ Component, route: currentRoute }">
    <Transition name="page" mode="out-in">
      <component :is="Component" :key="currentRoute.path" />
    </Transition>
  </RouterView>
</template>

<style>
/* 计时相位强调光晕（由 view 动态切换 class） */
.bg-glow {
  position: fixed;
  inset: 0;
  z-index: -1;
  pointer-events: none;
  opacity: 0;
  transition: opacity 0.9s ease;
}

.bg-glow.phase-w {
  opacity: 1;
  background: radial-gradient(80% 62% at 50% 42%, rgba(52, 224, 178, 0.17), transparent 72%);
}

.bg-glow.phase-r {
  opacity: 1;
  background: radial-gradient(80% 62% at 50% 42%, rgba(245, 166, 35, 0.16), transparent 72%);
}

.bg-glow.phase-u {
  opacity: 1;
  background: radial-gradient(80% 62% at 50% 42%, rgba(167, 139, 250, 0.19), transparent 72%);
}

/* 页面切换过渡（vue-router 官方 RouterView + Transition 模式） */
.page-enter-active,
.page-leave-active {
  transition:
    opacity 0.28s ease,
    transform 0.28s ease;
}

.page-enter-from {
  opacity: 0;
  transform: translateY(10px);
}

.page-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

/* Toast：缩放 + 透明度过渡（无位移） */
.toast {
  transform: translate(-50%, 0) scale(1);
  transition:
    opacity 0.25s ease,
    transform 0.25s ease;
}

.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translate(-50%, 0) scale(0.94);
}

/* 版本更新提示：缩放 + 透明度过渡（无位移） */
.update-enter-active,
.update-leave-active {
  transition:
    opacity 0.25s ease,
    scale 0.25s ease;
}

.update-enter-from,
.update-leave-to {
  opacity: 0;
  scale: 0.96;
}
</style>
