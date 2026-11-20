<script setup>
import { Search, X, ShoppingBag, Sun, Moon, Menu } from '@lucide/vue'
import { useProductsStore } from '../stores/products.js'
const products = useProductsStore()
function goShop() {
  document
    .getElementById('shop')
    ?.scrollIntoView({
      behavior: matchMedia('(prefers-reduced-motion: reduce)').matches
        ? 'auto'
        : 'smooth',
    })
}
defineProps({ quantity: Number, theme: String })
defineEmits(['cart', 'theme', 'menu'])
</script>
<template>
  <div class="demo-banner">
    A storefront demonstration. <span>No real orders. No payments.</span>
  </div>
  <header class="navbar">
    <div class="navbar-inner">
      <a class="brand" href="#home"
        ><span class="brand-symbol" aria-hidden="true">N</span>NEXORA<span
          class="brand-dot"
          aria-hidden="true"
          >.</span
        ></a
      >
      <nav class="desktop-nav" aria-label="Main navigation">
        <a href="#home">Home</a><a href="#shop">Shop</a
        ><a href="#categories">Categories</a>
      </nav>
      <form class="nav-search" role="search" @submit.prevent="goShop">
        <label class="sr-only" for="product-search">Search products</label
        ><Search :size="17" aria-hidden="true" /><input
          id="product-search"
          v-model="products.search"
          type="search"
          maxlength="200"
          placeholder="Search your next favorite"
          autocomplete="off"
        /><button
          v-if="products.search"
          type="button"
          class="search-clear"
          aria-label="Clear product search"
          @click="products.search = ''"
        >
          <X :size="16" aria-hidden="true" />
        </button>
      </form>
      <div class="nav-actions">
        <button
          type="button"
          class="icon-button theme-button"
          :aria-label="`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`"
          @click="$emit('theme')"
        >
          <Sun v-if="theme === 'dark'" :size="19" aria-hidden="true" /><Moon
            v-else
            :size="19"
            aria-hidden="true"
          /></button
        ><button
          id="cart-trigger"
          type="button"
          class="icon-button cart-trigger"
          :aria-label="`Open shopping cart, ${quantity} items`"
          @click="$emit('cart')"
        >
          <ShoppingBag :size="21" aria-hidden="true" /><span
            v-if="quantity"
            class="cart-badge"
            aria-hidden="true"
            >{{ quantity }}</span
          ></button
        ><button
          type="button"
          class="icon-button mobile-menu-trigger"
          aria-label="Open navigation"
          @click="$emit('menu')"
        >
          <Menu :size="22" aria-hidden="true" />
        </button>
      </div>
    </div>
  </header>
</template>
