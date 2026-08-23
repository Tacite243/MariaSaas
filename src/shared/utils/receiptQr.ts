/** Payload compact de contrôle pour QR ticket (scannable offline) */
export interface ReceiptQrPayload {
  saleId: string
  reference: string
  totalUsdCents: number
  exchangeRate: number
  date: string
}

export const buildReceiptControlPayload = (data: ReceiptQrPayload): string => {
  const compact = {
    v: 1,
    app: 'MariaSaaS',
    id: data.saleId,
    ref: data.reference,
    usd: data.totalUsdCents,
    rate: data.exchangeRate,
    at: data.date
  }
  return JSON.stringify(compact)
}

/** Payload QR produit = code-barres EAN/CIP scannable au POS */
export const buildProductQrPayload = (code: string): string => code.trim()
