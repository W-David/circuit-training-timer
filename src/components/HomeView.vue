<script setup>
import { Icon } from '@iconify/vue'
import { computed, inject } from 'vue'
import { useRouter } from 'vue-router'
import { presetTotalSec, fmtMin } from '../utils/presetFormat.js'

const presets = inject('presets')
const actions = inject('actions')
const router = useRouter()

const builtinPresets = computed(() => presets.builtinPresets)

const customPresets = computed(() =>
  Object.entries(presets.customPresets).map(([key, p]) => ({ ...p, key, kind: 'custom' })),
)
</script>

<template>
  <div class="home-page">
    <div class="section-head">
      <h2><Icon icon="mdi:lightning-bolt" />预设方案</h2>
    </div>

    <div class="preset-group">
      <div class="preset-group-title">系统预设</div>
      <div class="preset-grid">
        <button
          v-for="p in builtinPresets"
          :key="p.key"
          class="preset-card"
          @click="router.push('/preset/' + p.key)"
        >
          <Icon v-if="p.icon" :icon="p.icon" class="preset-icon" />
          <div class="preset-name">{{ p.name }}</div>
          <div class="preset-meta">{{ p.exercises.length }} 个动作 · {{ p.rounds }} 轮</div>
          <div class="preset-time">约 {{ fmtMin(presetTotalSec(p)) }}</div>
        </button>
      </div>
    </div>

    <div class="preset-group">
      <div class="preset-group-title">我的预设</div>
      <div class="preset-grid">
        <button
          v-for="p in customPresets"
          :key="p.key"
          class="preset-card"
          @click="router.push('/preset/' + p.key)"
        >
          <Icon v-if="p.icon" :icon="p.icon" class="preset-icon" />
          <span
            class="preset-del"
            title="删除此预设"
            @click.stop="actions.deletePreset(p.key)"
          >
            <Icon icon="mdi:close-circle" />
          </span>
          <div class="preset-name">{{ p.name }}</div>
          <div class="preset-meta">{{ p.exercises.length }} 个动作 · {{ p.rounds }} 轮</div>
          <div class="preset-time">约 {{ fmtMin(presetTotalSec(p)) }}</div>
        </button>

        <button class="preset-card preset-new" @click="router.push('/new')">
          <Icon icon="mdi:plus" class="preset-icon" />
          <div class="preset-name">新建方案</div>
          <div class="preset-meta">自定义你的训练</div>
        </button>
      </div>
    </div>
  </div>
</template>
