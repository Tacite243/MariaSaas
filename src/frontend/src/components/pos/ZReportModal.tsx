import React from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { AppDispatch, RootState } from '@renderer/app/store/store'
import { setZReportData } from '@renderer/app/store/slice/posSlice'
import { formatCdf, formatUsdCents } from '@shared/utils/money'

export const ZReportModal: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>()
  const zReportData = useSelector((s: RootState) => s.pos.zReportData) as {
    zReport?: {
      salesCount: number
      totalSalesUsdCents: number
      totalSalesCdf: number
      declaredUsdCents: number
      declaredCdfCents: number
      systemUsdCents: number
      systemCdfCents: number
      discrepancyUsdCents: number
      discrepancyCdfCents: number
      exchangeRate: number
    }
    session?: { cashier?: { name: string }; closedAt?: string }
  } | null

  if (!zReportData?.zReport) return null

  const z = zReportData.zReport

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-md p-6 space-y-4">
        <h2 className="text-xl font-black uppercase dark:text-white">Z de Caisse</h2>
        <p className="text-xs text-slate-400">
          Caissier: {zReportData.session?.cashier?.name ?? '—'}
        </p>

        <div className="space-y-2 text-sm dark:text-slate-200">
          <div className="flex justify-between">
            <span>Ventes</span>
            <span className="font-bold">{z.salesCount}</span>
          </div>
          <div className="flex justify-between">
            <span>CA USD</span>
            <span className="font-bold">${formatUsdCents(z.totalSalesUsdCents)}</span>
          </div>
          <div className="flex justify-between">
            <span>CA CDF</span>
            <span className="font-bold">{formatCdf(z.totalSalesCdf)} FC</span>
          </div>
          <hr className="border-slate-200 dark:border-slate-700" />
          <div className="flex justify-between">
            <span>Déclaré USD</span>
            <span>${formatUsdCents(z.declaredUsdCents)}</span>
          </div>
          <div className="flex justify-between">
            <span>Système USD</span>
            <span>${formatUsdCents(z.systemUsdCents)}</span>
          </div>
          <div className="flex justify-between font-black">
            <span>Écart USD</span>
            <span className={z.discrepancyUsdCents !== 0 ? 'text-red-500' : 'text-emerald-500'}>
              ${formatUsdCents(z.discrepancyUsdCents)}
            </span>
          </div>
          <div className="flex justify-between font-black">
            <span>Écart CDF</span>
            <span className={z.discrepancyCdfCents !== 0 ? 'text-red-500' : 'text-emerald-500'}>
              {formatCdf(z.discrepancyCdfCents)} FC
            </span>
          </div>
        </div>

        <button
          onClick={() => dispatch(setZReportData(null))}
          className="w-full py-3 rounded-xl bg-slate-900 dark:bg-emerald-600 text-white font-black uppercase text-xs"
        >
          Fermer
        </button>
      </div>
    </div>
  )
}
