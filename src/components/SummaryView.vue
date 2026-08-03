<script setup>
import { Icon } from '@iconify/vue';

defineProps({
  totalElapsed: Number,
  rounds: Number,
  exerciseCount: Number,
  fmt: Function,
})

defineEmits(['restart', 'home'])
</script>

<template>
  <div class="text-center py-10">
    <Icon
      icon="mdi:party-popper"
      width="52"
      height="52"
      class="text-accent-2 mb-2 drop-shadow-[0_0_16px_rgba(124,111,247,0.55)]"
    />
    <h2 class="text-[1.3rem] mb-1 font-bold">训练完成！</h2>
    <div class="text-[0.85rem] opacity-[0.5] mt-1">
      总用时 {{ fmt(totalElapsed) }} · {{ rounds }} 轮 · {{ exerciseCount }} 个动作
    </div>
    <div class="flex gap-2.5 justify-center flex-wrap mt-4.5">
      <button
        class="inline-flex items-center gap-1.25 px-4 py-2 rounded-control text-[0.85rem] font-semibold font-[inherit] cursor-pointer transition-all duration-200 active:scale-[0.97] border-none bg-accent bg-(image:--grad-main) text-white shadow-[var(--glow-main),inset_0_1px_0_rgba(255,255,255,0.22)] hover:brightness-110"
        @click="$emit('restart')"
      >
        <Icon icon="mdi:refresh" />再来一轮
      </button>
      <button
        class="inline-flex items-center gap-1.25 px-4 py-2 rounded-control text-[0.85rem] font-semibold font-[inherit] cursor-pointer transition-all duration-200 active:scale-[0.97] border bg-transparent border-line text-ink hover:bg-[rgba(255,255,255,0.04)] hover:border-line-bright"
        @click="$emit('home')"
      >
        <Icon icon="mdi:home" />返回首页
      </button>
    </div>
  </div>
</template>
