<script setup>
import { Icon } from '@iconify/vue'
import { computed, inject, ref, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { presetTotalSec, fmtMin } from '../utils/presetFormat.js'

const route = useRoute()
const router = useRouter()
const presets = inject('presets')
const actions = inject('actions')

const showForkModal = ref(false)
const forkName = ref('')
const forkInput = ref(null)

const preset = computed(() => {
  const b = presets.builtinPresets.find((p) => p.key === route.params.key)
  if (b) return { ...b, kind: 'builtin' }
  const c = presets.customPresets[route.params.key]
  if (c) return { ...c, key: route.params.key, kind: 'custom' }
  return null
})

async function openFork() {
  if (!preset.value) return
  forkName.value = (preset.value.name || '方案') + ' 副本'
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
  <div class="detail-page">
    <button type="button" class="back-link" @click="router.push('/')">
      <Icon icon="mdi:arrow-left" />预设方案
    </button>

    <section v-if="preset" class="detail-card">
      <div class="detail-head">
        <div class="detail-icon">
          <Icon :icon="preset.icon || 'mdi:tune-variant'" />
        </div>
        <div class="detail-titles">
          <div class="detail-name">
            <Icon v-if="preset.kind === 'custom'" icon="mdi:pin" class="preset-pin" />
            {{ preset.name }}
          </div>
          <div class="detail-meta">
            <span>{{ preset.exercises.length }} 个动作</span>
            <span>{{ preset.rounds }} 轮</span>
            <span v-if="preset.restBetweenRounds > 0">轮间休息 {{ preset.restBetweenRounds }} 秒</span>
            <span v-if="preset.warmupEnabled">热身 {{ preset.warmupSeconds }} 秒</span>
            <span>约 {{ fmtMin(presetTotalSec(preset)) }}</span>
          </div>
        </div>
        <div class="detail-head-actions">
          <button
            v-if="preset.kind === 'custom'"
            type="button"
            class="btn btn-ghost btn-sm"
            @click="router.push('/edit/' + preset.key)"
          >
            <Icon icon="mdi:pencil" />编辑
          </button>
          <button type="button" class="btn btn-ghost btn-sm" @click="openFork">
            <Icon icon="mdi:content-copy" />另存为
          </button>
        </div>
      </div>

      <div class="detail-exs">
        <div v-if="preset.warmupEnabled" class="detail-ex">
          <span class="ex-idx ex-idx-warm">热</span>
          <span class="ex-name">热身</span>
          <span class="ex-times">
            <b class="c-accent2">{{ preset.warmupSeconds }}s</b>
          </span>
        </div>
        <div v-for="(ex, i) in preset.exercises" :key="i" class="detail-ex">
          <span class="ex-idx">{{ i + 1 }}</span>
          <span class="ex-name">{{ ex.name || '动作' + (i + 1) }}</span>
          <span class="ex-times">
            <b class="c-work">{{ ex.work }}s</b>
            <span class="ex-sep"> / </span>
            <span>{{ ex.rest }}s</span>
          </span>
        </div>
      </div>

      <button
        type="button"
        class="btn btn-primary btn-block btn-lg start-btn"
        @click="actions.startPreset(preset.key)"
      >
        <Icon icon="mdi:play" />开始训练
      </button>
    </section>

    <div v-else class="card empty-card">
      方案不存在或已被删除
    </div>

    <div
      v-if="showForkModal"
      class="modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="fork-title"
      @click.self="showForkModal = false"
    >
      <div class="modal-box">
        <div id="fork-title" class="modal-title">
          <Icon icon="mdi:content-copy" /> 另存为新预设
        </div>
        <p class="modal-desc">
          复制「{{ preset?.name }}」到「我的预设」，原方案不会被修改。
        </p>
        <input
          ref="forkInput"
          v-model="forkName"
          type="text"
          class="modal-input"
          placeholder="新预设名称"
          @keyup.enter="confirmFork"
        />
        <div class="modal-actions">
          <button type="button" class="btn btn-ghost btn-sm" @click="showForkModal = false">取消</button>
          <button type="button" class="btn btn-primary btn-sm" @click="confirmFork">保存副本</button>
        </div>
      </div>
    </div>
  </div>
</template>
