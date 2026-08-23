/** Précision financière : USD en centimes, CDF en francs entiers */

export type CurrencyCode = 'USD' | 'CDF'

export const toUsdCents = (amount: number): number => Math.round(amount * 100)

export const fromUsdCents = (cents: number): number => cents / 100

export const toCdfMinor = (amount: number): number => Math.round(amount)

export const fromCdfMinor = (minor: number): number => minor

export const sumDenominations = (
  entries: { denomination: number; quantity: number }[],
  currency: CurrencyCode
): number => {
  return entries.reduce((sum, e) => {
    const unitMinor = currency === 'USD' ? toUsdCents(e.denomination) : toCdfMinor(e.denomination)
    return sum + unitMinor * e.quantity
  }, 0)
}

export const convertUsdCentsToCdf = (usdCents: number, rate: number): number =>
  Math.round(fromUsdCents(usdCents) * rate)

export const convertCdfToUsdCents = (cdfMinor: number, rate: number): number =>
  rate > 0 ? toUsdCents(cdfMinor / rate) : 0

export const calcDiscrepancy = (declared: number, system: number): number => declared - system

export const formatUsdCents = (cents: number): string => fromUsdCents(cents).toFixed(2)

export const formatCdf = (minor: number): string =>
  minor.toLocaleString('fr-CD', { maximumFractionDigits: 0 })
