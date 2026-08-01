<script setup>
import { Icon } from '@iconify/vue'

defineProps({
  totalElapsed: Number,
  rounds: Number,
  exerciseCount: Number,
  fmt: Function,
})

defineEmits(['restart', 'home'])
</script>

<template>
  <div class="summary-screen">
    <Icon icon="mdi:party-popper" width="52" height="52" class="summary-icon" />
    <h2>训练完成！</h2>
    <div class="stat">
      总用时 {{ fmt(totalElapsed) }} · {{ rounds }} 轮 · {{ exerciseCount }} 个动作
    </div>
    <div class="summary-actions">
      <button class="btn btn-primary" @click="$emit('restart')">
        <Icon icon="mdi:refresh" />再来一轮
      </button>
      <button class="btn btn-ghost" @click="$emit('home')">
        <Icon icon="mdi:home" />返回首页
      </button>
    </div>
  </div>
</template>
