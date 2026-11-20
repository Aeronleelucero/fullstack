export const CATEGORIES = Object.freeze([
  { id: "men's clothing", label: "Men's Clothing", short: 'For him' },
  { id: "women's clothing", label: "Women's Clothing", short: 'For her' },
  { id: 'jewelery', label: 'Jewelry', short: 'The finishing touch' },
  { id: 'electronics', label: 'Electronics', short: 'Everyday tech' },
])
export function categoryLabel(id) {
  return CATEGORIES.find((category) => category.id === id)?.label || id
}
