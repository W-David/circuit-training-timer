<script setup>
import { computed } from 'vue'
import FlipDigit from './FlipDigit.vue'
import { formatMMSS } from '../utils/time.js'

const props = defineProps({
  seconds: { type: Number, default: 0 },
})

// remaining 每帧是小数，展示时向上取整（如还剩 0.8 秒显示 00:01）
const chars = computed(() => formatMMSS(props.seconds, { ceil: true }).split(''))
</script>

<template>
  <span class="digit-group">
    <FlipDigit v-for="(ch, i) in chars" :key="i" :char="ch" />
  </span>
</template>

<style>
.digit-group {
  display: inline-flex;
  gap: 6px;
  align-items: stretch;
}
</style>
