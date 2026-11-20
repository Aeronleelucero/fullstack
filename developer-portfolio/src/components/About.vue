<script setup>
import { CodeXml, Braces, ShieldCheck, Sparkles } from 'lucide-vue-next'
import SectionHeading from './SectionHeading.vue'
const focuses = [
  { icon: CodeXml, title: 'Interfaces with intention', text: 'Responsive web and mobile experiences that make everyday tasks feel simple.' },
  { icon: Braces, title: 'Systems that work', text: 'APIs, databases, and offline workflows built around real-world needs.' },
  { icon: ShieldCheck, title: 'A security-minded approach', text: 'Exploring cybersecurity and building habits for safer, more reliable software.' },
]
</script>
<template>
  <section id="about" class="section about-section" aria-label="About me">
    <div class="container about-layout" data-reveal>
      <div>
        <SectionHeading eyebrow="THE PERSON BEHIND THE CODE" title="Curious by nature. Developer by choice." />
        <div class="about-copy">
          <p>I’m <strong>Aeron Lee Vincent Lucero</strong>, a Computer Science student from Davao de Oro, Philippines, who enjoys turning complex problems into practical software.</p>
          <p>My work spans frontend interfaces, backend systems, mobile applications, and computer vision. I care about how things look, how they work, and how they hold up in the real world.</p>
          <p>Along the way, I’m exploring cybersecurity, learning new tools, and finding better ways to build. There’s always another interesting problem to solve.</p>
        </div>
        <div class="about-note">
          <Sparkles :size="18" aria-hidden="true" />
          <span>A little curiosity goes a long way.</span>
        </div>
      </div>
      <div class="focus-list">
        <article v-for="item in focuses" :key="item.title" class="focus-item">
          <div class="icon-tile">
            <component :is="item.icon" :size="23" aria-hidden="true" />
          </div>
          <div>
            <h3>{{ item.title }}</h3>
            <p>{{ item.text }}</p>
          </div>
        </article>
        <div class="education-note">
          <span class="mono">CURRENT CHAPTER</span>
          <strong>BS Computer Science</strong>
          <span>University of Mindanao Tagum College · 2022–2026</span>
        </div>
      </div>
    </div>
  </section>
</template>
