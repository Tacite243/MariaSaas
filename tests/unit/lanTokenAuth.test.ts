import { describe, it, expect } from 'vitest'
import {
  generateLanSecret,
  createLanToken,
  verifyLanToken,
  extractBearerToken
} from '@shared/utils/lanToken'

describe('lanTokenAuth', () => {
  it('génère un secret LAN de 64 caractères hex', () => {
    const secret = generateLanSecret()
    expect(secret).toHaveLength(64)
  })

  it('crée et vérifie un token de jumelage valide', () => {
    const secret = generateLanSecret()
    const token = createLanToken(secret, 'pharmacy-001')
    const payload = verifyLanToken(token, secret)

    expect(payload).not.toBeNull()
    expect(payload?.pharmacyId).toBe('pharmacy-001')
    expect(payload?.exp).toBeGreaterThan(Date.now())
  })

  it('rejette un token avec mauvais secret', () => {
    const token = createLanToken(generateLanSecret())
    expect(verifyLanToken(token, generateLanSecret())).toBeNull()
  })

  it('rejette un token malformé', () => {
    expect(verifyLanToken('invalid-token', generateLanSecret())).toBeNull()
  })

  it('extrait le Bearer token du header Authorization', () => {
    expect(extractBearerToken('Bearer abc123')).toBe('abc123')
    expect(extractBearerToken('Basic xyz')).toBeNull()
    expect(extractBearerToken(undefined)).toBeNull()
  })
})
