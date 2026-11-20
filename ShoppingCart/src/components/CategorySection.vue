<script setup>
import { Shirt, Gem, Headphones } from '@lucide/vue'
import { useProductsStore } from '../stores/products.js'
const products = useProductsStore()
const icons = {
  "men's clothing": Shirt,
  "women's clothing": Shirt,
  jewelery: Gem,
  electronics: Headphones,
}
function select(value) {
  products.setCategory(value)
  document
    .getElementById('shop')
    ?.scrollIntoView({
      behavior: matchMedia('(prefers-reduced-motion: reduce)').matches
        ? 'auto'
        : 'smooth',
    })
}
</script>
<template>
  <section
    id="categories"
    class="category-section"
    aria-labelledby="categories-title"
  >
    <div class="section-intro">
      <div>
        <p class="eyebrow">A WORLD TO EXPLORE</p>
        <h2 id="categories-title">A little of what you love.</h2>
      </div>
      <p>Find your way into the collection.</p>
    </div>
    <div class="category-grid">
      <button
        v-for="category in products.categories"
        :key="category.id"
        type="button"
        class="category-tile"
        :class="category.id.replaceAll(' ', '-')"
        :aria-pressed="products.category === category.id"
        @click="select(category.id)"
      >
        <span class="category-icon"
          ><component
            :is="icons[category.id]"
            :size="25"
            :stroke-width="1.4"
            aria-hidden="true" /></span
        ><span class="category-tile-copy"
          ><span class="category-label">{{ category.label }}</span
          ><span>{{ category.short }}</span></span
        ><span v-if="products.ready" class="category-count"
          >{{ category.count }}<span class="sr-only"> products</span></span
        >
      </button>
    </div>
  </section>
</template>
