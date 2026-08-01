const PRESET_ICONS = [
  'mdi:arm-flex',
  'mdi:run',
  'mdi:target',
  'mdi:fire',
  'mdi:lightning-bolt',
  'mdi:meditation',
  'mdi:stairs',
  'mdi:dumbbell',
  'mdi:shoe-sneaker',
  'mdi:weight-lifter',
  'mdi:run-fast',
  'mdi:heart-pulse',
  'mdi:bike',
  'mdi:yoga',
  'mdi:timer',
  'mdi:tune-variant',
]

export { PRESET_ICONS }

export function clamp(n, min, max, fallback = min) {
  const v = Number(n)
  if (!Number.isFinite(v)) return fallback
  return Math.max(min, Math.min(max, Math.round(v)))
}

export function normalizeExercise(ex = {}, fallback = { work: 30, rest: 10 }) {
  return {
    name: String(ex.name ?? '').trim() || '未命名',
    work: clamp(ex.work, 1, 600, fallback.work ?? 30),
    rest: clamp(ex.rest, 0, 600, fallback.rest ?? 0),
  }
}

/** Normalize any partial preset/config into a safe shape. */
export function normalizePreset(raw = {}, opts = {}) {
  const fallbackEx = opts.newExercise || { work: 30, rest: 10 }
  const exercises = Array.isArray(raw.exercises)
    ? raw.exercises.map((ex) => normalizeExercise(ex, fallbackEx))
    : []
  const icon = typeof raw.icon === 'string' && raw.icon.startsWith('mdi:')
    ? raw.icon
    : opts.defaultIcon || 'mdi:tune-variant'
  return {
    name: String(raw.name ?? '').trim(),
    icon,
    exercises,
    rounds: clamp(raw.rounds, 1, 99, 3),
    restBetweenRounds: clamp(raw.restBetweenRounds, 0, 600, 0),
    warmupEnabled: !!raw.warmupEnabled,
    warmupSeconds: clamp(raw.warmupSeconds, 10, 600, 180),
  }
}

/**
 * Parse imported JSON. Returns { ok, data } or { ok: false, error }.
 */
export function parseImportPayload(raw) {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return { ok: false, error: '不是有效的 JSON 对象' }
  }
  if (raw.v != null && raw.v !== 1) {
    return { ok: false, error: '不支持的导出版本（需要 v: 1）' }
  }
  if (!Array.isArray(raw.exercises) || raw.exercises.length === 0) {
    return { ok: false, error: '缺少动作列表' }
  }
  for (let i = 0; i < raw.exercises.length; i++) {
    const ex = raw.exercises[i]
    if (!ex || typeof ex !== 'object') {
      return { ok: false, error: `第 ${i + 1} 个动作格式无效` }
    }
  }
  const data = normalizePreset(raw)
  if (!data.exercises.length) {
    return { ok: false, error: '动作列表为空' }
  }
  return { ok: true, data }
}

export function presetTotalSec(cfg) {
  const roundSec = (cfg.exercises || []).reduce((s, e) => s + (e.work || 0) + (e.rest || 0), 0)
  return (
    (cfg.rounds || 0) * roundSec
    + Math.max(0, (cfg.rounds || 0) - 1) * (cfg.restBetweenRounds || 0)
    + (cfg.warmupEnabled ? cfg.warmupSeconds || 0 : 0)
  )
}

export function fmtMin(sec) {
  const m = Math.floor(sec / 60)
  const s = Math.round(sec % 60)
  if (m <= 0) return s + '秒'
  return m + '分' + (s ? s + '秒' : '')
}

export function cloneConfig(cfg) {
  return {
    name: cfg.name || '',
    icon: cfg.icon || 'mdi:tune-variant',
    exercises: (cfg.exercises || []).map((e) => ({
      name: e.name,
      work: e.work,
      rest: e.rest,
    })),
    rounds: cfg.rounds,
    restBetweenRounds: cfg.restBetweenRounds,
    warmupEnabled: !!cfg.warmupEnabled,
    warmupSeconds: cfg.warmupSeconds,
  }
}
