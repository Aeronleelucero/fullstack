<script setup>
import { CodeXml, Github, Linkedin, Mail, ChevronUp } from 'lucide-vue-next'
import { profile } from '../data/profile'
const year = new Date().getFullYear()
</script>
<template>
  <footer class="site-footer">
    <div class="container">
      <div class="footer-main">
        <div>
          <a href="#home" class="wordmark">
            <CodeXml aria-hidden="true" />
            <span>aeron<span class="accent">.dev</span>
            </span>
          </a>
          <p>Thoughtful code. Meaningful experiences.</p>
        </div>
        <nav class="footer-nav" aria-label="Footer navigation">
          <a href="#about">About</a>
          <a href="#projects">Projects</a>
          <a href="#resume">Resume</a>
          <a href="#contact">Contact</a>
        </nav>
        <div class="social-links">
          <a :href="profile.github" target="_blank" rel="noopener noreferrer" aria-label="GitHub (opens in a new tab)">
            <Github :size="19" aria-hidden="true" />
          </a>
          <a :href="profile.linkedin" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn (opens in a new tab)">
            <Linkedin :size="19" aria-hidden="true" />
          </a>
          <a :href="`mailto:${profile.email}`" aria-label="Email Aeron">
            <Mail :size="19" aria-hidden="true" />
          </a>
        </div>
      </div>
      <div class="footer-bottom">
        <p>© {{ year }} {{ profile.shortName }}. Built with care & curiosity.</p>
        <span class="footer-stack">Vue 3 <span class="accent">·</span> Vite <span class="accent">·</span> Tailwind CSS</span>
        <a href="#home" class="back-top">Back to top <ChevronUp :size="17" aria-hidden="true" />
        </a>
      </div>
    </div>
  </footer>
</template>
