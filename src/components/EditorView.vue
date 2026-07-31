<script setup>
import { ref } from 'vue'
import { Icon } from '@iconify/vue'
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
  'save-preset',
  'import-preset',
  'export-preset',
])

const showSaveModal = ref(false)
const saveName = ref('')
const importInput = ref(null)

function doSave() {
  const n = saveName.value.trim()
  if (!n) return
  emit('save-preset', n)
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
    <div class="logo-section">
      <div class="logo-icon">
        <Icon icon="mdi:timer-outline" width="26" height="26" style="color:#fff" />
      </div>
      <h1>循环训练计时器</h1>
      <div class="sub">自定义动作 · 分组计时 · 自动轮转</div>
    </div>

    <!-- Exercises -->
    <div class="card">
      <div class="card-title">
        <Icon icon="mdi:dumbbell" />训练动作
        <span style="flex:1"></span>
        <button class="btn btn-ghost btn-sm" @click="emit('add-exercise')">
          <Icon icon="mdi:plus" />添加
        </button>
      </div>
      <div v-if="exercises.length === 0" style="text-align:center;padding:24px;opacity:.4;font-size:.85rem">
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
        <NumInput :model-value="ex.work" :min="1" :max="600" color="g" @update:model-value="ex.work = $event" />
        <span class="time-label">休息</span>
        <NumInput :model-value="ex.rest" :min="0" :max="600" color="o" @update:model-value="ex.rest = $event" />
        <button class="btn-icon" style="color:var(--danger)" @click="emit('remove-exercise', i)">
          <Icon icon="mdi:trash-can-outline" />
        </button>
      </div>
    </div>

    <!-- Rounds & Warm-up -->
    <div class="card">
      <div class="card-title"><Icon icon="mdi:repeat" />循环设置</div>
      <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin-bottom:12px">
        <span style="font-size:.82rem;opacity:.6">总轮数</span>
        <NumInput :model-value="rounds" :min="1" :max="99" :step="1" unit="" @update:model-value="emit('update:rounds', $event)" />
        <span style="font-size:.82rem;opacity:.6;margin-left:8px">轮间休息</span>
        <NumInput :model-value="restBetweenRounds" :min="0" :max="600" unit="秒" @update:model-value="emit('update:restBetweenRounds', $event)" />
      </div>
      <div class="toggle-row" @click="emit('update:warmupEnabled', !warmupEnabled)">
        <div class="toggle-track" :class="{ on: warmupEnabled }"></div>
        <span style="font-size:.82rem;opacity:.6">
          <Icon icon="mdi:fire" style="vertical-align:-2px" /> 热身{{ warmupEnabled ? ' · ' + warmupSeconds + ' 秒' : '' }}
        </span>
      </div>
      <div v-if="warmupEnabled" style="display:flex;align-items:center;gap:10px;margin-top:10px">
        <span style="font-size:.82rem;opacity:.6">热身时长</span>
        <NumInput :model-value="warmupSeconds" :min="10" :max="600" unit="秒" @update:model-value="emit('update:warmupSeconds', $event)" />
      </div>
    </div>

    <!-- Presets -->
    <div class="card">
      <div class="card-title">
        <Icon icon="mdi:lightning-bolt" />预设方案
        <span style="flex:1"></span>
        <button class="btn btn-ghost btn-sm" @click="handleExport"><Icon icon="mdi:download" />导出</button>
        <button class="btn btn-ghost btn-sm" style="margin-left:6px" @click="importInput?.click()"><Icon icon="mdi:upload" />导入</button>
        <input ref="importInput" type="file" accept=".json" style="display:none" @change="handleImport" />
        <button class="btn btn-ghost btn-sm" style="margin-left:6px" @click="showSaveModal = true"><Icon icon="mdi:content-save" />保存</button>
      </div>
      <div class="tag-row" style="margin-bottom:6px">
        <span class="tag" v-for="p in builtinPresets" :key="p.key" @click="emit('load-builtin', p.key)">
          <Icon :icon="p.icon" />{{ p.name }}
        </span>
      </div>
      <template v-if="customCount > 0">
        <div style="font-size:.7rem;opacity:.4;margin-bottom:6px"><Icon icon="mdi:pin" /> 我的预设</div>
        <div class="tag-row">
          <span class="tag" v-for="(p, key) in customPresets" :key="key" @click="emit('load-custom', key)">
            {{ p.name }}
            <span class="del" @click.stop="emit('delete-custom', key)">
              <Icon icon="mdi:close-circle" />
            </span>
          </span>
        </div>
      </template>
    </div>

    <button class="btn btn-primary btn-block btn-lg" style="margin-top:4px" @click="emit('start')">
      <Icon icon="mdi:play" />开始训练
    </button>

    <!-- Save modal -->
    <div v-if="showSaveModal" class="modal-overlay" @click.self="showSaveModal = false">
      <div class="modal-box">
        <div style="font-weight:700;margin-bottom:12px"><Icon icon="mdi:content-save" /> 保存为预设</div>
        <input type="text" v-model="saveName" placeholder="输入预设名称" style="width:100%;margin-bottom:14px" @keyup.enter="doSave" />
        <div style="display:flex;gap:8px;justify-content:flex-end">
          <button class="btn btn-ghost btn-sm" @click="showSaveModal = false">取消</button>
          <button class="btn btn-primary btn-sm" @click="doSave">保存</button>
        </div>
      </div>
    </div>
  </div>
</template>
