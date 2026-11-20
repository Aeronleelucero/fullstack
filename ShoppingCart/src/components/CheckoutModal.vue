<script setup>
import { ref } from 'vue'
import { ShieldCheck, LoaderCircle } from '@lucide/vue'
import BaseDialog from './BaseDialog.vue'
import CartNotice from './CartNotice.vue'
import OrderTotals from './OrderTotals.vue'
import { useCartStore } from '../stores/cart.js'
import { formatMoney } from '../utils/currency.js'
const cart = useCartStore(),
  processing = ref(false),
  error = ref('')
const emit = defineEmits(['close', 'confirmed', 'reset', 'reload', 'export'])
async function confirm() {
  if (processing.value) return
  processing.value = true
  error.value = ''
  try {
    await Promise.resolve()
    const order = cart.confirmCheckout()
    emit('confirmed', order)
  } catch (failure) {
    error.value = failure.message
  } finally {
    processing.value = false
  }
}
</script>
<template>
  <BaseDialog
    labelledby="checkout-title"
    variant="checkout-dialog"
    @close="emit('close')"
    ><p class="eyebrow">ONE LAST LOOK</p>
    <h2 id="checkout-title">Your demo checkout.</h2>
    <p class="checkout-intro">
      Review your selections. This stays entirely in your browser.
    </p>
    <div class="demo-checkout-notice">
      <ShieldCheck :size="21" aria-hidden="true" />
      <p>
        <strong>No real order. No real payment.</strong> Confirming generates a
        local demo reference and clears this cart. Nothing is submitted to a
        retailer.
      </p>
    </div>
    <CartNotice
      @reset="emit('reset')"
      @reload="emit('reload')"
      @export="emit('export', $event)"
    />
    <ul class="checkout-lines" aria-label="Order items">
      <li v-for="item in cart.items" :key="item.id">
        <div>
          <strong>{{ item.title }}</strong
          ><span>{{ item.quantity }} × {{ formatMoney(item.priceCents) }}</span>
        </div>
        <span>{{ formatMoney(item.lineTotalCents) }}</span>
      </li>
    </ul>
    <OrderTotals :totals="cart.totals" />
    <p v-if="error" class="field-error" role="alert">{{ error }}</p>
    <button
      type="button"
      class="button button-dark confirm-order-button"
      :disabled="processing || !cart.canCheckout"
      @click="confirm"
    >
      <LoaderCircle
        v-if="processing"
        :size="17"
        class="spin"
        aria-hidden="true"
      />{{ processing ? 'Confirming locally…' : 'Confirm demo order' }}</button
    ><button type="button" class="button button-quiet" @click="emit('close')">
      Back to cart
    </button></BaseDialog
  >
</template>
