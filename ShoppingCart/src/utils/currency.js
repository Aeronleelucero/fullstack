const usd = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
})
export function toCents(price) {
  if (!Number.isFinite(price) || price < 0)
    throw new Error('Invalid product price')
  const match = String(price).match(/^(\d+)(?:\.(\d{1,2}))?$/)
  if (!match) throw new Error('Price must have at most two decimal places')
  const cents = Number(match[1]) * 100 + Number((match[2] || '').padEnd(2, '0'))
  if (!Number.isSafeInteger(cents) || cents > 100_000_000)
    throw new Error('Product price exceeds supported range')
  return cents
}
export function formatMoney(cents) {
  if (!Number.isSafeInteger(cents) || cents < 0)
    throw new Error('Invalid amount in cents')
  return usd.format(cents / 100)
}
