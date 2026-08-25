import { Prisma } from '@prisma/client'
import { prisma } from '../lib/prisma'
import { WriteOffInput, StockAuditCreateInput, StockAuditAddItemsInput, StockAuditCompleteInput } from '../../shared/schemas/stock.schema'
import { ExpiryAlertSummaryDTO, ExpiringBatchDTO, StockAuditDTO, StockAuditStatus, StockAuditAction } from '../../shared/types/stock.types'
import { daysUntilExpiry, getExpirySeverity, calcAuditDiscrepancy, calcLossValues } from '../../shared/utils/expiry'
import { auditService } from './auditService'
import { UserRole } from '../../shared/types'

export class StockService {
  async getExpiringBatches(): Promise<ExpiryAlertSummaryDTO> {
    const lots = await prisma.stockLot.findMany({
      where: { quantity: { gt: 0 } },
      include: {
        product: { select: { id: true, name: true, code: true, isPrescriptionRequired: true } }
      },
      orderBy: { expiryDate: 'asc' }
    })

    const batches: ExpiringBatchDTO[] = lots.map((lot) => {
      const days = daysUntilExpiry(lot.expiryDate)
      return {
        lotId: lot.id,
        batchNumber: lot.batchNumber,
        expiryDate: lot.expiryDate.toISOString(),
        quantity: lot.quantity,
        daysUntilExpiry: days,
        severity: getExpirySeverity(days),
        productId: lot.product.id,
        productName: lot.product.name,
        productCode: lot.product.code,
        isPrescriptionRequired: lot.product.isPrescriptionRequired
      }
    }).filter((b) => b.severity !== 'OK')

    const summary = batches.reduce(
      (acc, b) => {
        if (b.severity === 'EXPIRED' || b.severity === 'CRITICAL') acc.critical += 1
        else if (b.severity === 'WARNING') acc.warning += 1
        else if (b.severity === 'WATCH') acc.watch += 1
        if (b.severity === 'EXPIRED') acc.expired += 1
        return acc
      },
      { critical: 0, warning: 0, watch: 0, expired: 0 }
    )

    return { ...summary, batches }
  }

  async writeOffLot(data: WriteOffInput) {
    return prisma.$transaction(async (tx) => {
      const lot = await tx.stockLot.findUnique({
        where: { id: data.stockLotId },
        include: { product: true }
      })
      if (!lot) throw new Error('Lot introuvable')
      if (lot.quantity < data.quantity) throw new Error('Quantité insuffisante sur le lot')

      await tx.stockLot.update({
        where: { id: lot.id },
        data: { quantity: { decrement: data.quantity } }
      })

      await tx.product.update({
        where: { id: lot.productId },
        data: { currentStock: { decrement: data.quantity } }
      })

      const writeOff = await tx.stockWriteOff.create({
        data: {
          stockLotId: lot.id,
          productId: lot.productId,
          quantity: data.quantity,
          reason: data.reason,
          notes: data.notes,
          performedById: data.performedById
        }
      })

      await auditService.log({
        action: StockAuditAction.STOCK_WRITE_OFF,
        userId: data.performedById,
        details: `Déclassement lot ${lot.batchNumber} — ${data.quantity} u. — ${data.reason}`,
        metadata: { writeOffId: writeOff.id, productId: lot.productId, lotId: lot.id }
      })

      return writeOff
    })
  }

  async createAudit(data: StockAuditCreateInput) {
    const ref = `INV-${new Date().getFullYear()}-${Date.now().toString().slice(-6)}`
    return prisma.stockAudit.create({
      data: {
        reference: ref,
        createdById: data.createdById,
        exchangeRate: data.exchangeRate,
        status: StockAuditStatus.DRAFT
      }
    }).then((audit) => this.getAudit(audit.id))
  }

  async addAuditItems(data: StockAuditAddItemsInput) {
    const audit = await prisma.stockAudit.findUnique({ where: { id: data.auditId } })
    if (!audit || audit.status !== StockAuditStatus.DRAFT) {
      throw new Error('Inventaire non modifiable')
    }

    const rows: Prisma.StockAuditItemCreateManyInput[] = []
    for (const item of data.items) {
      const product = await prisma.product.findUnique({ where: { id: item.productId } })
      if (!product) throw new Error(`Produit ${item.productId} introuvable`)

      let expected = product.currentStock
      let lotId: string | undefined = item.stockLotId

      if (item.stockLotId) {
        const lot = await prisma.stockLot.findUnique({ where: { id: item.stockLotId } })
        if (!lot) throw new Error('Lot introuvable')
        expected = lot.quantity
      }

      const discrepancy = calcAuditDiscrepancy(expected, item.countedQuantity)
      const { lossValueUsd, lossValueCdf } = calcLossValues(
        discrepancy,
        product.buyingPrice,
        data.exchangeRate
      )

      rows.push({
        auditId: data.auditId,
        productId: item.productId,
        stockLotId: lotId,
        expectedQuantity: expected,
        countedQuantity: item.countedQuantity,
        discrepancy,
        unitCostUsd: product.buyingPrice,
        unitCostCdf: Math.round(product.buyingPrice * data.exchangeRate),
        lossValueUsd,
        lossValueCdf
      })
    }

    await prisma.stockAuditItem.createMany({ data: rows })
    return this.getAudit(data.auditId)
  }

  async completeAudit(data: StockAuditCompleteInput) {
    if (data.userRole !== UserRole.ADMIN && data.userRole !== UserRole.SUPERADMIN) {
      throw new Error('Seuls ADMIN et SUPERADMIN peuvent valider un inventaire')
    }

    return prisma.$transaction(async (tx) => {
      const audit = await tx.stockAudit.findUnique({
        where: { id: data.auditId },
        include: { items: true }
      })
      if (!audit || audit.status !== StockAuditStatus.DRAFT) {
        throw new Error('Inventaire invalide')
      }

      for (const item of audit.items) {
        if (item.discrepancy === 0) continue

        if (item.stockLotId) {
          await tx.stockLot.update({
            where: { id: item.stockLotId },
            data: { quantity: item.countedQuantity }
          })
        }

        const product = await tx.product.findUnique({ where: { id: item.productId } })
        if (!product) continue

        if (item.stockLotId) {
          const otherLots = await tx.stockLot.findMany({
            where: { productId: item.productId, id: { not: item.stockLotId }, quantity: { gt: 0 } }
          })
          const otherQty = otherLots.reduce((s, l) => s + l.quantity, 0)
          await tx.product.update({
            where: { id: item.productId },
            data: { currentStock: otherQty + item.countedQuantity }
          })
        } else {
          await tx.product.update({
            where: { id: item.productId },
            data: { currentStock: item.countedQuantity }
          })
        }
      }

      const completed = await tx.stockAudit.update({
        where: { id: audit.id },
        data: {
          status: StockAuditStatus.COMPLETED,
          completedById: data.completedById,
          completedAt: new Date()
        }
      })

      await auditService.log({
        action: StockAuditAction.STOCK_AUDIT_COMPLETED,
        userId: data.completedById,
        details: `Inventaire ${audit.reference} validé — ${audit.items.length} lignes`,
        metadata: { auditId: audit.id, reference: audit.reference }
      })

      return completed
    })
  }

  async listAudits() {
    const audits = await prisma.stockAudit.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        createdBy: { select: { name: true } },
        completedBy: { select: { name: true } },
        items: {
          include: {
            product: { select: { name: true } },
            stockLot: { select: { batchNumber: true } }
          }
        }
      },
      take: 50
    })
    return audits.map((a) => this.mapAudit(a))
  }

  async getAudit(id: string): Promise<StockAuditDTO> {
    const audit = await prisma.stockAudit.findUnique({
      where: { id },
      include: {
        createdBy: { select: { name: true } },
        completedBy: { select: { name: true } },
        items: {
          include: {
            product: { select: { name: true } },
            stockLot: { select: { batchNumber: true } }
          }
        }
      }
    })
    if (!audit) throw new Error('Inventaire introuvable')
    return this.mapAudit(audit)
  }

  private mapAudit(audit: {
    id: string
    reference: string
    status: string
    exchangeRate: number
    createdAt: Date
    completedAt: Date | null
    createdBy: { name: string }
    completedBy: { name: string } | null
    items: {
      id: string
      productId: string
      stockLotId: string | null
      expectedQuantity: number
      countedQuantity: number
      discrepancy: number
      unitCostUsd: number
      unitCostCdf: number
      lossValueUsd: number
      lossValueCdf: number
      product: { name: string }
      stockLot: { batchNumber: string } | null
    }[]
  }): StockAuditDTO {
    let totalLossUsd = 0
    let totalLossCdf = 0
    let totalGainUsd = 0
    let totalGainCdf = 0

    const items = audit.items.map((i) => {
      if (i.discrepancy < 0) {
        totalLossUsd += i.lossValueUsd
        totalLossCdf += i.lossValueCdf
      } else if (i.discrepancy > 0) {
        totalGainUsd += i.discrepancy * i.unitCostUsd
        totalGainCdf += Math.round(i.discrepancy * i.unitCostCdf)
      }
      return {
        id: i.id,
        productId: i.productId,
        productName: i.product.name,
        stockLotId: i.stockLotId,
        batchNumber: i.stockLot?.batchNumber ?? null,
        expectedQuantity: i.expectedQuantity,
        countedQuantity: i.countedQuantity,
        discrepancy: i.discrepancy,
        unitCostUsd: i.unitCostUsd,
        unitCostCdf: i.unitCostCdf,
        lossValueUsd: i.lossValueUsd,
        lossValueCdf: i.lossValueCdf
      }
    })

    return {
      id: audit.id,
      reference: audit.reference,
      status: audit.status as StockAuditStatus,
      exchangeRate: audit.exchangeRate,
      createdByName: audit.createdBy.name,
      completedByName: audit.completedBy?.name ?? null,
      items,
      totalLossUsd,
      totalLossCdf,
      totalGainUsd,
      totalGainCdf,
      createdAt: audit.createdAt.toISOString(),
      completedAt: audit.completedAt?.toISOString() ?? null
    }
  }
}

export const stockService = new StockService()
