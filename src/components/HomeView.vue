<script setup>
import { Icon } from '@iconify/vue'
import { computed, inject, ref, watch, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { useEscClose } from '../composables/useEscClose.js'
import { presetTotalSec, fmtMin } from '../utils/presetFormat.js'

const presets = inject('presets')
const actions = inject('actions')
const toast = inject('toast', () => {})
const router = useRouter()

const pendingDelete = ref(null)
const confirmBtn = ref(null)
const backupInput = ref(null)

useEscClose(pendingDelete)

watch(pendingDelete, (v) => {
  if (v) nextTick(() => confirmBtn.value?.focus())
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
</script>

<template>
  <div class="home-page">
    <svg width="0" height="0" style="position:absolute" aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id="preset-icon-grad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#22d3ee" />
          <stop offset="50%" stop-color="#7c6ff7" />
          <stop offset="100%" stop-color="#a855f7" />
        </linearGradient>
      </defs>
    </svg>

    <div class="section-head">
      <h2><Icon icon="mdi:lightning-bolt" />预设方案</h2>
      <span class="spacer"></span>
      <button type="button" class="btn btn-ghost btn-sm" @click="actions.exportAllPresets()">
        <Icon icon="mdi:export" />保存备份
      </button>
      <button type="button" class="btn btn-ghost btn-sm" @click="backupInput?.click()">
        <Icon icon="mdi:import" />加载备份
      </button>
      <input
        ref="backupInput"
        type="file"
        accept=".json,application/json"
        class="hidden-input"
        @change="handleBackupImport"
      />
    </div>

    <div class="preset-group">
      <div class="preset-group-title">系统预设</div>
      <div v-if="presets.builtinPresets.length" class="preset-grid">
        <div
          v-for="p in presets.builtinPresets"
          :key="p.key"
          class="preset-card"
          role="button"
          tabindex="0"
          @click="router.push('/preset/' + p.key)"
          @keydown.enter="router.push('/preset/' + p.key)"
        >
          <Icon v-if="p.icon" :icon="p.icon" class="preset-icon" />
          <div class="preset-name">{{ p.name }}</div>
          <div class="preset-meta">{{ p.exercises.length }} 个动作 · {{ p.rounds }} 轮</div>
          <div class="preset-time">{{ fmtMin(presetTotalSec(p)) }}</div>
        </div>
      </div>
      <div v-else class="empty-hint">暂无系统预设</div>
    </div>

    <div class="preset-group">
      <div class="preset-group-title">我的预设</div>
      <div class="preset-grid">
        <div
          v-for="p in customPresets"
          :key="p.key"
          class="preset-card"
          role="button"
          tabindex="0"
          @click="router.push('/preset/' + p.key)"
          @keydown.enter="router.push('/preset/' + p.key)"
        >
          <Icon :icon="p.icon || 'mdi:tune-variant'" class="preset-icon" />
          <button
            type="button"
            class="preset-del"
            title="删除此预设"
            aria-label="删除预设"
            @click.stop="askDelete(p)"
          >
            <Icon icon="mdi:close-circle" />
          </button>
          <div class="preset-name">{{ p.name }}</div>
          <div class="preset-meta">{{ p.exercises.length }} 个动作 · {{ p.rounds }} 轮</div>
          <div class="preset-time">{{ fmtMin(presetTotalSec(p)) }}</div>
        </div>

        <div
          class="preset-card preset-new"
          role="button"
          tabindex="0"
          @click="router.push('/new')"
          @keydown.enter="router.push('/new')"
        >
          <Icon icon="mdi:plus" class="preset-icon" />
          <div class="preset-name">新建方案</div>
          <div class="preset-meta">自定义你的训练</div>
        </div>
      </div>
    </div>

    <div
      v-if="pendingDelete"
      class="modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="del-title"
      @click.self="pendingDelete = null"
    >
      <div class="modal-box">
        <div id="del-title" class="modal-title">
          <Icon icon="mdi:delete-alert" /> 删除预设
        </div>
        <p class="modal-desc">确定删除「{{ pendingDelete.name }}」？此操作不可撤销。</p>
        <div class="modal-actions">
          <button type="button" class="btn btn-ghost btn-sm" @click="pendingDelete = null">取消</button>
          <button ref="confirmBtn" type="button" class="btn btn-danger btn-sm" @click="confirmDelete">删除</button>
        </div>
      </div>
    </div>
  </div>
</template>
