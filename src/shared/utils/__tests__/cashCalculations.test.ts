import { describe, it, expect } from 'vitest'
import {
  toUsdCents,
  fromUsdCents,
  sumDenominations,
  calcDiscrepancy,
  convertUsdCentsToCdf,
  convertCdfToUsdCents
} from '../money'

describe('money / cashCalculations', () => {
  it('convertit USD en centimes sans erreur flottante', () => {
    expect(toUsdCents(10.5)).toBe(1050)
    expect(fromUsdCents(1050)).toBe(10.5)
  })

  it('somme les coupures USD en centimes', () => {
    const total = sumDenominations(
      [
        { denomination: 20, quantity: 2 },
        { denomination: 5, quantity: 1 }
      ],
      'USD'
    )
    expect(total).toBe(4500) // 40 + 5 = 45 USD
  })

  it('somme les coupures CDF en francs entiers', () => {
    const total = sumDenominations(
      [
        { denomination: 10000, quantity: 3 },
        { denomination: 500, quantity: 2 }
      ],
      'CDF'
    )
    expect(total).toBe(31000)
  })

  it('calcule l\'écart de caisse (discrepancy)', () => {
    expect(calcDiscrepancy(10000, 9950)).toBe(50)
    expect(calcDiscrepancy(9950, 9950)).toBe(0)
  })

  it('convertit USD vers CDF avec taux figé', () => {
    expect(convertUsdCentsToCdf(100, 2300)).toBe(2300) // 1 USD
    expect(convertCdfToUsdCents(2300, 2300)).toBe(100)
  })
})
