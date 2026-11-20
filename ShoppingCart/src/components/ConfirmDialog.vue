<script setup>
import BaseDialog from './BaseDialog.vue'
defineProps({ reset: Boolean, error: String })
defineEmits(['confirm', 'close'])
</script>
<template>
  <BaseDialog
    labelledby="recovery-title"
    variant="recovery-dialog"
    initial-focus=".cancel-recovery"
    @close="$emit('close')"
    ><p class="eyebrow">SAVED CART RECOVERY</p>
    <h2 id="recovery-title">
      {{ reset ? 'Reset saved cart?' : 'Reload saved cart?' }}
    </h2>
    <p>
      {{
        reset
          ? 'This replaces only NEXORA’s saved cart with an empty list. Download the original first if you want to keep it. Other browser data stays intact.'
          : 'This replaces the current view and unsaved changes with the cart saved in this browser. Export the current view first if you want to keep it.'
      }}
    </p>
    <p v-if="error" class="field-error" role="alert">{{ error }}</p>
    <div class="recovery-actions">
      <button
        type="button"
        class="button button-secondary cancel-recovery"
        @click="$emit('close')"
      >
        Cancel</button
      ><button
        type="button"
        class="button button-dark"
        @click="$emit('confirm')"
      >
        {{ reset ? 'Reset saved cart' : 'Reload saved cart' }}
      </button>
    </div></BaseDialog
  >
</template>
