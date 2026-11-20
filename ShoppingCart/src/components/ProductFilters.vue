<script setup>
import { useProductsStore } from '../stores/products.js'
const products = useProductsStore()
</script>
<template>
  <div class="product-filter-bar">
    <div class="filter-chips" role="group" aria-label="Product category">
      <button
        type="button"
        :aria-pressed="products.category === 'all'"
        @click="products.setCategory('all')"
      >
        All Products</button
      ><button
        v-for="option in products.categories"
        :key="option.id"
        type="button"
        :aria-pressed="products.category === option.id"
        @click="products.setCategory(option.id)"
      >
        {{ option.label }}
      </button>
    </div>
    <div class="sort-control">
      <label for="product-sort">Sort by</label
      ><select id="product-sort" v-model="products.sort">
        <option value="catalog">Catalog order</option>
        <option value="price-asc">Price: low to high</option>
        <option value="price-desc">Price: high to low</option>
        <option value="rating">Highest rating</option>
      </select>
    </div>
  </div>
</template>
