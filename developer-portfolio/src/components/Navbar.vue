<script setup>
import { ref, onMounted, onUnmounted, nextTick } from 'vue'
import { CodeXml, Moon, Sun, Menu, X } from 'lucide-vue-next'
import { navigation } from '../data/profile'
import { useTheme } from '../composables/useTheme'
const { theme, toggleTheme } = useTheme()
const open = ref(false)
const scrolled = ref(false)
const active = ref('home')
const menuButton = ref(null)
let observer
function onScroll() { scrolled.value = window.scrollY > 24 }
function closeMenu(restoreFocus = false) { open.value = false; if (restoreFocus) menuButton.value?.focus() }
async function navigate(id) {
  const wasOpen = open.value
  closeMenu()
  if (wasOpen) {
    await nextTick()
    const target = document.getElementById(id)
    target?.setAttribute('tabindex', '-1')
    target?.focus({ preventScroll: true })
  }
}
function onKeydown(event) { if (event.key === 'Escape' && open.value) closeMenu(true) }
function onResize() { if (window.innerWidth >= 900) closeMenu() }
onMounted(() => {
  onScroll()
  window.addEventListener('scroll', onScroll, { passive: true })
  window.addEventListener('keydown', onKeydown)
  window.addEventListener('resize', onResize)
  observer = new IntersectionObserver(entries => {
    for (const entry of entries) if (entry.isIntersecting) active.value = entry.target.id
  }, { rootMargin: '-15% 0px -65% 0px', threshold: 0 })
  document.querySelectorAll('main > section[id]').forEach(section => observer.observe(section))
})
onUnmounted(() => {
  observer?.disconnect()
  window.removeEventListener('scroll', onScroll)
  window.removeEventListener('keydown', onKeydown)
  window.removeEventListener('resize', onResize)
})
</script>
<template>
  <header class="site-header" :class="{ 'is-scrolled': scrolled, 'menu-open': open }">
    <nav class="container nav-inner" aria-label="Main navigation">
      <a href="#home" class="wordmark" aria-label="Aeron Lucero home" @click="closeMenu()">
        <CodeXml aria-hidden="true" />
        <span>aeron<span class="accent">.dev</span>
        </span>
      </a>
      <div id="navigation-links" class="nav-links" :class="{ 'is-open': open }">
        <a v-for="item in navigation" :key="item.id" :href="`#${item.id}`" :class="{ active: active === item.id }" :aria-current="active === item.id ? 'location' : undefined" @click="navigate(item.id)">{{ item.label }}</a>
      </div>
      <div class="nav-actions">
        <button class="icon-button theme-toggle" type="button" :aria-label="`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`" @click="toggleTheme">
          <Sun v-if="theme === 'dark'" :size="19" aria-hidden="true" />
          <Moon v-else :size="19" aria-hidden="true" />
        </button>
        <a href="#contact" class="button button-small nav-contact">Let’s talk</a>
        <button ref="menuButton" class="icon-button menu-toggle" type="button" :aria-expanded="open" aria-controls="navigation-links" :aria-label="open ? 'Close navigation' : 'Open navigation'" @click="open = !open">
          <X v-if="open" aria-hidden="true" />
          <Menu v-else aria-hidden="true" />
        </button>
      </div>
    </nav>
  </header>
</template>
