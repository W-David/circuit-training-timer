<script setup>
import { Icon } from '@iconify/vue'

defineProps({
  totalElapsed: Number,
  rounds: Number,
  exerciseCount: Number,
  fmt: Function,
})

defineEmits(['restart'])
</script>

<template>
  <div class="summary-screen">
    <Icon icon="mdi:party-popper" width="52" height="52" style="color:var(--accent);margin-bottom:8px" />
    <h2>训练完成！</h2>
    <div class="stat">
      总用时 {{ fmt(totalElapsed) }} · {{ rounds }} 轮 · {{ exerciseCount }} 个动作
    </div>
    <button class="btn btn-ghost" style="margin-top:18px" @click="$emit('restart')">
      <Icon icon="mdi:refresh" />再来一轮
    </button>
  </div>
</template>
