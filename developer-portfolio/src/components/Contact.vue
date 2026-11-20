<script setup>
import { reactive, ref, nextTick } from 'vue'
import { Mail, Github, Linkedin, MapPin, Send, Check, Copy } from 'lucide-vue-next'
import { profile } from '../data/profile'
import SectionHeading from './SectionHeading.vue'
const fields = reactive({ name: '', email: '', subject: '', message: '', website: '' })
const errors = reactive({})
const status = ref('idle')
const emailDraft = ref('')
const copied = ref(false)
const copyError = ref('')
let cooldownUntil = 0
function validate() {
  Object.keys(errors).forEach(key => delete errors[key])
  if (!fields.name.trim()) errors.name = 'Please enter your full name.'
  if (!fields.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fields.email.trim())) errors.email = 'Please enter a valid email address.'
  if (!fields.subject.trim()) errors.subject = 'Please enter a subject.'
  if (fields.message.trim().length < 10) errors.message = 'Please write a message of at least 10 characters.'
  return Object.keys(errors).length === 0
}
async function prepareEmail() {
  if (status.value === 'preparing') return
  if (!validate()) {
    status.value = 'invalid'
    await nextTick()
    document.getElementById(`contact-${Object.keys(errors)[0]}`)?.focus()
    return
  }
  if (fields.website || Date.now() < cooldownUntil) { status.value = 'limited'; return }
  status.value = 'preparing'
  copied.value = false
  copyError.value = ''
  await nextTick()
  const body = `${fields.message.trim()}\n\nFrom: ${fields.name.trim()}\nEmail: ${fields.email.trim()}`
  emailDraft.value = `mailto:${profile.email}?subject=${encodeURIComponent(fields.subject.trim())}&body=${encodeURIComponent(body)}`
  cooldownUntil = Date.now() + 3000
  status.value = 'ready'
  // An actual mailto navigation, never a claim that a message was delivered.
  window.location.href = emailDraft.value
}
async function copyEmail() {
  copied.value = false
  copyError.value = ''
  try {
    await navigator.clipboard.writeText(profile.email)
    copied.value = true
  } catch {
    copyError.value = 'Copying is unavailable. Please copy the address from the contact details or use the email link.'
  }
}
const formFields = [
  { key: 'name', label: 'Full name', type: 'text', placeholder: 'Your name', autocomplete: 'name', max: 100 },
  { key: 'email', label: 'Email address', type: 'email', placeholder: 'you@example.com', autocomplete: 'email', max: 254 },
  { key: 'subject', label: 'Subject', type: 'text', placeholder: 'What’s on your mind?', autocomplete: 'off', max: 150 },
]
</script>
<template>
  <section id="contact" class="section contact-section" aria-label="Contact">
    <div class="container contact-layout">
      <div class="contact-intro" data-reveal>
        <SectionHeading eyebrow="LET’S CONNECT" title="Have something in mind? Let’s build it." />
        <p class="section-description">A project idea, an opportunity, or just a good conversation about technology — I’d love to hear from you.</p>
        <div class="contact-links">
          <a :href="`mailto:${profile.email}`">
            <span class="icon-tile">
              <Mail :size="20" aria-hidden="true" />
            </span>
            <span>
              <small>DROP ME A LINE</small>
              <strong>{{ profile.email }}</strong>
            </span>
          </a>
          <a :href="profile.github" target="_blank" rel="noopener noreferrer">
            <span class="icon-tile">
              <Github :size="20" aria-hidden="true" />
            </span>
            <span>
              <small>FOLLOW THE CODE</small>
              <strong>github.com/Aeronleelucero</strong>
            </span>
            <span class="sr-only">(opens in a new tab)</span>
          </a>
          <a :href="profile.linkedin" target="_blank" rel="noopener noreferrer">
            <span class="icon-tile">
              <Linkedin :size="20" aria-hidden="true" />
            </span>
            <span>
              <small>CONNECT PROFESSIONALLY</small>
              <strong>Let’s connect on LinkedIn</strong>
            </span>
            <span class="sr-only">(opens in a new tab)</span>
          </a>
        </div>
        <p class="contact-location">
          <MapPin :size="16" aria-hidden="true" /> {{ profile.location }}</p>
      </div>
      <form class="contact-form" novalidate aria-label="Prepare an email to Aeron" :aria-busy="status === 'preparing'" @submit.prevent="prepareEmail">
        <h3>Start a conversation</h3>
        <p class="form-intro" id="contact-form-note">This form opens a draft in your email app. Review and send it there; messages aren’t sent from this website.</p>
        <div class="form-grid">
          <div v-for="field in formFields" :key="field.key" class="form-field" :class="{ 'full-width': field.key === 'subject' }">
            <label :for="`contact-${field.key}`">{{ field.label }} <span aria-hidden="true">*</span>
            </label>
            <input :id="`contact-${field.key}`" v-model="fields[field.key]" :type="field.type" :placeholder="field.placeholder" :autocomplete="field.autocomplete" :maxlength="field.max" required :aria-invalid="!!errors[field.key]" :aria-describedby="errors[field.key] ? `error-${field.key}` : undefined" @input="delete errors[field.key]; status = 'idle'" />
            <p v-if="errors[field.key]" :id="`error-${field.key}`" class="form-error">{{ errors[field.key] }}</p>
          </div>
          <div class="form-field full-width">
            <label for="contact-message">Message <span aria-hidden="true">*</span>
            </label>
            <textarea id="contact-message" v-model="fields.message" placeholder="Tell me a little about your idea…" rows="5" required minlength="10" maxlength="2000" :aria-invalid="!!errors.message" :aria-describedby="errors.message ? 'error-message' : undefined" @input="delete errors.message; status = 'idle'">
            </textarea>
            <p v-if="errors.message" id="error-message" class="form-error">{{ errors.message }}</p>
          </div>
        </div>
        <div class="honeypot" aria-hidden="true">
          <label for="contact-website">Leave this field blank</label>
          <input id="contact-website" v-model="fields.website" type="text" tabindex="-1" autocomplete="off" />
        </div>
        <button class="button button-primary form-submit" type="submit" :disabled="status === 'preparing'" aria-describedby="contact-form-note">
          <Send :size="17" aria-hidden="true" /> {{ status === 'preparing' ? 'Preparing your draft…' : 'Open email draft' }}</button>
        <div class="form-status" role="status">
          <template v-if="status === 'ready'">
            <p>
              <Check :size="17" aria-hidden="true" /> Your draft is ready. Send it from your email app.</p>
            <a :href="emailDraft" class="inline-link">Open the draft again</a>
            <span class="small-text"> · No email app? </span>
            <button type="button" class="inline-link" @click="copyEmail">
              <Copy :size="13" aria-hidden="true" /> {{ copied ? 'Email copied' : 'Copy my email' }}</button>
            <p v-if="copyError" class="form-error" role="alert">{{ copyError }}</p>
          </template>
          <p v-else-if="status === 'invalid'" class="form-error">Please check the highlighted fields.</p>
          <p v-else-if="status === 'limited'">Please wait a moment before preparing another draft.</p>
        </div>
        <p class="form-footnote">No server storage. Just a direct conversation.</p>
      </form>
    </div>
  </section>
</template>
