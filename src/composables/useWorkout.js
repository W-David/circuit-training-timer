import { ref, computed } from 'vue'
import { buildSchedule as buildFlat } from '../utils/schedule.js'
import { formatMMSS } from '../utils/time.js'
import { normalizePreset } from '../utils/presetFormat.js'
import { useVoicePrompts } from './useVoicePrompts.js'

export function useWorkout() {
  const exercises = ref([])
  const rounds = ref(3)
  const restBetweenRounds = ref(30)
  const warmupEnabled = ref(false)
  const warmupSeconds = ref(180)

  const view = ref('editor')
  const flat = ref([])
  const cur = ref(0)
  const remaining = ref(0)
  const paused = ref(false)
  const totalElapsed = ref(0)

  // rAF 驱动的真实时间计时状态
  let rafId = null
  let startAt = 0
  let pausedMs = 0
  let pauseStartAt = 0
  let skipAdjustMs = 0
  let lastTs = null
  let finished = false
  let audioRef = null
  let voice = null

  function applyConfig(cfg) {
    const n = normalizePreset(cfg)
    exercises.value = n.exercises.map((e) => ({ ...e }))
    rounds.value = n.rounds
    restBetweenRounds.value = n.restBetweenRounds
    warmupEnabled.value = n.warmupEnabled
    warmupSeconds.value = n.warmupSeconds
  }

  function buildSchedule() {
    flat.value = buildFlat({
      exercises: exercises.value,
      rounds: rounds.value,
      restBetweenRounds: restBetweenRounds.value,
      warmupEnabled: warmupEnabled.value,
      warmupSeconds: warmupSeconds.value,
    })
  }

  const currentStep = computed(() => flat.value[cur.value] || {})
  const currentStepType = computed(() => currentStep.value.type || '')
  const currentRound = computed(() => currentStep.value.round ?? 0)

  const displayName = computed(() => {
    const t = currentStepType.value
    if (t === 'warmup') return '热身'
    if (t === 'roundRest') return '轮间休息'
    if (t === 'rest') return '休息'
    return currentStep.value.name || ''
  })

  const phaseLabel = computed(() => {
    const t = currentStepType.value
    if (t === 'warmup') return '热身中'
    if (t === 'work') return '运动中'
    if (t === 'roundRest') return '轮间休息'
    return '休息中'
  })

  const phaseCls = computed(() => {
    const t = currentStepType.value
    if (t === 'warmup') return 'u'
    if (t === 'work') return 'w'
    return 'r'
  })

  const nextStep = computed(() =>
    cur.value + 1 < flat.value.length ? flat.value[cur.value + 1] : null,
  )

  const nextName = computed(() => {
    if (!nextStep.value) return ''
    const t = nextStep.value.type
    if (t === 'warmup') return '热身'
    if (t === 'roundRest') return '轮间休息'
    if (t === 'rest') return '休息'
    return nextStep.value.name
  })

  const nextSec = computed(() => (nextStep.value ? nextStep.value.seconds : 0))

  const progressDots = computed(() => {
    const dots = []
    for (let r = 0; r < rounds.value; r++) {
      for (let i = 0; i < exercises.value.length; i++) {
        const si = flat.value.findIndex(
          (s) => s.round === r && s.exIndex === i && s.type === 'work',
        )
        let cls = 'work'
        if (si >= 0 && si < cur.value) {
          cls = 'past'
        } else if (si === cur.value) {
          cls = 'now'
        }
        dots.push({ cls, title: exercises.value[i].name })
      }
      if (r < rounds.value - 1) dots.push('s')
    }
    return dots
  })

  function startWorkout(audio, cfg) {
    if (cfg) applyConfig(cfg)
    if (!exercises.value.length) return false
    buildSchedule()
    if (!flat.value.length) return false
    if (rafId) cancelAnimationFrame(rafId)
    audioRef = audio
    voice = useVoicePrompts(audio)
    cur.value = 0
    remaining.value = flat.value[0].seconds
    paused.value = false
    totalElapsed.value = 0
    startAt = performance.now()
    pausedMs = 0
    skipAdjustMs = 0
    lastTs = null
    finished = false
    view.value = 'timer'

    const s = flat.value[0]
    voice?.onStart(s)

    rafId = requestAnimationFrame(frame)
    return true
  }

  function finish() {
    finished = true
    cancelAnimationFrame(rafId)
    rafId = null
    totalElapsed.value = Math.floor((performance.now() - startAt - pausedMs) / 1000)
    voice?.onFinish()
    view.value = 'summary'
  }

  function frame(ts) {
    if (finished || paused.value || view.value !== 'timer') return

    const catchUp = lastTs !== null && ts - lastTs > 500
    lastTs = ts

    const elapsedMs = ts - startAt - pausedMs + skipAdjustMs
    const oldCur = cur.value
    const oldRem = remaining.value

    let acc = 0
    let idx = -1
    for (let i = 0; i < flat.value.length; i++) {
      const stepMs = flat.value[i].seconds * 1000
      if (elapsedMs < acc + stepMs) {
        idx = i
        remaining.value = (acc + stepMs - elapsedMs) / 1000
        break
      }
      acc += stepMs
    }

    if (idx === -1) {
      remaining.value = 0
      if (!catchUp) audioRef?.beep?.(660, 0.5, 0.4)
      finish()
      return
    }

    if (idx !== oldCur) {
      cur.value = idx
      if (!catchUp) {
        audioRef?.beep?.(660, 0.5, 0.4)
        const s = flat.value[idx]
        voice?.onStepChange(s)
      }
    } else if (!catchUp && remaining.value < oldRem) {
      const s = flat.value[idx]
      const next = flat.value[idx + 1] || null
      if (oldRem > 5 && remaining.value <= 5) {
        voice?.onNearEnd(s, next)
      }
      for (let t = 3; t >= 1; t--) {
        if (oldRem > t && remaining.value <= t) {
          audioRef?.beep?.(600 + (3 - t) * 100, 0.15)
        }
      }
    }

    rafId = requestAnimationFrame(frame)
  }

  function togglePause() {
    paused.value = !paused.value
    if (paused.value) {
      pauseStartAt = performance.now()
      cancelAnimationFrame(rafId)
      rafId = null
      if ('speechSynthesis' in window) speechSynthesis.cancel()
    } else {
      pausedMs += performance.now() - pauseStartAt
      lastTs = null
      // 继续时重播当前步骤提示，避免暂停后丢失上下文
      const s = flat.value[cur.value]
      if (s) voice?.onStepChange(s)
      rafId = requestAnimationFrame(frame)
    }
  }

  function skip() {
    if (view.value !== 'timer' || finished) return
    if (remaining.value > 1) {
      skipAdjustMs += (remaining.value - 1) * 1000
    }
    remaining.value = 1
  }

  function stop() {
    cancelAnimationFrame(rafId)
    rafId = null
    finished = true
    if ('speechSynthesis' in window) speechSynthesis.cancel()
    view.value = 'editor'
  }

  function goHome() {
    cancelAnimationFrame(rafId)
    rafId = null
    finished = true
    if ('speechSynthesis' in window) speechSynthesis.cancel()
    view.value = 'editor'
  }

  function fmt(s) {
    return formatMMSS(s)
  }

  return {
    exercises,
    rounds,
    restBetweenRounds,
    warmupEnabled,
    warmupSeconds,
    view,
    flat,
    cur,
    remaining,
    paused,
    totalElapsed,
    currentStepType,
    currentRound,
    displayName,
    phaseLabel,
    phaseCls,
    nextName,
    nextSec,
    progressDots,
    startWorkout,
    togglePause,
    skip,
    stop,
    goHome,
    fmt,
  }
}
