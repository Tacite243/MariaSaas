import { describe, it, expect } from 'vitest'
import {
  daysUntilExpiry,
  getExpirySeverity,
  getFefoLot,
  isPosExpiryWarning
} from '@shared/utils/expiry'
import { ExpirySeverity } from '@shared/types/stock.types'

describe('fefoExpiry', () => {
  const now = new Date('2026-06-01')

  it('calcule les jours jusqu\'à péremption', () => {
    expect(daysUntilExpiry('2026-06-15', now)).toBe(14)
    expect(daysUntilExpiry('2026-05-01', now)).toBeLessThan(0)
  })

  it('classifie les paliers de sévérité', () => {
    expect(getExpirySeverity(15)).toBe(ExpirySeverity.CRITICAL)
    expect(getExpirySeverity(60)).toBe(ExpirySeverity.WARNING)
    expect(getExpirySeverity(120)).toBe(ExpirySeverity.WATCH)
    expect(getExpirySeverity(200)).toBe(ExpirySeverity.OK)
    expect(getExpirySeverity(-1)).toBe(ExpirySeverity.EXPIRED)
  })

  it('sélectionne le lot FEFO (péremption la plus proche)', () => {
    const lot = getFefoLot([
      { quantity: 5, expiryDate: '2026-12-01' },
      { quantity: 3, expiryDate: '2026-08-01' },
      { quantity: 0, expiryDate: '2026-07-01' }
    ])
    expect(lot?.expiryDate).toBe('2026-08-01')
  })

  it('avertit le POS sous 60 jours', () => {
    expect(isPosExpiryWarning(45)).toBe(true)
    expect(isPosExpiryWarning(90)).toBe(false)
  })
})
