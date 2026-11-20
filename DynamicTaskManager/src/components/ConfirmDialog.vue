<script setup>
import { TriangleAlert } from '@lucide/vue'
import BaseDialog from './BaseDialog.vue'
defineProps({
  title: String,
  description: String,
  confirmLabel: { type: String, default: 'Delete task' },
  error: { type: String, default: '' },
})
defineEmits(['confirm', 'close'])
</script>
<template>
  <BaseDialog
    labelledby="confirm-title"
    initial-focus="[data-safe-focus]"
    @close="$emit('close')"
    ><div class="confirm-content">
      <span class="dialog-symbol danger-symbol"
        ><TriangleAlert :size="24" aria-hidden="true"
      /></span>
      <h2 id="confirm-title">{{ title }}</h2>
      <p>{{ description }}</p>
      <p v-if="error" class="field-error" role="alert">{{ error }}</p>
      <div class="dialog-actions">
        <button
          data-safe-focus
          type="button"
          class="button button-secondary"
          @click="$emit('close')"
        >
          Cancel</button
        ><button
          type="button"
          class="button button-danger"
          @click="$emit('confirm')"
        >
          {{ confirmLabel }}
        </button>
      </div>
    </div></BaseDialog
  >
</template>
