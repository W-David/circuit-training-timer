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
  <div class="inline-flex items-center bg-surface-2 border border-line rounded-control h-8 overflow-hidden">
    <span
      v-if="color"
      class="size-2 shrink-0 rounded-full mx-1.5"
      :class="color === 'g' ? 'bg-work' : 'bg-rest'"
    ></span>
    <button
      type="button"
      aria-label="减少"
      class="w-6 h-full border-none bg-transparent text-ink-2 cursor-pointer text-[0.85rem] font-[inherit] inline-flex items-center justify-center transition-all duration-150 shrink-0 leading-none hover:bg-line hover:text-ink active:bg-accent active:text-white"
      @click="adjust(-step)"
    >−</button>
    <input
      class="w-[38px] h-full border-none bg-transparent text-ink text-[0.85rem] text-center font-[inherit] outline-none p-0 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:m-0 [&::-webkit-outer-spin-button]:m-0"
      type="number"
      :value="inputVal"
      :min="min"
      :max="max"
      @input="onInput"
      @blur="commit"
      @keyup.enter="commit"
    />
    <button
      type="button"
      aria-label="增加"
      class="w-6 h-full border-none bg-transparent text-ink-2 cursor-pointer text-[0.85rem] font-[inherit] inline-flex items-center justify-center transition-all duration-150 shrink-0 leading-none hover:bg-line hover:text-ink active:bg-accent active:text-white"
      @click="adjust(step)"
    >+</button>
    <span v-if="unit" class="text-[0.68rem] opacity-[0.45] pr-1">{{ unit }}</span>
  </div>
</template>
