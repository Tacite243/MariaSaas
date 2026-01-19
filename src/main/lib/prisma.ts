import { PrismaClient } from '@prisma/client'
import { app } from 'electron'
import path from 'path'

// Détermine le chemin de la DB selon l'environnement
const dbPath = app.isPackaged
  ? path.join(app.getPath('userData'), 'mariasaas.db')
  : path.join(__dirname, '../../prisma/dev.db')

export const prisma = new PrismaClient({
  datasources: {
    db: {
      url: `file:${dbPath}`,
    },
  },
})