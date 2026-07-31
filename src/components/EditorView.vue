<script setup>
import { Icon } from '@iconify/vue'
import { ref, computed, nextTick } from 'vue'
import NumInput from './NumInput.vue'

const props = defineProps({
  exercises: Array,
  rounds: Number,
  restBetweenRounds: Number,
  warmupEnabled: Boolean,
  warmupSeconds: Number,
  builtinPresets: Array,
  customPresets: Object,
  customCount: Number,
  activePresetKey: String,
})

const emit = defineEmits([
  'update:rounds',
  'update:restBetweenRounds',
  'update:warmupEnabled',
  'update:warmupSeconds',
  'add-exercise',
  'remove-exercise',
  'start',
  'load-builtin',
  'load-custom',
  'delete-custom',
  'clear-preset',
  'save-preset',
  'import-preset',
  'export-preset',
])

const showSaveModal = ref(false)
const saveName = ref('')
const importInput = ref(null)
const editorOpen = ref(false)

const allPresets = computed(() => [
  ...props.builtinPresets.map((p) => ({ ...p, kind: 'builtin' })),
  ...Object.entries(props.customPresets).map(([key, p]) => ({ ...p, key, kind: 'custom' })),
])

const activePreset = computed(
  () => allPresets.value.find((p) => p.key === props.activePresetKey) || null,
)

const isActiveCustom = computed(() => activePreset.value?.kind === 'custom')

const currentConfig = computed(() => ({
  exercises: props.exercises,
  rounds: props.rounds,
  restBetweenRounds: props.restBetweenRounds,
  warmupEnabled: props.warmupEnabled,
  warmupSeconds: props.warmupSeconds,
}))

function totalSec(cfg) {
  const roundSec = cfg.exercises.reduce((s, e) => s + (e.work || 0) + (e.rest || 0), 0)
  return (
    cfg.rounds * roundSec
    + Math.max(0, cfg.rounds - 1) * (cfg.restBetweenRounds || 0)
    + (cfg.warmupEnabled ? cfg.warmupSeconds || 0 : 0)
  )
}

function fmtMin(sec) {
  const m = Math.floor(sec / 60)
  const s = Math.round(sec % 60)
  if (m <= 0) return s + '秒'
  return m + '分' + (s ? s + '秒' : '')
}

function pickPreset(p) {
  if (p.kind === 'builtin') emit('load-builtin', p.key)
  else emit('load-custom', p.key)
}

function openEditor() {
  editorOpen.value = true
  nextTick(() => {
    document.getElementById('editor-panel')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  })
}

function createNew() {
  emit('clear-preset')
  openEditor()
}

function openSave() {
  saveName.value = activePreset.value?.name || ''
  showSaveModal.value = true
}

function doSave(mode) {
  const n = saveName.value.trim()
  if (!n) return
  const key = mode === 'overwrite' && isActiveCustom.value ? props.activePresetKey : undefined
  emit('save-preset', n, key)
  showSaveModal.value = false
  saveName.value = ''
}

function handleImport(e) {
  const file = e.target.files[0]
  if (!file) return
  const reader = new FileReader()
  reader.onload = (ev) => {
    try {
      const d = JSON.parse(ev.target.result)
      if (!d.exercises?.length) throw new Error('无效数据')
      emit('import-preset', d)
    } catch (err) {
      alert('导入失败：' + err.message)
    }
  }
  reader.readAsText(file)
  e.target.value = ''
}

function handleExport() {
  emit('export-preset')
}
</script>

<template>
  <div class="editor-block">
    <!-- 预设方案（核心） -->
    <section class="preset-section">
      <div class="section-head">
        <h2><Icon icon="mdi:lightning-bolt" />预设方案</h2>
      </div>
      <div class="preset-grid">
        <button
          v-for="p in allPresets"
          :key="p.key"
          class="preset-card"
          :class="{ on: p.key === activePresetKey }"
          @click="pickPreset(p)"
        >
          <Icon v-if="p.icon" :icon="p.icon" class="preset-icon" />
          <span
            v-if="p.kind === 'custom'"
            class="preset-del"
            title="删除此预设"
            @click.stop="emit('delete-custom', p.key)"
          >
            <Icon icon="mdi:close-circle" />
          </span>
          <div class="preset-name">
            <Icon v-if="p.kind === 'custom'" icon="mdi:pin" class="preset-pin" />
            {{ p.name }}
          </div>
          <div class="preset-meta">{{ p.exercises.length }} 个动作 · {{ p.rounds }} 轮</div>
          <div class="preset-time">约 {{ fmtMin(totalSec(p)) }}</div>
        </button>

        <button class="preset-card preset-new" @click="createNew">
          <Icon icon="mdi:plus" class="preset-icon" />
          <div class="preset-name">新建方案</div>
          <div class="preset-meta">自定义你的训练</div>
        </button>
      </div>
    </section>

    <!-- 当前方案详情 + 开始 -->
    <section class="detail-card">
      <div class="detail-head">
        <div class="detail-icon">
          <Icon :icon="activePreset?.icon || 'mdi:tune-variant'" />
        </div>
        <div class="detail-titles">
          <div class="detail-name">{{ activePreset?.name || '自定义方案' }}</div>
          <div class="detail-meta">
            <span>{{ exercises.length }} 个动作</span>
            <span>{{ rounds }} 轮</span>
            <span v-if="restBetweenRounds > 0">轮间休息 {{ restBetweenRounds }} 秒</span>
            <span v-if="warmupEnabled">热身 {{ warmupSeconds }} 秒</span>
            <span>约 {{ fmtMin(totalSec(currentConfig)) }}</span>
          </div>
        </div>
        <button class="btn btn-ghost btn-sm" @click="openEditor">
          <Icon icon="mdi:pencil" />编辑
        </button>
      </div>

      <div class="detail-exs">
        <div v-for="(ex, i) in exercises" :key="i" class="detail-ex">
          <span class="ex-idx">{{ i + 1 }}</span>
          <span class="ex-name">{{ ex.name || '动作' + (i + 1) }}</span>
          <span class="ex-times">
            <b style="color:var(--work)">{{ ex.work }}s</b>
            <span style="opacity:.45"> / </span>
            <span>{{ ex.rest }}s</span>
          </span>
        </div>
      </div>

      <button class="btn btn-primary btn-block btn-lg start-btn" @click="emit('start')">
        <Icon icon="mdi:play" />开始训练
      </button>
    </section>

    <!-- 自定义方案（编辑器，默认收起） -->
    <section id="editor-panel" class="editor-panel" :class="{ open: editorOpen }">
      <button class="editor-toggle" @click="editorOpen = !editorOpen">
        <Icon icon="mdi:tune-variant" />
        <span>自定义方案</span>
        <span style="flex:1"></span>
        <Icon :icon="editorOpen ? 'mdi:chevron-up' : 'mdi:chevron-down'" style="opacity:.5" />
      </button>

      <div v-show="editorOpen" class="editor-body">
        <div class="card editor-card">
          <div class="card-title">
            <Icon icon="mdi:dumbbell" />训练动作
            <span style="flex:1"></span>
            <button class="btn btn-ghost btn-sm" @click="emit('add-exercise')">
              <Icon icon="mdi:plus" />添加
            </button>
          </div>
          <div
            v-if="exercises.length === 0"
            style="text-align:center;padding:24px;opacity:.4;font-size:.85rem"
          >
            还没有动作，点击「添加」开始编排
          </div>
          <div v-for="(ex, i) in exercises" :key="i" class="ex-row">
            <Icon icon="mdi:drag" style="opacity:.2;font-size:1rem;flex-shrink:0" />
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
            <button class="btn-icon" style="color:var(--danger)" @click="emit('remove-exercise', i)">
              <Icon icon="mdi:trash-can-outline" />
            </button>
          </div>
        </div>

        <div class="card editor-card">
          <div class="card-title"><Icon icon="mdi:repeat" />循环设置（随预设一起保存）</div>
          <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin-bottom:12px">
            <span style="font-size:.82rem;opacity:.6">总轮数</span>
            <NumInput
              :model-value="rounds"
              :min="1"
              :max="99"
              :step="1"
              unit=""
              @update:model-value="emit('update:rounds', $event)"
            />
            <span style="font-size:.82rem;opacity:.6;margin-left:8px">轮间休息</span>
            <NumInput
              :model-value="restBetweenRounds"
              :min="0"
              :max="600"
              unit="秒"
              @update:model-value="emit('update:restBetweenRounds', $event)"
            />
          </div>
          <div class="toggle-row" @click="emit('update:warmupEnabled', !warmupEnabled)">
            <div class="toggle-track" :class="{ on: warmupEnabled }"></div>
            <span style="font-size:.82rem;opacity:.6">
              <Icon icon="mdi:fire" style="vertical-align:-2px" />
              热身{{ warmupEnabled ? ' · ' + warmupSeconds + ' 秒' : '' }}
            </span>
          </div>
          <div v-if="warmupEnabled" style="display:flex;align-items:center;gap:10px;margin-top:10px">
            <span style="font-size:.82rem;opacity:.6">热身时长</span>
            <NumInput
              :model-value="warmupSeconds"
              :min="10"
              :max="600"
              unit="秒"
              @update:model-value="emit('update:warmupSeconds', $event)"
            />
          </div>
        </div>

        <div class="editor-actions">
          <button class="btn btn-primary" @click="openSave">
            <Icon icon="mdi:content-save" />保存为预设
          </button>
          <button class="btn btn-ghost" @click="handleExport">
            <Icon icon="mdi:upload" />导出
          </button>
          <button class="btn btn-ghost" @click="importInput?.click()">
            <Icon icon="mdi:download" />导入
          </button>
          <input ref="importInput" type="file" accept=".json" style="display:none" @change="handleImport" />
        </div>
      </div>
    </section>

    <!-- 保存为预设 -->
    <div v-if="showSaveModal" class="modal-overlay" @click.self="showSaveModal = false">
      <div class="modal-box">
        <div style="font-weight:700;margin-bottom:4px"><Icon icon="mdi:content-save" /> 保存为预设</div>
        <div v-if="isActiveCustom" style="font-size:.78rem;opacity:.55;margin-bottom:12px">
          当前方案来自「{{ activePreset.name }}」，可以直接覆盖，也可以另存为新方案
        </div>
        <input
          v-model="saveName"
          type="text"
          placeholder="输入预设名称"
          style="width:100%;margin-bottom:14px"
          @keyup.enter="doSave('new')"
        />
        <div style="display:flex;gap:8px;justify-content:flex-end">
          <button class="btn btn-ghost btn-sm" @click="showSaveModal = false">取消</button>
          <button v-if="isActiveCustom" class="btn btn-ghost btn-sm" @click="doSave('overwrite')">
            覆盖当前
          </button>
          <button class="btn btn-primary btn-sm" @click="doSave('new')">保存为新方案</button>
        </div>
      </div>
    </div>
  </div>
</template>
