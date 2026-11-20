<script setup>
defineProps({ eyebrow: String, title: String, description: String })
</script>
<template>
  <div class="section-heading">
    <p class="eyebrow">
      <span class="little-line">
      </span>{{ eyebrow }}</p>
    <h2>{{ title }}</h2>
    <p v-if="description" class="section-description">{{ description }}</p>
  </div>
</template>
