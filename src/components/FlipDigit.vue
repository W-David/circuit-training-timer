<script setup>
import { ref, watch } from 'vue'

const props = defineProps({
  char: { type: String, required: true },
})

const display = ref(props.char)
const oldChar = ref(props.char)
const flipping = ref(false)
let timer = null
let midTimer = null

watch(
  () => props.char,
  (cur) => {
    if (cur === display.value || cur === ':') return
    clearTimeout(timer)
    clearTimeout(midTimer)
    if (flipping.value) {
      // 动画未结束又来了新变化：直接瞬移，避免中间状态错乱
      display.value = cur
      oldChar.value = cur
      flipping.value = false
      return
    }
    oldChar.value = display.value
    flipping.value = true
    midTimer = setTimeout(() => {
      display.value = cur
    }, 200)
    timer = setTimeout(() => {
      flipping.value = false
      oldChar.value = cur
    }, 400)
  },
)
</script>

<template>
  <span v-if="char === ':'" class="digit-sep">{{ char }}</span>
  <span v-else class="flip-digit" :class="{ go: flipping }">
    <span class="card-up">{{ display }}</span>
    <span class="card-lo">{{ display }}</span>
    <span class="mid-line"></span>
    <span class="fold-top">{{ oldChar }}</span>
    <span class="fold-bot">{{ char }}</span>
  </span>
</template>

<style>
/* 翻牌时钟机械结构（伪元素/3D 变换/关键帧），保留为组件内样式 */
.digit-sep {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  opacity: 0.9;
  font-weight: 700;
  font-size: 1em;
  width: 0.5em;
  height: 1em;
}

.flip-digit {
  position: relative;
  display: inline-grid;
  grid-template-rows: 1fr;
  height: 1em;
  perspective: 600px;
  vertical-align: top;
  font-weight: 900;
  line-height: 1;
  font-size: 1.2em;
  border-radius: 6px;
  box-shadow:
    0 3px 8px rgba(0, 0, 0, 0.5),
    0 1px 2px rgba(0, 0, 0, 0.4);
}

.flip-digit .card-up,
.flip-digit .card-lo {
  grid-area: 1 / 1;
  height: 50%;
  overflow: hidden;
  display: flex;
  justify-content: center;
}

.flip-digit .card-up {
  align-self: start;
  align-items: flex-start;
  background: linear-gradient(180deg, #2a3040 0%, #1e2430 100%);
  border-radius: 8px 8px 0 0;
  box-shadow:
    inset 0 0.5px 0 rgba(255, 255, 255, 0.06),
    inset 0 -1px 0 rgba(0, 0, 0, 0.5);
  padding: 0 0.06em;
}

.flip-digit .card-lo {
  align-self: end;
  align-items: flex-end;
  background: linear-gradient(180deg, #161b26 0%, #0e1219 100%);
  border-radius: 0 0 8px 8px;
  box-shadow:
    inset 0 0.5px 0 rgba(255, 255, 255, 0.04),
    inset 0 -1px 0 rgba(0, 0, 0, 0.3);
  padding: 0 0.06em;
}

.flip-digit .mid-line {
  position: absolute;
  left: 1px;
  right: 1px;
  top: 50%;
  height: 1px;
  background: rgba(0, 0, 0, 0.6);
  z-index: 5;
  pointer-events: none;
  box-shadow: 0 1px 0 rgba(255, 255, 255, 0.03);
}

.flip-digit .fold-top,
.flip-digit .fold-bot {
  grid-area: 1 / 1;
  height: 50%;
  overflow: hidden;
  display: flex;
  justify-content: center;
  backface-visibility: hidden;
}

.flip-digit .fold-top {
  align-self: start;
  align-items: flex-start;
  background: linear-gradient(180deg, #2a3040 0%, #1e2430 100%);
  border-radius: 6px 6px 0 0;
  box-shadow:
    inset 0 0.5px 0 rgba(255, 255, 255, 0.06),
    inset 0 -1px 0 rgba(0, 0, 0, 0.5);
  transform-origin: bottom center;
  z-index: 3;
  padding: 0 0.06em;
}

.flip-digit .fold-bot {
  align-self: end;
  align-items: flex-end;
  background: linear-gradient(180deg, #161b26 0%, #0e1219 100%);
  border-radius: 0 0 6px 6px;
  box-shadow:
    inset 0 0.5px 0 rgba(255, 255, 255, 0.04),
    inset 0 -1px 0 rgba(0, 0, 0, 0.3);
  transform-origin: top center;
  transform: rotateX(-90deg);
  z-index: 2;
  padding: 0 0.06em;
}

.flip-digit.go .fold-top {
  animation: f-top 0.4s ease-in both;
}

.flip-digit.go .fold-bot {
  animation: f-bot 0.4s ease-out both;
}

@keyframes f-top {
  0% {
    transform: rotateX(0deg);
  }
  100% {
    transform: rotateX(-90deg);
  }
}

@keyframes f-bot {
  0% {
    transform: rotateX(-90deg);
  }
  100% {
    transform: rotateX(0deg);
  }
}

/* 数字文字光晕 */
.flip-digit .card-up > *,
.flip-digit .card-lo > *,
.flip-digit .fold-top > *,
.flip-digit .fold-bot > * {
  text-shadow: 0 0 18px rgba(124, 111, 247, 0.35);
}

.timer-countdown.urgent .flip-digit .card-up > *,
.timer-countdown.urgent .flip-digit .card-lo > *,
.timer-countdown.urgent .flip-digit .fold-top > *,
.timer-countdown.urgent .flip-digit .fold-bot > * {
  text-shadow: 0 0 18px rgba(239, 68, 68, 0.4);
}
</style>
