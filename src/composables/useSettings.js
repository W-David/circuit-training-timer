import { reactive, watch } from 'vue'
import { load, save } from './useStorage.js'

const KEY = 'ct3-settings'

function loadSettings() {
  const d = load(KEY)
  return {
    muted: !!(d && (d.muteBeep || d.muteVoice || d.muted)),
  }
}

const state = reactive(loadSettings())

watch(
  state,
  () => {
    save(KEY, {
      muted: state.muted,
    })
  },
  { deep: true },
)

export function useSettings() {
  function toggleMute() {
    state.muted = !state.muted
  }
  return {
    settings: state,
    toggleMute,
  }
}
