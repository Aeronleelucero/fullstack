export const MAX_QUANTITY = 99
export const PRICING_RULES = Object.freeze({
  taxBasisPoints: 800,
  shippingCents: 599,
  freeShippingThresholdCents: 10000,
})
export function validQuantity(value) {
  return Number.isInteger(value) && value >= 1 && value <= MAX_QUANTITY
}
export function calculatePricing(lines, rules = PRICING_RULES) {
  let subtotalCents = 0
  for (const line of lines) {
    if (
      !validQuantity(line.quantity) ||
      !Number.isSafeInteger(line.priceCents) ||
      line.priceCents < 0
    )
      throw new Error('Invalid cart line')
    subtotalCents += line.priceCents * line.quantity
  }
  if (!Number.isSafeInteger(subtotalCents))
    throw new Error('Cart total exceeds supported range')
  if (
    ![
      rules.taxBasisPoints,
      rules.shippingCents,
      rules.freeShippingThresholdCents,
    ].every((value) => Number.isSafeInteger(value) && value >= 0)
  )
    throw new Error('Invalid demo pricing rules')
  const taxCents = Number(
    (BigInt(subtotalCents) * BigInt(rules.taxBasisPoints) + 5000n) / 10000n,
  )
  const shippingCents =
    !lines.length || subtotalCents >= rules.freeShippingThresholdCents
      ? 0
      : rules.shippingCents
  const totalCents = subtotalCents + taxCents + shippingCents
  if (!Number.isSafeInteger(totalCents))
    throw new Error('Order total exceeds supported range')
  return { subtotalCents, taxCents, shippingCents, totalCents }
}
