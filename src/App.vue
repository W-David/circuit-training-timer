<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue'
import { Icon } from '@iconify/vue'
import { useWorkout } from './composables/useWorkout.js'
import { useAudio } from './composables/useAudio.js'
import { usePresets } from './composables/usePresets.js'
import EditorView from './components/EditorView.vue'
import TimerView from './components/TimerView.vue'
import SummaryView from './components/SummaryView.vue'

const workout = useWorkout()
const audio = useAudio()
const presets = usePresets()

const isFullscreen = ref(false)
const toastText = ref('')
let toastTimer = null

function toast(msg) {
  toastText.value = msg
  clearTimeout(toastTimer)
  toastTimer = setTimeout(() => (toastText.value = ''), 2000)
}

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
}

function handleRestart() {
  // 与按钮文案一致：直接重新开始一轮训练
  handleStart()
}

function handleLoadBuiltin(key) {
  const p = presets.loadBuiltin(key)
  if (!p) return
  workout.loadPreset(p)
  toast('已加载「' + p.name + '」')
}

function handleLoadCustom(key) {
  const p = presets.customPresets[key]
  if (!p) return
  workout.loadPreset(p)
  toast('已加载「' + p.name + '」')
}

function handleDeleteCustom(key) {
  const name = presets.customPresets[key]?.name || '未命名'
  presets.deletePreset(key)
  toast('已删除「' + name + '」')
}

function handleSavePreset(name) {
  presets.savePreset(name, {
    exercises: JSON.parse(JSON.stringify(workout.exercises.value)),
    rounds: workout.rounds.value,
    restBetweenRounds: workout.restBetweenRounds.value,
    warmupEnabled: workout.warmupEnabled.value,
    warmupSeconds: workout.warmupSeconds.value,
  })
  toast('已保存「' + name + '」')
}

function handleImportPreset(data) {
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
}

function handleExportPreset() {
  const data = {
    v: 1,
    exercises: workout.exercises.value.map((e) => ({
      name: e.name,
      work: e.work,
      rest: e.rest,
    })),
    rounds: workout.rounds.value,
    restBetweenRounds: workout.restBetweenRounds.value,
    warmupEnabled: workout.warmupEnabled.value,
    warmupSeconds: workout.warmupSeconds.value,
    exportedAt: new Date().toISOString(),
  }
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'workout-' + new Date().toISOString().slice(0, 10) + '.json'
  a.click()
  URL.revokeObjectURL(url)
  toast('已导出')
}

function handleAddExercise() {
  workout.addExercise()
}

function handleRemoveExercise(i) {
  workout.removeExercise(i)
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

  <Transition name="fade" mode="out-in">
    <EditorView
      v-if="workout.view.value === 'editor'"
      key="editor"
      :exercises="workout.exercises.value"
      :rounds="workout.rounds.value"
      :rest-between-rounds="workout.restBetweenRounds.value"
      :warmup-enabled="workout.warmupEnabled.value"
      :warmup-seconds="workout.warmupSeconds.value"
      :builtin-presets="presets.builtinPresets"
      :custom-presets="presets.customPresets"
      :custom-count="presets.customCount.value"
      @update:rounds="workout.rounds.value = $event"
      @update:rest-between-rounds="workout.restBetweenRounds.value = $event"
      @update:warmup-enabled="workout.warmupEnabled.value = $event"
      @update:warmup-seconds="workout.warmupSeconds.value = $event"
      @add-exercise="handleAddExercise"
      @remove-exercise="handleRemoveExercise"
      @start="handleStart"
      @load-builtin="handleLoadBuiltin"
      @load-custom="handleLoadCustom"
      @delete-custom="handleDeleteCustom"
      @save-preset="handleSavePreset"
      @import-preset="handleImportPreset"
      @export-preset="handleExportPreset"
    />

    <TimerView
      v-else-if="workout.view.value === 'timer'"
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
