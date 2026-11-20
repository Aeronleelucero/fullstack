<script setup>
import { TriangleAlert } from '@lucide/vue'
import { useCartStore } from '../stores/cart.js'
const cart = useCartStore()
defineEmits(['reset', 'reload', 'export'])
</script>
<template>
  <div v-if="cart.message" class="cart-notice" role="alert">
    <TriangleAlert :size="18" aria-hidden="true" />
    <div>
      <strong>{{
        cart.readOnly
          ? 'Your saved cart needs attention.'
          : 'Your latest changes are not saved.'
      }}</strong>
      <p>{{ cart.message }}</p>
      <div class="notice-actions">
        <button
          v-if="cart.persistenceState === 'write-failed'"
          type="button"
          @click="cart.save()"
        >
          Retry saving</button
        ><button
          v-if="
            cart.originalRaw !== null && cart.persistenceState === 'corrupt'
          "
          type="button"
          @click="$emit('export', true)"
        >
          Download original data</button
        ><button v-else type="button" @click="$emit('export', false)">
          Export cart backup</button
        ><button type="button" @click="$emit('reload')">
          Reload saved cart</button
        ><button
          v-if="cart.persistenceState === 'corrupt'"
          type="button"
          @click="$emit('reset')"
        >
          Reset saved cart
        </button>
      </div>
    </div>
  </div>
</template>
