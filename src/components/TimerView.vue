<script setup>
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

const emit = defineEmits(['pause', 'skip', 'stop', 'toggle-fs'])

function press(action, e) {
  // 点击后立刻失焦，避免按钮保持焦点时按空格触发二次点击
  e.currentTarget.blur()
  emit(action)
}
</script>

<template>
  <div class="timer-screen">
    <div class="timer-phase" :class="phaseCls">{{ phaseLabel }}</div>
    <div class="timer-ex-name">{{ displayName }}</div>

    <div
      class="timer-countdown"
      :style="{ color: remaining <= 3 && !paused ? 'var(--danger)' : 'var(--text)' }"
    >
      <FlipClock :seconds="remaining" />
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
      <button class="btn btn-primary btn-lg" @click="press('pause', $event)">
        <Icon :icon="paused ? 'mdi:play' : 'mdi:pause'" />
        {{ paused ? '继续' : '暂停' }}
      </button>
      <button class="btn btn-ghost" @click="press('skip', $event)">
        <Icon icon="mdi:skip-next" />跳过
      </button>
      <button class="btn btn-ghost" @click="press('stop', $event)">
        <Icon icon="mdi:stop" />结束
      </button>
    </div>
  </div>
</template>
