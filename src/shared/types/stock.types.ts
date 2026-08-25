import type {
  PrescriptionInput,
  WriteOffInput
} from '../schemas/stock.schema'

export enum ExpirySeverity {
  EXPIRED = 'EXPIRED',
  CRITICAL = 'CRITICAL',
  WARNING = 'WARNING',
  WATCH = 'WATCH',
  OK = 'OK'
}

export enum StockAuditStatus {
  DRAFT = 'DRAFT',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED'
}

export enum WriteOffReason {
  EXPIRY_DESTRUCTION = 'EXPIRY_DESTRUCTION',
  SUPPLIER_RETURN = 'SUPPLIER_RETURN',
  OTHER = 'OTHER'
}

export enum StockAuditAction {
  STOCK_WRITE_OFF = 'STOCK_WRITE_OFF',
  STOCK_AUDIT_COMPLETED = 'STOCK_AUDIT_COMPLETED',
  PRESCRIPTION_REGISTERED = 'PRESCRIPTION_REGISTERED'
}

export interface ExpiringBatchDTO {
  lotId: string
  batchNumber: string
  expiryDate: string
  quantity: number
  daysUntilExpiry: number
  severity: ExpirySeverity
  productId: string
  productName: string
  productCode: string
  isPrescriptionRequired: boolean
}

export interface ExpiryAlertSummaryDTO {
  critical: number
  warning: number
  watch: number
  expired: number
  batches: ExpiringBatchDTO[]
}

export interface PrescriptionRegisterDTO {
  id: string
  orderNumber: string
  saleId: string | null
  productId: string
  productName: string
  productDci: string | null
  isNarcotic: boolean
  prescriberName: string
  prescriberQualification: string
  prescriberLicense: string | null
  patientName: string
  patientAge: number | null
  patientIdDocument: string | null
  prescriptionDate: string
  dispensedDate: string
  quantityDispensed: number
  validatedByName: string
}

export interface StockAuditItemDTO {
  id: string
  productId: string
  productName: string
  stockLotId: string | null
  batchNumber: string | null
  expectedQuantity: number
  countedQuantity: number
  discrepancy: number
  unitCostUsd: number
  unitCostCdf: number
  lossValueUsd: number
  lossValueCdf: number
}

export interface StockAuditDTO {
  id: string
  reference: string
  status: StockAuditStatus
  exchangeRate: number
  createdByName: string
  completedByName: string | null
  items: StockAuditItemDTO[]
  totalLossUsd: number
  totalLossCdf: number
  totalGainUsd: number
  totalGainCdf: number
  createdAt: string
  completedAt: string | null
}

export type { PrescriptionInput, WriteOffInput }
