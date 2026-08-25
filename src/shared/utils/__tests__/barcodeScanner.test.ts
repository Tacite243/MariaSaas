import { describe, it, expect } from 'vitest'
import {
  createScanState,
  isScannerInput,
  isValidBarcode,
  shouldIgnoreScanTarget
} from '../barcodeScanner'

describe('barcodeScanner', () => {
  it('valide un code EAN-13', () => {
    expect(isValidBarcode('1234567890123')).toBe(true)
    expect(isValidBarcode('abc')).toBe(false)
    expect(isValidBarcode('123')).toBe(false)
  })

  it('détecte une saisie douchette (intervalles rapides)', () => {
    const fastIntervals = [10, 15, 12, 18, 20, 11, 14]
    expect(isScannerInput(fastIntervals, 13)).toBe(true)
  })

  it('rejette une saisie clavier manuelle lente', () => {
    const slowIntervals = [120, 200, 150, 180, 90, 300, 250]
    expect(isScannerInput(slowIntervals, 13)).toBe(false)
  })

  it('réinitialise le buffer via createScanState', () => {
    const state = createScanState()
    expect(state.buffer).toBe('')
    expect(state.intervals).toEqual([])
  })

  it('retourne false pour une cible null', () => {
    expect(shouldIgnoreScanTarget(null)).toBe(false)
  })
})
