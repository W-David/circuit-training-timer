import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('./useStorage.js', () => {
  const store = new Map()
  return {
    load: vi.fn((key) => (store.has(key) ? JSON.parse(store.get(key)) : null)),
    save: vi.fn((key, value) => store.set(key, JSON.stringify(value))),
    remove: vi.fn((key) => store.delete(key)),
  }
})

let usePresets

beforeEach(async () => {
  vi.resetModules()
  const mod = await import('./usePresets.js')
  usePresets = mod.usePresets
})

describe('usePresets', () => {
  it('saves a preset with name-timestamp key and normalized shape', () => {
    const p = usePresets()
    const k = p.savePreset('我的预设', {
      icon: 'mdi:fire',
      exercises: [{ name: '深蹲', work: 40, rest: 20 }],
      rounds: 2,
      restBetweenRounds: 30,
    })
    expect(k).toMatch(/^我的预设-\d+$/)
    expect(p.customPresets[k]).toMatchObject({
      name: '我的预设',
      icon: 'mdi:fire',
      rounds: 2,
      restBetweenRounds: 30,
    })
    expect(p.customPresets[k].exercises).toEqual([{ name: '深蹲', work: 40, rest: 20 }])
  })

  it('deletes a preset', () => {
    const p = usePresets()
    const k = p.savePreset('待删', { exercises: [{ name: 'A', work: 10, rest: 0 }] })
    expect(p.customPresets[k]).toBeTruthy()
    p.deletePreset(k)
    expect(p.customPresets[k]).toBeUndefined()
  })

  it('loads builtin presets by key', () => {
    const p = usePresets()
    const b = p.loadBuiltin('全身力量')
    expect(b).toBeTruthy()
    expect(b.name).toBe('全身力量')
    expect(p.loadBuiltin('nope')).toBeNull()
  })

  it('round-trips the new-draft', () => {
    const p = usePresets()
    p.saveDraft({ name: '草稿', exercises: [{ name: 'X', work: 5, rest: 5 }], rounds: 1 })
    expect(p.loadDraft().name).toBe('草稿')
    p.clearDraft()
    expect(p.loadDraft()).toBeNull()
  })
})
