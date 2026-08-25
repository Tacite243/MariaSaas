import { EXPIRY_TIERS } from '../schemas/stock.schema'
import { ExpirySeverity } from '../types/stock.types'

export const daysUntilExpiry = (expiryDate: Date | string, now = new Date()): number => {
  const expiry = new Date(expiryDate)
  return Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
}

export const getExpirySeverity = (days: number): ExpirySeverity => {
  if (days < 0) return ExpirySeverity.EXPIRED
  if (days <= EXPIRY_TIERS.CRITICAL_MAX_DAYS) return ExpirySeverity.CRITICAL
  if (days <= EXPIRY_TIERS.WARNING_MAX_DAYS) return ExpirySeverity.WARNING
  if (days <= EXPIRY_TIERS.WATCH_MAX_DAYS) return ExpirySeverity.WATCH
  return ExpirySeverity.OK
}

export const isPosExpiryWarning = (days: number): boolean =>
  days >= 0 && days < EXPIRY_TIERS.POS_WARNING_DAYS

export const getFefoLot = <T extends { quantity: number; expiryDate: Date | string }>(
  lots: T[]
): T | null => {
  const available = lots.filter((l) => l.quantity > 0)
  if (available.length === 0) return null
  return [...available].sort(
    (a, b) => new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime()
  )[0]
}

export const calcAuditDiscrepancy = (expected: number, counted: number): number =>
  counted - expected

export const calcLossValues = (
  discrepancy: number,
  unitCostUsd: number,
  exchangeRate: number
): { lossValueUsd: number; lossValueCdf: number; gainValueUsd: number; gainValueCdf: number } => {
  if (discrepancy >= 0) {
    return {
      lossValueUsd: 0,
      lossValueCdf: 0,
      gainValueUsd: discrepancy * unitCostUsd,
      gainValueCdf: Math.round(discrepancy * unitCostUsd * exchangeRate)
    }
  }
  const abs = Math.abs(discrepancy)
  return {
    lossValueUsd: abs * unitCostUsd,
    lossValueCdf: Math.round(abs * unitCostUsd * exchangeRate),
    gainValueUsd: 0,
    gainValueCdf: 0
  }
}
