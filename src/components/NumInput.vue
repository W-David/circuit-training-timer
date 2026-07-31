<script setup>
const props = defineProps({
  modelValue: { type: Number, required: true },
  min: { type: Number, default: 1 },
  max: { type: Number, default: 600 },
  step: { type: Number, default: 5 },
  color: { type: String, default: '' },
  unit: { type: String, default: '秒' },
})
const emit = defineEmits(['update:modelValue'])

function adjust(delta) {
  setValue(props.modelValue + delta)
}

function setValue(v) {
  // 直接输入也做校验：非法值回落、四舍五入取整、夹取到 [min, max]
  let n = Number.isFinite(+v) ? +v : props.min
  n = Math.max(props.min, Math.min(props.max, Math.round(n)))
  emit('update:modelValue', n)
}
</script>

<template>
  <div class="num-input">
    <span v-if="color" class="dot" :class="color"></span>
    <button @click="adjust(-step)">−</button>
    <input
      class="val"
      type="number"
      :value="modelValue"
      :min="min"
      :max="max"
      @input="setValue($event.target.value)"
    />
    <button @click="adjust(step)">+</button>
    <span v-if="unit" class="unit">{{ unit }}</span>
  </div>
</template>
