import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto'

const TOKEN_TTL_MS = 365 * 24 * 60 * 60 * 1000 // 1 an pour token d'officine

export interface LanTokenPayload {
  pharmacyId: string
  issuedAt: number
  exp: number
}

export const generateLanSecret = (): string => randomBytes(32).toString('hex')

export const createLanToken = (secret: string, pharmacyId = 'default'): string => {
  const payload: LanTokenPayload = {
    pharmacyId,
    issuedAt: Date.now(),
    exp: Date.now() + TOKEN_TTL_MS
  }
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url')
  const sig = createHmac('sha256', secret).update(body).digest('base64url')
  return `${body}.${sig}`
}

export const verifyLanToken = (token: string, secret: string): LanTokenPayload | null => {
  const parts = token.split('.')
  if (parts.length !== 2) return null
  const [body, sig] = parts
  const expected = createHmac('sha256', secret).update(body).digest('base64url')

  try {
    const a = Buffer.from(sig)
    const b = Buffer.from(expected)
    if (a.length !== b.length || !timingSafeEqual(a, b)) return null
  } catch {
    return null
  }

  try {
    const payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf8')) as LanTokenPayload
    if (payload.exp < Date.now()) return null
    return payload
  } catch {
    return null
  }
}

export const extractBearerToken = (header: string | undefined): string | null => {
  if (!header?.startsWith('Bearer ')) return null
  return header.slice(7).trim() || null
}
