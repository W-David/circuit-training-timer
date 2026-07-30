<script setup>
import { ref, watch } from 'vue'

const props = defineProps({
  char: { type: String, required: true },
})

const prevChar = ref(props.char)
const oldChar = ref(props.char)
const flipping = ref(false)
let timer = null
let midTimer = null

watch(
  () => props.char,
  (cur) => {
    if (cur === prevChar.value || cur === ':') return
    clearTimeout(timer)
    clearTimeout(midTimer)
    oldChar.value = prevChar.value
    flipping.value = true
    midTimer = setTimeout(() => {
      prevChar.value = cur
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
    <span class="card-up">{{ prevChar }}</span>
    <span class="card-lo">{{ prevChar }}</span>
    <span class="mid-line"></span>
    <span class="fold-top">{{ oldChar }}</span>
    <span class="fold-bot">{{ char }}</span>
  </span>
</template>
