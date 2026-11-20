import { defineStore } from 'pinia'
import { computed, ref, shallowRef } from 'vue'
import { fetchProducts } from '../services/productApi.js'
import { CATEGORIES, categoryLabel } from '../utils/categories.js'
export const useProductsStore = defineStore('products', () => {
  const products = shallowRef([]),
    status = ref('idle'),
    error = shallowRef(null),
    skipped = ref(0)
  const search = ref(''),
    category = ref('all'),
    sort = ref('catalog')
  let controller,
    generation = 0
  const ready = computed(() => status.value === 'ready')
  const byId = computed(
    () => new Map(products.value.map((product) => [product.id, product])),
  )
  const categories = computed(() =>
    CATEGORIES.map((option) => ({
      ...option,
      count: products.value.filter((product) => product.category === option.id)
        .length,
    })),
  )
  const filtered = computed(() => {
    const query = search.value.trim().toLocaleLowerCase()
    const matches = products.value.filter(
      (product) =>
        (category.value === 'all' || product.category === category.value) &&
        (!query ||
          `${product.title}\n${product.description}\n${product.category}\n${categoryLabel(product.category)}`
            .toLocaleLowerCase()
            .includes(query)),
    )
    if (sort.value === 'price-asc')
      matches.sort((a, b) => a.priceCents - b.priceCents || a.id - b.id)
    if (sort.value === 'price-desc')
      matches.sort((a, b) => b.priceCents - a.priceCents || a.id - b.id)
    if (sort.value === 'rating')
      matches.sort((a, b) => b.rating.rate - a.rating.rate || a.id - b.id)
    return matches
  })
  async function load(fetcher = fetchProducts) {
    const current = ++generation
    controller?.abort()
    controller = new AbortController()
    status.value = 'loading'
    error.value = null
    products.value = []
    skipped.value = 0
    try {
      const result = await fetcher({ signal: controller.signal })
      if (current !== generation) return
      products.value = result.products
      skipped.value = result.skipped
      status.value = 'ready'
    } catch (failure) {
      if (current !== generation || failure.name === 'AbortError') return
      status.value = 'error'
      error.value = {
        code: failure.code || 'network',
        message:
          failure.message ||
          'The catalog could not be loaded. Please try again.',
      }
    }
  }
  function setCategory(value) {
    if (value === 'all' || CATEGORIES.some((option) => option.id === value))
      category.value = value
  }
  function resetFilters() {
    search.value = ''
    category.value = 'all'
    sort.value = 'catalog'
  }
  function dispose() {
    generation++
    controller?.abort()
  }
  return {
    products,
    status,
    error,
    ready,
    byId,
    skipped,
    search,
    category,
    sort,
    filtered,
    categories,
    load,
    setCategory,
    resetFilters,
    dispose,
  }
})
