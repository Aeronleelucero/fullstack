<script setup>
import { Plus, Eye } from '@lucide/vue'
import { useCartStore } from '../stores/cart.js'
import ProductImage from './ProductImage.vue'
import RatingDisplay from './RatingDisplay.vue'
import { formatMoney } from '../utils/currency.js'
import { categoryLabel } from '../utils/categories.js'
defineProps({ product: { type: Object, required: true } })
const cart = useCartStore()
defineEmits(['details', 'add'])
</script>
<template>
  <article class="product-card">
    <button
      type="button"
      class="product-photo-button"
      :aria-label="`View details for ${product.title}`"
      aria-haspopup="dialog"
      @click="$emit('details', product)"
    >
      <ProductImage :src="product.image" :alt="product.title" /><span
        class="quick-view"
        ><Eye :size="15" aria-hidden="true" /> View details</span
      >
    </button>
    <div class="product-card-content">
      <p class="product-category">{{ categoryLabel(product.category) }}</p>
      <h3>{{ product.title }}</h3>
      <RatingDisplay :rating="product.rating" />
      <div class="product-card-bottom">
        <span class="product-price">{{ formatMoney(product.priceCents) }}</span
        ><button
          type="button"
          class="add-button"
          :aria-label="`Add to cart: ${product.title}`"
          :disabled="cart.readOnly || cart.quantityFor(product.id) >= 99"
          @click="$emit('add', product)"
        >
          <Plus :size="15" aria-hidden="true" /> Add to cart
        </button>
      </div>
    </div>
  </article>
</template>
