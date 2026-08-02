import { ref } from 'vue'

const text = ref('')
let timer = null

export function useToast() {
  function toast(msg) {
    text.value = msg
    clearTimeout(timer)
    timer = setTimeout(() => (text.value = ''), 2000)
  }
  return { toast, text }
}
