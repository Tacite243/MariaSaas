import { prisma } from '../lib/prisma'
import {
  CreatePrescriptionsInput,
  PrescriptionFilterInput
} from '../../shared/schemas/stock.schema'
import { PrescriptionRegisterDTO } from '../../shared/types/stock.types'
import { StockAuditAction } from '../../shared/types/stock.types'
import { auditService } from './auditService'

import { Prisma } from '@prisma/client'

export class PrescriptionService {
  async createRegisters(data: CreatePrescriptionsInput) {
    return prisma.$transaction(async (tx) => {
      const year = new Date().getFullYear()
      const prefix = `ORD-${year}-`
      const last = await tx.prescriptionRegister.findFirst({
        where: { orderNumber: { startsWith: prefix } },
        orderBy: { orderNumber: 'desc' }
      })
      let seq = last ? parseInt(last.orderNumber.replace(prefix, ''), 10) : 0

      type RegisterRow = Prisma.PrescriptionRegisterGetPayload<{
        include: {
          product: { select: { name: true; dci: true; isNarcotic: true } }
          validatedBy: { select: { name: true } }
        }
      }>

      const created: RegisterRow[] = []
      for (const entry of data.entries) {
        seq += 1
        const orderNumber = `${prefix}${seq.toString().padStart(4, '0')}`
        const reg = await tx.prescriptionRegister.create({
          data: {
            orderNumber,
            saleId: data.saleId,
            productId: entry.productId,
            prescriberName: entry.prescriberName,
            prescriberQualification: entry.prescriberQualification,
            prescriberLicense: entry.prescriberLicense,
            patientName: entry.patientName,
            patientAge: entry.patientAge,
            patientIdDocument: entry.patientIdDocument,
            prescriptionDate: entry.prescriptionDate,
            quantityDispensed: entry.quantityDispensed,
            validatedById: data.validatedById
          },
          include: {
            product: { select: { name: true, dci: true, isNarcotic: true } },
            validatedBy: { select: { name: true } }
          }
        })
        created.push(reg)
      }

      await auditService.log({
        action: StockAuditAction.PRESCRIPTION_REGISTERED,
        userId: data.validatedById,
        details: `${created.length} ordonnance(s) enregistrée(s)`,
        metadata: { saleId: data.saleId, count: created.length }
      })

      return created.map((r) => this.mapRegister(r))
    })
  }

  async list(filter?: PrescriptionFilterInput): Promise<PrescriptionRegisterDTO[]> {
    const where: Record<string, unknown> = {}
    if (filter?.from || filter?.to) {
      where.dispensedDate = {
        ...(filter.from ? { gte: filter.from } : {}),
        ...(filter.to ? { lte: filter.to } : {})
      }
    }
    if (filter?.productId) where.productId = filter.productId
    if (filter?.prescriberName) {
      where.prescriberName = { contains: filter.prescriberName }
    }

    const rows = await prisma.prescriptionRegister.findMany({
      where,
      include: {
        product: { select: { name: true, dci: true, isNarcotic: true } },
        validatedBy: { select: { name: true } }
      },
      orderBy: { dispensedDate: 'desc' },
      take: 500
    })

    let result = rows.map((r) => this.mapRegister(r))
    if (filter?.narcoticOnly) {
      result = result.filter((r) => r.isNarcotic)
    }
    return result
  }

  private mapRegister(r: {
    id: string
    orderNumber: string
    saleId: string | null
    productId: string
    prescriberName: string
    prescriberQualification: string
    prescriberLicense: string | null
    patientName: string
    patientAge: number | null
    patientIdDocument: string | null
    prescriptionDate: Date
    dispensedDate: Date
    quantityDispensed: number
    product: { name: string; dci: string | null; isNarcotic: boolean }
    validatedBy: { name: string }
  }): PrescriptionRegisterDTO {
    return {
      id: r.id,
      orderNumber: r.orderNumber,
      saleId: r.saleId,
      productId: r.productId,
      productName: r.product.name,
      productDci: r.product.dci,
      isNarcotic: r.product.isNarcotic,
      prescriberName: r.prescriberName,
      prescriberQualification: r.prescriberQualification,
      prescriberLicense: r.prescriberLicense,
      patientName: r.patientName,
      patientAge: r.patientAge,
      patientIdDocument: r.patientIdDocument,
      prescriptionDate: r.prescriptionDate.toISOString(),
      dispensedDate: r.dispensedDate.toISOString(),
      quantityDispensed: r.quantityDispensed,
      validatedByName: r.validatedBy.name
    }
  }
}

export const prescriptionService = new PrescriptionService()
