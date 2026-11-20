<script setup>
import { Github, Linkedin, Download, CodeXml, Terminal, Layers, MapPin, ChevronDown } from 'lucide-vue-next'
import { profile } from '../data/profile'
</script>
<template>
  <section id="home" class="hero-section" aria-labelledby="hero-title">
    <div class="hero-grid-background" aria-hidden="true">
    </div>
    <div class="container hero-layout">
      <div class="hero-copy">
        <p class="eyebrow hero-eyebrow">
          <span class="little-line">
          </span> THOUGHTFUL CODE. MEANINGFUL EXPERIENCES.</p>
        <p class="hero-greeting">Hey, I’m Aeron <span class="wave" aria-hidden="true">✳</span>
        </p>
        <h1 id="hero-title">Turning ideas<br>into <span class="gradient-text">digital<br class="desktop-break"> experiences.</span>
        </h1>
        <p class="hero-role">Software Developer <span> / </span> Creative Problem Solver</p>
        <p class="hero-description">I build thoughtful web applications, reliable backend systems, and a few things just for the joy of creating.</p>
        <div class="hero-buttons flex flex-wrap gap-3">
          <a class="button button-primary" href="#projects">
            <Layers :size="17" aria-hidden="true" /> Explore my work</a>
          <a class="button button-secondary" :href="profile.resume" :download="profile.resumeFilename">
            <Download :size="17" aria-hidden="true" /> Download CV</a>
        </div>
        <div class="hero-bottom">
          <div class="social-links">
            <a :href="profile.github" target="_blank" rel="noopener noreferrer" aria-label="Aeron on GitHub (opens in a new tab)">
              <Github :size="20" aria-hidden="true" />
            </a>
            <a :href="profile.linkedin" target="_blank" rel="noopener noreferrer" aria-label="Aeron on LinkedIn (opens in a new tab)">
              <Linkedin :size="20" aria-hidden="true" />
            </a>
          </div>
          <span class="hero-divider">
          </span>
          <span class="location">
            <MapPin :size="14" aria-hidden="true" /> Based in the Philippines</span>
        </div>
      </div>
      <div class="developer-visual" aria-hidden="true">
        <div class="orbit orbit-one">
        </div>
        <div class="orbit orbit-two">
        </div>
        <div class="orbit orbit-three">
        </div>
        <div class="orbit-star star-one">✦</div>
        <div class="orbit-star star-two">+</div>
        <div class="orbit-star star-three">✦</div>
        <div class="floating-label label-top">
          <CodeXml :size="17" /> Built with curiosity</div>
        <div class="code-window">
          <div class="window-top">
            <div class="window-dots">
              <i>
              </i>
              <i>
              </i>
              <i>
              </i>
            </div>
            <span>developer.js</span>
            <CodeXml :size="15" />
          </div>
          <div class="code-body">
            <div class="code-line">
              <span class="line-number">1</span>
              <span>
                <b>const</b> developer = {</span>
            </div>
            <div class="code-line">
              <span class="line-number">2</span>
              <span>  name: <em>'Aeron Lucero'</em>,</span>
            </div>
            <div class="code-line">
              <span class="line-number">3</span>
              <span>  focus: [</span>
            </div>
            <div class="code-line">
              <span class="line-number">4</span>
              <span>    <em>'Thoughtful interfaces'</em>,</span>
            </div>
            <div class="code-line">
              <span class="line-number">5</span>
              <span>    <em>'Reliable systems'</em>,</span>
            </div>
            <div class="code-line">
              <span class="line-number">6</span>
              <span>    <em>'Continuous learning'</em>
              </span>
            </div>
            <div class="code-line">
              <span class="line-number">7</span>
              <span>  ],</span>
            </div>
            <div class="code-line">
              <span class="line-number">8</span>
              <span>  mindset: <em>'Keep building.'</em>
              </span>
            </div>
            <div class="code-line">
              <span class="line-number">9</span>
              <span>};<span class="code-cursor">
                </span>
              </span>
            </div>
          </div>
          <div class="window-bottom">
            <span>JavaScript</span>
            <span>UTF-8 <span class="code-check">✓</span>
            </span>
          </div>
        </div>
        <div class="floating-label label-bottom">
          <span class="terminal-icon">
            <Terminal :size="20" />
          </span>
          <div>
            <strong>From concept to creation.</strong>
            <span>One thoughtful line at a time.</span>
          </div>
        </div>
        <div class="visual-caption">
          <span>
          </span> ALWAYS LEARNING. ALWAYS BUILDING.</div>
      </div>
    </div>
    <div class="container hero-footnote">
      <a href="#about">
        <span>SCROLL TO EXPLORE</span>
        <ChevronDown :size="16" aria-hidden="true" />
      </a>
      <span>FULL STACK · CREATIVE DEVELOPMENT · CYBERSECURITY</span>
    </div>
  </section>
</template>
