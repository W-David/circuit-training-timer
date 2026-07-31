<script setup>
import { Icon } from '@iconify/vue'
import { ref, inject, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import NumInput from './NumInput.vue'

const workout = inject('workout')
const actions = inject('actions')
const presets = inject('presets')
const route = useRoute()
const router = useRouter()

const showSaveModal = ref(false)
const saveName = ref('')
const importedName = ref('')
const importInput = ref(null)
const editKey = ref(null)
const editName = ref('')

function init() {
  const key = route.params.key || null
  const p = key ? presets.customPresets[key] : null
  // 编辑入口只允许自定义预设；系统预设或已删除的方案不允许进入编辑
  if (key && !p) {
    router.replace('/')
    return
  }
  editKey.value = key
  editName.value = p?.name || ''
  importedName.value = ''
  saveName.value = ''
  if (p) workout.loadPreset(p)
}

watch(() => route.fullPath, init, { immediate: true })

function handleImport(e) {
  const file = e.target.files[0]
  if (!file) return
  const reader = new FileReader()
  reader.onload = (ev) => {
    try {
      const d = JSON.parse(ev.target.result)
      if (!d.exercises?.length) throw new Error('无效数据')
      importedName.value = String(d.name || '').trim()
      actions.importPreset(d)
    } catch (err) {
      alert('导入失败：' + err.message)
    }
  }
  reader.readAsText(file)
  e.target.value = ''
}

function openSave() {
  saveName.value = importedName.value || editName.value
  showSaveModal.value = true
}

function doSave() {
  const n = saveName.value.trim()
  if (!n) return
  actions.savePreset(n, editKey.value || undefined)
  showSaveModal.value = false
  saveName.value = ''
}
</script>

<template>
  <div class="edit-page">
    <button class="back-link" @click="router.push(editKey ? '/preset/' + editKey : '/')">
      <Icon icon="mdi:arrow-left" />预设方案
    </button>

    <div class="section-head">
      <h2>
        <Icon :icon="editKey ? 'mdi:pencil' : 'mdi:plus'" />
        {{ editKey ? '编辑方案' : '新建方案' }}
      </h2>
      <span style="flex:1"></span>
      <button
        class="btn btn-ghost btn-sm"
        @click="actions.exportPreset(editName || importedName || saveName.trim())"
      >
        <Icon icon="mdi:upload" />导出
      </button>
      <button class="btn btn-ghost btn-sm" @click="importInput?.click()">
        <Icon icon="mdi:download" />导入
      </button>
      <input
        ref="importInput"
        type="file"
        accept=".json"
        style="display:none"
        @change="handleImport"
      />
    </div>

    <!-- 热身 -->
    <div class="card">
      <div class="card-title"><Icon icon="mdi:fire" />热身</div>
      <div class="toggle-row" @click="workout.warmupEnabled.value = !workout.warmupEnabled.value">
        <div class="toggle-track" :class="{ on: workout.warmupEnabled.value }"></div>
        <span style="font-size:.82rem;opacity:.6">
          训练前热身{{ workout.warmupEnabled.value ? ' · ' + workout.warmupSeconds.value + ' 秒' : '' }}
        </span>
      </div>
      <div
        v-if="workout.warmupEnabled.value"
        style="display:flex;align-items:center;gap:10px;margin-top:10px"
      >
        <span style="font-size:.82rem;opacity:.6">热身时长</span>
        <NumInput
          :model-value="workout.warmupSeconds.value"
          :min="10"
          :max="600"
          unit="秒"
          @update:model-value="workout.warmupSeconds.value = $event"
        />
      </div>
    </div>

    <!-- 训练动作 -->
    <div class="card">
      <div class="card-title">
        <Icon icon="mdi:dumbbell" />训练动作
        <span style="flex:1"></span>
        <button class="btn btn-ghost btn-sm" @click="workout.addExercise()">
          <Icon icon="mdi:plus" />添加
        </button>
      </div>
      <div
        v-if="workout.exercises.value.length === 0"
        style="text-align:center;padding:24px;opacity:.4;font-size:.85rem"
      >
        还没有动作，点击「添加」开始编排
      </div>
      <div v-for="(ex, i) in workout.exercises.value" :key="i" class="ex-row">
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
        <button class="btn-icon" style="color:var(--danger)" @click="workout.removeExercise(i)">
          <Icon icon="mdi:trash-can-outline" />
        </button>
      </div>
    </div>

    <div class="card">
      <div class="card-title"><Icon icon="mdi:repeat" />循环设置（随预设一起保存）</div>
      <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin-bottom:12px">
        <span style="font-size:.82rem;opacity:.6">总轮数</span>
        <NumInput
          :model-value="workout.rounds.value"
          :min="1"
          :max="99"
          :step="1"
          unit=""
          @update:model-value="workout.rounds.value = $event"
        />
        <span style="font-size:.82rem;opacity:.6;margin-left:8px">轮间休息</span>
        <NumInput
          :model-value="workout.restBetweenRounds.value"
          :min="0"
          :max="600"
          unit="秒"
          @update:model-value="workout.restBetweenRounds.value = $event"
        />
      </div>
    </div>

    <div class="editor-actions">
      <button class="btn btn-primary" @click="openSave">
        <Icon icon="mdi:content-save" />{{ editKey ? '保存修改' : '保存为预设' }}
      </button>
    </div>

    <!-- 保存为预设 -->
    <div v-if="showSaveModal" class="modal-overlay" @click.self="showSaveModal = false">
      <div class="modal-box">
        <div style="font-weight:700;margin-bottom:8px">
          <Icon icon="mdi:content-save" /> {{ editKey ? '保存修改' : '保存为预设' }}
        </div>
        <div v-if="editKey" style="font-size:.78rem;opacity:.55;margin-bottom:12px">
          将更新「{{ editName }}」这个预设
        </div>
        <input
          v-model="saveName"
          type="text"
          placeholder="输入预设名称"
          style="width:100%;margin-bottom:14px"
          @keyup.enter="doSave"
        />
        <div style="display:flex;gap:8px;justify-content:flex-end">
          <button class="btn btn-ghost btn-sm" @click="showSaveModal = false">取消</button>
          <button class="btn btn-primary btn-sm" @click="doSave">保存</button>
        </div>
      </div>
    </div>
  </div>
</template>
