<script setup>
import { ref, watch } from 'vue'

const props = defineProps({
  modelValue: { type: Number, required: true },
  min: { type: Number, default: 1 },
  max: { type: Number, default: 600 },
  step: { type: Number, default: 5 },
  color: { type: String, default: '' },
  unit: { type: String, default: '秒' },
})
const emit = defineEmits(['update:modelValue'])

// 输入框允许暂存空值，失焦/回车时统一提交校验，避免输入被即时打断
const inputVal = ref(String(props.modelValue))

watch(
  () => props.modelValue,
  (v) => {
    if (inputVal.value !== String(v)) inputVal.value = String(v)
  },
)

function setValue(v) {
  let n = Number.isFinite(+v) ? +v : props.min
  n = Math.max(props.min, Math.min(props.max, Math.round(n)))
  emit('update:modelValue', n)
}

function onInput(e) {
  const raw = e.target.value
  inputVal.value = raw
  if (raw === '') return
  setValue(raw)
}

function commit() {
  if (inputVal.value === '') {
    inputVal.value = String(props.modelValue)
    return
  }
  setValue(inputVal.value)
}

function adjust(delta) {
  setValue(props.modelValue + delta)
  inputVal.value = String(props.modelValue + delta)
}
</script>

<template>
  <div class="num-input">
    <span v-if="color" class="dot" :class="color"></span>
    <button type="button" aria-label="减少" @click="adjust(-step)">−</button>
    <input
      class="val"
      type="number"
      :value="inputVal"
      :min="min"
      :max="max"
      @input="onInput"
      @blur="commit"
      @keyup.enter="commit"
    />
    <button type="button" aria-label="增加" @click="adjust(step)">+</button>
    <span v-if="unit" class="unit">{{ unit }}</span>
  </div>
</template>
