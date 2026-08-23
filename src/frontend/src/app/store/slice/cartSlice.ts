/** Panier actif (salesSlice) + paniers en attente (posSlice) — point d'entrée unifié POS */
export {
  addToCart,
  removeFromCart,
  updateQuantity,
  setPaymentMethod,
  clearCart,
  processCheckout
} from '@renderer/app/store/slice/salesSlice'

export {
  holdCurrentCart,
  restoreHeldCart,
  removeHeldCart,
  setPaymentModalOpen
} from '@renderer/app/store/slice/posSlice'

export type { CartItemUI } from '@renderer/app/store/slice/salesSlice'
export type { HeldCartSnapshot } from '@shared/types/pos.types'
