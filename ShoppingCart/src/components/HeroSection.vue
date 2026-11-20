<script setup>
import { computed } from 'vue'
import { Sparkles, ShoppingBag } from '@lucide/vue'
import ProductImage from './ProductImage.vue'
import { formatMoney } from '../utils/currency.js'
import { categoryLabel } from '../utils/categories.js'
const props = defineProps({
  products: { type: Array, required: true },
  ready: Boolean,
})
const primary = computed(() => props.products[0])
const secondary = computed(() =>
  props.products.find((product) => product.category === 'jewelery'),
)
const categoryCount = computed(
  () => new Set(props.products.map((product) => product.category)).size,
)
</script>
<template>
  <section id="home" class="hero">
    <div class="hero-copy">
      <p class="eyebrow">
        <span class="eyebrow-line"></span> A LITTLE DISCOVERY GOES A LONG WAY
      </p>
      <h1>Meet your<br />next <span>favorite.</span></h1>
      <p class="hero-description">
        For your everyday, and everything in between.<br
          class="desktop-break"
        />
        Explore clothing, jewelry, and tech in one considered collection.
      </p>
      <div class="hero-actions">
        <a class="button button-dark" href="#shop"
          >Explore the collection
          <ShoppingBag :size="17" aria-hidden="true" /></a
        ><a class="hero-secondary" href="#categories">Find your category</a>
      </div>
      <div class="hero-meta">
        <span v-if="ready"
          ><strong>{{ products.length }}</strong> catalog products</span
        ><span v-if="ready"
          ><strong>{{ categoryCount }}</strong> categories</span
        ><span
          ><span class="small-spark" aria-hidden="true">✦</span> A demo with
          real catalog data</span
        >
      </div>
    </div>
    <div class="hero-art" aria-label="A selection from the loaded catalog">
      <span class="hero-ring ring-one" aria-hidden="true"></span
      ><span class="hero-ring ring-two" aria-hidden="true"></span
      ><span class="art-word" aria-hidden="true">N</span
      ><template v-if="primary"
        ><div class="hero-product-main">
          <span class="hero-card-label">FROM THE CATALOG</span
          ><ProductImage :src="primary.image" :alt="primary.title" eager />
          <div class="hero-product-caption">
            <span>{{ categoryLabel(primary.category) }}</span
            ><strong>{{ formatMoney(primary.priceCents) }}</strong>
          </div>
        </div>
        <div v-if="secondary" class="hero-product-secondary">
          <ProductImage
            :src="secondary.image"
            :alt="secondary.title"
            eager
          /><span>{{ categoryLabel(secondary.category) }}</span>
        </div>
        <span class="art-note"
          ><Sparkles :size="16" aria-hidden="true" /> A good place to
          start.</span
        ></template
      >
      <div v-else class="hero-art-placeholder">
        <ShoppingBag :size="88" :stroke-width="1" aria-hidden="true" /><span
          >So many possibilities.</span
        >
      </div>
      <span class="art-star star-one" aria-hidden="true">✦</span
      ><span class="art-star star-two" aria-hidden="true">✦</span>
    </div>
  </section>
</template>
