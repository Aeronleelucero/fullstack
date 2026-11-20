<script setup>
import { ShoppingBag, Gem, SlidersHorizontal } from '@lucide/vue'
</script>
<template>
  <section class="experience-strip" aria-label="About this shopping demo">
    <div>
      <ShoppingBag :size="22" :stroke-width="1.4" aria-hidden="true" /><span
        ><strong>A collection to explore</strong
        ><span>Catalog data from FakeStoreAPI</span></span
      >
    </div>
    <div>
      <Gem :size="22" :stroke-width="1.4" aria-hidden="true" /><span
        ><strong>Your style, your selection</strong
        ><span>Clothing, jewelry, and electronics</span></span
      >
    </div>
    <div>
      <SlidersHorizontal
        :size="22"
        :stroke-width="1.4"
        aria-hidden="true"
      /><span
        ><strong>A thoughtfully simple demo</strong
        ><span>No accounts or real payments</span></span
      >
    </div>
  </section>
  <footer class="app-footer">
    <div class="footer-top">
      <div>
        <a class="brand" href="#home"
          >NEXORA<span class="brand-dot" aria-hidden="true">.</span></a
        >
        <p>
          Good discoveries start with a little curiosity.<br />Make yourself at
          home.
        </p>
      </div>
      <nav aria-label="Footer navigation">
        <a href="#home">Home</a><a href="#shop">Shop</a
        ><a href="#categories">Categories</a
        ><a
          href="https://fakestoreapi.com/"
          target="_blank"
          rel="noopener noreferrer"
          >Catalog source</a
        >
      </nav>
      <details class="demo-details">
        <summary>About this demo</summary>
        <p>
          NEXORA is a frontend demonstration using FakeStoreAPI’s sample
          catalog. Prices and ratings come from that service. Tax, shipping, and
          checkout are illustrative; no real purchases are possible.
        </p>
      </details>
    </div>
    <div class="footer-bottom">
      <span>© {{ new Date().getFullYear() }} NEXORA · Demo storefront</span
      ><span>Prices in USD. Checkout is simulated.</span>
    </div>
  </footer>
</template>
