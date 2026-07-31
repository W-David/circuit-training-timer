import { reactive, computed } from 'vue'
import { load, save } from './useStorage.js'
import { BUILTIN } from '../data/presets.js'

const PRESETS_KEY = 'ct3-presets'

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

  function savePreset(name, config) {
    const key = 'c_' + Date.now()
    state[key] = { name, ...config }
    savePresets(state)
  }

  function deletePreset(key) {
    delete state[key]
    savePresets(state)
  }

  function loadBuiltin(key) {
    return BUILTIN.find((p) => p.key === key) || null
  }

  return {
    builtinPresets: BUILTIN,
    customPresets,
    customCount,
    savePreset,
    deletePreset,
    loadBuiltin,
    updatePresets: savePresets,
  }
}
