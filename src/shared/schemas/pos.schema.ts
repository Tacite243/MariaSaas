import { z } from 'zod'

export const USD_DENOMINATIONS = [1, 5, 10, 20, 50, 100] as const
export const CDF_DENOMINATIONS = [500, 1000, 5000, 10000, 20000] as const

export const denominationEntrySchema = z.object({
  denomination: z.number().int().positive(),
  quantity: z.number().int().min(0)
})

export const cashSessionOpenSchema = z.object({
  cashierId: z.string().uuid(),
  exchangeRate: z.number().positive(),
  initialUsdCents: z.number().int().min(0).default(0),
  initialCdfCents: z.number().int().min(0).default(0)
})

export const cashSessionCloseSchema = z.object({
  sessionId: z.string().uuid(),
  cashierId: z.string().uuid(),
  usdDenominations: z.array(denominationEntrySchema),
  cdfDenominations: z.array(denominationEntrySchema)
})

export const printSettingsSchema = z.object({
  defaultPrinter: z.string().optional().nullable(),
  receiptWidth: z.enum(['58', '80']).default('80'),
  pharmacyName: z.string().min(1).default('Pharmacie Maria'),
  pharmacyAddress: z.string().optional().nullable(),
  pharmacyPhone: z.string().optional().nullable(),
  pharmacyRccm: z.string().optional().nullable(),
  pharmacyIdNat: z.string().optional().nullable()
})

export const receiptItemSchema = z.object({
  name: z.string(),
  dci: z.string().optional().nullable(),
  quantity: z.number().int().positive(),
  unitPriceMinor: z.number().int().min(0),
  totalMinor: z.number().int().min(0),
  currency: z.enum(['USD', 'CDF'])
})

export const printReceiptSchema = z.object({
  saleId: z.string().uuid(),
  reference: z.string(),
  date: z.string(),
  cashierName: z.string(),
  items: z.array(receiptItemSchema).min(1),
  subTotalUsdCents: z.number().int().min(0),
  subTotalCdf: z.number().int().min(0),
  exchangeRate: z.number().positive(),
  paymentMethod: z.string(),
  amountTenderedUsdCents: z.number().int().min(0).optional(),
  amountTenderedCdf: z.number().int().min(0).optional(),
  changeUsdCents: z.number().int().min(0).optional(),
  changeCdf: z.number().int().min(0).optional(),
  controlQrText: z.string()
})

export const productByCodeSchema = z.object({
  code: z.string().min(1).max(20)
})

export type CashSessionOpenInput = z.infer<typeof cashSessionOpenSchema>
export type CashSessionCloseInput = z.infer<typeof cashSessionCloseSchema>
export type PrintSettingsInput = z.infer<typeof printSettingsSchema>
export type PrintReceiptInput = z.infer<typeof printReceiptSchema>
export type DenominationEntry = z.infer<typeof denominationEntrySchema>
