<script setup>
import { computed } from 'vue'
import FlipDigit from './FlipDigit.vue'

const props = defineProps({
  seconds: { type: Number, default: 0 },
})

function fmt(s) {
  // remaining 现在每帧都是小数，展示时向上取整（如还剩 0.8 秒显示 00:01）
  const t = Math.max(0, Math.ceil(s))
  const m = Math.floor(t / 60)
  return String(m).padStart(2, '0') + ':' + String(t % 60).padStart(2, '0')
}

const chars = computed(() => fmt(props.seconds).split(''))
</script>

<template>
  <span class="digit-group">
    <FlipDigit v-for="(ch, i) in chars" :key="i" :char="ch" />
  </span>
</template>
