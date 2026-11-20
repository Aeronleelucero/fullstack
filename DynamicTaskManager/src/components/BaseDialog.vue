<script setup>
import { ref, onMounted, onUnmounted, nextTick } from 'vue'
import { X } from '@lucide/vue'
const props = defineProps({
  labelledby: { type: String, required: true },
  initialFocus: { type: String, default: '' },
})
const emit = defineEmits(['close'])
const dialog = ref(null)
let previousFocus
let overflow
onMounted(async () => {
  previousFocus = document.activeElement
  overflow = document.body.style.overflow
  document.body.style.overflow = 'hidden'
  await nextTick()
  dialog.value.showModal()
  const target = props.initialFocus
    ? dialog.value.querySelector(props.initialFocus)
    : null
  ;(target || dialog.value.querySelector('button'))?.focus()
})
onUnmounted(() => {
  document.body.style.overflow = overflow
  if (
    previousFocus?.isConnected &&
    !previousFocus.closest('.task-leave-active')
  )
    previousFocus.focus({ preventScroll: true })
  else document.getElementById('tasks-heading')?.focus({ preventScroll: true })
})
function trap(event) {
  if (event.key !== 'Tab') return
  const items = [
    ...dialog.value.querySelectorAll(
      'button:not(:disabled), a[href], input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex="0"]',
    ),
  ].filter((el) => el.getClientRects().length)
  const first = items[0],
    last = items.at(-1)
  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault()
    last?.focus()
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault()
    first?.focus()
  }
}
function backdrop(event) {
  if (event.target !== dialog.value) return
  const box = dialog.value.getBoundingClientRect()
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
      ref="dialog"
      class="app-dialog"
      :aria-labelledby="labelledby"
      @cancel.prevent="emit('close')"
      @click="backdrop"
      @keydown="trap"
    >
      <button
        type="button"
        class="icon-button dialog-close"
        aria-label="Close dialog"
        @click="emit('close')"
      >
        <X :size="20" aria-hidden="true" />
      </button>
      <slot /></dialog
  ></Teleport>
</template>
