import React, { useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { AppDispatch, RootState } from '@renderer/app/store/store'
import { setPaymentModalOpen } from '@renderer/app/store/slice/posSlice'
import { processCheckout, setPaymentMethod } from '@renderer/app/store/slice/salesSlice'
import { useCurrency } from '@renderer/hooks/useCurrently'
import { ReceiptQrPreview } from './ReceiptQrPreview'

type PaymentMethodType = 'CASH' | 'MOBILE_MONEY' | 'CARD' | 'INSURANCE'

export interface SalePrintPayload {
  id: string
  reference: string
  totalAmount: number
  paymentMethod: string
  items: {
    product: { name: string; dci?: string | null }
    quantity: number
    unitPrice: number
    total: number
  }[]
}

interface PaymentModalProps {
  subTotal: number
  onPrintReceipt?: (sale: SalePrintPayload) => Promise<string | void>
}

export const PaymentModal: React.FC<PaymentModalProps> = ({ subTotal, onPrintReceipt }) => {
  const dispatch = useDispatch<AppDispatch>()
  const open = useSelector((s: RootState) => s.pos.paymentModalOpen)
  const { paymentMethod, isLoading, error, cart } = useSelector((s: RootState) => s.sales)
  const authUser = useSelector((s: RootState) => s.auth.user)
  const { rate, formatPrice } = useCurrency()
  const [tendered, setTendered] = useState('')
  const [lastQr, setLastQr] = useState<{ payload: string; reference: string } | null>(null)

  if (!open) return null

  const displayTotal = formatPrice(subTotal)
  const tenderedNum = parseFloat(tendered) || 0
  const change = Math.max(0, tenderedNum - subTotal)

  const handleCheckout = async () => {
    const result = await dispatch(processCheckout())
    if (processCheckout.fulfilled.match(result) && result.payload) {
      const sale = result.payload as unknown as SalePrintPayload
      const qrPayload = await onPrintReceipt?.(sale)
      if (qrPayload) {
        setLastQr({ payload: qrPayload, reference: sale.reference })
        setTimeout(() => {
          dispatch(setPaymentModalOpen(false))
          setTendered('')
          setLastQr(null)
        }, 2500)
        return
      }
      dispatch(setPaymentModalOpen(false))
      setTendered('')
    }
  }

  const handleClose = () => {
    dispatch(setPaymentModalOpen(false))
    setTendered('')
    setLastQr(null)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-md p-6 space-y-5">
        {lastQr ? (
          <div className="text-center space-y-3">
            <h2 className="text-lg font-black uppercase dark:text-white text-emerald-600">
              Vente enregistrée
            </h2>
            <ReceiptQrPreview controlPayload={lastQr.payload} reference={lastQr.reference} />
            <p className="text-[10px] text-slate-400">Impression en cours...</p>
          </div>
        ) : (
          <>
            <h2 className="text-xl font-black uppercase dark:text-white">Encaissement</h2>

            <div className="text-center py-4 bg-slate-50 dark:bg-slate-800 rounded-2xl">
              <p className="text-xs text-slate-400 uppercase font-bold">Total à payer</p>
              <p className="text-4xl font-black text-emerald-600">
                {displayTotal.value} {displayTotal.symbol}
              </p>
              <p className="text-[10px] text-slate-400 mt-1">Taux figé: 1 USD = {rate} CDF</p>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {(['CASH', 'MOBILE_MONEY', 'CARD', 'INSURANCE'] as PaymentMethodType[]).map((m) => (
                <button
                  key={m}
                  onClick={() => dispatch(setPaymentMethod(m))}
                  className={`py-2 rounded-xl text-[10px] font-black uppercase ${
                    paymentMethod === m
                      ? 'bg-slate-900 text-white'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
                  }`}
                >
                  {m.replace('_', ' ')}
                </button>
              ))}
            </div>

            {paymentMethod === 'CASH' && (
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase">Montant reçu</label>
                <input
                  type="number"
                  min={0}
                  step="0.01"
                  value={tendered}
                  onChange={(e) => setTendered(e.target.value)}
                  className="w-full mt-1 px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white font-bold"
                  autoFocus
                />
                {tenderedNum > 0 && (
                  <p className="text-sm font-bold text-emerald-600 mt-2">
                    Monnaie: {change.toFixed(2)} {displayTotal.symbol}
                  </p>
                )}
              </div>
            )}

            {error && <p className="text-red-500 text-xs font-bold text-center">{error}</p>}

            <div className="flex gap-3">
              <button
                onClick={handleClose}
                className="flex-1 py-3 rounded-xl border font-bold text-slate-500"
              >
                Annuler
              </button>
              <button
                onClick={() => void handleCheckout()}
                disabled={isLoading || cart.length === 0}
                className="flex-1 py-3 rounded-xl bg-emerald-600 text-white font-black uppercase text-xs disabled:opacity-50"
              >
                {isLoading ? '...' : 'Confirmer'}
              </button>
            </div>

            {authUser && (
              <p className="text-[10px] text-center text-slate-400">Caissier: {authUser.name}</p>
            )}
          </>
        )}
      </div>
    </div>
  )
}
