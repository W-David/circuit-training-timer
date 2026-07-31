<script setup>
import { ref, watch } from 'vue'

const props = defineProps({
  char: { type: String, required: true },
})

const display = ref(props.char)
const oldChar = ref(props.char)
const flipping = ref(false)
let timer = null
let midTimer = null

watch(
  () => props.char,
  (cur) => {
    if (cur === display.value || cur === ':') return
    clearTimeout(timer)
    clearTimeout(midTimer)
    if (flipping.value) {
      // 动画未结束又来了新变化：直接瞬移，避免中间状态错乱
      display.value = cur
      oldChar.value = cur
      flipping.value = false
      return
    }
    oldChar.value = display.value
    flipping.value = true
    midTimer = setTimeout(() => {
      display.value = cur
    }, 200)
    timer = setTimeout(() => {
      flipping.value = false
      oldChar.value = cur
    }, 400)
  },
)
</script>

<template>
  <span v-if="char === ':'" class="digit-sep">{{ char }}</span>
  <span v-else class="flip-digit" :class="{ go: flipping }">
    <span class="card-up">{{ display }}</span>
    <span class="card-lo">{{ display }}</span>
    <span class="mid-line"></span>
    <span class="fold-top">{{ oldChar }}</span>
    <span class="fold-bot">{{ char }}</span>
  </span>
</template>
