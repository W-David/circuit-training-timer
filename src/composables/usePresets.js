import { reactive, computed } from 'vue'
import { load, save, remove } from './useStorage.js'
import BUILTIN from '../data/presets.json'
import { normalizePreset } from '../utils/presetFormat.js'

const PRESETS_KEY = 'ct3-presets'
const DRAFT_KEY = 'ct3-new-draft'

function loadPresets() {
  const d = load(PRESETS_KEY)
  return d && typeof d === 'object' ? d : {}
}

function savePresets(data) {
  save(PRESETS_KEY, data)
}

const state = reactive(loadPresets())

export function usePresets() {
  const customPresets = state
  const customCount = computed(() => Object.keys(state).length)

  function savePreset(name, config, key) {
    const n = normalizePreset({ ...config, name })
    const k = key || name + '-' + Date.now()
    state[k] = {
      name: n.name || name,
      icon: n.icon,
      exercises: n.exercises,
      rounds: n.rounds,
      restBetweenRounds: n.restBetweenRounds,
      warmupEnabled: n.warmupEnabled,
      warmupSeconds: n.warmupSeconds,
    }
    savePresets(state)
    return k
  }

  function deletePreset(key) {
    delete state[key]
    savePresets(state)
  }

  function loadBuiltin(key) {
    return BUILTIN.find((p) => p.key === key) || null
  }

  function loadDraft() {
    return load(DRAFT_KEY)
  }

  function saveDraft(cfg) {
    save(DRAFT_KEY, cfg)
  }

  function clearDraft() {
    remove(DRAFT_KEY)
  }

  return {
    builtinPresets: BUILTIN,
    customPresets,
    customCount,
    savePreset,
    deletePreset,
    loadBuiltin,
    loadDraft,
    saveDraft,
    clearDraft,
    updatePresets: savePresets,
  }
}
