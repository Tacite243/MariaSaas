import { app } from 'electron'
import path from 'path'
import fs from 'fs'
import { execSync } from 'child_process'

export const getDatabasePath = (): string => {
  const isDev = !app.isPackaged
  return isDev
    ? path.join(__dirname, '../../prisma/dev.db')
    : path.join(app.getPath('userData'), 'mariasaas.db')
}

export function setupDatabaseEnvironment(): void {
  const dbPath = getDatabasePath()
  process.env.DATABASE_URL = `file:${dbPath}`

  if (!app.isPackaged) return

  const dir = path.dirname(dbPath)
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }
}

function resolvePrismaPaths(): { prismaCli: string; schemaPath: string } {
  const root = app.isPackaged ? path.join(process.resourcesPath, 'app.asar.unpacked') : app.getAppPath()

  return {
    prismaCli: path.join(root, 'node_modules/prisma/build/index.js'),
    schemaPath: path.join(root, 'prisma/schema.prisma')
  }
}

export function runDatabaseMigrations(): void {
  const { prismaCli, schemaPath } = resolvePrismaPaths()

  if (!fs.existsSync(prismaCli)) {
    throw new Error(`Prisma CLI introuvable: ${prismaCli}`)
  }
  if (!fs.existsSync(schemaPath)) {
    throw new Error(`Schema Prisma introuvable: ${schemaPath}`)
  }

  execSync(`node "${prismaCli}" migrate deploy --schema="${schemaPath}"`, {
    env: { ...process.env },
    stdio: 'inherit'
  })
}
