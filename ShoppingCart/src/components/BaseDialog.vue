<script setup>
import { ref, onMounted, onUnmounted, nextTick } from 'vue'
import { X } from '@lucide/vue'
const props = defineProps({
  labelledby: { type: String, required: true },
  variant: { type: String, default: '' },
  initialFocus: { type: String, default: '' },
})
const emit = defineEmits(['close'])
const element = ref(null)
let previousFocus, previousOverflow
onMounted(async () => {
  previousFocus = document.activeElement
  previousOverflow = document.body.style.overflow
  document.body.style.overflow = 'hidden'
  await nextTick()
  element.value.showModal()
  const initial = props.initialFocus
    ? element.value.querySelector(props.initialFocus)
    : element.value.querySelector('button')
  initial?.focus({ preventScroll: true })
})
onUnmounted(() => {
  document.body.style.overflow = previousOverflow
  if (previousFocus?.isConnected && !previousFocus.closest('dialog'))
    previousFocus.focus({ preventScroll: true })
  else document.getElementById('cart-trigger')?.focus({ preventScroll: true })
})
function keyboard(event) {
  if (event.key !== 'Tab') return
  const focusable = [
    ...element.value.querySelectorAll(
      'button:not(:disabled), a[href], input:not(:disabled), select:not(:disabled), [tabindex="0"]',
    ),
  ].filter((node) => node.getClientRects().length)
  const first = focusable[0],
    last = focusable.at(-1)
  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault()
    last?.focus()
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault()
    first?.focus()
  }
}
function backdrop(event) {
  if (event.target !== element.value) return
  const box = element.value.getBoundingClientRect()
  if (
    event.clientX < box.left ||
    event.clientX > box.right ||
    event.clientY < box.top ||
    event.clientY > box.bottom
  )
    emit('close')
}
</script>
<template>
  <Teleport to="body"
    ><dialog
      ref="element"
      class="base-dialog"
      :class="variant"
      :aria-labelledby="labelledby"
      @cancel.prevent="emit('close')"
      @keydown="keyboard"
      @click="backdrop"
    >
      <button
        type="button"
        class="icon-button dialog-close"
        aria-label="Close dialog"
        @click="emit('close')"
      >
        <X :size="21" aria-hidden="true" /></button
      ><slot /></dialog
  ></Teleport>
</template>
