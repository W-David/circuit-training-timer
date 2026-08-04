<script setup>
import { Icon } from '@iconify/vue'
import { computed, nextTick, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useActions } from '../composables/useActions.js'
import { useEscClose } from '../composables/useEscClose.js'
import { usePresets } from '../composables/usePresets.js'
import { useToast } from '../composables/useToast.js'
import { backupFileName } from '../utils/backup.js'
import PresetCard from './PresetCard.vue'

const presets = usePresets()
const actions = useActions()
const { toast } = useToast()
const router = useRouter()

const pendingDelete = ref(null)
const pendingBackup = ref(null)
const confirmBtn = ref(null)
const backupConfirmBtn = ref(null)
const backupInput = ref(null)

useEscClose(pendingDelete)
useEscClose(pendingBackup)

watch(pendingDelete, (v) => {
  if (v) nextTick(() => confirmBtn.value?.focus())
})

watch(pendingBackup, (v) => {
  if (v) nextTick(() => backupConfirmBtn.value?.focus())
})

function handleBackupImport(e) {
  const file = e.target.files[0]
  if (!file) return
  const reader = new FileReader()
  reader.onload = (ev) => {
    try {
      const raw = JSON.parse(ev.target.result)
      const result = actions.importAllPresets(raw)
      if (!result.ok) throw new Error(result.error)
      toast('已导入 ' + result.count + ' 个预设')
    } catch (err) {
      toast('导入失败：' + (err.message || '未知错误'))
    }
  }
  reader.readAsText(file)
  e.target.value = ''
}

const customPresets = computed(() =>
  Object.entries(presets.customPresets).map(([key, p]) => ({
    ...p,
    key,
    kind: 'custom',
    type: 'custom',
  })),
)

function askDelete(p) {
  pendingDelete.value = { key: p.key, name: p.name }
}

function confirmDelete() {
  if (!pendingDelete.value) return
  actions.deletePreset(pendingDelete.value.key)
  pendingDelete.value = null
}

function askBackup() {
  const names = Object.values(presets.customPresets).map((p) => p.name || '未命名')
  if (!names.length) {
    toast('暂无自定义预设')
    return
  }
  pendingBackup.value = { names, filename: backupFileName() }
}

function confirmBackup() {
  if (!pendingBackup.value) return
  actions.exportAllPresets()
  pendingBackup.value = null
}
</script>

<template>
  <div>
    <svg width="0" height="0" style="position:absolute" aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id="preset-icon-grad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#22d3ee" />
          <stop offset="50%" stop-color="#7c6ff7" />
          <stop offset="100%" stop-color="#a855f7" />
        </linearGradient>
      </defs>
    </svg>

    <div class="flex items-center gap-2.5 mb-3">
      <h2
        class="flex items-center gap-1.5 text-[1.05rem] font-extrabold text-ink supports-[(-webkit-background-clip:text)_or_(background-clip:text)]:bg-[linear-gradient(120deg,#fff_10%,var(--accent2)_60%,var(--cyan)_100%)] supports-[(-webkit-background-clip:text)_or_(background-clip:text)]:[-webkit-background-clip:text] supports-[(-webkit-background-clip:text)_or_(background-clip:text)]:bg-clip-text supports-[(-webkit-background-clip:text)_or_(background-clip:text)]:text-transparent"
      >
        <Icon
          icon="mdi:lightning-bolt"
          class="text-accent-2 drop-shadow-[0_0_8px_rgba(124,111,247,0.5)]"
        />循环训练计时器
      </h2>
      <span class="flex-1"></span>
      <button
        type="button"
        class="inline-flex items-center gap-1.25 rounded-control font-semibold font-[inherit] cursor-pointer transition-all duration-200 active:scale-[0.97] border bg-transparent border-line text-ink hover:bg-[rgba(255,255,255,0.04)] hover:border-line-bright px-3 py-1.25 text-[0.78rem]"
        @click="askBackup"
      >
        <Icon icon="mdi:export" />保存备份
      </button>
      <button
        type="button"
        class="inline-flex items-center gap-1.25 rounded-control font-semibold font-[inherit] cursor-pointer transition-all duration-200 active:scale-[0.97] border bg-transparent border-line text-ink hover:bg-[rgba(255,255,255,0.04)] hover:border-line-bright px-3 py-1.25 text-[0.78rem]"
        @click="backupInput?.click()"
      >
        <Icon icon="mdi:import" />加载备份
      </button>
      <input
        ref="backupInput"
        type="file"
        accept=".json,application/json"
        class="hidden"
        @change="handleBackupImport"
      />
    </div>

    <div class="mb-5 last:mb-0">
      <div class="text-[0.72rem] font-bold tracking-[0.06em] uppercase text-ink-2 mb-2.5">系统预设</div>
      <div v-if="presets.builtinPresets.length" class="grid grid-cols-3 gap-2.5 max-[480px]:grid-cols-2">
        <PresetCard
          v-for="p in presets.builtinPresets"
          :key="p.key"
          :preset="p"
        />
      </div>
      <div v-else class="text-center p-6 opacity-[0.4] text-[0.85rem]">暂无系统预设</div>
    </div>

    <div class="mb-5 last:mb-0">
      <div class="text-[0.72rem] font-bold tracking-[0.06em] uppercase text-ink-2 mb-2.5">我的预设</div>
      <div class="grid grid-cols-3 gap-2.5 max-[480px]:grid-cols-2">
        <PresetCard
          v-for="p in customPresets"
          :key="p.key"
          :preset="p"
          show-delete
          @delete="askDelete(p)"
        />

        <div
          class="relative overflow-hidden flex flex-col gap-0.75 bg-[linear-gradient(135deg,#2b3452_0%,#1a2136_45%,#0c0f1a_100%)] border border-line rounded-card pt-5.5 px-4 cursor-pointer font-[inherit] transition-[transform,border-color,box-shadow] duration-200 group hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.05),0_16px_32px_-14px_rgba(0,0,0,0.75),0_0_0_1px_rgba(124,111,247,0.12)] max-[480px]:px-3 max-[480px]:pt-3 max-[480px]:pb-2.5 border-dashed items-center justify-center text-center text-ink-2 shadow-none pb-5.5 hover:text-ink hover:border-transparent hover:translate-y-0 hover:[background:linear-gradient(var(--surface),var(--surface))_padding-box,var(--grad-main)_border-box]"
          role="button"
          tabindex="0"
          @click="router.push('/new')"
          @keydown.enter="router.push('/new')"
        >
          <div class="relative flex items-center gap-0.75 mb-1 text-[1rem] font-extrabold">新建预设</div>
          <div class="relative text-[0.7rem] opacity-[0.6] text-shadow-[0_1px_4px_rgba(0,0,0,0.5)] pr-0">定制你的训练</div>
        </div>
      </div>
    </div>

    <div
      v-if="pendingDelete"
      class="fixed inset-0 z-200 flex items-center justify-center bg-[rgba(5,7,12,0.66)] backdrop-blur-[6px]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="del-title"
      @click.self="pendingDelete = null"
    >
      <div class="bg-[linear-gradient(180deg,var(--surface2)_0%,var(--surface)_100%)] border border-line-bright rounded-card p-6 min-w-75 max-w-[90vw] shadow-[0_24px_60px_-20px_rgba(0,0,0,0.8),inset_0_1px_0_rgba(255,255,255,0.05)] animate-[modal-in_0.22s_ease]">
        <div id="del-title" class="font-bold mb-2 flex items-center gap-1.5">
          <Icon icon="mdi:delete-alert" /> 删除预设
        </div>
        <p class="text-[0.78rem] opacity-[0.55] mb-3 leading-relaxed">确定删除「{{ pendingDelete.name }}」？此操作不可撤销。</p>
        <div class="flex gap-2 justify-end">
          <button
            type="button"
            class="inline-flex items-center gap-1.25 rounded-control font-semibold font-[inherit] cursor-pointer transition-all duration-200 active:scale-[0.97] border bg-transparent border-line text-ink hover:bg-[rgba(255,255,255,0.04)] hover:border-line-bright px-3 py-1.25 text-[0.78rem]"
            @click="pendingDelete = null"
          >取消</button>
          <button
            ref="confirmBtn"
            type="button"
            class="inline-flex items-center gap-1.25 rounded-control font-semibold font-[inherit] cursor-pointer transition-all duration-200 active:scale-[0.97] border-none bg-danger bg-[linear-gradient(135deg,#f87171,#dc2626)] text-white shadow-[0_8px_20px_-8px_rgba(239,68,68,0.55),inset_0_1px_0_rgba(255,255,255,0.22)] hover:brightness-[1.08] px-3 py-1.25 text-[0.78rem]"
            @click="confirmDelete"
          >删除</button>
        </div>
      </div>
    </div>

    <div
      v-if="pendingBackup"
      class="fixed inset-0 z-200 flex items-center justify-center bg-[rgba(5,7,12,0.66)] backdrop-blur-[6px]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="backup-title"
      @click.self="pendingBackup = null"
    >
      <div class="bg-[linear-gradient(180deg,var(--surface2)_0%,var(--surface)_100%)] border border-line-bright rounded-card p-6 min-w-75 max-w-[90vw] shadow-[0_24px_60px_-20px_rgba(0,0,0,0.8),inset_0_1px_0_rgba(255,255,255,0.05)] animate-[modal-in_0.22s_ease]">
        <div id="backup-title" class="font-bold mb-2 flex items-center gap-1.5">
          <Icon icon="mdi:export" /> 保存备份
        </div>
        <p class="text-[0.78rem] opacity-[0.55] mb-3 leading-relaxed">将保存以下 {{ pendingBackup.names.length }} 个预设：</p>
        <ul class="list-none m-0 mb-3 px-2.5 py-2 max-h-45 overflow-y-auto bg-[rgba(255,255,255,0.04)] border border-line rounded-lg grid gap-1 text-[0.82rem]">
          <li v-for="(name, i) in pendingBackup.names" :key="i">{{ name }}</li>
        </ul>
        <p class="text-[0.78rem] opacity-[0.55] mb-3 leading-relaxed">
          文件名：<b class="text-accent-2 font-bold">{{ pendingBackup.filename }}</b>
        </p>
        <div class="flex gap-2 justify-end">
          <button
            type="button"
            class="inline-flex items-center gap-1.25 rounded-control font-semibold font-[inherit] cursor-pointer transition-all duration-200 active:scale-[0.97] border bg-transparent border-line text-ink hover:bg-[rgba(255,255,255,0.04)] hover:border-line-bright px-3 py-1.25 text-[0.78rem]"
            @click="pendingBackup = null"
          >取消</button>
          <button
            ref="backupConfirmBtn"
            type="button"
            class="inline-flex items-center gap-1.25 rounded-control font-semibold font-[inherit] cursor-pointer transition-all duration-200 active:scale-[0.97] border-none bg-accent bg-(image:--grad-main) text-white shadow-[var(--glow-main),inset_0_1px_0_rgba(255,255,255,0.22)] hover:brightness-110 px-3 py-1.25 text-[0.78rem]"
            @click="confirmBackup"
          >
            保存备份
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
