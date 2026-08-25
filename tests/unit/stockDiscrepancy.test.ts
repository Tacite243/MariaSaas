import { describe, it, expect } from 'vitest'
import { calcAuditDiscrepancy, calcLossValues } from '@shared/utils/expiry'

describe('stockDiscrepancy', () => {
  const rate = 2300

  it('calcule l\'écart quantitatif', () => {
    expect(calcAuditDiscrepancy(10, 8)).toBe(-2)
    expect(calcAuditDiscrepancy(10, 12)).toBe(2)
  })

  it('valorise les pertes en USD et CDF', () => {
    const loss = calcLossValues(-2, 5, rate)
    expect(loss.lossValueUsd).toBe(10)
    expect(loss.lossValueCdf).toBe(23000)
    expect(loss.gainValueUsd).toBe(0)
  })

  it('valorise les excédents', () => {
    const gain = calcLossValues(3, 4, rate)
    expect(gain.gainValueUsd).toBe(12)
    expect(gain.gainValueCdf).toBe(27600)
    expect(gain.lossValueUsd).toBe(0)
  })
})
