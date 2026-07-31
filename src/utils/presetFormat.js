export function presetTotalSec(cfg) {
  const roundSec = (cfg.exercises || []).reduce((s, e) => s + (e.work || 0) + (e.rest || 0), 0)
  return (
    cfg.rounds * roundSec
    + Math.max(0, cfg.rounds - 1) * (cfg.restBetweenRounds || 0)
    + (cfg.warmupEnabled ? cfg.warmupSeconds || 0 : 0)
  )
}

export function fmtMin(sec) {
  const m = Math.floor(sec / 60)
  const s = Math.round(sec % 60)
  if (m <= 0) return s + '秒'
  return m + '分' + (s ? s + '秒' : '')
}
