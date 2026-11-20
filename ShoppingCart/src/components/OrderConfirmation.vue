<script setup>
import { Check, Sparkles } from '@lucide/vue'
import BaseDialog from './BaseDialog.vue'
import { formatMoney } from '../utils/currency.js'
defineProps({ order: { type: Object, required: true } })
defineEmits(['close'])
</script>
<template>
  <BaseDialog
    labelledby="order-title"
    variant="order-dialog"
    @close="$emit('close')"
    ><div class="confirmation-check">
      <Check :size="36" :stroke-width="1.5" aria-hidden="true" />
    </div>
    <p class="eyebrow">A LITTLE PREVIEW OF CHECKOUT</p>
    <h2 id="order-title">Demo complete.</h2>
    <p class="confirmation-copy">
      Your local demo order was confirmed, and your cart is now clear.
    </p>
    <div class="order-reference">
      <span>DEMO REFERENCE</span
      ><strong data-testid="order-reference">{{ order.reference }}</strong
      ><span>Demo total: {{ formatMoney(order.totals.totalCents) }}</span>
    </div>
    <p class="confirmation-disclaimer">
      <strong>No payment was taken.</strong> No real order was submitted,
      reserved, or sent to a retailer. This reference exists only in this
      session.
    </p>
    <button type="button" class="button button-dark" @click="$emit('close')">
      Continue exploring <Sparkles :size="16" aria-hidden="true" /></button
  ></BaseDialog>
</template>
