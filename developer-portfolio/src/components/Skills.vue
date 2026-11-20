<script setup>
import { CodeXml, PanelsTopLeft, Server, Database, Terminal, ShieldCheck } from 'lucide-vue-next'
import { skills } from '../data/skills'
import SectionHeading from './SectionHeading.vue'
const icons = { code: CodeXml, layout: PanelsTopLeft, server: Server, database: Database, terminal: Terminal, shield: ShieldCheck }
</script>
<template>
  <section id="skills" class="section skills-section" aria-label="Technical skills">
    <div class="container">
      <SectionHeading eyebrow="MY TOOLKIT" title="The right tools. A builder’s mindset." description="Technologies I work with and ideas I’m exploring. Always room for something new." />
      <div class="skills-grid grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        <article v-for="group in skills" :key="group.title" class="skill-card" data-reveal>
          <div class="skill-card-heading">
            <component :is="icons[group.icon]" :size="21" aria-hidden="true" />
            <h3>{{ group.title }}</h3>
          </div>
          <ul class="skill-tags">
            <li v-for="skill in group.items" :key="skill">{{ skill }}</li>
          </ul>
        </article>
      </div>
    </div>
  </section>
</template>
