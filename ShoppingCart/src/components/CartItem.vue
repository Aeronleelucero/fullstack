<script setup>
import { Trash2 } from '@lucide/vue'
import ProductImage from './ProductImage.vue'
import QuantitySelector from './QuantitySelector.vue'
import { formatMoney } from '../utils/currency.js'
defineProps({ item: { type: Object, required: true }, disabled: Boolean })
defineEmits(['quantity', 'remove'])
</script>
<template>
  <li class="cart-item">
    <ProductImage :src="item.image" :alt="item.title" eager />
    <div class="cart-item-content">
      <h3>{{ item.title }}</h3>
      <p class="unit-price">{{ formatMoney(item.priceCents) }} each</p>
      <div class="cart-item-actions">
        <QuantitySelector
          :model-value="item.quantity"
          :title="item.title"
          :disabled="disabled"
          @update:modelValue="$emit('quantity', item.id, $event)"
        /><button
          type="button"
          class="remove-item"
          :disabled="disabled"
          :aria-label="`Remove ${item.title}`"
          @click="$emit('remove', item.id)"
        >
          <Trash2 :size="14" aria-hidden="true" />Remove
        </button>
      </div>
      <p class="line-total">
        Line total <strong>{{ formatMoney(item.lineTotalCents) }}</strong>
      </p>
    </div>
  </li>
</template>
