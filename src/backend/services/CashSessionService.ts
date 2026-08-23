import { prisma } from '../lib/prisma'
import { CashSessionCloseInput, CashSessionOpenInput } from '../../shared/schemas/pos.schema'
import { AuditAction } from '../../shared/types/pos.types'
import {
  calcDiscrepancy,
  convertUsdCentsToCdf,
  sumDenominations
} from '../../shared/utils/money'
import { auditService } from './auditService'

export class CashSessionService {
  async getActiveSession(cashierId: string) {
    return prisma.cashSession.findFirst({
      where: { cashierId, status: 'OPEN' },
      include: { cashier: { select: { name: true } } }
    })
  }

  async openSession(data: CashSessionOpenInput) {
    const existing = await this.getActiveSession(data.cashierId)
    if (existing) throw new Error('Une session de caisse est déjà ouverte pour ce caissier')

    return prisma.$transaction(async (tx) => {
      const session = await tx.cashSession.create({
        data: {
          cashierId: data.cashierId,
          exchangeRate: data.exchangeRate,
          initialUsdCents: data.initialUsdCents,
          initialCdfCents: data.initialCdfCents,
          status: 'OPEN'
        },
        include: { cashier: { select: { name: true } } }
      })

      await auditService.log({
        action: AuditAction.CASH_SESSION_OPEN,
        userId: data.cashierId,
        sessionId: session.id,
        details: `Ouverture caisse — fond USD: ${data.initialUsdCents / 100}, CDF: ${data.initialCdfCents}`,
        metadata: { exchangeRate: data.exchangeRate }
      })

      return session
    })
  }

  /** Calcul théorique aveugle (côté serveur uniquement) */
  private async computeSystemTotals(sessionId: string) {
    const session = await prisma.cashSession.findUnique({ where: { id: sessionId } })
    if (!session) throw new Error('Session introuvable')

    const sales = await prisma.sale.findMany({
      where: { cashSessionId: sessionId, status: 'COMPLETED' }
    })

    let salesUsdCents = 0
    let salesCdf = 0

    for (const sale of sales) {
      if (sale.currency === 'USD') {
        salesUsdCents += Math.round(sale.totalAmount * 100)
      } else {
        salesCdf += Math.round(sale.totalAmount)
      }
    }

    const systemUsdCents = session.initialUsdCents + salesUsdCents
    const systemCdfCents = session.initialCdfCents + salesCdf

    return { systemUsdCents, systemCdfCents, salesCount: sales.length, salesUsdCents, salesCdf }
  }

  async closeSession(data: CashSessionCloseInput) {
    return prisma.$transaction(async (tx) => {
      const session = await tx.cashSession.findUnique({
        where: { id: data.sessionId },
        include: { cashier: { select: { name: true } } }
      })

      if (!session) throw new Error('Session introuvable')
      if (session.status !== 'OPEN') throw new Error('Session déjà clôturée')
      if (session.cashierId !== data.cashierId) throw new Error('Session non autorisée')

      const declaredUsdCents = sumDenominations(data.usdDenominations, 'USD')
      const declaredCdfCents = sumDenominations(data.cdfDenominations, 'CDF')

      const { systemUsdCents, systemCdfCents, salesCount, salesUsdCents, salesCdf } =
        await this.computeSystemTotals(session.id)

      const discrepancyUsdCents = calcDiscrepancy(declaredUsdCents, systemUsdCents)
      const discrepancyCdfCents = calcDiscrepancy(declaredCdfCents, systemCdfCents)

      await tx.cashDenominationCount.deleteMany({ where: { sessionId: session.id } })

      const denomRows = [
        ...data.usdDenominations.map((d) => ({
          sessionId: session.id,
          currency: 'USD',
          denomination: d.denomination,
          quantity: d.quantity,
          totalMinor: d.denomination * 100 * d.quantity
        })),
        ...data.cdfDenominations.map((d) => ({
          sessionId: session.id,
          currency: 'CDF',
          denomination: d.denomination,
          quantity: d.quantity,
          totalMinor: d.denomination * d.quantity
        }))
      ]

      if (denomRows.length > 0) {
        await tx.cashDenominationCount.createMany({ data: denomRows })
      }

      const closed = await tx.cashSession.update({
        where: { id: session.id },
        data: {
          status: 'CLOSED',
          closedAt: new Date(),
          declaredUsdCents,
          declaredCdfCents,
          systemUsdCents,
          systemCdfCents,
          discrepancyUsdCents,
          discrepancyCdfCents
        },
        include: {
          cashier: { select: { name: true } },
          denominationCounts: true
        }
      })

      await auditService.log({
        action: AuditAction.CASH_SESSION_CLOSE,
        userId: data.cashierId,
        sessionId: session.id,
        details: `Clôture Z — écart USD: ${discrepancyUsdCents / 100}, CDF: ${discrepancyCdfCents}`,
        metadata: {
          declaredUsdCents,
          declaredCdfCents,
          systemUsdCents,
          systemCdfCents,
          discrepancyUsdCents,
          discrepancyCdfCents,
          salesCount
        }
      })

      return {
        session: closed,
        zReport: {
          salesCount,
          totalSalesUsdCents: salesUsdCents,
          totalSalesCdf: salesCdf,
          systemUsdCents,
          systemCdfCents,
          declaredUsdCents,
          declaredCdfCents,
          discrepancyUsdCents,
          discrepancyCdfCents,
          exchangeRate: session.exchangeRate,
          equivalentCdfFromUsd: convertUsdCentsToCdf(salesUsdCents, session.exchangeRate)
        }
      }
    })
  }

  async getZReport(sessionId: string) {
    const session = await prisma.cashSession.findUnique({
      where: { id: sessionId },
      include: {
        cashier: { select: { name: true } },
        denominationCounts: true
      }
    })
    if (!session || session.status !== 'CLOSED') throw new Error('Z-Report indisponible')

    const totals = await this.computeSystemTotals(sessionId)

    return { session, ...totals }
  }
}

export const cashSessionService = new CashSessionService()
