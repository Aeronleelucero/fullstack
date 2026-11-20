<script setup>
import { onMounted, onUnmounted } from 'vue'
import Navbar from './components/Navbar.vue'
import Hero from './components/Hero.vue'
import About from './components/About.vue'
import Skills from './components/Skills.vue'
import Projects from './components/Projects.vue'
import Resume from './components/Resume.vue'
import Contact from './components/Contact.vue'
import Footer from './components/Footer.vue'
let observer
onMounted(() => {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches || !('IntersectionObserver' in window)) return
  observer = new IntersectionObserver(entries => {
    entries.forEach(entry => { if (entry.isIntersecting) { entry.target.classList.add('is-visible'); observer.unobserve(entry.target) } })
  }, { threshold: 0.08 })
  document.querySelectorAll('[data-reveal]').forEach(el => { el.classList.add('reveal-ready'); observer.observe(el) })
})
onUnmounted(() => observer?.disconnect())
</script>
<template>
  <a href="#main-content" class="skip-link">Skip to content</a>
  <Navbar />
  <main id="main-content" tabindex="-1">
    <Hero />
    <About />
    <Skills />
    <Projects />
    <Resume />
    <Contact />
  </main>
  <Footer />
</template>
