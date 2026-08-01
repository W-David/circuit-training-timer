import { describe, it, expect } from 'vitest'
import { buildSchedule } from './schedule.js'

describe('buildSchedule', () => {
  it('builds work + rest per exercise and round rest', () => {
    const flat = buildSchedule({
      exercises: [
        { name: '深蹲', work: 40, rest: 20 },
        { name: '俯卧撑', work: 30, rest: 0 },
      ],
      rounds: 2,
      restBetweenRounds: 15,
      warmupEnabled: false,
    })
    expect(flat.map((s) => s.type)).toEqual([
      'work',
      'rest',
      'work',
      'roundRest',
      'work',
      'rest',
      'work',
    ])
    expect(flat[0]).toMatchObject({ name: '深蹲', seconds: 40, round: 0, exIndex: 0 })
    expect(flat[3]).toMatchObject({ type: 'roundRest', seconds: 15 })
    expect(flat[4].round).toBe(1)
  })

  it('prepends warmup when enabled', () => {
    const flat = buildSchedule({
      exercises: [{ name: 'A', work: 10, rest: 0 }],
      rounds: 1,
      restBetweenRounds: 0,
      warmupEnabled: true,
      warmupSeconds: 60,
    })
    expect(flat[0]).toMatchObject({ type: 'warmup', seconds: 60, name: '热身' })
    expect(flat).toHaveLength(2)
  })

  it('skips rest when rest is 0 and skips final roundRest', () => {
    const flat = buildSchedule({
      exercises: [{ name: 'A', work: 5, rest: 0 }],
      rounds: 1,
      restBetweenRounds: 99,
      warmupEnabled: false,
    })
    expect(flat).toEqual([
      { name: 'A', seconds: 5, type: 'work', exIndex: 0, round: 0 },
    ])
  })
})
