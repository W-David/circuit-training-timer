<script setup>
import { Icon } from '@iconify/vue'
import { computed, nextTick, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useActions } from '../composables/useActions.js'
import { useEscClose } from '../composables/useEscClose.js'
import { usePresets } from '../composables/usePresets.js'
import { fmtMin, presetTotalSec } from '../utils/presetFormat.js'

const route = useRoute()
const router = useRouter()
const presets = usePresets()
const actions = useActions()

const showForkModal = ref(false)
const forkName = ref('')
const forkInput = ref(null)

useEscClose(showForkModal)

const preset = computed(() => {
  const b = presets.builtinPresets.find((p) => p.key === route.params.key)
  if (b) return { ...b, kind: 'builtin' }
  const c = presets.customPresets[route.params.key]
  if (c) return { ...c, key: route.params.key, kind: 'custom' }
  return null
})

async function openFork() {
  if (!preset.value) return
  forkName.value = (preset.value.name || '预设') + ' 副本'
  showForkModal.value = true
  await nextTick()
  forkInput.value?.focus()
  forkInput.value?.select()
}

function confirmFork() {
  const n = forkName.value.trim()
  if (!n || !preset.value) return
  showForkModal.value = false
  actions.forkPreset(preset.value.key, n)
}
</script>

<template>
  <div>
    <button
      type="button"
      class="inline-flex items-center gap-1 bg-transparent border-none text-ink-2 cursor-pointer text-[0.82rem] font-semibold p-0 mb-3.5 font-[inherit] transition-colors duration-200 hover:text-accent-2"
      @click="router.push('/')"
    >
      <Icon icon="mdi:arrow-left" />返回首页
    </button>

    <section v-if="preset" class="bg-surface border border-line rounded-card p-4 mb-4.5">
      <div class="flex items-center gap-3 mb-3.5 flex-wrap">
        <div class="size-10 rounded-xl shrink-0 bg-(image:--grad-main) bg-accent inline-flex items-center justify-center text-white text-[1.2rem] shadow-[0_8px_20px_-6px_rgba(124,111,247,0.65),inset_0_1px_0_rgba(255,255,255,0.3)]">
          <Icon :icon="preset.icon || 'mdi:tune-variant'" />
        </div>
        <div class="flex-1 min-w-0">
          <div class="text-[1.15rem] font-extrabold tracking-[-0.01em]">
            {{ preset.name }}
          </div>
          <div class="flex flex-wrap gap-x-2.5 gap-y-1 mt-1 text-[0.72rem] opacity-[0.55]">
            <span>{{ preset.exercises.length }} 个动作</span>
            <span>{{ preset.rounds }} 轮</span>
            <span v-if="preset.restBetweenRounds > 0">轮间休息 {{ preset.restBetweenRounds }} 秒</span>
            <span v-if="preset.warmupEnabled">热身 {{ preset.warmupSeconds }} 秒</span>
            <span>约 {{ fmtMin(presetTotalSec(preset)) }}</span>
          </div>
        </div>
        <div class="flex gap-1.5 flex-wrap">
          <button
            v-if="preset.kind === 'custom'"
            type="button"
            class="inline-flex items-center gap-[5px] px-4 py-2 rounded-control text-[0.85rem] font-semibold font-[inherit] cursor-pointer transition-all duration-200 active:scale-[0.97] border! bg-transparent border-line text-ink hover:bg-[rgba(255,255,255,0.04)] hover:border-line-bright px-3! py-[5px]! text-[0.78rem]!"
            @click="router.push('/edit/' + preset.key)"
          >
            <Icon icon="mdi:pencil" />编辑
          </button>
          <button
            type="button"
            class="inline-flex items-center gap-[5px] px-4 py-2 rounded-control text-[0.85rem] font-semibold font-[inherit] cursor-pointer transition-all duration-200 active:scale-[0.97] border! bg-transparent border-line text-ink hover:bg-[rgba(255,255,255,0.04)] hover:border-line-bright px-3! py-[5px]! text-[0.78rem]!"
            @click="openFork"
          >
            <Icon icon="mdi:content-copy" />另存为
          </button>
        </div>
      </div>

      <div class="flex flex-col gap-0.5 mt-0.5 mb-1">
        <div
          v-if="preset.warmupEnabled"
          class="flex items-center gap-2 px-2 py-1.25 rounded-lg text-[0.82rem] odd:bg-[linear-gradient(90deg,rgba(255,255,255,0.045),rgba(255,255,255,0.012))]"
        >
          <span class="size-4.5 rounded-full bg-accent! text-white! text-[0.65rem] inline-flex items-center justify-center shrink-0">热</span>
          <span class="flex-1 min-w-0 overflow-hidden text-ellipsis whitespace-nowrap font-semibold">热身</span>
          <span class="shrink-0 tabular-nums text-[0.75rem] opacity-[0.75]">
            <b class="text-accent-2">{{ preset.warmupSeconds }}s</b>
          </span>
        </div>
        <div
          v-for="(ex, i) in preset.exercises"
          :key="i"
          class="flex items-center gap-2 px-2 py-1.25 rounded-lg text-[0.82rem] odd:bg-[linear-gradient(90deg,rgba(255,255,255,0.045),rgba(255,255,255,0.012))]"
        >
          <span class="size-4.5 rounded-full bg-surface-2 text-ink-2 text-[0.65rem] inline-flex items-center justify-center shrink-0">{{ i + 1 }}</span>
          <span class="flex-1 min-w-0 overflow-hidden text-ellipsis whitespace-nowrap font-semibold">{{ ex.name || '动作' + (i + 1) }}</span>
          <span class="shrink-0 tabular-nums text-[0.75rem] opacity-[0.75]">
            <b class="text-work">{{ ex.work }}s</b>
            <span class="opacity-[0.45]"> / </span>
            <span>{{ ex.rest }}s</span>
          </span>
        </div>
      </div>

      <button
        type="button"
        class="inline-flex items-center gap-[5px] px-4 py-2 rounded-control text-[0.85rem] font-semibold font-[inherit] cursor-pointer transition-all duration-200 active:scale-[0.97] border-none bg-accent bg-[image:var(--grad-main)] text-white shadow-[var(--glow-main),inset_0_1px_0_rgba(255,255,255,0.22)] hover:brightness-110 px-8! py-[14px]! text-[1rem]! rounded-card! flex! w-full justify-center mt-3.5"
        @click="actions.startPreset(preset.key)"
      >
        <Icon icon="mdi:play" />开始训练
      </button>
    </section>

    <div class="bg-[linear-gradient(180deg,var(--surface2)_0%,var(--surface)_100%)] border border-line rounded-card p-[18px] mb-3.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.035)] text-center p-8! opacity-[0.5]">
      预设不存在或已被删除
    </div>

    <div
      v-if="showForkModal"
      class="fixed inset-0 z-200 flex items-center justify-center bg-[rgba(5,7,12,0.66)] backdrop-blur-[6px]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="fork-title"
      @click.self="showForkModal = false"
    >
      <div class="bg-[linear-gradient(180deg,var(--surface2)_0%,var(--surface)_100%)] border border-line-bright rounded-card p-6 min-w-75 max-w-[90vw] shadow-[0_24px_60px_-20px_rgba(0,0,0,0.8),inset_0_1px_0_rgba(255,255,255,0.05)] animate-[modal-in_0.22s_ease]">
        <div id="fork-title" class="font-bold mb-2 flex items-center gap-1.5">
          <Icon icon="mdi:content-copy" /> 另存为新预设
        </div>
        <p class="text-[0.78rem] opacity-[0.55] mb-3 leading-relaxed">
          复制「{{ preset?.name }}」到「我的预设」，原预设不会被修改。
        </p>
        <input
          ref="forkInput"
          v-model="forkName"
          type="text"
          class="w-full mb-3.5"
          placeholder="新预设名称"
          @keyup.enter="confirmFork"
        />
        <div class="flex gap-2 justify-end">
          <button
            type="button"
            class="inline-flex items-center gap-[5px] px-4 py-2 rounded-control text-[0.85rem] font-semibold font-[inherit] cursor-pointer transition-all duration-200 active:scale-[0.97] border! bg-transparent border-line text-ink hover:bg-[rgba(255,255,255,0.04)] hover:border-line-bright px-3! py-[5px]! text-[0.78rem]!"
            @click="showForkModal = false"
          >取消</button>
          <button
            type="button"
            class="inline-flex items-center gap-[5px] px-4 py-2 rounded-control text-[0.85rem] font-semibold font-[inherit] cursor-pointer transition-all duration-200 active:scale-[0.97] border-none bg-accent bg-[image:var(--grad-main)] text-white shadow-[var(--glow-main),inset_0_1px_0_rgba(255,255,255,0.22)] hover:brightness-110 px-3! py-[5px]! text-[0.78rem]!"
            @click="confirmFork"
          >保存副本</button>
        </div>
      </div>
    </div>
  </div>
</template>
