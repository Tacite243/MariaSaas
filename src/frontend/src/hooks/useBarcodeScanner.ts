import { useCallback, useEffect, useRef } from 'react'
import { useDispatch } from 'react-redux'
import { AppDispatch } from '@renderer/app/store/store'
import { addToCart } from '@renderer/app/store/slice/salesSlice'
import {
  createScanState,
  isScannerInput,
  isValidBarcode,
  shouldIgnoreScanTarget
} from '@shared/utils/barcodeScanner'
import { playScanBeep } from '@renderer/utils/scanBeep'

interface UseBarcodeScannerOptions {
  onScan?: (code: string) => void
  enabled?: boolean
}

export const useBarcodeScanner = ({ onScan, enabled = true }: UseBarcodeScannerOptions = {}) => {
  const dispatch = useDispatch<AppDispatch>()
  const scanState = useRef(createScanState())

  const handleProductScan = useCallback(
    async (code: string) => {
      try {
        const res = await window.api.pos.findProductByCode(code)
        if (!res.success || !res.data) return

        const product = res.data as {
          id: string
          name: string
          code: string
          sellPrice: number
          currentStock: number
          dci?: string | null
        }

        dispatch(
          addToCart({
            productId: product.id,
            name: product.name,
            code: product.code,
            quantity: 1,
            unitPrice: product.sellPrice,
            maxStock: product.currentStock
          })
        )

        playScanBeep()
        onScan?.(code)
      } catch {
        // Produit non trouvé — pas de bip d'erreur pour ne pas ralentir le flux
      }
    },
    [dispatch, onScan]
  )

  useEffect(() => {
    if (!enabled) return

    const onKeyDown = (e: KeyboardEvent) => {
      if (shouldIgnoreScanTarget(e.target)) return

      const now = Date.now()
      const state = scanState.current

      if (e.key === 'Enter') {
        const code = state.buffer.trim()
        if (isScannerInput(state.intervals, code.length) && isValidBarcode(code)) {
          e.preventDefault()
          void handleProductScan(code)
        }
        scanState.current = createScanState()
        return
      }

      if (e.key.length !== 1 || e.ctrlKey || e.metaKey || e.altKey) return

      if (state.lastKeyTime > 0) {
        state.intervals.push(now - state.lastKeyTime)
      }
      state.buffer += e.key
      state.lastKeyTime = now

      if (state.buffer.length > 20) {
        scanState.current = createScanState()
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [enabled, handleProductScan])
}
