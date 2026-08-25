import QRCode from 'qrcode'

const cache = new Map<string, string>()
const MAX_CACHE = 500

export class QrCodeService {
  async toDataUrl(text: string, size = 160): Promise<string> {
    const key = `${size}:${text}`
    const cached = cache.get(key)
    if (cached) return cached

    const dataUrl = await QRCode.toDataURL(text, {
      errorCorrectionLevel: 'M',
      margin: 1,
      width: size,
      color: { dark: '#000000', light: '#FFFFFF' }
    })

    if (cache.size >= MAX_CACHE) {
      const firstKey = cache.keys().next().value
      if (firstKey) cache.delete(firstKey)
    }
    cache.set(key, dataUrl)
    return dataUrl
  }

  async forProductCode(code: string): Promise<string> {
    return this.toDataUrl(code, 80)
  }

  async forReceipt(controlPayload: string, width: '58' | '80'): Promise<string> {
    const size = width === '58' ? 120 : 160
    return this.toDataUrl(controlPayload, size)
  }
}

export const qrCodeService = new QrCodeService()
