<script setup>
import { computed } from 'vue'
import { Icon } from '@iconify/vue'
import FlipClock from './FlipClock.vue'
import { BTN_GHOST, BTN_LG, BTN_PRIMARY } from '../utils/twClasses.js'

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

const phaseIcon = computed(() => {
  if (props.currentStepType === 'warmup') return 'mdi:fire'
  if (props.currentStepType === 'roundRest') return 'mdi:restart'
  if (props.currentStepType === 'rest') return 'mdi:coffee-outline'
  return 'mdi:dumbbell'
})

const isWork = computed(() => props.currentStepType === 'work')

const dotBase = 'size-[9px] rounded-full transition-all duration-300'
const dotCls = {
  work: 'bg-[#262b3a] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.05)]',
  past: 'bg-work shadow-[0_0_8px_-2px_rgba(52,224,178,0.7)]',
  now: 'bg-work scale-[2] shadow-[0_0_14px_1px_rgba(52,224,178,0.8)]',
}
</script>

<template>
  <div class="text-center py-4 min-h-[calc(100dvh-88px)] flex flex-col items-center justify-center">
    <!-- 状态岛：休息/热身 = 单一提示；运动 = 状态 + 动作名 -->
    <div class="timer-status" :class="[phaseCls, { solo: !isWork }]">
      <span class="status-icon" aria-hidden="true">
        <Icon :icon="phaseIcon" />
      </span>
      <span class="status-body">
        <span class="status-label">{{ phaseLabel }}</span>
        <span v-if="isWork" class="status-title">{{ displayName }}</span>
      </span>
    </div>

    <div class="timer-countdown" :class="{ urgent: remaining <= 3 && !paused }">
      <FlipClock :seconds="remaining" />
    </div>

    <div v-if="currentStepType !== 'warmup'" class="text-[0.88rem] opacity-[0.55] mb-1">
      第 <b class="opacity-100 text-accent-2">{{ currentRound + 1 }}</b> / {{ rounds }} 轮
    </div>
    <div v-else class="text-[0.88rem] opacity-[0.55] mb-1">
      <Icon icon="mdi:fire" /> 热身
    </div>

    <div class="flex justify-center gap-2 mb-5 flex-wrap">
      <template v-for="(d, idx) in progressDots" :key="idx">
        <div v-if="d === 's'" class="w-3"></div>
        <div v-else :class="[dotBase, dotCls[d.cls]]" :title="d.title"></div>
      </template>
    </div>

    <div v-if="nextName" class="text-[0.82rem] opacity-[0.5] mb-5">
      下一个：{{ nextName }}（{{ nextSec }}秒）
    </div>

    <div class="flex gap-2.5 justify-center flex-wrap">
      <button type="button" :class="[BTN_PRIMARY, BTN_LG]" @click="press('pause', $event)">
        <Icon :icon="paused ? 'mdi:play' : 'mdi:pause'" />
        {{ paused ? '继续' : '暂停' }}
      </button>
      <button type="button" :class="BTN_GHOST" @click="press('skip', $event)">
        <Icon icon="mdi:skip-next" />跳过
      </button>
      <button type="button" :class="BTN_GHOST" @click="press('stop', $event)">
        <Icon icon="mdi:stop" />结束
      </button>
    </div>

    <div class="mt-6 text-[0.72rem] opacity-[0.35] tracking-[0.02em]">
      空格 暂停 · Ctrl+S 跳过 · Ctrl+F 全屏
    </div>
  </div>
</template>

<style>
/* 状态岛（含各阶段 CSS 变量）与倒计时大数字：依赖动态 phaseCls/urgent，保留为组件内样式 */
.timer-status {
  --status-accent: var(--accent2);
  --status-soft: rgba(167, 139, 250, 0.14);
  --status-ring: rgba(167, 139, 250, 0.35);
  --status-glow: rgba(167, 139, 250, 0.28);

  align-self: center;
  display: inline-flex;
  align-items: center;
  gap: 12px;
  max-width: min(92vw, 420px);
  padding: 10px 18px 10px 10px;
  margin-bottom: 18px;
  border-radius: 999px;
  background:
    linear-gradient(135deg, rgba(255, 255, 255, 0.06), rgba(255, 255, 255, 0.015)),
    rgba(12, 15, 24, 0.72);
  border: 1px solid rgba(255, 255, 255, 0.08);
  box-shadow:
    0 10px 28px -14px rgba(0, 0, 0, 0.75),
    0 0 0 1px rgba(0, 0, 0, 0.25) inset,
    0 0 24px -8px var(--status-glow);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
}

.timer-status.w {
  --status-accent: var(--work);
  --status-soft: rgba(52, 224, 178, 0.14);
  --status-ring: rgba(52, 224, 178, 0.4);
  --status-glow: rgba(52, 224, 178, 0.28);
}

.timer-status.r {
  --status-accent: var(--rest);
  --status-soft: rgba(245, 166, 35, 0.12);
  --status-ring: rgba(245, 166, 35, 0.4);
  --status-glow: rgba(245, 166, 35, 0.26);
}

.timer-status.u {
  --status-accent: var(--accent2);
  --status-soft: rgba(167, 139, 250, 0.14);
  --status-ring: rgba(167, 139, 250, 0.4);
  --status-glow: rgba(167, 139, 250, 0.28);
}

.status-icon {
  flex-shrink: 0;
  width: 38px;
  height: 38px;
  border-radius: 50%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 1.15rem;
  color: var(--status-accent);
  background: var(--status-soft);
  box-shadow:
    inset 0 0 0 1px var(--status-ring),
    0 0 14px -4px var(--status-glow);
}

.status-body {
  min-width: 0;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 1px;
  text-align: left;
}

.status-label {
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--status-accent);
  line-height: 1.2;
  opacity: 0.95;
}

.status-title {
  font-size: 1.12rem;
  font-weight: 800;
  letter-spacing: -0.01em;
  color: var(--text);
  line-height: 1.25;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.timer-status.solo .status-label {
  font-size: 1rem;
  letter-spacing: 0.02em;
  text-transform: none;
  font-weight: 800;
  color: var(--text);
}

.timer-status.solo .status-body {
  justify-content: center;
}

.timer-countdown {
  position: relative;
  font-size: min(22vw, 9rem);
  font-weight: 900;
  letter-spacing: -0.04em;
  font-variant-numeric: tabular-nums;
  line-height: 1.1;
  margin: 8px 0;
  color: var(--text);
  user-select: none;
  transition: color 0.3s;
}

.timer-countdown.urgent {
  color: var(--danger);
}

/* 冒号与数字同色（继承 .timer-countdown 的颜色） */
.timer-countdown .digit-sep {
  color: inherit;
  opacity: 0.9;
}

@media (max-width: 480px) {
  .timer-countdown {
    font-size: 18vw !important;
  }
}
</style>
