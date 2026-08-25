import { z } from 'zod'

export const EXPIRY_TIERS = {
  CRITICAL_MAX_DAYS: 30,
  WARNING_MAX_DAYS: 90,
  WATCH_MAX_DAYS: 180,
  POS_WARNING_DAYS: 60
} as const

export const expirySeveritySchema = z.enum(['CRITICAL', 'WARNING', 'WATCH', 'OK', 'EXPIRED'])

export const writeOffSchema = z.object({
  stockLotId: z.string().uuid(),
  quantity: z.number().int().positive(),
  reason: z.enum(['EXPIRY_DESTRUCTION', 'SUPPLIER_RETURN', 'OTHER']),
  notes: z.string().min(3, 'Motif obligatoire'),
  performedById: z.string().uuid()
})

export const prescriptionInputSchema = z.object({
  productId: z.string().uuid(),
  prescriberName: z.string().min(2),
  prescriberQualification: z.string().min(2),
  prescriberLicense: z.string().optional(),
  patientName: z.string().min(2),
  patientAge: z.number().int().min(0).max(150).optional(),
  patientIdDocument: z.string().optional(),
  prescriptionDate: z.coerce.date(),
  quantityDispensed: z.number().int().positive()
})

export const createPrescriptionsSchema = z.object({
  saleId: z.string().uuid().optional(),
  validatedById: z.string().uuid(),
  entries: z.array(prescriptionInputSchema).min(1)
})

export const prescriptionFilterSchema = z.object({
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
  productId: z.string().uuid().optional(),
  prescriberName: z.string().optional(),
  narcoticOnly: z.boolean().optional()
})

export const stockAuditCreateSchema = z.object({
  createdById: z.string().uuid(),
  exchangeRate: z.number().positive()
})

export const stockAuditItemSchema = z.object({
  productId: z.string().uuid(),
  stockLotId: z.string().uuid().optional(),
  countedQuantity: z.number().int().min(0)
})

export const stockAuditAddItemsSchema = z.object({
  auditId: z.string().uuid(),
  items: z.array(stockAuditItemSchema).min(1),
  exchangeRate: z.number().positive()
})

export const stockAuditCompleteSchema = z.object({
  auditId: z.string().uuid(),
  completedById: z.string().uuid(),
  userRole: z.string()
})

export const expiringBatchesFilterSchema = z.object({
  maxDays: z.number().int().positive().optional()
})

export type WriteOffInput = z.infer<typeof writeOffSchema>
export type PrescriptionInput = z.infer<typeof prescriptionInputSchema>
export type CreatePrescriptionsInput = z.infer<typeof createPrescriptionsSchema>
export type PrescriptionFilterInput = z.infer<typeof prescriptionFilterSchema>
export type StockAuditCreateInput = z.infer<typeof stockAuditCreateSchema>
export type StockAuditAddItemsInput = z.infer<typeof stockAuditAddItemsSchema>
export type StockAuditCompleteInput = z.infer<typeof stockAuditCompleteSchema>
