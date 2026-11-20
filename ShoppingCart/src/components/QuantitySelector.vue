<script setup>
import { Minus, Plus } from '@lucide/vue'
import { MAX_QUANTITY } from '../utils/pricing.js'
defineProps({
  modelValue: { type: Number, required: true },
  title: { type: String, required: true },
  disabled: Boolean,
  max: { type: Number, default: MAX_QUANTITY },
})
defineEmits(['update:modelValue'])
</script>
<template>
  <div
    class="quantity-selector"
    role="group"
    :aria-label="`Quantity for ${title}`"
  >
    <button
      type="button"
      :aria-label="`Decrease quantity for ${title}`"
      :disabled="disabled || modelValue <= 1"
      @click="$emit('update:modelValue', modelValue - 1)"
    >
      <Minus :size="15" aria-hidden="true" /></button
    ><output :aria-label="`Quantity: ${modelValue}`">{{ modelValue }}</output
    ><button
      type="button"
      :aria-label="`Increase quantity for ${title}`"
      :disabled="disabled || modelValue >= max"
      @click="$emit('update:modelValue', modelValue + 1)"
    >
      <Plus :size="15" aria-hidden="true" />
    </button>
  </div>
</template>
