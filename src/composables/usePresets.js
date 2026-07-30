import { reactive, computed } from 'vue'
import { load, save } from './useStorage.js'
import { BUILTIN } from '../data/presets.js'

const PRESETS_KEY = 'ct3-presets'

function loadPresets() {
  try {
    return JSON.parse(localStorage.getItem(PRESETS_KEY)) || {}
  } catch {
    return {}
  }
}

function savePresets(data) {
  try {
    localStorage.setItem(PRESETS_KEY, JSON.stringify(data))
  } catch { /* ignore */ }
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
