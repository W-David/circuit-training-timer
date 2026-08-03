<script setup>
import { Icon } from '@iconify/vue'
import { reactive, ref, watch, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import NumInput from './NumInput.vue'
import { useEscClose } from '../composables/useEscClose.js'
import { usePresets } from '../composables/usePresets.js'
import { useToast } from '../composables/useToast.js'
import { useActions } from '../composables/useActions.js'
import defaults from '../data/defaults.json'
import {
  PRESET_ICONS,
  normalizePreset,
  cloneConfig,
} from '../utils/presetFormat.js'
import { BTN_GHOST, BTN_PRIMARY, BTN_SM, CARD } from '../utils/twClasses.js'

const actions = useActions()
const presets = usePresets()
const { toast } = useToast()
const route = useRoute()
const router = useRouter()

const importInput = ref(null)
const editKey = ref(null)
const dragFrom = ref(-1)
const showExportModal = ref(false)
const exportName = ref('')
const exportInput = ref(null)

useEscClose(showExportModal)

// 编辑页工具类（替代 main.css 中 .edit-*/ex-row/toggle/icon-pick 系列）
const labelCls = 'text-[0.82rem] opacity-[0.6]'
const iconPickCls = [
  'size-10',
  'rounded-[10px]',
  'border',
  'border-line',
  'bg-surface-2',
  'text-ink-2',
  'cursor-pointer',
  'inline-flex',
  'items-center',
  'justify-center',
  'text-[1.25rem]',
  'transition-all',
  'duration-150',
  'hover:border-accent',
  'hover:text-ink',
].join(' ')
const iconPickOnCls = [
  'border-[rgba(124,111,247,0.75)]!',
  'bg-[image:linear-gradient(180deg,rgba(124,111,247,0.28),rgba(124,111,247,0.1))]!',
  'text-accent-2!',
  'shadow-[0_0_0_1px_rgba(124,111,247,0.25),0_4px_12px_-4px_rgba(124,111,247,0.5)]!',
].join(' ')
const trackCls = [
  'relative',
  'w-[38px]',
  'h-[21px]',
  'rounded-[11px]',
  'bg-line',
  'transition-colors',
  'duration-[250ms]',
  'shrink-0',
  "after:content-['']",
  'after:absolute',
  'after:top-0.5',
  'after:left-0.5',
  'after:size-[17px]',
  'after:rounded-full',
  'after:bg-white',
  'after:transition-transform',
  'after:duration-[250ms]',
].join(' ')
const trackOnCls = 'bg-accent! after:translate-x-[17px]!'
const exRowCls = [
  'flex',
  'items-center',
  'gap-2',
  'px-1.5',
  'py-2',
  'border-b',
  'border-line',
  'rounded-[10px]',
  '-mx-1.5',
  'transition-colors',
  'duration-150',
  'hover:bg-[rgba(255,255,255,0.03)]',
  'last:border-b-0',
  'max-[480px]:flex-wrap',
].join(' ')
const dragHandleCls =
  'opacity-[0.35] text-[1rem] shrink-0 cursor-grab inline-flex touch-none active:cursor-grabbing'
const exMoveCls = 'inline-flex flex-col shrink-0 opacity-[0.35] min-[481px]:hidden'
const moveBtnCls =
  'bg-transparent border-none text-ink-2 cursor-pointer text-[0.9rem] p-0 px-0.5 rounded-[4px] opacity-80 transition-all duration-200 hover:opacity-100'
const delBtnCls =
  'bg-transparent border-none text-danger cursor-pointer text-[1rem] p-1 rounded-[4px] opacity-50 transition-all duration-200 hover:opacity-100'
const nameInputCls =
  'flex-1 min-w-0 max-[480px]:flex-[1_1_100%] max-[480px]:min-w-full'
const timeLabelCls = 'text-[0.7rem] opacity-50 font-semibold shrink-0 w-7 text-center'

const draft = reactive({
  name: '',
  icon: 'mdi:tune-variant',
  exercises: [],
  rounds: defaults.rounds,
  restBetweenRounds: defaults.restBetweenRounds,
  warmupEnabled: defaults.warmupEnabled,
  warmupSeconds: defaults.warmupSeconds,
})

function emptyDraft() {
  return normalizePreset({
    name: '',
    icon: 'mdi:tune-variant',
    exercises: JSON.parse(JSON.stringify(defaults.exercises)),
    rounds: defaults.rounds,
    restBetweenRounds: defaults.restBetweenRounds,
    warmupEnabled: defaults.warmupEnabled,
    warmupSeconds: defaults.warmupSeconds,
  }, { newExercise: defaults.newExercise })
}

function applyToDraft(cfg) {
  const n = normalizePreset(cfg, { newExercise: defaults.newExercise })
  draft.name = n.name
  draft.icon = n.icon
  draft.exercises = n.exercises.map((e) => ({ ...e }))
  draft.rounds = n.rounds
  draft.restBetweenRounds = n.restBetweenRounds
  draft.warmupEnabled = n.warmupEnabled
  draft.warmupSeconds = n.warmupSeconds
}

function draftPayload() {
  return cloneConfig(draft)
}

function persistNewDraft() {
  if (editKey.value) return
  presets.saveDraft(draftPayload())
}

function init() {
  const key = route.params.key || null
  const p = key ? presets.customPresets[key] : null
  if (key && !p) {
    router.replace('/')
    return
  }
  editKey.value = key

  if (p) {
    applyToDraft(p)
    return
  }

  // 新建：恢复未保存草稿，否则默认模板
  const saved = presets.loadDraft()
  if (saved) applyToDraft(saved)
  else applyToDraft(emptyDraft())
}

watch(() => route.fullPath, init, { immediate: true })

watch(
  draft,
  () => {
    persistNewDraft()
  },
  { deep: true },
)

function addExercise() {
  draft.exercises.push({
    name: '',
    work: defaults.newExercise.work,
    rest: defaults.newExercise.rest,
  })
}

function removeExercise(i) {
  draft.exercises.splice(i, 1)
}

function onDragStart(i, e) {
  dragFrom.value = i
  e.dataTransfer.effectAllowed = 'move'
  e.dataTransfer.setData('text/plain', String(i))
}

function onDragOver(e) {
  e.preventDefault()
  e.dataTransfer.dropEffect = 'move'
}

function onDrop(i, e) {
  e.preventDefault()
  const from = dragFrom.value
  dragFrom.value = -1
  if (from < 0 || from === i) return
  const item = draft.exercises.splice(from, 1)[0]
  draft.exercises.splice(i, 0, item)
}

function onDragEnd() {
  dragFrom.value = -1
}

function moveExercise(i, dir) {
  const j = i + dir
  if (j < 0 || j >= draft.exercises.length) return
  const [item] = draft.exercises.splice(i, 1)
  draft.exercises.splice(j, 0, item)
}

function handleImport(e) {
  const file = e.target.files[0]
  if (!file) return
  const reader = new FileReader()
  reader.onload = (ev) => {
    try {
      const raw = JSON.parse(ev.target.result)
      const result = actions.importPreset(raw)
      if (!result.ok) throw new Error(result.error)
      // 导入会覆盖内容与名称（含 name 字段）
      applyToDraft(result.data)
    } catch (err) {
      toast('导入失败：' + (err.message || '未知错误'))
    }
  }
  reader.readAsText(file)
  e.target.value = ''
}

function doSave() {
  const n = draft.name.trim()
  if (!n) {
    toast('请先填写预设名称')
    return
  }
  actions.savePreset(n, draftPayload(), editKey.value || undefined)
  if (!editKey.value) presets.clearDraft()
}

function openExport() {
  exportName.value = draft.name.trim()
  showExportModal.value = true
  nextTick(() => {
    exportInput.value?.focus()
    exportInput.value?.select()
  })
}

function confirmExport() {
  const n = exportName.value.trim()
  if (!n) {
    toast('请填写导出名称')
    return
  }
  draft.name = n
  showExportModal.value = false
  actions.exportPreset(n, draftPayload())
}

function startNow() {
  if (!draft.exercises.length) {
    toast('请先添加动作')
    return
  }
  actions.startConfig(draftPayload())
}
</script>

<template>
  <div>
    <button
      type="button"
      class="inline-flex items-center gap-1 bg-transparent border-none text-ink-2 cursor-pointer text-[0.82rem] font-semibold p-0 mb-3.5 font-[inherit] transition-colors duration-200 hover:text-accent-2"
      @click="router.push(editKey ? '/preset/' + editKey : '/')"
    >
      <Icon icon="mdi:arrow-left" />预设详情
    </button>

    <div :class="[CARD, 'p-4!']">
      <div class="flex items-center gap-2.5 max-[480px]:flex-wrap">
        <div
          class="size-10 rounded-[12px] shrink-0 bg-[image:var(--grad-main)] bg-accent inline-flex items-center justify-center text-white text-[1.2rem] shadow-[0_8px_20px_-6px_rgba(124,111,247,0.65),inset_0_1px_0_rgba(255,255,255,0.3)]"
          aria-hidden="true"
        >
          <Icon :icon="draft.icon || 'mdi:tune-variant'" />
        </div>
        <input
          id="preset-name-input"
          v-model="draft.name"
          type="text"
          class="flex-[1_1_auto] min-w-0 h-10! box-border text-[0.95rem]! font-bold! leading-[1.2]! px-3! py-0! bg-surface-2! border! border-line! rounded-[10px]! text-ink! font-[inherit] focus:border-accent! focus:shadow-[0_0_0_3px_rgba(124,111,247,0.18)]! placeholder:font-semibold placeholder:opacity-40 max-[480px]:flex-[1_1_calc(100%_-_2.5rem_-_10px)]"
          :placeholder="editKey ? '预设名称' : '新预设名称'"
          aria-label="预设名称"
          @focus="$event.target.select()"
        />
        <div class="flex items-center gap-2 shrink-0 max-[480px]:w-full">
          <button
            type="button"
            :class="[BTN_GHOST, 'h-10', 'min-h-10', 'py-0!', 'px-3!', 'text-[0.82rem]!', 'max-[480px]:flex-1', 'max-[480px]:justify-center']"
            @click="openExport"
          >
            <Icon icon="mdi:upload" />导出
          </button>
          <button
            type="button"
            :class="[BTN_GHOST, 'h-10', 'min-h-10', 'py-0!', 'px-3!', 'text-[0.82rem]!', 'max-[480px]:flex-1', 'max-[480px]:justify-center']"
            @click="importInput?.click()"
          >
            <Icon icon="mdi:download" />导入
          </button>
          <input
            ref="importInput"
            type="file"
            accept=".json,application/json"
            class="hidden"
            @change="handleImport"
          />
        </div>
      </div>
      <div class="mt-3 pt-3 border-t border-line">
        <div class="flex flex-wrap gap-1.5" role="listbox" aria-label="选择图标">
          <button
            v-for="ic in PRESET_ICONS"
            :key="ic"
            type="button"
            :class="[iconPickCls, draft.icon === ic ? iconPickOnCls : '']"
            :aria-selected="draft.icon === ic"
            :title="ic"
            @click="draft.icon = ic"
          >
            <Icon :icon="ic" />
          </button>
        </div>
      </div>
    </div>

    <!-- 热身 -->
    <div :class="CARD">
      <div class="text-[0.7rem] uppercase tracking-[0.08em] text-ink-2 font-bold mb-3.5 flex items-center gap-2"><Icon icon="mdi:fire" />热身</div>
      <button
        type="button"
        class="flex items-center gap-2 cursor-pointer select-none bg-transparent border-none text-inherit font-[inherit] p-0 w-full text-left"
        role="switch"
        :aria-checked="draft.warmupEnabled"
        @click="draft.warmupEnabled = !draft.warmupEnabled"
      >
        <span :class="[trackCls, draft.warmupEnabled ? trackOnCls : '']" aria-hidden="true"></span>
        <span :class="labelCls">
          训练前热身{{ draft.warmupEnabled ? ' · ' + draft.warmupSeconds + ' 秒' : '' }}
        </span>
      </button>
      <div v-if="draft.warmupEnabled" class="flex items-center gap-2.5 mt-2.5">
        <span :class="labelCls">热身时长</span>
        <NumInput
          :model-value="draft.warmupSeconds"
          :min="10"
          :max="600"
          unit="秒"
          @update:model-value="draft.warmupSeconds = $event"
        />
      </div>
    </div>

    <!-- 训练动作 -->
    <div :class="CARD">
      <div class="text-[0.7rem] uppercase tracking-[0.08em] text-ink-2 font-bold mb-3.5 flex items-center gap-2">
        <Icon icon="mdi:dumbbell" />训练动作
        <span class="flex-1"></span>
        <button type="button" :class="[BTN_GHOST, BTN_SM]" @click="addExercise">
          <Icon icon="mdi:plus" />添加
        </button>
      </div>
      <div v-if="draft.exercises.length === 0" class="text-center p-6 opacity-[0.4] text-[0.85rem]">
        还没有动作，点击「添加」开始编排
      </div>
      <div
        v-for="(ex, i) in draft.exercises"
        :key="i"
        :class="[exRowCls, dragFrom === i ? 'opacity-[0.45]' : '']"
        draggable="true"
        @dragstart="onDragStart(i, $event)"
        @dragover="onDragOver"
        @drop="onDrop(i, $event)"
        @dragend="onDragEnd"
      >
        <span :class="dragHandleCls" title="拖动排序" aria-hidden="true">
          <Icon icon="mdi:drag" />
        </span>
        <span :class="exMoveCls">
          <button
            type="button"
            :class="moveBtnCls"
            aria-label="上移动作"
            title="上移"
            @click="moveExercise(i, -1)"
          >
            <Icon icon="mdi:chevron-up" />
          </button>
          <button
            type="button"
            :class="moveBtnCls"
            aria-label="下移动作"
            title="下移"
            @click="moveExercise(i, 1)"
          >
            <Icon icon="mdi:chevron-down" />
          </button>
        </span>
        <input
          type="text"
          :class="nameInputCls"
          :value="ex.name"
          :placeholder="'动作' + (i + 1)"
          @input="ex.name = $event.target.value"
          @focus="$event.target.select()"
        />
        <span :class="timeLabelCls">运动</span>
        <NumInput
          :model-value="ex.work"
          :min="1"
          :max="600"
          color="g"
          @update:model-value="ex.work = $event"
        />
        <span :class="timeLabelCls">休息</span>
        <NumInput
          :model-value="ex.rest"
          :min="0"
          :max="600"
          color="o"
          @update:model-value="ex.rest = $event"
        />
        <button
          type="button"
          :class="delBtnCls"
          aria-label="删除动作"
          @click="removeExercise(i)"
        >
          <Icon icon="mdi:trash-can-outline" />
        </button>
      </div>
    </div>

    <div :class="CARD">
      <div class="text-[0.7rem] uppercase tracking-[0.08em] text-ink-2 font-bold mb-3.5 flex items-center gap-2"><Icon icon="mdi:repeat" />循环设置（随预设一起保存）</div>
      <div class="flex items-center gap-2.5 flex-wrap">
        <span :class="labelCls">总轮数</span>
        <NumInput
          :model-value="draft.rounds"
          :min="1"
          :max="99"
          :step="1"
          unit=""
          @update:model-value="draft.rounds = $event"
        />
        <span :class="[labelCls, 'ml-2']">轮间休息</span>
        <NumInput
          :model-value="draft.restBetweenRounds"
          :min="0"
          :max="600"
          unit="秒"
          @update:model-value="draft.restBetweenRounds = $event"
        />
      </div>
    </div>

    <div class="flex gap-2 flex-wrap mt-0.5">
      <button type="button" :class="BTN_PRIMARY" @click="startNow">
        <Icon icon="mdi:play" />开始训练
      </button>
      <button type="button" :class="BTN_GHOST" @click="doSave">
        <Icon icon="mdi:content-save" />{{ editKey ? '保存修改' : '保存为预设' }}
      </button>
    </div>

    <div
      v-if="showExportModal"
      class="fixed inset-0 z-[200] flex items-center justify-center bg-[rgba(5,7,12,0.66)] backdrop-blur-[6px]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="export-title"
      @click.self="showExportModal = false"
    >
      <div class="bg-[linear-gradient(180deg,var(--surface2)_0%,var(--surface)_100%)] border border-line-bright rounded-card p-6 min-w-[300px] max-w-[90vw] shadow-[0_24px_60px_-20px_rgba(0,0,0,0.8),inset_0_1px_0_rgba(255,255,255,0.05)] animate-[modal-in_0.22s_ease]">
        <div id="export-title" class="font-bold mb-2 flex items-center gap-1.5">
          <Icon icon="mdi:upload" /> 导出预设
        </div>
        <p class="text-[0.78rem] opacity-[0.55] mb-3 leading-relaxed">
          将下载为 JSON 文件，文件名：
          <b class="text-accent-2 font-bold">{{ (exportName.trim() || '预设') + '.json' }}</b>
        </p>
        <label :class="[labelCls, 'block', 'mb-1.5']" for="export-name-input">导出名称</label>
        <input
          ref="exportInput"
          id="export-name-input"
          v-model="exportName"
          type="text"
          class="w-full mb-3.5"
          placeholder="预设名称"
          @keyup.enter="confirmExport"
        />
        <div class="flex gap-2 justify-end">
          <button type="button" :class="[BTN_GHOST, BTN_SM]" @click="showExportModal = false">取消</button>
          <button type="button" :class="[BTN_PRIMARY, BTN_SM]" @click="confirmExport">确认导出</button>
        </div>
      </div>
    </div>
  </div>
</template>
