export type LanMode = 'STANDALONE' | 'SERVER' | 'CLIENT'

export interface LanStatusDTO {
  mode: LanMode
  serverPort: number
  localIp: string | null
  serverRunning: boolean
  pairingToken: string | null
  clientHost: string | null
  clientConnected: boolean
  lastError: string | null
}

export interface LanPairingInfoDTO {
  host: string
  port: number
  token: string
  localIp: string
}
