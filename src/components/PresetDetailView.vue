<script setup>
import { Icon } from '@iconify/vue'
import { computed, inject } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { presetTotalSec, fmtMin } from '../utils/presetFormat.js'

const route = useRoute()
const router = useRouter()
const presets = inject('presets')
const actions = inject('actions')

const preset = computed(() => {
  const b = presets.builtinPresets.find((p) => p.key === route.params.key)
  if (b) return { ...b, kind: 'builtin' }
  const c = presets.customPresets[route.params.key]
  if (c) return { ...c, key: route.params.key, kind: 'custom' }
  return null
})
</script>

<template>
  <div class="detail-page">
    <button class="back-link" @click="router.push('/')">
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
        <button
          v-if="preset.kind === 'custom'"
          class="btn btn-ghost btn-sm"
          @click="router.push('/edit/' + preset.key)"
        >
          <Icon icon="mdi:pencil" />编辑
        </button>
      </div>

      <div class="detail-exs">
        <div v-if="preset.warmupEnabled" class="detail-ex">
          <span class="ex-idx" style="background:var(--accent);color:#fff">热</span>
          <span class="ex-name">热身</span>
          <span class="ex-times">
            <b style="color:var(--accent2)">{{ preset.warmupSeconds }}s</b>
          </span>
        </div>
        <div v-for="(ex, i) in preset.exercises" :key="i" class="detail-ex">
          <span class="ex-idx">{{ i + 1 }}</span>
          <span class="ex-name">{{ ex.name || '动作' + (i + 1) }}</span>
          <span class="ex-times">
            <b style="color:var(--work)">{{ ex.work }}s</b>
            <span style="opacity:.45"> / </span>
            <span>{{ ex.rest }}s</span>
          </span>
        </div>
      </div>

      <button class="btn btn-primary btn-block btn-lg start-btn" @click="actions.startPreset(preset.key)">
        <Icon icon="mdi:play" />开始训练
      </button>
    </section>

    <div v-else class="card" style="text-align:center;padding:32px;opacity:.5">
      方案不存在或已被删除
    </div>
  </div>
</template>
