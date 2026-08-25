import http from 'node:http'
import { prisma } from '../lib/prisma'
import { LanPairInput } from '../../shared/schemas/lan.schema'
import { LanStatusDTO } from '../../shared/types/lan.types'

export class LanClientService {
  private connected = false
  private lastError: string | null = null
  private reconnectTimer: NodeJS.Timeout | null = null

  async getConfig() {
    let settings = await prisma.appSettings.findUnique({ where: { id: 'default' } })
    if (!settings) settings = await prisma.appSettings.create({ data: { id: 'default' } })
    return settings
  }

  isClientMode(): boolean {
    return false // mis à jour async via cache — voir refreshMode
  }

  private cachedMode: 'STANDALONE' | 'SERVER' | 'CLIENT' = 'STANDALONE'

  async refreshMode(): Promise<'STANDALONE' | 'SERVER' | 'CLIENT'> {
    const settings = await this.getConfig()
    this.cachedMode = settings.lanMode as 'STANDALONE' | 'SERVER' | 'CLIENT'
    return this.cachedMode
  }

  async isClient(): Promise<boolean> {
    const mode = await this.refreshMode()
    return mode === 'CLIENT'
  }

  async getStatus(): Promise<LanStatusDTO> {
    const settings = await this.getConfig()
    if (settings.lanMode === 'CLIENT' && settings.lanClientHost) {
      await this.pingHealth(settings.lanClientHost, settings.lanServerPort)
    }
    return {
      mode: settings.lanMode as LanStatusDTO['mode'],
      serverPort: settings.lanServerPort,
      localIp: null,
      serverRunning: false,
      pairingToken: null,
      clientHost: settings.lanClientHost,
      clientConnected: this.connected,
      lastError: this.lastError
    }
  }

  async pair(data: LanPairInput): Promise<LanStatusDTO> {
    const ok = await this.pingHealth(data.host, 4141)
    if (!ok) throw new Error('Impossible de joindre la caisse principale')

    await prisma.appSettings.update({
      where: { id: 'default' },
      data: {
        lanMode: 'CLIENT',
        lanClientHost: data.host,
        lanClientToken: data.token
      }
    })

    this.cachedMode = 'CLIENT'
    this.scheduleReconnect()
    return this.getStatus()
  }

  private scheduleReconnect() {
    if (this.reconnectTimer) clearInterval(this.reconnectTimer)
    this.reconnectTimer = setInterval(() => {
      void this.tryReconnect()
    }, 15000)
  }

  private async tryReconnect() {
    const settings = await this.getConfig()
    if (settings.lanMode !== 'CLIENT' || !settings.lanClientHost) return
    await this.pingHealth(settings.lanClientHost, settings.lanServerPort)
  }

  private async pingHealth(host: string, port: number): Promise<boolean> {
    return new Promise((resolve) => {
      const req = http.get(`http://${host}:${port}/health`, (res) => {
        this.connected = res.statusCode === 200
        this.lastError = this.connected ? null : 'Serveur LAN injoignable'
        resolve(this.connected)
      })
      req.on('error', (err) => {
        this.connected = false
        this.lastError = err.message
        resolve(false)
      })
      req.setTimeout(3000, () => {
        req.destroy()
        this.connected = false
        this.lastError = 'Timeout connexion LAN'
        resolve(false)
      })
    })
  }

  private async request<T>(method: string, path: string): Promise<T> {
    const settings = await this.getConfig()
    if (!settings.lanClientHost || !settings.lanClientToken) {
      throw new Error('Client LAN non configuré')
    }

    const url = `http://${settings.lanClientHost}:${settings.lanServerPort}${path}`
    return new Promise((resolve, reject) => {
      const req = http.request(
        url,
        {
          method,
          headers: { Authorization: `Bearer ${settings.lanClientToken}` }
        },
        (res) => {
          let body = ''
          res.on('data', (chunk) => { body += chunk })
          res.on('end', () => {
            try {
              const parsed = JSON.parse(body) as { data?: T; error?: string }
              if (res.statusCode && res.statusCode >= 400) {
                reject(new Error(parsed.error ?? `HTTP ${res.statusCode}`))
                return
              }
              this.connected = true
              this.lastError = null
              resolve(parsed.data as T)
            } catch (err) {
              reject(err)
            }
          })
        }
      )
      req.on('error', (err) => {
        this.connected = false
        this.lastError = err.message
        reject(err)
      })
      req.setTimeout(8000, () => {
        req.destroy()
        reject(new Error('Timeout requête LAN'))
      })
      req.end()
    })
  }

  async getProducts() {
    if (!(await this.isClient())) return null
    return this.request<unknown[]>('GET', '/api/v1/products')
  }

  async findProductByCode(code: string) {
    if (!(await this.isClient())) return null
    return this.request<unknown>('GET', `/api/v1/products/by-code/${encodeURIComponent(code)}`)
  }
}

export const lanClientService = new LanClientService()
