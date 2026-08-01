import { onMounted, onUnmounted } from 'vue'

/** 弹窗开启时按 Esc 关闭。传入控制弹窗显隐的 ref。 */
export function useEscClose(openRef) {
  function onKey(e) {
    if (e.key === 'Escape' && openRef.value) openRef.value = false
  }
  onMounted(() => document.addEventListener('keydown', onKey))
  onUnmounted(() => document.removeEventListener('keydown', onKey))
}
