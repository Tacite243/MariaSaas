import React, { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { AppDispatch, RootState } from '@renderer/app/store/store'
import { fetchExpiryAlerts } from '@renderer/app/store/slice/stockAuditSlice'
import { ExpirySeverity } from '@shared/types/stock.types'

const severityLabel: Record<ExpirySeverity, string> = {
  EXPIRED: 'Périmé',
  CRITICAL: 'Critique',
  WARNING: 'Attention',
  WATCH: 'Surveillance',
  OK: 'OK'
}

const severityColor: Record<ExpirySeverity, string> = {
  EXPIRED: 'bg-red-600',
  CRITICAL: 'bg-red-500',
  WARNING: 'bg-amber-500',
  WATCH: 'bg-yellow-400',
  OK: 'bg-emerald-500'
}

interface Props {
  lowStockCount: number
}

export const ExpiryAlertsPanel: React.FC<Props> = ({ lowStockCount }) => {
  const dispatch = useDispatch<AppDispatch>()
  const navigate = useNavigate()
  const alerts = useSelector((s: RootState) => s.stock.expiryAlerts)

  useEffect(() => {
    void dispatch(fetchExpiryAlerts())
  }, [dispatch])

  const topBatches = alerts?.batches.slice(0, 4) ?? []
  const criticalTotal = (alerts?.critical ?? 0) + (alerts?.expired ?? 0)

  return (
    <div className="bg-white dark:bg-slate-900 p-6 md:p-10 rounded-[1rem] border border-slate-200 dark:border-slate-800 shadow-sm">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-black italic text-slate-900 dark:text-white uppercase tracking-tighter">
          Alertes Péremption
        </h3>
        {criticalTotal > 0 && (
          <span className="px-2 py-1 rounded-full bg-red-100 text-red-600 text-[10px] font-black">
            {criticalTotal} critique(s)
          </span>
        )}
      </div>

      <div className="grid grid-cols-3 gap-2 mb-6">
        <div className="text-center p-3 rounded-xl bg-red-50 dark:bg-red-900/20">
          <p className="text-xl font-black text-red-600">{alerts?.critical ?? 0}</p>
          <p className="text-[9px] font-bold text-red-400 uppercase">&lt; 30j</p>
        </div>
        <div className="text-center p-3 rounded-xl bg-amber-50 dark:bg-amber-900/20">
          <p className="text-xl font-black text-amber-600">{alerts?.warning ?? 0}</p>
          <p className="text-[9px] font-bold text-amber-400 uppercase">31-90j</p>
        </div>
        <div className="text-center p-3 rounded-xl bg-yellow-50 dark:bg-yellow-900/20">
          <p className="text-xl font-black text-yellow-600">{alerts?.watch ?? 0}</p>
          <p className="text-[9px] font-bold text-yellow-500 uppercase">91-180j</p>
        </div>
      </div>

      <div className="space-y-2 mb-6 max-h-40 overflow-y-auto">
        {topBatches.length === 0 ? (
          <p className="text-xs text-slate-400 text-center py-4">Aucune alerte péremption</p>
        ) : (
          topBatches.map((b) => (
            <div
              key={b.lotId}
              className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 text-xs"
            >
              <span className={`w-2 h-2 rounded-full ${severityColor[b.severity]}`} />
              <div className="flex-1 min-w-0">
                <p className="font-bold truncate dark:text-white">{b.productName}</p>
                <p className="text-slate-400">Lot {b.batchNumber} — {b.daysUntilExpiry}j</p>
              </div>
              <span className="text-[9px] font-black uppercase text-slate-400">
                {severityLabel[b.severity]}
              </span>
            </div>
          ))
        )}
      </div>

      <p className="text-[10px] text-slate-400 mb-3">{lowStockCount} produit(s) sous seuil min.</p>

      <button
        onClick={() => navigate('/inventory')}
        className="w-full py-3 bg-emerald-50 dark:bg-slate-800 text-emerald-600 dark:text-slate-300 rounded-2xl font-black uppercase text-[10px] tracking-widest"
      >
        Voir Inventaire
      </button>
    </div>
  )
}
