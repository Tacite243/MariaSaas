import http from 'node:http'
import os from 'node:os'
import { prisma } from '../lib/prisma'
import { verifyLanToken, extractBearerToken, generateLanSecret, createLanToken } from '../../shared/utils/lanToken'
import { LanConfigInput } from '../../shared/schemas/lan.schema'
import { LanPairingInfoDTO, LanStatusDTO } from '../../shared/types/lan.types'

export class LanServerService {
  private server: http.Server | null = null
  private secret: string | null = null
  private port = 4141

  getLocalIp(): string | null {
    const nets = os.networkInterfaces()
    for (const name of Object.keys(nets)) {
      for (const net of nets[name] ?? []) {
        if (net.family === 'IPv4' && !net.internal) return net.address
      }
    }
    return null
  }

  async getStatus(): Promise<LanStatusDTO> {
    const settings = await this.ensureSettings()
    return {
      mode: settings.lanMode as LanStatusDTO['mode'],
      serverPort: settings.lanServerPort,
      localIp: this.getLocalIp(),
      serverRunning: this.server !== null,
      pairingToken: settings.lanServerSecret ? createLanToken(settings.lanServerSecret) : null,
      clientHost: settings.lanClientHost,
      clientConnected: false,
      lastError: null
    }
  }

  async configure(data: LanConfigInput) {
    const update: Record<string, unknown> = { lanMode: data.lanMode }
    if (data.lanServerPort !== undefined) update.lanServerPort = data.lanServerPort
    if (data.lanClientHost !== undefined) update.lanClientHost = data.lanClientHost
    if (data.lanClientToken !== undefined) update.lanClientToken = data.lanClientToken

    if (data.lanMode === 'SERVER') {
      const settings = await this.ensureSettings()
      if (!settings.lanServerSecret) {
        update.lanServerSecret = generateLanSecret()
      }
    }

    if (data.lanMode === 'STANDALONE') {
      await this.stop()
    }

    await prisma.appSettings.update({ where: { id: 'default' }, data: update })

    if (data.lanMode === 'SERVER') {
      await this.start()
    } else {
      await this.stop()
    }

    return this.getStatus()
  }

  async start(): Promise<LanPairingInfoDTO> {
    const settings = await this.ensureSettings()
    if (!settings.lanServerSecret) {
      const secret = generateLanSecret()
      await prisma.appSettings.update({
        where: { id: 'default' },
        data: { lanServerSecret: secret }
      })
      settings.lanServerSecret = secret
    }

    this.secret = settings.lanServerSecret
    this.port = settings.lanServerPort

    if (this.server) await this.stop()

    this.server = http.createServer((req, res) => void this.handleRequest(req, res))
    await new Promise<void>((resolve, reject) => {
      this.server!.listen(this.port, '0.0.0.0', () => resolve())
      this.server!.on('error', reject)
    })

    const ip = this.getLocalIp() ?? '127.0.0.1'
    return {
      host: ip,
      port: this.port,
      token: createLanToken(settings.lanServerSecret!),
      localIp: ip
    }
  }

  async stop() {
    if (!this.server) return
    await new Promise<void>((resolve) => {
      this.server!.close(() => resolve())
    })
    this.server = null
  }

  private async ensureSettings() {
    let settings = await prisma.appSettings.findUnique({ where: { id: 'default' } })
    if (!settings) settings = await prisma.appSettings.create({ data: { id: 'default' } })
    return settings
  }

  private async handleRequest(req: http.IncomingMessage, res: http.ServerResponse) {
    res.setHeader('Content-Type', 'application/json')

    if (req.method === 'GET' && req.url === '/health') {
      res.writeHead(200)
      res.end(JSON.stringify({ ok: true, service: 'mariasaas-lan' }))
      return
    }

    const token = extractBearerToken(req.headers.authorization)
    if (!token || !this.secret || !verifyLanToken(token, this.secret)) {
      res.writeHead(401)
      res.end(JSON.stringify({ error: 'Token LAN invalide' }))
      return
    }

    try {
      if (req.method === 'GET' && req.url === '/api/v1/products') {
        const products = await prisma.product.findMany({
          include: {
            lots: {
              where: { quantity: { gt: 0 } },
              orderBy: { expiryDate: 'asc' }
            }
          },
          orderBy: { name: 'asc' }
        })
        res.writeHead(200)
        res.end(JSON.stringify({ data: products }))
        return
      }

      if (req.method === 'GET' && req.url?.startsWith('/api/v1/products/by-code/')) {
        const code = decodeURIComponent(req.url.split('/').pop() ?? '')
        const product = await prisma.product.findFirst({
          where: {
            OR: [{ code }, { codeCip7: code }],
            currentStock: { gt: 0 }
          },
          include: {
            lots: {
              where: { quantity: { gt: 0 } },
              orderBy: { expiryDate: 'asc' },
              take: 1
            }
          }
        })
        if (!product) {
          res.writeHead(404)
          res.end(JSON.stringify({ error: 'Produit introuvable' }))
          return
        }
        res.writeHead(200)
        res.end(JSON.stringify({ data: product }))
        return
      }

      res.writeHead(404)
      res.end(JSON.stringify({ error: 'Route inconnue' }))
    } catch (err) {
      res.writeHead(500)
      res.end(JSON.stringify({ error: err instanceof Error ? err.message : 'Erreur serveur' }))
    }
  }
}

export const lanServerService = new LanServerService()
