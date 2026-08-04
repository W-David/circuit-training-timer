<script setup>
import { Icon } from '@iconify/vue'
import { useRouter } from 'vue-router'
import { fmtMin, presetTotalSec } from '../utils/presetFormat.js'

const props = defineProps({
  preset: { type: Object, required: true },
  showDelete: { type: Boolean, default: false },
})
const emit = defineEmits(['delete'])
const router = useRouter()

function open() {
  router.push({
    name: 'preset-detail',
    params: { type: props.preset.type === 'custom' ? 'custom' : 'builtin', key: props.preset.key },
  })
}
</script>

<template>
  <div
    class="relative overflow-hidden flex flex-col gap-1 bg-[linear-gradient(135deg,#2b3452_0%,#1a2136_45%,#0c0f1a_100%)] border border-line rounded-card pt-5 px-4 pb-10 cursor-pointer text-left font-[inherit] text-ink shadow-[inset_0_1px_0_rgba(255,255,255,0.04),0_8px_20px_-12px_rgba(0,0,0,0.6)] transition-[transform,border-color,box-shadow] duration-300 hover:-translate-y-0.75 hover:border-[rgba(124,111,247,0.55)] hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.05),0_16px_32px_-14px_rgba(0,0,0,0.75),0_0_0_1px_rgba(124,111,247,0.12)]"
    role="button"
    tabindex="0"
    @click="open"
    @keydown.enter="open"
  >
    <Icon
      :icon="preset.icon || 'mdi:tune-variant'"
      class="absolute right-4 top-1/2 -translate-y-1/2 size-10 text-accent-2 opacity-[0.35] drop-shadow-[0_0_8px_rgba(124,111,247,0.6)] pointer-events-none transition-[opacity,filter] duration-250 group-hover:opacity-[0.55] group-hover:drop-shadow-[0_0_10px_rgba(124,111,247,0.75)] group-hover:[&_path]:fill-[url(#preset-icon-grad)]"
    />
    <button
      v-if="showDelete"
      type="button"
      class="absolute top-1.5 right-1.5 text-[1.05rem] leading-none text-ink-2 opacity-[0.35] p-0.5 rounded-md inline-flex bg-transparent border-none cursor-pointer font-[inherit] z-1 hover:opacity-100 hover:text-danger"
      title="删除此预设"
      aria-label="删除预设"
      @click.stop="emit('delete')"
    >
      <Icon icon="mdi:close-circle" />
    </button>
    <div class="relative flex items-center gap-0.75 mb-1 text-[1rem] font-extrabold">{{ preset.name }}</div>
    <div class="relative text-[0.7rem] opacity-[0.6] text-shadow-[0_1px_4px_rgba(0,0,0,0.5)] pr-16">
      {{ preset.exercises.length }} 个动作 · {{ preset.rounds }} 轮
    </div>
    <div class="absolute left-3 bottom-2 z-1 text-[0.64rem] font-bold tracking-[0.02em] text-ink opacity-[0.9] py-0.5 px-2 rounded-full bg-[rgba(0,0,0,0.15)] border border-[rgba(255,255,255,0.07)] shadow-[0_2px_6px_rgba(0,0,0,0.2)] pointer-events-none">
      {{ fmtMin(presetTotalSec(preset)) }}
    </div>
  </div>
</template>
