<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue'
import { Icon } from '@iconify/vue'
import { useRouter } from 'vue-router'
import { useWorkout } from './composables/useWorkout.js'
import { useAudio } from './composables/useAudio.js'
import { useSettings } from './composables/useSettings.js'
import { useToast } from './composables/useToast.js'
import { useActions } from './composables/useActions.js'
import TimerView from './components/TimerView.vue'
import SummaryView from './components/SummaryView.vue'

const router = useRouter()
const workout = useWorkout()
const { settings, toggleMute } = useSettings()
const audio = useAudio(settings)
const actions = useActions()
const { toast, text: toastText } = useToast()

const isFullscreen = ref(false)

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
  <div
    class="bg-glow"
    :class="workout.view.value === 'timer' ? 'phase-' + workout.phaseCls.value : ''"
    aria-hidden="true"
  ></div>

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
