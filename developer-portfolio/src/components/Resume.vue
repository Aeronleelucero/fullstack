<script setup>
import { Download, FileText, GraduationCap, BriefcaseBusiness, BadgeCheck, ExternalLink } from 'lucide-vue-next'
import { profile, education } from '../data/profile'
import SectionHeading from './SectionHeading.vue'
</script>
<template>
  <section id="resume" class="section resume-section" aria-label="Resume and experience">
    <div class="container">
      <div class="resume-layout">
        <div class="resume-intro" data-reveal>
          <SectionHeading eyebrow="THE JOURNEY SO FAR" title="Learning. Building. Moving forward." />
          <p class="section-description">A foundation in Computer Science, hands-on project experience, and a commitment to getting better at the craft.</p>
          <div class="resume-download">
            <div class="resume-file-icon">
              <FileText :size="30" aria-hidden="true" />
            </div>
            <div>
              <strong>Aeron Lucero — CV</strong>
              <span>PDF document · Education & experience</span>
            </div>
            <a class="icon-button" :href="profile.resume" :download="profile.resumeFilename" aria-label="Download Aeron Lucero CV as PDF">
              <Download :size="21" aria-hidden="true" />
            </a>
          </div>
          <a class="button button-primary" :href="profile.resume" :download="profile.resumeFilename">
            <Download :size="17" aria-hidden="true" /> Download my resume</a>
        </div>
        <div class="resume-timeline" data-reveal>
          <div class="timeline-group">
            <h3>
              <GraduationCap :size="20" aria-hidden="true" /> Education</h3>
            <article v-for="item in education" :key="item.title" class="timeline-item">
              <span class="timeline-period">{{ item.period }}</span>
              <h4>{{ item.title }}</h4>
              <p>{{ item.institution }}</p>
            </article>
          </div>
          <div class="timeline-group">
            <h3>
              <BriefcaseBusiness :size="20" aria-hidden="true" /> Practical experience</h3>
            <article class="timeline-item">
              <span class="timeline-period">COMPLETED OCTOBER 18, 2025</span>
              <h4>Python Programming Internship</h4>
              <p>Datheon · Four-week program</p>
              <a href="/files/datheon-python-programming-internship.png" target="_blank" rel="noopener noreferrer" class="certificate-link">
                <BadgeCheck :size="16" aria-hidden="true" /> View completion certificate <ExternalLink :size="13" aria-hidden="true" />
                <span class="sr-only">(opens in a new tab)</span>
              </a>
            </article>
            <article class="timeline-item">
              <span class="timeline-period">PROJECT EXPERIENCE</span>
              <h4>Web, mobile & intelligent systems</h4>
              <p>Hands-on development of APIs, offline attendance, interactive 3D experiences, and computer-vision applications.</p>
            </article>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>
