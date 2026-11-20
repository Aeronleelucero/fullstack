<script setup>
import { Search, SlidersHorizontal, X } from '@lucide/vue'
import { useTasksStore } from '../stores/tasks.js'
import { CATEGORIES, PRIORITIES } from '../utils/taskSchema.js'
const store = useTasksStore()
const statuses = [
  { value: 'all', label: 'All tasks' },
  { value: 'active', label: 'Active' },
  { value: 'completed', label: 'Completed' },
]
</script>
<template>
  <div class="task-filters">
    <div class="filters-first-row">
      <div class="status-tabs" role="group" aria-label="Filter by task status">
        <button
          v-for="status in statuses"
          :key="status.value"
          type="button"
          :aria-pressed="store.filters.status === status.value"
          :class="{ selected: store.filters.status === status.value }"
          @click="store.setFilter('status', status.value)"
        >
          {{ status.label }}
        </button>
      </div>
      <div class="search-field">
        <Search :size="16" aria-hidden="true" /><label
          for="task-search"
          class="sr-only"
          >Search task titles and descriptions</label
        ><input
          id="task-search"
          :value="store.filters.search"
          @input="store.setFilter('search', $event.target.value)"
          type="search"
          placeholder="Search tasks…"
          autocomplete="off"
        />
      </div>
    </div>
    <div class="filters-second-row">
      <span class="filter-caption"
        ><SlidersHorizontal :size="14" aria-hidden="true" /> Filter by</span
      >
      <div class="select-wrap filter-select">
        <label for="filter-category" class="sr-only">Filter by category</label
        ><select
          id="filter-category"
          :value="store.filters.category"
          @change="store.setFilter('category', $event.target.value)"
        >
          <option value="all">All categories</option>
          <option v-for="category in CATEGORIES" :key="category">
            {{ category }}
          </option>
        </select>
      </div>
      <div class="select-wrap filter-select">
        <label for="filter-priority" class="sr-only">Filter by priority</label
        ><select
          id="filter-priority"
          :value="store.filters.priority"
          @change="store.setFilter('priority', $event.target.value)"
        >
          <option value="all">All priorities</option>
          <option v-for="priority in PRIORITIES" :key="priority">
            {{ priority }}
          </option>
        </select>
      </div>
      <div class="select-wrap filter-select">
        <label for="filter-due" class="sr-only">Filter by due date</label
        ><select
          id="filter-due"
          :value="store.filters.due"
          @change="store.setFilter('due', $event.target.value)"
        >
          <option value="all">All dates</option>
          <option value="today">Due today</option>
          <option value="upcoming">Upcoming</option>
          <option value="overdue">Overdue</option>
          <option value="none">No due date</option>
        </select>
      </div>
      <button
        v-if="store.hasFilters"
        type="button"
        class="clear-filters"
        @click="store.resetFilters"
      >
        <X :size="13" aria-hidden="true" /> Clear
      </button>
    </div>
  </div>
</template>
