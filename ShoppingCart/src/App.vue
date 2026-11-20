<script setup>
import { nextTick, onMounted, onUnmounted, ref } from 'vue'
import { Check, X, TriangleAlert } from '@lucide/vue'
import AppNavbar from './components/AppNavbar.vue'
import HeroSection from './components/HeroSection.vue'
import CategorySection from './components/CategorySection.vue'
import ProductGrid from './components/ProductGrid.vue'
import ProductModal from './components/ProductModal.vue'
import CartDrawer from './components/CartDrawer.vue'
import CheckoutModal from './components/CheckoutModal.vue'
import OrderConfirmation from './components/OrderConfirmation.vue'
import ConfirmDialog from './components/ConfirmDialog.vue'
import MobileMenu from './components/MobileMenu.vue'
import AppFooter from './components/AppFooter.vue'
import { useProductsStore } from './stores/products.js'
import { useCartStore } from './stores/cart.js'
import { useTheme } from './composables/useTheme.js'
import { downloadJSON, CART_KEY } from './utils/storage.js'
const products = useProductsStore(),
  cart = useCartStore(),
  { theme, toggle, warning } = useTheme()
cart.initialize()
const overlay = ref(null),
  selectedProduct = ref(null),
  toast = ref(''),
  toastError = ref(false),
  cartError = ref(''),
  recoveryError = ref('')
let toastTimer
function notify(message, error = false) {
  toast.value = message
  toastError.value = error
  clearTimeout(toastTimer)
  toastTimer = setTimeout(() => (toast.value = ''), 4500)
}
function showProduct(product) {
  selectedProduct.value = product
  overlay.value = 'product'
}
function add(product) {
  try {
    cart.addToCart(product, 1)
    notify('A good find. Added to your cart.')
  } catch (error) {
    notify(error.message, true)
  }
}
async function showOverlay(value) {
  overlay.value = null
  await nextTick()
  overlay.value = value
}
function quantity(id, count) {
  cartError.value = ''
  try {
    cart.updateQuantity(id, count)
  } catch (error) {
    cartError.value = error.message
  }
}
async function remove(id) {
  cartError.value = ''
  try {
    cart.removeFromCart(id)
    await nextTick()
    document.getElementById('cart-title')?.focus({ preventScroll: true })
  } catch (error) {
    cartError.value = error.message
  }
}
function exportCart(original = false) {
  try {
    downloadJSON(
      cart.exportData(original),
      original ? 'nexora-original-cart.json' : 'nexora-cart-backup.json',
    )
    notify('Cart backup download prepared.')
  } catch {
    notify(
      'The backup could not be downloaded. Browser downloads may be restricted.',
      true,
    )
  }
}
function recovery(reset) {
  recoveryError.value = ''
  showOverlay(reset ? 'reset' : 'reload')
}
function confirmRecovery() {
  if (overlay.value === 'reset' && !cart.resetStorage()) {
    recoveryError.value = cart.message
    return
  }
  if (overlay.value === 'reload') cart.reload()
  showOverlay('cart')
}
function storageChanged(event) {
  if (event.key === CART_KEY || event.key === null) cart.checkExternalStorage()
}
onMounted(() => {
  products.load()
  window.addEventListener('storage', storageChanged)
})
onUnmounted(() => {
  clearTimeout(toastTimer)
  products.dispose()
  window.removeEventListener('storage', storageChanged)
})
</script>
<template>
  <a class="skip-link" href="#main-content">Skip to products</a
  ><AppNavbar
    :quantity="cart.quantity"
    :theme="theme"
    @cart="overlay = 'cart'"
    @theme="toggle"
    @menu="overlay = 'menu'"
  />
  <main id="main-content" tabindex="-1" class="main-content">
    <p v-if="warning" class="page-notice" role="status">{{ warning }}</p>
    <div v-if="cart.readOnly" class="page-notice">
      <TriangleAlert :size="18" aria-hidden="true" /><span>{{
        cart.message
      }}</span
      ><button type="button" @click="overlay = 'cart'">
        Review saved cart
      </button>
    </div>
    <HeroSection
      :products="products.products"
      :ready="products.ready"
    /><CategorySection /><ProductGrid
      @details="showProduct"
      @add="add"
    /><AppFooter />
  </main>
  <div
    v-if="toast"
    class="toast"
    :class="{ 'toast-error': toastError }"
    :role="toastError ? 'alert' : 'status'"
  >
    <Check v-if="!toastError" :size="18" aria-hidden="true" /><span>{{
      toast
    }}</span
    ><button
      type="button"
      class="icon-button"
      aria-label="Dismiss notification"
      @click="toast = ''"
    >
      <X :size="16" aria-hidden="true" />
    </button>
  </div>
  <p class="sr-only" role="status" aria-live="polite" aria-atomic="true">
    {{ cart.announcement }}
  </p>
  <ProductModal
    v-if="overlay === 'product'"
    :product="selectedProduct"
    @close="overlay = null"
  /><CartDrawer
    v-if="overlay === 'cart'"
    :error="cartError"
    @close="overlay = null"
    @checkout="showOverlay('checkout')"
    @quantity="quantity"
    @remove="remove"
    @reset="recovery(true)"
    @reload="recovery(false)"
    @export="exportCart"
  /><CheckoutModal
    v-if="overlay === 'checkout'"
    @close="showOverlay('cart')"
    @confirmed="showOverlay('order')"
    @reset="recovery(true)"
    @reload="recovery(false)"
    @export="exportCart"
  /><OrderConfirmation
    v-if="overlay === 'order' && cart.lastOrder"
    :order="cart.lastOrder"
    @close="overlay = null"
  /><ConfirmDialog
    v-if="['reset', 'reload'].includes(overlay)"
    :reset="overlay === 'reset'"
    :error="recoveryError"
    @confirm="confirmRecovery"
    @close="showOverlay('cart')"
  /><MobileMenu v-if="overlay === 'menu'" @close="overlay = null" />
</template>
