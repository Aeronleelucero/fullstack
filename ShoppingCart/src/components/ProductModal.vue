<script setup>
import { computed, ref } from 'vue'
import { ShoppingBag } from '@lucide/vue'
import BaseDialog from './BaseDialog.vue'
import ProductImage from './ProductImage.vue'
import RatingDisplay from './RatingDisplay.vue'
import QuantitySelector from './QuantitySelector.vue'
import { useCartStore } from '../stores/cart.js'
import { categoryLabel } from '../utils/categories.js'
import { formatMoney } from '../utils/currency.js'
const props = defineProps({ product: { type: Object, required: true } })
const emit = defineEmits(['close', 'added'])
const cart = useCartStore(),
  quantity = ref(1),
  error = ref(''),
  success = ref('')
const max = computed(() => Math.max(1, 99 - cart.quantityFor(props.product.id)))
function add() {
  error.value = ''
  try {
    cart.addToCart(props.product, quantity.value)
    success.value = `${quantity.value} added to your cart.`
    emit('added', props.product)
  } catch (failure) {
    error.value = failure.message
  }
}
</script>
<template>
  <BaseDialog
    labelledby="product-modal-title"
    variant="product-dialog"
    @close="emit('close')"
    ><div class="product-detail-grid">
      <div class="detail-photo">
        <ProductImage :src="product.image" :alt="product.title" eager />
      </div>
      <div class="detail-copy">
        <p class="eyebrow">{{ categoryLabel(product.category) }}</p>
        <h2 id="product-modal-title">{{ product.title }}</h2>
        <RatingDisplay :rating="product.rating" />
        <p class="detail-price">{{ formatMoney(product.priceCents) }}</p>
        <p class="detail-description">{{ product.description }}</p>
        <div class="detail-purchase">
          <span class="field-label">Quantity</span
          ><QuantitySelector
            v-model="quantity"
            :title="product.title"
            :max="max"
            :disabled="cart.readOnly"
          />
          <p class="purchase-note">
            Demo limit: 99 per item. Not a stock indication.
          </p>
          <button
            type="button"
            class="button button-dark"
            :disabled="
              cart.readOnly || quantity + cart.quantityFor(product.id) > 99
            "
            @click="add"
          >
            <ShoppingBag :size="18" aria-hidden="true" />Add to cart ·
            {{ formatMoney(product.priceCents * quantity) }}
          </button>
          <p
            v-if="quantity + cart.quantityFor(product.id) > 99"
            class="field-error"
          >
            Your cart has reached the demo limit for this product.
          </p>
          <p v-if="error" role="alert" class="field-error">{{ error }}</p>
          <p v-if="success" role="status" class="purchase-success">
            {{ success }}
          </p>
        </div>
      </div>
    </div></BaseDialog
  >
</template>
