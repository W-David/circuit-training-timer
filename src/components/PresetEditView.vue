<script setup>
import { Icon } from '@iconify/vue'
import { reactive, ref, inject, watch, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import NumInput from './NumInput.vue'
import { useEscClose } from '../composables/useEscClose.js'
import defaults from '../data/defaults.json'
import {
  PRESET_ICONS,
  normalizePreset,
  cloneConfig,
} from '../utils/presetFormat.js'

const actions = inject('actions')
const presets = inject('presets')
const toast = inject('toast', () => {})
const route = useRoute()
const router = useRouter()

const importInput = ref(null)
const editKey = ref(null)
const dragFrom = ref(-1)
const showExportModal = ref(false)
const exportName = ref('')
const exportInput = ref(null)

useEscClose(showExportModal)

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
    toast('请先填写方案名称')
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
  <div class="edit-page">
    <button
      type="button"
      class="back-link"
      @click="router.push(editKey ? '/preset/' + editKey : '/')"
    >
      <Icon icon="mdi:arrow-left" />预设方案
    </button>

    <div class="card edit-identity">
      <div class="edit-identity-main">
        <div class="detail-icon edit-identity-icon" aria-hidden="true">
          <Icon :icon="draft.icon || 'mdi:tune-variant'" />
        </div>
        <input
          id="preset-name-input"
          v-model="draft.name"
          type="text"
          class="edit-title-input"
          :placeholder="editKey ? '方案名称' : '新方案名称'"
          aria-label="方案名称"
          @focus="$event.target.select()"
        />
        <div class="edit-identity-actions">
          <button type="button" class="btn btn-ghost edit-id-btn" @click="openExport">
            <Icon icon="mdi:upload" />导出
          </button>
          <button type="button" class="btn btn-ghost edit-id-btn" @click="importInput?.click()">
            <Icon icon="mdi:download" />导入
          </button>
          <input
            ref="importInput"
            type="file"
            accept=".json,application/json"
            class="hidden-input"
            @change="handleImport"
          />
        </div>
      </div>
      <div class="edit-identity-icons">
        <div class="icon-picker" role="listbox" aria-label="选择图标">
          <button
            v-for="ic in PRESET_ICONS"
            :key="ic"
            type="button"
            class="icon-pick"
            :class="{ on: draft.icon === ic }"
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
    <div class="card">
      <div class="card-title"><Icon icon="mdi:fire" />热身</div>
      <button
        type="button"
        class="toggle-row"
        role="switch"
        :aria-checked="draft.warmupEnabled"
        @click="draft.warmupEnabled = !draft.warmupEnabled"
      >
        <span class="toggle-track" :class="{ on: draft.warmupEnabled }" aria-hidden="true"></span>
        <span class="toggle-label">
          训练前热身{{ draft.warmupEnabled ? ' · ' + draft.warmupSeconds + ' 秒' : '' }}
        </span>
      </button>
      <div v-if="draft.warmupEnabled" class="inline-field">
        <span class="field-label">热身时长</span>
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
    <div class="card">
      <div class="card-title">
        <Icon icon="mdi:dumbbell" />训练动作
        <span class="spacer"></span>
        <button type="button" class="btn btn-ghost btn-sm" @click="addExercise">
          <Icon icon="mdi:plus" />添加
        </button>
      </div>
      <div v-if="draft.exercises.length === 0" class="empty-hint">
        还没有动作，点击「添加」开始编排
      </div>
      <div
        v-for="(ex, i) in draft.exercises"
        :key="i"
        class="ex-row"
        :class="{ dragging: dragFrom === i }"
        draggable="true"
        @dragstart="onDragStart(i, $event)"
        @dragover="onDragOver"
        @drop="onDrop(i, $event)"
        @dragend="onDragEnd"
      >
        <span class="drag-handle" title="拖动排序" aria-hidden="true">
          <Icon icon="mdi:drag" />
        </span>
        <span class="ex-move">
          <button
            type="button"
            class="btn-icon"
            aria-label="上移动作"
            title="上移"
            @click="moveExercise(i, -1)"
          >
            <Icon icon="mdi:chevron-up" />
          </button>
          <button
            type="button"
            class="btn-icon"
            aria-label="下移动作"
            title="下移"
            @click="moveExercise(i, 1)"
          >
            <Icon icon="mdi:chevron-down" />
          </button>
        </span>
        <input
          type="text"
          class="name-input"
          :value="ex.name"
          :placeholder="'动作' + (i + 1)"
          @input="ex.name = $event.target.value"
          @focus="$event.target.select()"
        />
        <span class="time-label">运动</span>
        <NumInput
          :model-value="ex.work"
          :min="1"
          :max="600"
          color="g"
          @update:model-value="ex.work = $event"
        />
        <span class="time-label">休息</span>
        <NumInput
          :model-value="ex.rest"
          :min="0"
          :max="600"
          color="o"
          @update:model-value="ex.rest = $event"
        />
        <button
          type="button"
          class="btn-icon btn-danger-icon"
          aria-label="删除动作"
          @click="removeExercise(i)"
        >
          <Icon icon="mdi:trash-can-outline" />
        </button>
      </div>
    </div>

    <div class="card">
      <div class="card-title"><Icon icon="mdi:repeat" />循环设置（随预设一起保存）</div>
      <div class="inline-field wrap">
        <span class="field-label">总轮数</span>
        <NumInput
          :model-value="draft.rounds"
          :min="1"
          :max="99"
          :step="1"
          unit=""
          @update:model-value="draft.rounds = $event"
        />
        <span class="field-label field-label-gap">轮间休息</span>
        <NumInput
          :model-value="draft.restBetweenRounds"
          :min="0"
          :max="600"
          unit="秒"
          @update:model-value="draft.restBetweenRounds = $event"
        />
      </div>
    </div>

    <div class="editor-actions">
      <button type="button" class="btn btn-primary" @click="startNow">
        <Icon icon="mdi:play" />开始训练
      </button>
      <button type="button" class="btn btn-ghost" @click="doSave">
        <Icon icon="mdi:content-save" />{{ editKey ? '保存修改' : '保存为预设' }}
      </button>
    </div>

    <div
      v-if="showExportModal"
      class="modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="export-title"
      @click.self="showExportModal = false"
    >
      <div class="modal-box">
        <div id="export-title" class="modal-title">
          <Icon icon="mdi:upload" /> 导出预设
        </div>
        <p class="modal-desc">
          将下载为 JSON 文件，文件名：
          <b class="export-filename">{{ (exportName.trim() || '预设') + '.json' }}</b>
        </p>
        <label class="field-label" for="export-name-input">导出名称</label>
        <input
          ref="exportInput"
          id="export-name-input"
          v-model="exportName"
          type="text"
          class="modal-input"
          placeholder="方案名称"
          @keyup.enter="confirmExport"
        />
        <div class="modal-actions">
          <button type="button" class="btn btn-ghost btn-sm" @click="showExportModal = false">取消</button>
          <button type="button" class="btn btn-primary btn-sm" @click="confirmExport">确认导出</button>
        </div>
      </div>
    </div>
  </div>
</template>
