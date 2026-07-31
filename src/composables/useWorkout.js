import { ref, computed, watch } from 'vue'
import { load, save } from './useStorage.js'
import defaults from '../data/defaults.json'
import { useVoicePrompts } from './useVoicePrompts.js'

const CONFIG_KEY = 'ct3-config'

function loadConfig() {
  const d = load(CONFIG_KEY)
  return d && d.ex ? d : null
}

export function useWorkout() {
  const cfg = loadConfig()
  const exercises = ref(cfg?.ex || JSON.parse(JSON.stringify(defaults.exercises)))
  const rounds = ref(cfg?.r ?? defaults.rounds)
  const restBetweenRounds = ref(cfg?.rb ?? defaults.restBetweenRounds)
  const warmupEnabled = ref(cfg?.we || defaults.warmupEnabled)
  const warmupSeconds = ref(cfg?.ws ?? defaults.warmupSeconds)

  const view = ref('editor')
  const flat = ref([])
  const cur = ref(0)
  const remaining = ref(0)
  const paused = ref(false)
  const totalElapsed = ref(0)

  // rAF 驱动的真实时间计时状态
  let rafId = null
  let startAt = 0        // 开始训练时的 performance.now()
  let pausedMs = 0       // 累计暂停毫秒（暂停时间不计入训练进度）
  let pauseStartAt = 0   // 本次暂停开始的时间
  let skipAdjustMs = 0   // 跳过动作产生的进度偏移
  let lastTs = null      // 上一帧时间戳，用于识别后台恢复
  let finished = false
  let audioRef = null    // 当前训练使用的音频对象（rAF 回调内引用）
  let voice = null       // 当前训练的语音提示模块

  function persist() {
    save(CONFIG_KEY, {
      ex: exercises.value,
      r: rounds.value,
      rb: restBetweenRounds.value,
      we: warmupEnabled.value,
      ws: warmupSeconds.value,
    })
  }

  function addExercise() {
    exercises.value.push({ name: '', ...defaults.newExercise })
    persist()
  }

  function removeExercise(i) {
    exercises.value.splice(i, 1)
    persist()
  }

  function buildSchedule() {
    const f = []
    if (warmupEnabled.value) {
      f.push({ name: '热身', seconds: warmupSeconds.value, type: 'warmup', exIndex: -1, round: -1 })
    }
    for (let r = 0; r < rounds.value; r++) {
      for (let i = 0; i < exercises.value.length; i++) {
        const e = exercises.value[i]
        f.push({ name: e.name, seconds: e.work, type: 'work', exIndex: i, round: r })
        if (e.rest > 0) {
          f.push({ name: '休息', seconds: e.rest, type: 'rest', exIndex: i, round: r })
        }
      }
      if (r < rounds.value - 1 && restBetweenRounds.value > 0) {
        f.push({ name: '轮间休息', seconds: restBetweenRounds.value, type: 'roundRest', exIndex: -1, round: r })
      }
    }
    flat.value = f
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
        // 未完成：灰色；已完成：绿色；正在完成：放大 + 发光
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

  function startWorkout(audio) {
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
    // 总用时扣除暂停时间，与实际训练时长一致
    totalElapsed.value = Math.floor((performance.now() - startAt - pausedMs) / 1000)
    voice?.onFinish()
    view.value = 'summary'
  }

  function frame(ts) {
    if (finished || paused.value || view.value !== 'timer') return

    // 帧间隔超过 500ms 说明期间标签页在后台/锁屏，恢复后只补进度、不播声音
    const catchUp = lastTs !== null && ts - lastTs > 500
    lastTs = ts

    // 用真实时间戳计算已进行的训练进度（暂停时间不计入）
    const elapsedMs = ts - startAt - pausedMs + skipAdjustMs
    const oldCur = cur.value
    const oldRem = remaining.value

    // 按时间线累加各步骤时长，找到当前步骤与剩余秒数
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
      // 进入新步骤
      cur.value = idx
      if (!catchUp) {
        audioRef?.beep?.(660, 0.5, 0.4)
        const s = flat.value[idx]
        voice?.onStepChange(s)
      }
    } else if (!catchUp && remaining.value < oldRem) {
      // 同一步骤内跨过关键时间点：提前 5 秒语音播报，3/2/1 秒蜂鸣
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

  function reset() {
    cancelAnimationFrame(rafId)
    rafId = null
    finished = false
    view.value = 'editor'
  }

  function loadPreset(preset) {
    exercises.value = preset.exercises.map((e) => ({ ...e }))
    rounds.value = preset.rounds ?? 3
    restBetweenRounds.value = preset.restBetweenRounds ?? 30
    warmupEnabled.value = preset.warmupEnabled || false
    warmupSeconds.value = preset.warmupSeconds || 180
    persist()
  }

  function fmt(s) {
    const m = Math.floor(s / 60)
    return String(m).padStart(2, '0') + ':' + String(s % 60).padStart(2, '0')
  }

  watch(
    [exercises, rounds, restBetweenRounds, warmupEnabled, warmupSeconds],
    persist,
    { deep: true },
  )

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
    addExercise,
    removeExercise,
    buildSchedule,
    startWorkout,
    togglePause,
    skip,
    stop,
    reset,
    loadPreset,
    persist,
    fmt,
  }
}
