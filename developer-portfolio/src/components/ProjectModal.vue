<script setup>
import { ref, onMounted, onUnmounted, nextTick } from 'vue'
import { X, Github, ExternalLink } from 'lucide-vue-next'
const props = defineProps({ project: { type: Object, required: true } })
const emit = defineEmits(['close'])
const dialog = ref(null)
let previousFocus
let previousOverflow
function close() { emit('close') }
onMounted(async () => {
  previousFocus = document.activeElement
  previousOverflow = document.body.style.overflow
  document.body.style.overflow = 'hidden'
  await nextTick()
  dialog.value.showModal()
  dialog.value.querySelector('button')?.focus()
})
onUnmounted(() => { document.body.style.overflow = previousOverflow; previousFocus?.focus({ preventScroll: true }) })
function backdropClick(event) {
  if (event.target !== dialog.value) return
  const bounds = dialog.value.getBoundingClientRect()
  if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) close()
}
function containFocus(event) {
  if (event.key !== 'Tab') return
  const items = [...dialog.value.querySelectorAll('button:not(:disabled), a[href], [tabindex="0"]')]
  const first = items[0]
  const last = items.at(-1)
  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault()
    last?.focus()
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault()
    first?.focus()
  }
}
</script>
<template>
  <Teleport to="body">
    <dialog ref="dialog" class="project-modal" aria-labelledby="modal-title" aria-describedby="modal-overview" @cancel.prevent="close" @click="backdropClick" @keydown="containFocus">
      <button type="button" class="icon-button modal-close" autofocus aria-label="Close project details" @click="close">
        <X :size="22" aria-hidden="true" />
      </button>
      <img v-if="props.project.image" :src="props.project.image" :alt="props.project.imageAlt" class="modal-image" width="1440" height="900" />
      <div v-else class="modal-placeholder">Screenshot not yet supplied</div>
      <div class="modal-content">
        <p class="eyebrow">{{ props.project.category }}</p>
        <h2 id="modal-title">{{ props.project.title }}</h2>
        <p id="modal-overview">{{ props.project.overview }}</p>
        <h3>Key features</h3>
        <ul class="feature-list">
          <li v-for="feature in props.project.features" :key="feature">{{ feature }}</li>
        </ul>
        <h3>My contribution</h3>
        <p>{{ props.project.contribution }}</p>
        <h3>Technology stack</h3>
        <ul class="skill-tags">
          <li v-for="tech in props.project.stack" :key="tech">{{ tech }}</li>
        </ul>
        <div class="modal-links flex flex-wrap gap-3">
          <a v-if="props.project.github" class="button button-secondary" :href="props.project.github" target="_blank" rel="noopener noreferrer">
            <Github :size="17" aria-hidden="true" /> GitHub repository <span class="sr-only">(opens in a new tab)</span>
          </a>
          <a v-if="props.project.demo" class="button button-primary" :href="props.project.demo" target="_blank" rel="noopener noreferrer">
            <ExternalLink :size="17" aria-hidden="true" /> Visit live site <span class="sr-only">(opens in a new tab)</span>
          </a>
          <p v-if="!props.project.github && !props.project.demo" class="muted small-text">Repository and live demo links have not been supplied.</p>
        </div>
      </div>
    </dialog>
  </Teleport>
</template>
