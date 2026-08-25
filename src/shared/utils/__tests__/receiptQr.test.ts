import { describe, it, expect } from 'vitest'
import { buildReceiptControlPayload, buildProductQrPayload } from '../receiptQr'

describe('receiptQr', () => {
  it('génère un payload JSON compact pour le ticket', () => {
    const payload = buildReceiptControlPayload({
      saleId: 'abc-123',
      reference: 'TKT-20260223-0042',
      totalUsdCents: 1550,
      exchangeRate: 2300,
      date: '2026-02-23T10:00:00.000Z'
    })

    const parsed = JSON.parse(payload)
    expect(parsed.app).toBe('MariaSaaS')
    expect(parsed.id).toBe('abc-123')
    expect(parsed.ref).toBe('TKT-20260223-0042')
    expect(parsed.usd).toBe(1550)
    expect(parsed.rate).toBe(2300)
  })

  it('encode le code produit tel quel pour scan POS', () => {
    expect(buildProductQrPayload(' 2012345678901 ')).toBe('2012345678901')
  })
})
