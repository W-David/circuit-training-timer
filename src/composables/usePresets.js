import { reactive, computed } from 'vue'
import { load, save } from './useStorage.js'
import BUILTIN from '../data/presets.json'

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

  function savePreset(name, config, key) {
    // 用「预设名-时间戳」作为保存标识，避免同名预设互相覆盖
    const k = key || name + '-' + Date.now()
    state[k] = { name, ...config }
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
