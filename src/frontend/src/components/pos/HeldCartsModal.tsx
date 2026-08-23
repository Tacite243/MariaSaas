import React from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { AppDispatch, RootState } from '@renderer/app/store/store'
import { setHeldCartsModalOpen, restoreHeldCart } from '@renderer/app/store/slice/posSlice'
import {
  addToCart,
  clearCart,
  setPaymentMethod
} from '@renderer/app/store/slice/salesSlice'
import { HeldCartSnapshot } from '@shared/types/pos.types'

export const HeldCartsModal: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>()
  const open = useSelector((s: RootState) => s.pos.heldCartsModalOpen)
  const heldCarts = useSelector((s: RootState) => s.pos.heldCarts)
  const currentCartLen = useSelector((s: RootState) => s.sales.cart.length)

  if (!open) return null

  const handleRestore = (held: HeldCartSnapshot) => {
    if (currentCartLen > 0 && !confirm('Remplacer le panier actuel ?')) return

    dispatch(clearCart())
    held.cart.forEach((item) => dispatch(addToCart(item)))
    dispatch(setPaymentMethod(held.paymentMethod))
    dispatch(restoreHeldCart(held.id))
    dispatch(setHeldCartsModalOpen(false))
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-md p-6">
        <h2 className="text-lg font-black uppercase dark:text-white mb-4">Paniers en attente</h2>

        {heldCarts.length === 0 ? (
          <p className="text-sm text-slate-400 text-center py-8">Aucun panier en attente</p>
        ) : (
          <ul className="space-y-2">
            {heldCarts.map((held, idx) => (
              <li key={held.id}>
                <button
                  onClick={() => handleRestore(held)}
                  className="w-full flex justify-between items-center p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 hover:bg-sky-50 dark:hover:bg-sky-900/20 border border-slate-100 dark:border-slate-700 transition-colors"
                >
                  <span className="font-bold dark:text-white">
                    <kbd className="text-emerald-500 mr-2">{idx + 1}</kbd>
                    {held.label}
                  </span>
                  <span className="text-xs text-slate-400">{held.cart.length} art.</span>
                </button>
              </li>
            ))}
          </ul>
        )}

        <button
          onClick={() => dispatch(setHeldCartsModalOpen(false))}
          className="w-full mt-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 font-bold text-slate-500 text-sm"
        >
          Fermer (Échap)
        </button>
      </div>
    </div>
  )
}
