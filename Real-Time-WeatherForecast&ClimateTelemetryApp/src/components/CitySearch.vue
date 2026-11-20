<script setup>
import { ref, watch, onMounted, onUnmounted } from 'vue'
import { Search, MapPin, LoaderCircle, X, CornerDownLeft } from '@lucide/vue'
import { useCitySearch } from '../composables/useWeather.js'
const emit = defineEmits(['select'])
const { query, results, loading, error, searched, run, reset, cancel } =
  useCitySearch()
const root = ref(null),
  input = ref(null),
  open = ref(false),
  active = ref(-1),
  hint = ref('')
let timer
function close() {
  open.value = false
  active.value = -1
  clearTimeout(timer)
  cancel()
}
function execute() {
  clearTimeout(timer)
  active.value = -1
  open.value = true
  hint.value =
    Array.from(query.value.trim()).length < 2
      ? 'Enter at least two characters to search.'
      : ''
  return run()
}
watch(query, () => {
  clearTimeout(timer)
  cancel()
  active.value = -1
  results.value = []
  error.value = null
  searched.value = false
  hint.value = ''
  open.value = query.value.length > 0
  if (Array.from(query.value.trim()).length >= 2)
    timer = setTimeout(execute, 350)
})
function clearSearch() {
  reset()
  input.value?.focus({ preventScroll: true })
}
function handleFocusOut(event) {
  if (!root.value?.contains(event.relatedTarget)) close()
}
function retrySearch() {
  input.value?.focus({ preventScroll: true })
  execute()
}
function choose(city) {
  emit('select', city)
  reset()
  close()
  input.value?.focus({ preventScroll: true })
}
function keyboard(event) {
  if (event.key === 'Escape') {
    event.preventDefault()
    close()
    return
  }
  if (['ArrowDown', 'ArrowUp'].includes(event.key)) {
    event.preventDefault()
    open.value = true
    if (!results.value.length) return
    const step = event.key === 'ArrowDown' ? 1 : -1
    active.value =
      (active.value + step + results.value.length) % results.value.length
    requestAnimationFrame(() =>
      document
        .getElementById(`city-option-${active.value}`)
        ?.scrollIntoView({ block: 'nearest' }),
    )
  }
  if (event.key === 'Enter' && open.value && active.value >= 0) {
    event.preventDefault()
    choose(results.value[active.value])
  }
}
function outside(event) {
  if (!root.value?.contains(event.target)) close()
}
function focus() {
  if (query.value.trim().length >= 2) {
    open.value = true
    if (!searched.value && !loading.value) execute()
  }
}
onMounted(() => document.addEventListener('pointerdown', outside))
onUnmounted(() => {
  clearTimeout(timer)
  cancel()
  document.removeEventListener('pointerdown', outside)
})
</script>
<template>
  <div ref="root" class="city-search" @focusout="handleFocusOut">
    <form role="search" class="search-form" @submit.prevent="execute">
      <label class="sr-only" for="city-query">Search cities worldwide</label>
      <Search :size="19" aria-hidden="true" class="search-leading" />
      <input
        id="city-query"
        ref="input"
        v-model="query"
        type="search"
        role="combobox"
        autocomplete="off"
        spellcheck="false"
        maxlength="100"
        placeholder="Search any city…"
        aria-autocomplete="list"
        :aria-expanded="open && results.length > 0"
        :aria-controls="open && results.length ? 'city-results' : undefined"
        :aria-activedescendant="
          open && active >= 0 ? `city-option-${active}` : undefined
        "
        aria-describedby="search-help"
        @keydown="keyboard"
        @focus="focus"
      />
      <span id="search-help" class="sr-only"
        >Type at least two characters. Use arrow keys to explore results and
        Enter to select a city. Escape closes results.</span
      >
      <LoaderCircle
        v-if="loading"
        class="spin search-loader"
        :size="18"
        aria-hidden="true"
      />
      <button
        v-else-if="query"
        type="button"
        class="icon-button search-clear"
        aria-label="Clear city search"
        @click="clearSearch"
      >
        <X :size="16" aria-hidden="true" />
      </button>
      <button type="submit" class="search-submit" aria-label="Search cities">
        <CornerDownLeft :size="15" aria-hidden="true" />
      </button>
    </form>
    <div v-if="open" class="search-popover">
      <p v-if="loading" class="search-feedback" role="status">
        Finding places around the world…
      </p>
      <div v-else-if="error" class="search-feedback">
        <p role="alert">{{ error.message }}</p>
        <button type="button" class="text-button" @click="retrySearch">
          Retry search
        </button>
      </div>
      <ul
        v-else-if="results.length"
        id="city-results"
        role="listbox"
        aria-label="Matching cities"
      >
        <li
          v-for="(city, index) in results"
          :id="`city-option-${index}`"
          :key="city.id"
          role="option"
          :aria-selected="active === index"
          class="city-option"
          @pointermove="active = index"
          @mousedown.prevent
          @click="choose(city)"
        >
          <MapPin :size="19" aria-hidden="true" />
          <div>
            <strong>{{ city.name }}</strong><span>{{
              [city.region, city.country].filter(Boolean).join(', ')
            }}</span>
          </div>
          <CornerDownLeft
            v-if="active === index"
            :size="15"
            aria-hidden="true"
          />
        </li>
      </ul>
      <p v-else-if="searched" class="search-feedback" role="status">
        No cities found. Try a different spelling or add a country.
      </p>
      <p v-else class="search-feedback">
        {{ hint || 'Enter at least two characters to search.' }}
      </p>
      <div v-if="results.length" class="search-bottom">
        <span>Choose your location</span
        ><span>↑ ↓ to explore · Enter to select</span>
      </div>
    </div>
    <p class="sr-only" role="status" aria-live="polite">
      {{
        loading
          ? 'Searching for cities.'
          : searched
            ? `${results.length} city results available.`
            : ''
      }}
    </p>
  </div>
</template>
