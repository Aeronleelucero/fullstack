<script setup>
import BaseDialog from './BaseDialog.vue'
defineEmits(['close'])
</script>
<template>
  <BaseDialog
    labelledby="mobile-nav-title"
    variant="mobile-navigation"
    @close="$emit('close')"
    ><p class="eyebrow">A WORLD TO EXPLORE</p>
    <h2 id="mobile-nav-title">Find your next favorite.</h2>
    <nav aria-label="Mobile navigation">
      <a href="#home" @click="$emit('close')">Home</a
      ><a href="#shop" @click="$emit('close')">Shop the collection</a
      ><a href="#categories" @click="$emit('close')">Categories</a>
    </nav>
    <p class="mobile-menu-note">
      NEXORA is a demo storefront.<br />No real orders or payments.
    </p></BaseDialog
  >
</template>
