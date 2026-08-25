import { prisma } from '../lib/prisma'

export class AuditService {
  async log(params: {
    action: string
    userId: string
    details?: string
    metadata?: Record<string, unknown>
    sessionId?: string
  }) {
    return prisma.auditLog.create({
      data: {
        action: params.action,
        userId: params.userId,
        details: params.details,
        metadata: params.metadata ? JSON.stringify(params.metadata) : null,
        sessionId: params.sessionId
      }
    })
  }

  async list(limit = 200) {
    return prisma.auditLog.findMany({
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: { user: { select: { name: true, email: true } } }
    })
  }
}

export const auditService = new AuditService()
