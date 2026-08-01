<script setup>
import { computed } from 'vue'
import { Icon } from '@iconify/vue'
import FlipClock from './FlipClock.vue'

const props = defineProps({
  remaining: Number,
  paused: Boolean,
  displayName: String,
  phaseLabel: String,
  phaseCls: String,
  currentRound: Number,
  rounds: Number,
  currentStepType: String,
  nextName: String,
  nextSec: Number,
  progressDots: Array,
})

const emit = defineEmits(['pause', 'skip', 'stop'])

function press(action, e) {
  // 点击后立刻失焦，避免按钮保持焦点时按空格触发二次点击
  e.currentTarget.blur()
  emit(action)
}

// 动作点进度（含当前步），驱动倒计时外的相位色进度环
const progressPct = computed(() => {
  const dots = (props.progressDots || []).filter((d) => d !== 's')
  if (!dots.length) return 0
  const done = dots.filter((d) => d.cls === 'past' || d.cls === 'now').length
  return (done / dots.length) * 100
})

const ringStyle = computed(() => {
  if (props.phaseCls === 'w') {
    return { '--pct': progressPct.value + '%', '--ring': '#34e0b2', '--ring-glow': 'rgba(52, 224, 178, 0.16)' }
  }
  if (props.phaseCls === 'r') {
    return { '--pct': progressPct.value + '%', '--ring': '#f5a623', '--ring-glow': 'rgba(245, 166, 35, 0.14)' }
  }
  return { '--pct': progressPct.value + '%', '--ring': '#a78bfa', '--ring-glow': 'rgba(167, 139, 250, 0.18)' }
})
</script>

<template>
  <div class="timer-screen">
    <div class="timer-phase" :class="phaseCls">{{ phaseLabel }}</div>
    <div class="timer-ex-name">{{ displayName }}</div>

    <div class="countdown-stage" :style="ringStyle">
      <div class="countdown-halo" aria-hidden="true"></div>
      <div class="timer-countdown" :class="{ urgent: remaining <= 3 && !paused }">
        <FlipClock :seconds="remaining" />
      </div>
    </div>

    <div v-if="currentStepType !== 'warmup'" class="timer-round">
      第 <b>{{ currentRound + 1 }}</b> / {{ rounds }} 轮
    </div>
    <div v-else class="timer-round">
      <Icon icon="mdi:fire" /> 热身
    </div>

    <div class="progress-row">
      <template v-for="(d, idx) in progressDots" :key="idx">
        <div v-if="d === 's'" class="p-spacer"></div>
        <div v-else class="p-dot" :class="d.cls" :title="d.title"></div>
      </template>
    </div>

    <div v-if="nextName" class="timer-next">
      下一个：{{ nextName }}（{{ nextSec }}秒）
    </div>

    <div class="ctrl-row">
      <button type="button" class="btn btn-primary btn-lg" @click="press('pause', $event)">
        <Icon :icon="paused ? 'mdi:play' : 'mdi:pause'" />
        {{ paused ? '继续' : '暂停' }}
      </button>
      <button type="button" class="btn btn-ghost" @click="press('skip', $event)">
        <Icon icon="mdi:skip-next" />跳过
      </button>
      <button type="button" class="btn btn-ghost" @click="press('stop', $event)">
        <Icon icon="mdi:stop" />结束
      </button>
    </div>

    <div class="timer-kbd-hint">
      空格 暂停 · Ctrl+S 跳过 · Ctrl+F 全屏
    </div>
  </div>
</template>
