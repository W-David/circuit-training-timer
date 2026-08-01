<script setup>
import { ref, onMounted, onUnmounted, watch, provide } from 'vue'
import { Icon } from '@iconify/vue'
import { useRouter } from 'vue-router'
import { useWorkout } from './composables/useWorkout.js'
import { useAudio } from './composables/useAudio.js'
import { usePresets } from './composables/usePresets.js'
import { useSettings } from './composables/useSettings.js'
import { parseImportPayload, cloneConfig } from './utils/presetFormat.js'
import TimerView from './components/TimerView.vue'
import SummaryView from './components/SummaryView.vue'

const router = useRouter()
const workout = useWorkout()
const { settings, toggleMute } = useSettings()
const audio = useAudio(settings)
const presets = usePresets()

const isFullscreen = ref(false)
const toastText = ref('')
let toastTimer = null

provide('workout', workout)
provide('presets', presets)
provide('settings', { settings, toggleMute })

function toast(msg) {
  toastText.value = msg
  clearTimeout(toastTimer)
  toastTimer = setTimeout(() => (toastText.value = ''), 2000)
}

function resolvePreset(key) {
  return presets.loadBuiltin(key) || presets.customPresets[key] || null
}

const actions = {
  startPreset(key) {
    const p = resolvePreset(key)
    if (!p) return
    audio.prime()
    const ok = workout.startWorkout(audio, p)
    if (!ok) toast('训练内容为空')
  },
  startConfig(cfg) {
    audio.prime()
    const ok = workout.startWorkout(audio, cfg)
    if (!ok) toast('训练内容为空')
    return ok
  },
  savePreset(name, config, key) {
    const k = presets.savePreset(name, config, key)
    toast(key ? '已更新「' + name + '」' : '已保存「' + name + '」')
    router.push('/preset/' + k)
    return k
  },
  deletePreset(key) {
    const name = presets.customPresets[key]?.name || '未命名'
    presets.deletePreset(key)
    toast('已删除「' + name + '」')
  },
  /** 立即复制为新的自定义预设（不进编辑页） */
  forkPreset(key, name) {
    const p = resolvePreset(key)
    if (!p) return null
    const cfg = cloneConfig(p)
    const n = String(name || '').trim() || (p.name || '方案') + ' 副本'
    cfg.name = n
    const k = presets.savePreset(n, cfg)
    toast('已另存为「' + n + '」')
    router.push('/preset/' + k)
    return k
  },
  importPreset(raw) {
    const result = parseImportPayload(raw)
    if (!result.ok) return result
    return { ok: true, data: result.data }
  },
  exportPreset(name = '', data = null) {
    if (!data) {
      toast('没有可导出的内容')
      return
    }
    const payload = {
      v: 1,
      name: name || data.name || '',
      exercises: (data.exercises || []).map((e) => ({
        name: e.name,
        work: e.work,
        rest: e.rest,
      })),
      rounds: data.rounds,
      restBetweenRounds: data.restBetweenRounds,
      warmupEnabled: data.warmupEnabled,
      warmupSeconds: data.warmupSeconds,
      icon: data.icon || undefined,
      exportedAt: new Date().toISOString(),
    }
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    const base = String(name || data.name || '')
      .trim()
      .replace(/[\\/:*?"<>|]/g, '-') || '预设'
    a.download = base + '.json'
    a.click()
    URL.revokeObjectURL(url)
    toast('已导出「' + (payload.name || base) + '」')
  },
}

provide('actions', actions)

function handlePause() {
  workout.togglePause()
  if (workout.paused.value) audio.cancel()
}

function handleSkip() {
  workout.skip()
}

function handleStop() {
  workout.stop()
  audio.cancel()
  if (document.fullscreenElement) {
    document.exitFullscreen().catch(() => {})
  }
}

function handleRestart() {
  audio.prime()
  const ok = workout.startWorkout(audio)
  if (!ok) toast('训练内容为空')
}

function handleHome() {
  workout.goHome()
  audio.cancel()
  if (document.fullscreenElement) {
    document.exitFullscreen().catch(() => {})
  }
  router.push('/')
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
    handlePause()
  }
  if (e.code === 'KeyS' && e.ctrlKey) {
    e.preventDefault()
    handleSkip()
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
  document.body.classList.toggle('timer-active', v === 'timer')
  if (v === 'timer') acquireWakeLock()
  else releaseWakeLock()
})

onMounted(() => {
  document.addEventListener('fullscreenchange', onFS)
  document.addEventListener('keydown', onKey)
  document.addEventListener('visibilitychange', onVis)
})

onUnmounted(() => {
  document.removeEventListener('fullscreenchange', onFS)
  document.removeEventListener('keydown', onKey)
  document.removeEventListener('visibilitychange', onVis)
  releaseWakeLock()
})
</script>

<template>
  <div class="toast" :class="{ on: !!toastText }">{{ toastText }}</div>

  <div class="top-actions" v-show="workout.view.value === 'timer' || workout.view.value === 'summary'">
    <button
      class="icon-btn"
      :title="settings.muted ? '开启声音' : '静音'"
      :aria-pressed="settings.muted"
      @click="toggleMute"
    >
      <Icon :icon="settings.muted ? 'mdi:volume-off' : 'mdi:volume-high'" />
    </button>
    <button
      class="icon-btn"
      :title="isFullscreen ? '退出全屏' : '全屏'"
      @click="toggleFullscreen"
    >
      <Icon :icon="isFullscreen ? 'mdi:fullscreen-exit' : 'mdi:fullscreen'" />
    </button>
  </div>

  <button
    v-show="workout.view.value === 'editor'"
    class="fs-btn"
    @click="toggleFullscreen"
    :title="isFullscreen ? '退出全屏' : '全屏'"
  >
    <Icon :icon="isFullscreen ? 'mdi:fullscreen-exit' : 'mdi:fullscreen'" />
  </button>

  <RouterView v-if="workout.view.value === 'editor'" />

  <Transition v-else name="fade" mode="out-in">
    <TimerView
      v-if="workout.view.value === 'timer'"
      key="timer"
      :remaining="workout.remaining.value"
      :paused="workout.paused.value"
      :display-name="workout.displayName.value"
      :phase-label="workout.phaseLabel.value"
      :phase-cls="workout.phaseCls.value"
      :current-round="workout.currentRound.value"
      :rounds="workout.rounds.value"
      :current-step-type="workout.currentStepType.value"
      :next-name="workout.nextName.value"
      :next-sec="workout.nextSec.value"
      :progress-dots="workout.progressDots.value"
      @pause="handlePause"
      @skip="handleSkip"
      @stop="handleStop"
    />
    <SummaryView
      v-else
      key="summary"
      :total-elapsed="workout.totalElapsed.value"
      :rounds="workout.rounds.value"
      :exercise-count="workout.exercises.value.length"
      :fmt="workout.fmt"
      @restart="handleRestart"
      @home="handleHome"
    />
  </Transition>
</template>
