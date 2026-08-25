import { app } from 'electron'
import { setupDatabaseEnvironment, runDatabaseMigrations } from './lib/databaseSetup'

app.whenReady().then(async () => {
  setupDatabaseEnvironment()

  try {
    runDatabaseMigrations()
  } catch (error) {
    console.error('[DB] Échec des migrations:', error)
    app.quit()
    return
  }

  await import('./index')
})
