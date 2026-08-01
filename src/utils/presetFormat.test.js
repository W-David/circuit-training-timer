import { describe, it, expect } from 'vitest'
import {
  normalizePreset,
  parseImportPayload,
  presetTotalSec,
  fmtMin,
  clamp,
} from './presetFormat.js'
import {
  startPrompt,
  stepChangePrompt,
  nearEndPrompt,
  finishPrompt,
} from '../composables/useVoicePrompts.js'

describe('clamp / normalizePreset', () => {
  it('clamps numbers', () => {
    expect(clamp(50, 1, 10)).toBe(10)
    expect(clamp('x', 1, 10, 3)).toBe(3)
  })

  it('normalizes exercises and defaults', () => {
    const n = normalizePreset({
      name: '  HIIT  ',
      icon: 'mdi:fire',
      exercises: [{ name: '波比', work: 9999, rest: -1 }],
      rounds: 0,
      warmupEnabled: 1,
      warmupSeconds: 5,
    })
    expect(n.name).toBe('HIIT')
    expect(n.exercises[0]).toEqual({ name: '波比', work: 600, rest: 0 })
    expect(n.rounds).toBe(1)
    expect(n.warmupEnabled).toBe(true)
    expect(n.warmupSeconds).toBe(10)
  })
})

describe('parseImportPayload', () => {
  it('accepts v1 export shape', () => {
    const r = parseImportPayload({
      v: 1,
      name: '测',
      exercises: [{ name: 'A', work: 20, rest: 10 }],
      rounds: 2,
      restBetweenRounds: 30,
      warmupEnabled: false,
      warmupSeconds: 180,
    })
    expect(r.ok).toBe(true)
    expect(r.data.exercises).toHaveLength(1)
  })

  it('rejects bad version and empty exercises', () => {
    expect(parseImportPayload({ v: 2, exercises: [{ name: 'A', work: 1, rest: 0 }] }).ok).toBe(false)
    expect(parseImportPayload({ exercises: [] }).ok).toBe(false)
    expect(parseImportPayload(null).ok).toBe(false)
  })
})

describe('presetTotalSec / fmtMin', () => {
  it('sums schedule duration', () => {
    const sec = presetTotalSec({
      exercises: [
        { work: 40, rest: 20 },
        { work: 40, rest: 20 },
      ],
      rounds: 2,
      restBetweenRounds: 30,
      warmupEnabled: true,
      warmupSeconds: 60,
    })
    // round = 120, two rounds = 240 + roundRest 30 + warmup 60
    expect(sec).toBe(330)
  })

  it('formats minutes', () => {
    expect(fmtMin(45)).toBe('45秒')
    expect(fmtMin(60)).toBe('1分')
    expect(fmtMin(90)).toBe('1分30秒')
  })
})

describe('voice prompts', () => {
  it('start / step / finish', () => {
    expect(startPrompt({ type: 'warmup' })).toBe('热身开始')
    expect(startPrompt({ type: 'work', name: '深蹲' })).toBe('开始深蹲')
    expect(stepChangePrompt({ type: 'roundRest' })).toBe('本轮结束，休息一下')
    expect(finishPrompt()).toContain('完成')
  })

  it('near-end rules', () => {
    expect(
      nearEndPrompt({ type: 'work' }, { type: 'rest', seconds: 20 }),
    ).toBe('即将休息20秒')
    expect(
      nearEndPrompt({ type: 'rest' }, { type: 'work', name: '俯卧撑' }),
    ).toBe('下一个，俯卧撑')
    expect(nearEndPrompt({ type: 'work' }, null)).toBe('训练即将结束')
  })
})
