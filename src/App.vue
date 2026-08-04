<script setup>
import { Icon } from '@iconify/vue'
import { onMounted, onUnmounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useActions } from './composables/useActions.js'
import { useSettings } from './composables/useSettings.js'
import { useToast } from './composables/useToast.js'
import { useWorkout } from './composables/useWorkout.js'

const router = useRouter()
const route = useRoute()
const workout = useWorkout()
const { settings, toggleMute } = useSettings()
const actions = useActions()
const { toast, text: toastText } = useToast()

const isFullscreen = ref(false)

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
  // 开发调试：?demo=timer / ?demo=summary 直达计时/总结视图（仅 dev 构建生效，
  // 供 scripts/visual-snapshot.mjs 交互视图回归使用）
  if (import.meta.env.DEV) {
    const demo = new URLSearchParams(location.search).get('demo')
    if (demo === 'timer') {
      actions.startPreset('全身力量')
    } else if (demo === 'summary') {
      workout.view.value = 'summary'
    }
  }
})

onUnmounted(() => {
  document.removeEventListener('fullscreenchange', onFS)
  document.removeEventListener('keydown', onKey)
  document.removeEventListener('visibilitychange', onVis)
  releaseWakeLock()
})
</script>

<template>
  <div
    class="bg-glow"
    :class="route.path === '/train' ? 'phase-' + workout.phaseCls.value : ''"
    aria-hidden="true"
  ></div>

  <div
    :class="[
      'fixed top-5 left-1/2 z-999 bg-(image:--grad-main) bg-accent text-white px-5 py-2 rounded-full text-[0.82rem] font-semibold opacity-0 pointer-events-none shadow-[0_10px_28px_-8px_rgba(124,111,247,0.6),inset_0_1px_0_rgba(255,255,255,0.25)] transition-[opacity,transform] duration-300 -translate-x-1/2 -translate-y-2.5',
      toastText ? 'opacity-100 translate-y-0' : '',
    ]"
  >{{ toastText }}</div>

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
</style>
