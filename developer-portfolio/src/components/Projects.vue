<script setup>
import { computed, ref } from 'vue'
import { Github } from 'lucide-vue-next'
import { projects } from '../data/projects'
import { profile } from '../data/profile'
import SectionHeading from './SectionHeading.vue'
import ProjectCard from './ProjectCard.vue'
import ProjectModal from './ProjectModal.vue'
const filters = ['All projects', 'Full stack', 'Interactive', 'AI & mobile']
const selectedFilter = ref('All projects')
const selectedProject = ref(null)
const filteredProjects = computed(() => selectedFilter.value === 'All projects' ? projects : projects.filter(project => project.category === selectedFilter.value))
</script>
<template>
  <section id="projects" class="section projects-section" aria-label="Featured projects">
    <div class="container">
      <div class="section-heading-row">
        <SectionHeading eyebrow="SELECTED WORK" title="Ideas brought to life." description="A few things I’ve built, experimented with, and learned from." />
        <a class="button button-secondary button-small" :href="profile.github" target="_blank" rel="noopener noreferrer">
          <Github :size="17" aria-hidden="true" /> More on GitHub <span class="sr-only">(opens in a new tab)</span>
        </a>
      </div>
      <div class="project-filters" role="group" aria-label="Filter projects">
        <button v-for="filter in filters" :key="filter" type="button" :aria-pressed="selectedFilter === filter" :class="{ selected: selectedFilter === filter }" @click="selectedFilter = filter">{{ filter }}</button>
      </div>
      <p class="sr-only" role="status">{{ filteredProjects.length }} projects shown</p>
      <div class="projects-grid grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <ProjectCard v-for="project in filteredProjects" :key="project.id" :project="project" @details="selectedProject = $event" />
      </div>
      <p class="projects-postscript">
        <span class="accent">&lt;/&gt;</span> Every project is a chance to learn something new.</p>
    </div>
    <ProjectModal v-if="selectedProject" :project="selectedProject" @close="selectedProject = null" />
  </section>
</template>
