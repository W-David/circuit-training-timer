<script setup>
import { computed } from 'vue'
import FlipDigit from './FlipDigit.vue'

const props = defineProps({
  seconds: { type: Number, default: 0 },
})

function fmt(s) {
  const m = Math.floor(s / 60)
  return String(m).padStart(2, '0') + ':' + String(s % 60).padStart(2, '0')
}

const chars = computed(() => fmt(props.seconds).split(''))
</script>

<template>
  <span class="digit-group">
    <FlipDigit v-for="(ch, i) in chars" :key="i" :char="ch" />
  </span>
</template>
