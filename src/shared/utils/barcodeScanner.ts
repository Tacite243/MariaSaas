/** Détection douchette vs saisie clavier manuelle */

export const SCAN_CHAR_INTERVAL_MS = 40
export const MIN_BARCODE_LENGTH = 8
export const MAX_BARCODE_LENGTH = 20

const EAN13_REGEX = /^\d{8,13}$/

export const isValidBarcode = (code: string): boolean => EAN13_REGEX.test(code.trim())

export interface ScanTimingState {
  buffer: string
  lastKeyTime: number
  intervals: number[]
}

export const createScanState = (): ScanTimingState => ({
  buffer: '',
  lastKeyTime: 0,
  intervals: []
})

/** Retourne true si le pattern ressemble à un scan douchette (frappes rapides + Enter) */
export const isScannerInput = (intervals: number[], bufferLength: number): boolean => {
  if (bufferLength < MIN_BARCODE_LENGTH) return false
  if (intervals.length === 0) return false
  const fastCount = intervals.filter((i) => i < SCAN_CHAR_INTERVAL_MS).length
  return fastCount / intervals.length >= 0.7
}

export const shouldIgnoreScanTarget = (target: EventTarget | null): boolean => {
  if (!target) return false
  if (typeof HTMLElement === 'undefined' || !(target instanceof HTMLElement)) return false
  const tag = target.tagName
  if (tag === 'TEXTAREA') return true
  if (tag !== 'INPUT') return false
  const input = target as HTMLInputElement
  if (input.type === 'search' || input.dataset.posSearch === 'true') return false
  const freeTextTypes = ['text', 'email', 'tel', 'url', 'password', 'number']
  return freeTextTypes.includes(input.type) && input.dataset.posSearch !== 'true'
}
