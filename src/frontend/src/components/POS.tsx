import React, { useMemo, useRef, useEffect, useCallback } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { usePosLogic } from '../hooks/usePosLogic'
import { useBarcodeScanner } from '../hooks/useBarcodeScanner'
import { usePOSShortcuts } from '../hooks/usePOSShortcuts'
import { SearchBar } from './SearchBar'
import { ProductGrid } from './ProductGrid'
import { CartPanel } from './CartPanel'
import { ProductDTO } from '@shared/types'
import { PosShortcutsBar } from './pos/PosShortcutsBar'
import { PaymentModal } from './pos/PaymentModal'
import { HeldCartsModal } from './pos/HeldCartsModal'
import { CashCloseModal } from './pos/CashCloseModal'
import { ZReportModal } from './pos/ZReportModal'
import { PrintSettingsModal } from './pos/PrintSettingsModal'
import { AppDispatch, RootState } from '@renderer/app/store/store'
import {
  fetchActiveCashSession,
  openCashSession
} from '@renderer/app/store/slice/cashSessionSlice'
import { fetchDailyRate } from '@renderer/app/store/slice/sessionSlice'
import { setCloseSessionModalOpen, setPrintSettingsModalOpen } from '@renderer/app/store/slice/posSlice'
import { toUsdCents, convertUsdCentsToCdf } from '@shared/utils/money'
import { buildReceiptControlPayload } from '@shared/utils/receiptQr'
import { PrescriptionModal } from './pos/PrescriptionModal'
import type { SalePrintPayload } from './pos/PaymentModal'

const POS: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>()
  const searchRef = useRef<HTMLInputElement>(null)
  const { state, actions } = usePosLogic()
  const user = useSelector((s: RootState) => s.auth.user)
  const activeSession = useSelector((s: RootState) => s.cashSession.activeSession)
  const exchangeRate = useSelector((s: RootState) => s.session.exchangeRate)

  useEffect(() => {
    dispatch(fetchDailyRate())
    if (user?.id) dispatch(fetchActiveCashSession(user.id))
  }, [dispatch, user?.id])

  useEffect(() => {
    const ensureSession = async () => {
      if (!user?.id || activeSession) return
      await dispatch(
        openCashSession({
          cashierId: user.id,
          exchangeRate,
          initialUsdCents: 0,
          initialCdfCents: 0
        })
      )
    }
    void ensureSession()
  }, [user?.id, activeSession, exchangeRate, dispatch])

  useBarcodeScanner({ enabled: true })
  usePOSShortcuts({ searchInputRef: searchRef })

  const safeProducts = useMemo<ProductDTO[]>(() => {
    return state.availableProducts.map(
      (p) =>
        ({
          ...p,
          dosage: p.dosage ?? null,
          dci: p.dci ?? null,
          form: p.form ?? null
        }) as ProductDTO
    )
  }, [state.availableProducts])

  const handlePrintReceipt = useCallback(
    async (sale: SalePrintPayload) => {
      const controlQrText = buildReceiptControlPayload({
        saleId: sale.id,
        reference: sale.reference,
        totalUsdCents: toUsdCents(sale.totalAmount),
        exchangeRate,
        date: new Date().toISOString()
      })

      try {
        await window.api.pos.printReceipt({
          saleId: sale.id,
          reference: sale.reference,
          date: new Date().toLocaleString('fr-CD'),
          cashierName: user?.name ?? 'Caissier',
          items: sale.items.map((i) => ({
            name: i.product.name,
            dci: i.product.dci,
            quantity: i.quantity,
            unitPriceMinor: toUsdCents(i.unitPrice),
            totalMinor: toUsdCents(i.total),
            currency: 'USD' as const
          })),
          subTotalUsdCents: toUsdCents(sale.totalAmount),
          subTotalCdf: convertUsdCentsToCdf(toUsdCents(sale.totalAmount), exchangeRate),
          exchangeRate,
          paymentMethod: sale.paymentMethod,
          controlQrText
        })
      } catch {
        // Impression optionnelle
      }

      return controlQrText
    },
    [user?.name, exchangeRate]
  )

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] pb-10">
      <div className="flex gap-4 mb-4 items-center justify-between">
        <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">
          Session: {activeSession ? 'Ouverte' : '...'}
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => dispatch(setCloseSessionModalOpen(true))}
            className="px-3 py-1.5 text-[10px] font-black uppercase bg-slate-800 text-white rounded-lg"
          >
            Z Caisse
          </button>
          <button
            onClick={() => dispatch(setPrintSettingsModalOpen(true))}
            className="px-3 py-1.5 text-[10px] font-black uppercase border border-slate-300 dark:border-slate-600 rounded-lg dark:text-white"
          >
            Imprimante
          </button>
        </div>
      </div>

      <div className="flex flex-1 gap-8 min-h-0">
        <div className="flex-1 flex flex-col gap-8 min-w-0">
          <SearchBar
            ref={searchRef}
            value={state.searchTerm}
            onChange={actions.setSearchTerm}
          />
          <ProductGrid products={safeProducts} onAdd={actions.addToCart} />
        </div>

        <div className="flex-none h-full">
          <CartPanel
            cart={state.cart}
            subTotal={state.subTotal}
            paymentMethod={state.paymentMethod}
            isLoading={state.isLoading}
            error={state.error}
            onRemove={actions.removeFromCart}
            onUpdateQty={actions.updateQuantity}
            onSetMethod={actions.setPaymentMethod}
            onCheckout={actions.openPayment}
          />
        </div>
      </div>

      <PosShortcutsBar />
      <PrescriptionModal />
      <PaymentModal subTotal={state.subTotal} onPrintReceipt={handlePrintReceipt} />
      <HeldCartsModal />
      <CashCloseModal />
      <ZReportModal />
      <PrintSettingsModal />
    </div>
  )
}

export default POS
