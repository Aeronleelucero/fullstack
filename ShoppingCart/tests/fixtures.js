// Synthetic products are used only by automated tests. Production never imports this module.
export const rawProducts = [
  {
    id: 1,
    title: 'Test Canvas Backpack',
    price: 19.99,
    description: 'A synthetic blue travel bag for deterministic tests.',
    category: "men's clothing",
    image: 'https://fakestoreapi.com/img/test-bag.png',
    rating: { rate: 4.2, count: 12 },
  },
  {
    id: 2,
    title: 'Test Everyday Tee',
    price: 30,
    description: 'Cotton study fixture.',
    category: "women's clothing",
    image: 'https://fakestoreapi.com/img/test-tee.png',
    rating: { rate: 3.5, count: 7 },
  },
  {
    id: 3,
    title: 'Test Silver Ring',
    price: 100,
    description: 'A synthetic silver accessory fixture.',
    category: 'jewelery',
    image: 'https://fakestoreapi.com/img/test-ring.png',
    rating: { rate: 4.8, count: 24 },
  },
  {
    id: 4,
    title: 'Test Audio Headphones',
    price: 15.25,
    description: 'Electronics fixture for blue sound filtering.',
    category: 'electronics',
    image: 'https://fakestoreapi.com/img/test-audio.png',
    rating: { rate: 4.6, count: 16 },
  },
]
export const fixtureSvg =
  '<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200"><rect x="55" y="35" width="90" height="130" rx="18" fill="#6550d6"/><path d="M80 45V30a20 20 0 0 1 40 0v15" stroke="#26212f" fill="none" stroke-width="8"/></svg>'
export function memoryStorage(raw = null) {
  return {
    raw,
    writes: 0,
    getItem() {
      return this.raw
    },
    setItem(key, value) {
      this.writes++
      this.raw = value
    },
  }
}
export function deferred() {
  let resolve, reject
  const promise = new Promise((yes, no) => {
    resolve = yes
    reject = no
  })
  return { promise, resolve, reject }
}
