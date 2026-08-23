import type {
  CashSessionCloseInput,
  CashSessionOpenInput,
  PrintReceiptInput,
  PrintSettingsInput
} from '../schemas/pos.schema'

export enum CashSessionStatus {
  OPEN = 'OPEN',
  CLOSED = 'CLOSED'
}

export enum AuditAction {
  CASH_SESSION_OPEN = 'CASH_SESSION_OPEN',
  CASH_SESSION_CLOSE = 'CASH_SESSION_CLOSE',
  SALE_COMPLETED = 'SALE_COMPLETED',
  SALE_VOID = 'SALE_VOID',
  RECEIPT_PRINTED = 'RECEIPT_PRINTED'
}

export interface CashSessionDTO {
  id: string
  status: CashSessionStatus
  openedAt: string
  closedAt: string | null
  cashierId: string
  cashierName: string
  exchangeRate: number
  initialUsdCents: number
  initialCdfCents: number
  systemUsdCents: number | null
  systemCdfCents: number | null
  declaredUsdCents: number | null
  declaredCdfCents: number | null
  discrepancyUsdCents: number | null
  discrepancyCdfCents: number | null
}

export interface ZReportDTO {
  session: CashSessionDTO
  salesCount: number
  totalSalesUsdCents: number
  totalSalesCdf: number
  denominationCounts: {
    currency: 'USD' | 'CDF'
    denomination: number
    quantity: number
    totalMinor: number
  }[]
}

export interface PrinterInfo {
  name: string
  displayName: string
  isDefault: boolean
}

export interface PrintSettingsDTO extends PrintSettingsInput {
  id: string
}

export interface HeldCartSnapshot {
  id: string
  label: string
  savedAt: number
  cart: {
    productId: string
    name: string
    code: string
    quantity: number
    unitPrice: number
    maxStock: number
  }[]
  paymentMethod: 'CASH' | 'MOBILE_MONEY' | 'CARD' | 'INSURANCE'
  discount: number
  currentCustomer: string | null
}

export type { CashSessionOpenInput, CashSessionCloseInput, PrintReceiptInput, PrintSettingsInput }
