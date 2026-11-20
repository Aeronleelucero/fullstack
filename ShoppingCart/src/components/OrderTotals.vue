<script setup>
import { formatMoney } from '../utils/currency.js'
defineProps({ totals: { type: Object, required: true } })
</script>
<template>
  <dl class="order-totals">
    <div>
      <dt>Subtotal</dt>
      <dd>{{ formatMoney(totals.subtotalCents) }}</dd>
    </div>
    <div>
      <dt>Estimated tax <span>(8%, demo)</span></dt>
      <dd>{{ formatMoney(totals.taxCents) }}</dd>
    </div>
    <div>
      <dt>Standard shipping <span>(demo)</span></dt>
      <dd>
        {{ totals.shippingCents ? formatMoney(totals.shippingCents) : 'Free' }}
      </dd>
    </div>
    <div class="grand-total">
      <dt>Total <span>USD</span></dt>
      <dd data-testid="grand-total">{{ formatMoney(totals.totalCents) }}</dd>
    </div>
  </dl>
  <p class="pricing-assumptions">
    Demo assumptions: 8% estimated tax, $5.99 shipping, free shipping from a
    $100 subtotal. These are not real tax or delivery quotations.
  </p>
</template>
