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
  let v = props.modelValue + delta
  v = Math.max(props.min, Math.min(props.max, v))
  emit('update:modelValue', v)
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
      @input="emit('update:modelValue', +$event.target.value || 0)"
    />
    <button @click="adjust(step)">+</button>
    <span v-if="unit" class="unit">{{ unit }}</span>
  </div>
</template>
