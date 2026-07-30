import { ref, computed, watch } from 'vue'
import { load, save } from './useStorage.js'
import { defaultExercises, makeExercise } from '../data/exercises.js'

const CONFIG_KEY = 'ct3-config'

function loadConfig() {
  const d = load(CONFIG_KEY)
  return d && d.ex ? d : null
}

export function useWorkout() {
  const exercises = ref(loadConfig()?.ex || defaultExercises())
  const rounds = ref(loadConfig()?.r || 3)
  const restBetweenRounds = ref(loadConfig()?.rb ?? 30)
  const warmupEnabled = ref(loadConfig()?.we || false)
  const warmupSeconds = ref(loadConfig()?.ws || 180)

  const view = ref('editor')
  const flat = ref([])
  const cur = ref(0)
  const remaining = ref(0)
  const paused = ref(false)
  const totalElapsed = ref(0)

  let iv = null
  let st = 0

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
    exercises.value.push(makeExercise())
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

  const nextWorkName = computed(() => {
    for (let i = cur.value + 1; i < flat.value.length; i++) {
      if (flat.value[i].type === 'work') return flat.value[i].name
    }
    return ''
  })

  const progressDots = computed(() => {
    const dots = []
    for (let r = 0; r < rounds.value; r++) {
      for (let i = 0; i < exercises.value.length; i++) {
        const si = flat.value.findIndex(
          (s) => s.round === r && s.exIndex === i && s.type === 'work',
        )
        let cls = 'work'
        let sty = { background: 'var(--work)' }
        if (si >= 0 && si < cur.value) {
          cls = 'past'
          sty = { background: '#2a2d38' }
        } else if (si === cur.value) {
          cls = 'now'
          sty = { background: 'var(--work)', color: 'var(--work)' }
        }
        dots.push({ cls, sty, title: exercises.value[i].name })
      }
      if (r < rounds.value - 1) dots.push('s')
    }
    return dots
  })

  function startWorkout(audio) {
    if (!exercises.value.length) return false
    buildSchedule()
    if (!flat.value.length) return false
    cur.value = 0
    remaining.value = flat.value[0].seconds
    paused.value = false
    totalElapsed.value = 0
    st = Date.now()
    view.value = 'timer'

    const s = flat.value[0]
    if (s.type === 'warmup') audio?.speak?.('热身开始')
    else if (s.type === 'work') audio?.speak?.(s.name + '，准备开始')

    iv = setInterval(() => tick(audio), 1000)
    return true
  }

  function tick(audio) {
    if (paused.value) return
    remaining.value--
    if (remaining.value === 5 && currentStepType.value === 'work') {
      const nx = nextWorkName.value
      if (nx) audio?.speak?.('下一个，' + nx)
    }
    if (remaining.value <= 3 && remaining.value > 0) {
      audio?.beep?.(600 + (3 - remaining.value) * 100, 0.15)
    }
    if (remaining.value <= 0) {
      audio?.beep?.(660, 0.5, 0.4)
      if (cur.value + 1 >= flat.value.length) {
        totalElapsed.value = Math.floor((Date.now() - st) / 1000)
        clearInterval(iv)
        audio?.speak?.('训练完成！辛苦了！')
        view.value = 'summary'
        return
      }
      cur.value++
      remaining.value = flat.value[cur.value].seconds
      const s = flat.value[cur.value]
      if (s.type === 'work') audio?.speak?.(s.name)
      else if (s.type === 'roundRest') audio?.speak?.('本轮结束，休息一下')
    }
  }

  function togglePause() {
    paused.value = !paused.value
    if (paused.value) {
      if ('speechSynthesis' in window) speechSynthesis.cancel()
    }
  }

  function skip() {
    remaining.value = 1
  }

  function stop() {
    clearInterval(iv)
    if ('speechSynthesis' in window) speechSynthesis.cancel()
    view.value = 'editor'
  }

  function reset() {
    clearInterval(iv)
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
