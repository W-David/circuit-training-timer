/** Flatten workout config into timed steps. */
export function buildSchedule(cfg) {
  const exercises = cfg.exercises || []
  const rounds = cfg.rounds ?? 1
  const restBetweenRounds = cfg.restBetweenRounds ?? 0
  const f = []
  if (cfg.warmupEnabled) {
    f.push({
      name: '热身',
      seconds: cfg.warmupSeconds || 0,
      type: 'warmup',
      exIndex: -1,
      round: -1,
    })
  }
  for (let r = 0; r < rounds; r++) {
    for (let i = 0; i < exercises.length; i++) {
      const e = exercises[i]
      f.push({ name: e.name, seconds: e.work, type: 'work', exIndex: i, round: r })
      if (e.rest > 0) {
        f.push({ name: '休息', seconds: e.rest, type: 'rest', exIndex: i, round: r })
      }
    }
    if (r < rounds - 1 && restBetweenRounds > 0) {
      f.push({
        name: '轮间休息',
        seconds: restBetweenRounds,
        type: 'roundRest',
        exIndex: -1,
        round: r,
      })
    }
  }
  return f
}
