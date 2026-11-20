<script setup>
import { ref, watch } from 'vue'
import { ImageOff } from '@lucide/vue'
const props = defineProps({
  src: { type: String, default: null },
  alt: { type: String, required: true },
  eager: Boolean,
})
const failed = ref(false)
watch(
  () => props.src,
  () => (failed.value = false),
)
</script>
<template>
  <div class="product-image">
    <img
      v-if="src && !failed"
      :src="src"
      :alt="alt"
      :loading="eager ? 'eager' : 'lazy'"
      decoding="async"
      referrerpolicy="no-referrer"
      @error="failed = true"
    />
    <div
      v-else
      class="image-fallback"
      role="img"
      :aria-label="`Image unavailable for ${alt}`"
    >
      <ImageOff :size="30" aria-hidden="true" /><span>Image unavailable</span>
    </div>
  </div>
</template>
