import { useCallback, useEffect, useRef } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { AppDispatch, RootState } from '@renderer/app/store/store'
import { toggleCurrency } from '@renderer/app/store/slice/sessionSlice'
import { clearCart } from '@renderer/app/store/slice/salesSlice'
import {
  holdCurrentCart,
  setCloseSessionModalOpen,
  setHeldCartsModalOpen,
  setPaymentModalOpen
} from '@renderer/app/store/slice/posSlice'

interface UsePOSShortcutsOptions {
  searchInputRef: React.RefObject<HTMLInputElement | null>
  onHoldCart?: () => void
}

export const usePOSShortcuts = ({ searchInputRef, onHoldCart }: UsePOSShortcutsOptions) => {
  const dispatch = useDispatch<AppDispatch>()
  const { cart, paymentMethod, discount, currentCustomer } = useSelector(
    (s: RootState) => s.sales
  )
  const modals = useSelector((s: RootState) => s.pos)
  const anyModalOpen = useRef(false)

  useEffect(() => {
    anyModalOpen.current =
      modals.paymentModalOpen || modals.heldCartsModalOpen || modals.closeSessionModalOpen
  }, [modals.paymentModalOpen, modals.heldCartsModalOpen, modals.closeSessionModalOpen])

  const handleHoldCart = useCallback(() => {
    if (cart.length === 0) return
    dispatch(
      holdCurrentCart({
        cart,
        paymentMethod,
        discount,
        currentCustomer
      })
    )
    dispatch(clearCart())
    onHoldCart?.()
  }, [cart, paymentMethod, discount, currentCustomer, dispatch, onHoldCart])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement &&
        e.target.dataset.posSearch !== 'true' &&
        !e.key.startsWith('F')
      ) {
        return
      }

      switch (e.key) {
        case 'F1':
          e.preventDefault()
          searchInputRef.current?.focus()
          searchInputRef.current?.select()
          break
        case 'F2':
          e.preventDefault()
          dispatch(toggleCurrency())
          break
        case 'F4':
          e.preventDefault()
          handleHoldCart()
          break
        case 'F5':
          e.preventDefault()
          dispatch(setHeldCartsModalOpen(true))
          break
        case 'F9':
          e.preventDefault()
          if (cart.length > 0) dispatch(setPaymentModalOpen(true))
          break
        case 'Escape':
          if (anyModalOpen.current) {
            e.preventDefault()
            dispatch(setPaymentModalOpen(false))
            dispatch(setHeldCartsModalOpen(false))
            dispatch(setCloseSessionModalOpen(false))
            return
          }
          if (cart.length > 0 && confirm('Vider le panier en cours ?')) {
            dispatch(clearCart())
          }
          break
        default:
          break
      }
    }

    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [cart.length, dispatch, handleHoldCart, searchInputRef])
}
