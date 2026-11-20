<script setup>
import { SearchX, RefreshCw, CloudOff } from '@lucide/vue'
import { useProductsStore } from '../stores/products.js'
import ProductCard from './ProductCard.vue'
import ProductFilters from './ProductFilters.vue'
const products = useProductsStore()
defineEmits(['details', 'add'])
</script>
<template>
  <section id="shop" class="catalog-section" aria-labelledby="catalog-title">
    <div class="section-intro">
      <div>
        <p class="eyebrow">THE NEXORA CATALOG</p>
        <h2 id="catalog-title">Consider this your inspiration.</h2>
      </div>
      <span v-if="products.ready" class="results-count" role="status"
        >{{ products.filtered.length }} of
        {{ products.products.length }} products</span
      >
    </div>
    <ProductFilters />
    <div
      v-if="products.status === 'loading'"
      class="product-grid"
      role="status"
      aria-label="Loading product catalog"
    >
      <span class="sr-only">Loading products from FakeStoreAPI.</span>
      <div v-for="n in 8" :key="n" class="product-skeleton" aria-hidden="true">
        <div class="skeleton-photo"></div>
        <div class="skeleton-lines"><i></i><i></i><i></i></div>
      </div>
    </div>
    <div v-else-if="products.status === 'error'" class="catalog-state">
      <span class="state-icon"><CloudOff :size="36" aria-hidden="true" /></span>
      <h3>A little pause in your browsing.</h3>
      <p role="alert">{{ products.error.message }}</p>
      <button type="button" class="button button-dark" @click="products.load()">
        <RefreshCw :size="16" aria-hidden="true" /> Retry catalog
      </button>
      <p class="state-footnote">
        Your cart stays unchanged while the catalog is unavailable.
      </p>
    </div>
    <template v-else-if="products.ready"
      ><p v-if="products.skipped" class="data-warning" role="status">
        {{ products.skipped }} catalog records could not be validated and are
        not displayed.
      </p>
      <div v-if="products.filtered.length" class="product-grid">
        <ProductCard
          v-for="product in products.filtered"
          :key="product.id"
          :product="product"
          @details="$emit('details', $event)"
          @add="$emit('add', $event)"
        />
      </div>
      <div v-else class="catalog-state">
        <span class="state-icon"
          ><SearchX :size="36" aria-hidden="true"
        /></span>
        <h3>
          {{
            products.products.length
              ? 'Nothing quite fits that search.'
              : 'The catalog is empty right now.'
          }}
        </h3>
        <p>
          {{
            products.products.length
              ? 'Try a different phrase or explore another category.'
              : 'The service returned no products. Please check again later.'
          }}
        </p>
        <button
          v-if="products.products.length"
          type="button"
          class="button button-secondary"
          @click="products.resetFilters"
        >
          Clear search and filters</button
        ><button
          v-else
          type="button"
          class="button button-secondary"
          @click="products.load()"
        >
          Refresh catalog
        </button>
      </div></template
    >
  </section>
</template>
