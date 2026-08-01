<script setup>
import { Icon } from '@iconify/vue'
import { computed, inject, ref } from 'vue'
import { useRouter } from 'vue-router'
import { presetTotalSec, fmtMin } from '../utils/presetFormat.js'

const presets = inject('presets')
const actions = inject('actions')
const router = useRouter()

const pendingDelete = ref(null)

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
    <div class="section-head">
      <h2><Icon icon="mdi:lightning-bolt" />预设方案</h2>
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
          <div class="preset-time">约 {{ fmtMin(presetTotalSec(p)) }}</div>
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
          <div class="preset-time">约 {{ fmtMin(presetTotalSec(p)) }}</div>
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
          <button type="button" class="btn btn-danger btn-sm" @click="confirmDelete">删除</button>
        </div>
      </div>
    </div>
  </div>
</template>
