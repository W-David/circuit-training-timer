<script setup>
import { ref, onMounted, onUnmounted, watch, provide } from 'vue'
import { Icon } from '@iconify/vue'
import { useRouter } from 'vue-router'
import { useWorkout } from './composables/useWorkout.js'
import { useAudio } from './composables/useAudio.js'
import { usePresets } from './composables/usePresets.js'
import TimerView from './components/TimerView.vue'
import SummaryView from './components/SummaryView.vue'

const router = useRouter()
const workout = useWorkout()
const audio = useAudio()
const presets = usePresets()

const isFullscreen = ref(false)
const toastText = ref('')
let toastTimer = null

provide('workout', workout)
provide('presets', presets)

function toast(msg) {
  toastText.value = msg
  clearTimeout(toastTimer)
  toastTimer = setTimeout(() => (toastText.value = ''), 2000)
}

const actions = {
  startPreset(key) {
    const p = presets.loadBuiltin(key) || presets.customPresets[key] || null
    if (!p) return
    workout.loadPreset(p)
    audio.prime()
    const ok = workout.startWorkout(audio)
    if (!ok) toast('训练内容为空')
  },
  savePreset(name, key) {
    const k = presets.savePreset(
      name,
      {
        exercises: JSON.parse(JSON.stringify(workout.exercises.value)),
        rounds: workout.rounds.value,
        restBetweenRounds: workout.restBetweenRounds.value,
        warmupEnabled: workout.warmupEnabled.value,
        warmupSeconds: workout.warmupSeconds.value,
      },
      key,
    )
    toast(key ? '已更新「' + name + '」' : '已保存「' + name + '」')
    router.push('/preset/' + k)
  },
  deletePreset(key) {
    const name = presets.customPresets[key]?.name || '未命名'
    presets.deletePreset(key)
    toast('已删除「' + name + '」')
  },
  importPreset(data) {
    workout.exercises.value = data.exercises.map((ex) => ({
      name: String(ex.name || '未命名'),
      work: Math.max(1, Math.min(600, +ex.work || 1)),
      rest: Math.max(0, Math.min(600, +ex.rest || 0)),
    }))
    workout.rounds.value = Math.max(1, Math.min(99, +data.rounds || 3))
    workout.restBetweenRounds.value = Math.max(0, Math.min(600, +data.restBetweenRounds || 0))
    workout.warmupEnabled.value = !!data.warmupEnabled
    workout.warmupSeconds.value = Math.max(10, Math.min(600, +data.warmupSeconds || 180))
    workout.persist()
    toast('已导入 ' + workout.exercises.value.length + ' 个动作')
  },
  exportPreset(name = '', data = null) {
    const cfg = data || {
      exercises: workout.exercises.value,
      rounds: workout.rounds.value,
      restBetweenRounds: workout.restBetweenRounds.value,
      warmupEnabled: workout.warmupEnabled.value,
      warmupSeconds: workout.warmupSeconds.value,
    }
    const payload = {
      v: 1,
      name: name || '',
      exercises: cfg.exercises.map((e) => ({
        name: e.name,
        work: e.work,
        rest: e.rest,
      })),
      rounds: cfg.rounds,
      restBetweenRounds: cfg.restBetweenRounds,
      warmupEnabled: cfg.warmupEnabled,
      warmupSeconds: cfg.warmupSeconds,
      exportedAt: new Date().toISOString(),
    }
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    const base = String(name || '')
      .trim()
      .replace(/[\\/:*?"<>|]/g, '-') || '预设'
    a.download = base + '-' + Date.now() + '.json'
    a.click()
    URL.revokeObjectURL(url)
    toast('已导出')
  },
}

provide('actions', actions)

function handleStart() {
  if (!workout.exercises.value.length) {
    toast('请先添加动作')
    return
  }
  audio.prime()
  const ok = workout.startWorkout(audio)
  if (!ok) toast('训练内容为空')
}

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
  // 全屏下结束训练：先退出全屏，否则页面会被 body.fs 隐藏成空白页
  if (document.fullscreenElement) {
    document.exitFullscreen().catch(() => {})
  }
}

function handleRestart() {
  // 与按钮文案一致：直接重新开始一轮训练
  handleStart()
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

// --- Wake Lock：计时页面保持屏幕常亮 ---
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
  <!-- Toast -->
  <div class="toast" :class="{ on: !!toastText }">{{ toastText }}</div>

  <!-- FS button -->
  <button class="fs-btn" @click="toggleFullscreen" :title="isFullscreen ? '退出全屏' : '全屏'">
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
      @toggle-fs="toggleFullscreen"
    />
    <SummaryView
      v-else
      key="summary"
      :total-elapsed="workout.totalElapsed.value"
      :rounds="workout.rounds.value"
      :exercise-count="workout.exercises.value.length"
      :fmt="workout.fmt"
      @restart="handleRestart"
    />
  </Transition>
</template>
