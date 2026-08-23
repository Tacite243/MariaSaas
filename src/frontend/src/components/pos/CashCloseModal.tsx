import React, { useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { AppDispatch, RootState } from '@renderer/app/store/store'
import { closeCashSession } from '@renderer/app/store/slice/cashSessionSlice'
import { setCloseSessionModalOpen, setZReportData } from '@renderer/app/store/slice/posSlice'
import { DenominationTable, useDenominationState } from './DenominationTable'

export const CashCloseModal: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>()
  const open = useSelector((s: RootState) => s.pos.closeSessionModalOpen)
  const session = useSelector((s: RootState) => s.cashSession.activeSession)
  const user = useSelector((s: RootState) => s.auth.user)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const usd = useDenominationState('USD')
  const cdf = useDenominationState('CDF')

  if (!open) return null

  const handleClose = () => dispatch(setCloseSessionModalOpen(false))

  const handleSubmit = async () => {
    if (!session || !user) return
    setIsSubmitting(true)
    setError(null)
    try {
      const result = await dispatch(
        closeCashSession({
          sessionId: session.id,
          cashierId: user.id,
          usdDenominations: usd.toEntries(),
          cdfDenominations: cdf.toEntries()
        })
      ).unwrap()
      dispatch(setZReportData(result))
      dispatch(setCloseSessionModalOpen(false))
    } catch (err: unknown) {
      setError((err as Error).message || 'Erreur de clôture')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6 space-y-6">
        <div>
          <h2 className="text-xl font-black uppercase tracking-tight dark:text-white">
            Clôture de caisse (Z)
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Comptage aveugle — saisissez uniquement les coupures physiques comptées.
          </p>
        </div>

        <DenominationTable currency="USD" values={usd.values} onChange={usd.setQuantity} />
        <DenominationTable currency="CDF" values={cdf.values} onChange={cdf.setQuantity} />

        {error && (
          <p className="text-red-500 text-xs font-bold text-center bg-red-50 p-2 rounded-xl">{error}</p>
        )}

        <div className="flex gap-3">
          <button
            onClick={handleClose}
            className="flex-1 py-3 rounded-xl border border-slate-200 dark:border-slate-700 font-bold text-slate-500"
          >
            Annuler
          </button>
          <button
            onClick={() => void handleSubmit()}
            disabled={isSubmitting}
            className="flex-1 py-3 rounded-xl bg-slate-900 dark:bg-emerald-600 text-white font-black uppercase tracking-widest text-xs disabled:opacity-50"
          >
            {isSubmitting ? 'Clôture...' : 'Valider Z de caisse'}
          </button>
        </div>
      </div>
    </div>
  )
}
