import React from 'react'
import { useCurrency } from '@renderer/hooks/useCurrently'
import { CartItemUI } from '@renderer/app/store/slice/salesSlice'
import { CurrencySwitch } from './CurrencySwitch'



export type PaymentMethodType = 'CASH' | 'MOBILE_MONEY' | 'CARD'

interface Props {
  cart: CartItemUI[]
  subTotal: number // La valeur brute depuis Redux (qui est en USD)
  paymentMethod: string
  isLoading: boolean
  error: string | null
  onRemove: (id: string) => void
  onUpdateQty: (id: string, qty: number) => void
  onSetMethod: (method: PaymentMethodType) => void
  onCheckout: () => void
}

export const CartPanel: React.FC<Props> = ({
  cart,
  subTotal,
  paymentMethod,
  isLoading,
  error,
  onRemove,
  onUpdateQty,
  onSetMethod,
  onCheckout
}) => {
  const { currency, formatPrice } = useCurrency()

  const safeSubTotal = Number(subTotal) || 0;
  const displayTotal = formatPrice(safeSubTotal);

  const handleCheckoutClick = () => {
    if (confirm(`Confirmer l'encaissement de ${displayTotal.value} ${displayTotal.symbol} ?`)) {
      onCheckout()
    }
  }

  return (
    <div className="w-[420px] bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden h-full">

      {/* Header */}
      <div className="p-8 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex justify-between items-start">
        <div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight flex items-center gap-3 mb-1">
            Panier
            <span className="bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400 text-xs font-black px-3 py-1 rounded-full">
              {cart.length} Art.
            </span>
          </h2>
          <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">
            Ticket #{new Date().getTime().toString().slice(-6)}
          </p>
        </div>

        {/* Utilisation du composant globalisé */}
        <CurrencySwitch />
      </div>

      {/* Liste des Articles */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-4">
        {cart.map((item) => {
          const unitPriceFmt = formatPrice(Number(item.unitPrice) || 0);
          const lineTotalFmt = formatPrice((Number(item.unitPrice) || 0) * (Number(item.quantity) || 1));

          return (
            <div
              key={item.productId}
              className="flex items-center gap-4 p-4 rounded-3xl bg-slate-50 dark:bg-slate-950/50 border border-transparent hover:border-slate-200 dark:hover:border-slate-800 transition-all group"
            >
              <div className="flex-1 min-w-0">
                <h4 className="font-bold text-slate-800 dark:text-white text-sm truncate">
                  {item.name}
                </h4>
                <p className="text-[10px] text-slate-400 font-black mt-0.5 uppercase tracking-widest">
                  {unitPriceFmt.symbol} {unitPriceFmt.value} <span className="text-slate-300 font-normal lowercase mx-1">x</span> {item.quantity}
                </p>
              </div>

              <div className="flex items-center gap-1 bg-white dark:bg-slate-900 rounded-xl p-1 shadow-sm border border-slate-100 dark:border-slate-800">
                <button
                  onClick={() => onUpdateQty(item.productId, item.quantity - 1)}
                  className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors font-bold text-lg"
                >
                  -
                </button>
                <span className="text-sm font-black w-6 text-center dark:text-white">
                  {item.quantity}
                </span>
                <button
                  onClick={() => onUpdateQty(item.productId, item.quantity + 1)}
                  className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-lg transition-colors font-bold text-lg"
                >
                  +
                </button>
              </div>

              <div className="text-right min-w-[70px]">
                <p className="font-black text-slate-900 dark:text-white text-sm">
                  {lineTotalFmt.value} <span className="text-[9px] text-slate-400">{lineTotalFmt.symbol}</span>
                </p>
                <button
                  onClick={() => onRemove(item.productId)}
                  className="text-[10px] text-red-400 font-bold hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity mt-1"
                >
                  SUPPR.
                </button>
              </div>
            </div>
          )
        })}

        {cart.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-slate-300 dark:text-slate-700 opacity-50 space-y-4">
            <svg width="80" height="80" fill="none" stroke="currentColor" strokeWidth="1" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 0 0-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
            <p className="text-sm font-black uppercase tracking-widest">En attente de produits</p>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-8 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 shadow-[0_-10px_40px_rgba(0,0,0,0.05)] z-10 space-y-6">

        {/* Moyens de Paiement */}
        <div className="grid grid-cols-3 gap-2">
          {(['CASH', 'MOBILE_MONEY', 'CARD'] as const).map((method) => (
            <button
              key={method}
              onClick={() => onSetMethod(method)}
              className={`py-3 rounded-xl text-[9px] font-black uppercase tracking-widest border transition-all ${paymentMethod === method
                  ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 border-transparent shadow-lg scale-105'
                  : 'bg-slate-50 dark:bg-slate-800 border-transparent text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
                }`}
            >
              {method === 'MOBILE_MONEY' ? 'Mobile' : method}
            </button>
          ))}
        </div>

        {/* TOTAL */}
        <div className="space-y-2 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
          <div className="flex justify-between text-xs font-bold text-slate-400 uppercase tracking-wider">
            <span>Net à payer</span>
            <span>TTC</span>
          </div>
          <div className="flex justify-between items-baseline mt-1">
            <span className={`text-5xl font-black tracking-tighter ${currency === 'USD' ? 'text-emerald-500' : 'text-slate-900 dark:text-white'}`}>
              {displayTotal.value || '0.00'}
            </span>
            <span className={`text-lg font-black ml-2 uppercase ${currency === 'USD' ? 'text-emerald-500/50' : 'text-slate-400'}`}>
              {displayTotal.symbol}
            </span>
          </div>
        </div>

        {error && (
          <div className="text-red-500 text-xs font-bold text-center bg-red-50 p-3 rounded-xl animate-bounce">
            {error}
          </div>
        )}

        <button
          onClick={handleCheckoutClick}
          disabled={cart.length === 0 || isLoading}
          className="w-full py-5 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-200 disabled:dark:bg-slate-800 disabled:text-slate-400 disabled:cursor-not-allowed text-white font-black rounded-2xl shadow-xl shadow-emerald-600/30 active:scale-[0.98] transition-all flex items-center justify-center gap-4 text-sm uppercase tracking-widest"
        >
          {isLoading ? (
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
          ) : (
            <>
              <span>Encaisser {displayTotal.symbol}</span>
              <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </>
          )}
        </button>
      </div>
    </div>
  )
}