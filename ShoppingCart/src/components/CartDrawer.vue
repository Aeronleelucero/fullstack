<script setup>
import { ShoppingBag, LockKeyhole, RefreshCw } from '@lucide/vue'
import BaseDialog from './BaseDialog.vue'
import CartItem from './CartItem.vue'
import OrderTotals from './OrderTotals.vue'
import CartNotice from './CartNotice.vue'
import { useCartStore } from '../stores/cart.js'
import { useProductsStore } from '../stores/products.js'
const cart = useCartStore(),
  products = useProductsStore()
defineProps({ error: String })
const emit = defineEmits([
  'close',
  'checkout',
  'quantity',
  'remove',
  'reset',
  'reload',
  'export',
])
</script>
<template>
  <BaseDialog
    labelledby="cart-title"
    variant="cart-drawer"
    @close="emit('close')"
    ><div class="drawer-heading">
      <p class="eyebrow">SOMETHING GOOD IN HERE</p>
      <h2 id="cart-title" tabindex="-1">
        Your cart <span>{{ cart.quantity }}</span>
      </h2>
      <p>All your finds, in one place.</p>
    </div>
    <div class="drawer-body">
      <CartNotice
        @reset="emit('reset')"
        @reload="emit('reload')"
        @export="emit('export', $event)"
      />
      <p v-if="error" class="field-error" role="alert">{{ error }}</p>
      <div v-if="!products.ready" class="cart-loading">
        <RefreshCw
          v-if="products.status === 'loading'"
          :size="26"
          class="spin"
          aria-hidden="true"
        />
        <p>
          {{
            products.status === 'error'
              ? 'Your saved selections are safe. Load the catalog to verify current prices.'
              : 'Checking the catalog for your saved selections…'
          }}
        </p>
        <button
          v-if="products.status === 'error'"
          type="button"
          class="button button-secondary"
          @click="products.load()"
        >
          Retry catalog
        </button>
      </div>
      <template v-else
        ><ul
          v-if="cart.items.length"
          class="cart-item-list"
          aria-label="Cart items"
        >
          <CartItem
            v-for="item in cart.items"
            :key="item.id"
            :item="item"
            :disabled="cart.readOnly"
            @quantity="(id, count) => emit('quantity', id, count)"
            @remove="emit('remove', $event)"
          />
        </ul>
        <div v-if="cart.missing.length" class="missing-items">
          <p>
            Some saved products are absent from the current catalog. They are
            excluded from totals. Remove them before checkout.
          </p>
          <div v-for="item in cart.missing" :key="item.id">
            <span>Product #{{ item.id }} · Quantity {{ item.quantity }}</span
            ><button
              type="button"
              :disabled="cart.readOnly"
              :aria-label="`Remove unavailable product ${item.id}`"
              @click="emit('remove', item.id)"
            >
              Remove
            </button>
          </div>
        </div>
        <div v-if="!cart.entries.length" class="empty-cart">
          <span class="empty-bag"
            ><ShoppingBag :size="46" :stroke-width="1.2" aria-hidden="true"
          /></span>
          <h3>A little room for discovery.</h3>
          <p>
            Your cart is empty. Explore the catalog and find something that
            speaks to you.
          </p>
          <button
            type="button"
            class="button button-dark"
            @click="emit('close')"
          >
            Continue shopping
          </button>
        </div></template
      >
    </div>
    <div v-if="products.ready && cart.entries.length" class="drawer-summary">
      <OrderTotals :totals="cart.totals" /><button
        type="button"
        class="button button-dark checkout-button"
        :disabled="!cart.canCheckout"
        @click="emit('checkout')"
      >
        Review demo checkout <LockKeyhole :size="16" aria-hidden="true" />
      </button>
      <p class="checkout-disclaimer">
        A simulation only. No payment details required.
      </p>
    </div></BaseDialog
  >
</template>
