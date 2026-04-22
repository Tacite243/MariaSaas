import { app } from 'electron'
import path from 'path'
import { PrismaClient } from '@prisma/client'
import fs from 'fs'

// 1. Définir les chemins
const isDev = !app.isPackaged
const dbPath = isDev
  ? path.join(__dirname, '../../prisma/dev.db')
  : path.join(app.getPath('userData'), 'mariasaas.db')

// 2. CRITIQUE : Définir l'URL AVANT toute instanciation de PrismaClient
process.env.DATABASE_URL = `file:${dbPath}`

// 3. Logique de migration/copie pour la production
// Si on est en prod et que la DB n'existe pas encore dans userData, on la crée
if (!isDev && !fs.existsSync(dbPath)) {
  try {
    // On peut soit copier une DB vide, soit laisser Prisma la créer
    // Pour MariaSaaS, on laisse Prisma créer les tables via les migrations ou on touche rien
    // Le plus simple : s'assurer que le dossier existe
    fs.mkdirSync(path.dirname(dbPath), { recursive: true })
  } catch (e) {
    console.error('Erreur création dossier DB:', e)
  }
}

// 4. Singleton pour éviter les fuites de connexions
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