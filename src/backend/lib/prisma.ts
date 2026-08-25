import { app } from 'electron'
import { PrismaClient } from '@prisma/client'
import { getDatabasePath } from './databaseSetup'

export { getDatabasePath }

const isDev = !app.isPackaged

if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = `file:${getDatabasePath()}`
}

const globalForPrisma = global as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: isDev ? ['query', 'error', 'warn'] : ['error']
  })

if (!isDev) {
  globalForPrisma.prisma = prisma
}
