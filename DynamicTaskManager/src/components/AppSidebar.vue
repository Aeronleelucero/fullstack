<script setup>
import { computed, ref, watch, nextTick, onMounted, onUnmounted } from 'vue'
import {
  Layers,
  LayoutDashboard,
  ListTodo,
  Sun,
  CalendarDays,
  CircleCheck,
  BriefcaseBusiness,
  UserRound,
  GraduationCap,
  X,
  Download,
  ShieldCheck,
} from '@lucide/vue'
import { useTasksStore } from '../stores/tasks.js'
const store = useTasksStore()
const props = defineProps({ open: Boolean })
const emit = defineEmits(['close', 'export'])
const sidebar = ref(null)
let previousFocus, overflow
const items = computed(() => [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard, count: null },
  { id: 'all', label: 'All tasks', icon: ListTodo, count: store.stats.total },
  { id: 'today', label: 'Today', icon: Sun, count: store.stats.today },
  {
    id: 'upcoming',
    label: 'Upcoming',
    icon: CalendarDays,
    count: store.stats.upcoming,
  },
  {
    id: 'completed',
    label: 'Completed',
    icon: CircleCheck,
    count: store.stats.completed,
  },
])
const categoryIcons = {
  Work: BriefcaseBusiness,
  Personal: UserRound,
  Study: GraduationCap,
}
function select(id) {
  store.setView(id)
  emit('close')
}
watch(
  () => props.open,
  async (open) => {
    if (open) {
      previousFocus = document.activeElement
      overflow = document.body.style.overflow
      document.body.style.overflow = 'hidden'
      await nextTick()
      sidebar.value.querySelector('.sidebar-close')?.focus()
    } else {
      document.body.style.overflow = overflow || ''
      if (previousFocus?.getClientRects().length)
        previousFocus.focus({ preventScroll: true })
    }
  },
)
function keyboard(event) {
  if (!props.open) return
  if (event.key === 'Escape') emit('close')
  if (event.key === 'Tab') {
    const items = [...sidebar.value.querySelectorAll('button')].filter(
      (el) => el.getClientRects().length,
    )
    const first = items[0],
      last = items.at(-1)
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault()
      last?.focus()
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault()
      first?.focus()
    }
  }
}
function resize() {
  if (window.innerWidth >= 1100 && props.open) emit('close')
}
onMounted(() => window.addEventListener('resize', resize))
onUnmounted(() => {
  window.removeEventListener('resize', resize)
  if (props.open) document.body.style.overflow = overflow || ''
})
</script>
<template>
  <div
    v-if="open"
    class="sidebar-backdrop"
    aria-hidden="true"
    @click="emit('close')"
  ></div>
  <aside
    id="app-sidebar"
    ref="sidebar"
    class="app-sidebar"
    :class="{ 'sidebar-open': open }"
    :role="open ? 'dialog' : undefined"
    :aria-modal="open ? true : undefined"
    aria-label="Workspace navigation"
    @keydown="keyboard"
  >
    <div class="sidebar-brand">
      <button
        type="button"
        class="brand"
        aria-label="Momentum overview"
        @click="select('overview')"
      >
        <span class="brand-icon"><Layers :size="22" aria-hidden="true" /></span
        ><span>momentum<span class="brand-period">.</span></span></button
      ><button
        type="button"
        class="icon-button sidebar-close"
        aria-label="Close navigation"
        @click="emit('close')"
      >
        <X :size="20" aria-hidden="true" />
      </button>
    </div>
    <div class="workspace-label">
      <span class="workspace-avatar">M</span>
      <div><strong>My workspace</strong><span>Personal space</span></div>
    </div>
    <nav aria-label="Main navigation">
      <p class="nav-label">WORKSPACE</p>
      <button
        v-for="item in items"
        :key="item.id"
        type="button"
        class="sidebar-link"
        :class="{ active: store.view === item.id }"
        :aria-current="store.view === item.id ? 'page' : undefined"
        @click="select(item.id)"
      >
        <component :is="item.icon" :size="18" aria-hidden="true" /><span>{{
          item.label
        }}</span
        ><span v-if="item.count !== null" class="nav-count">{{
          item.count
        }}</span>
      </button>
      <p class="nav-label category-nav-label">CATEGORIES</p>
      <button
        v-for="category in store.categoryStats"
        :key="category.name"
        type="button"
        class="sidebar-link category-link"
        :class="[
          { active: store.view === category.name },
          category.name.toLowerCase(),
        ]"
        :aria-current="store.view === category.name ? 'page' : undefined"
        @click="select(category.name)"
      >
        <component
          :is="categoryIcons[category.name]"
          :size="17"
          aria-hidden="true"
        /><span>{{ category.name }}</span
        ><span class="nav-count">{{ category.total }}</span>
      </button>
    </nav>
    <div class="sidebar-bottom">
      <div class="sidebar-progress">
        <div class="sidebar-progress-top">
          <span>Your momentum</span
          ><strong>{{ store.stats.percentage }}%</strong>
        </div>
        <div
          class="thin-progress"
          role="progressbar"
          aria-label="Task completion"
          :aria-valuenow="store.stats.percentage"
          aria-valuemin="0"
          aria-valuemax="100"
        >
          <span :style="{ width: `${store.stats.percentage}%` }"></span>
        </div>
        <p>
          {{ store.stats.completed }} of {{ store.stats.total }} tasks completed
        </p>
      </div>
      <button type="button" class="sidebar-export" @click="emit('export')">
        <Download :size="17" aria-hidden="true" /> Export task backup
      </button>
      <div class="privacy-note">
        <ShieldCheck :size="16" aria-hidden="true" />
        <div>
          <strong>Just your space.</strong
          ><span>Your tasks stay in this browser.</span>
        </div>
      </div>
    </div>
  </aside>
</template>
