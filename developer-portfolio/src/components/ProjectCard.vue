<script setup>
import { ExternalLink, Github, ScanLine, ScanEye } from 'lucide-vue-next'
defineProps({ project: { type: Object, required: true } })
defineEmits(['details'])
</script>
<template>
  <article class="project-card" :class="{ 'project-card-compact': !project.image }">
    <button v-if="project.image" class="project-image-button" type="button" :aria-label="`View ${project.title} project details`" @click="$emit('details', project)">
      <img :src="project.image" :alt="project.imageAlt" loading="lazy" width="1440" height="900" />
      <span class="image-overlay">
        <span>Explore project <ExternalLink :size="15" aria-hidden="true" />
        </span>
      </span>
    </button>
    <div v-else class="project-placeholder" aria-label="Project screenshot not yet supplied">
      <component :is="project.id === 'qr-attendance' ? ScanLine : ScanEye" :size="32" aria-hidden="true" />
      <span>Screenshot to be added</span>
    </div>
    <div class="project-content">
      <p class="project-eyebrow">{{ project.eyebrow }}</p>
      <h3>{{ project.title }}</h3>
      <p class="project-description">{{ project.description }}</p>
      <ul class="project-tags">
        <li v-for="tech in project.stack" :key="tech">{{ tech }}</li>
      </ul>
      <div class="project-actions">
        <button type="button" class="text-button" :aria-label="`View details for ${project.title}`" @click="$emit('details', project)">View details <span aria-hidden="true">+</span>
        </button>
        <div class="flex gap-1">
          <a v-if="project.github" :href="project.github" target="_blank" rel="noopener noreferrer" class="icon-button" :aria-label="`${project.title} GitHub repository (opens in a new tab)`">
            <Github :size="18" aria-hidden="true" />
          </a>
          <a v-if="project.demo" :href="project.demo" target="_blank" rel="noopener noreferrer" class="icon-button" :aria-label="`${project.title} live demo (opens in a new tab)`">
            <ExternalLink :size="18" aria-hidden="true" />
          </a>
        </div>
      </div>
    </div>
  </article>
</template>
