import React, { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { AppDispatch, RootState } from '@renderer/app/store/store'
import {
  createStockAudit,
  addStockAuditItems,
  completeStockAudit,
  setActiveAudit
} from '@renderer/app/store/slice/stockAuditSlice'
import { UserRole } from '@shared/types'

export const StockAuditPanel: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>()
  const user = useSelector((s: RootState) => s.auth.user)
  const exchangeRate = useSelector((s: RootState) => s.session.exchangeRate)
  const activeAudit = useSelector((s: RootState) => s.stock.activeAudit)
  const [scanCode, setScanCode] = useState('')
  const [countedQty, setCountedQty] = useState(1)
  const [message, setMessage] = useState<string | null>(null)

  useEffect(() => {
    if (!activeAudit && user?.id) {
      void dispatch(createStockAudit({ createdById: user.id, exchangeRate })).then((r) => {
        if (createStockAudit.fulfilled.match(r)) {
          dispatch(setActiveAudit(r.payload))
        }
      })
    }
  }, [activeAudit, user?.id, exchangeRate, dispatch])

  const handleScan = async () => {
    if (!activeAudit || !scanCode.trim()) return
    try {
      const res = await window.api.pos.findProductByCode(scanCode.trim())
      if (!res.success || !res.data) throw new Error('Produit introuvable')
      const product = res.data as { id: string; name: string; lots?: { id: string; quantity: number }[] }
      const lot = product.lots?.[0]

      const updated = await dispatch(
        addStockAuditItems({
          auditId: activeAudit.id,
          exchangeRate,
          items: [
            {
              productId: product.id,
              stockLotId: lot?.id,
              countedQuantity: countedQty
            }
          ]
        })
      ).unwrap()

      dispatch(setActiveAudit(updated))
      setMessage(`${product.name} — compté: ${countedQty}`)
      setScanCode('')
    } catch (err: unknown) {
      setMessage((err as Error).message)
    }
  }

  const handleComplete = async () => {
    if (!activeAudit || !user?.id) return
    try {
      await dispatch(
        completeStockAudit({
          auditId: activeAudit.id,
          completedById: user.id,
          userRole: user.role as UserRole
        })
      ).unwrap()
      setMessage('Inventaire validé — stocks ajustés')
      dispatch(setActiveAudit(null))
    } catch (err: unknown) {
      setMessage((err as Error).message)
    }
  }

  const canValidate = user?.role === UserRole.ADMIN || user?.role === UserRole.SUPERADMIN

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-slate-900 rounded-3xl border dark:border-slate-800 p-6">
        <h3 className="font-black uppercase dark:text-white mb-2">Inventaire tournant</h3>
        <p className="text-xs text-slate-400 mb-4">
          Réf: {activeAudit?.reference ?? '...'} — scannez ou saisissez le code produit
        </p>

        <div className="flex gap-2 mb-4">
          <input
            data-pos-search="true"
            value={scanCode}
            onChange={(e) => setScanCode(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && void handleScan()}
            placeholder="Code-barres / EAN"
            className="flex-1 px-4 py-3 rounded-xl border dark:bg-slate-800 dark:text-white font-bold"
          />
          <input
            type="number"
            min={0}
            value={countedQty}
            onChange={(e) => setCountedQty(parseInt(e.target.value, 10) || 0)}
            className="w-24 px-3 py-3 rounded-xl border dark:bg-slate-800 dark:text-white text-center font-black"
          />
          <button
            onClick={() => void handleScan()}
            className="px-4 py-3 bg-sky-600 text-white rounded-xl font-black text-xs uppercase"
          >
            Compter
          </button>
        </div>

        {message && <p className="text-sm font-bold text-emerald-600 mb-4">{message}</p>}

        {activeAudit && activeAudit.items.length > 0 && (
          <div className="overflow-x-auto mb-4">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-[10px] uppercase text-slate-400">
                  <th className="text-left py-2">Produit</th>
                  <th className="text-center">Attendu</th>
                  <th className="text-center">Compté</th>
                  <th className="text-center">Écart</th>
                  <th className="text-right">Perte USD</th>
                </tr>
              </thead>
              <tbody>
                {activeAudit.items.map((i) => (
                  <tr key={i.id} className="border-t dark:border-slate-800">
                    <td className="py-2 dark:text-white">{i.productName}</td>
                    <td className="text-center">{i.expectedQuantity}</td>
                    <td className="text-center font-black">{i.countedQuantity}</td>
                    <td className={`text-center font-black ${i.discrepancy !== 0 ? 'text-red-500' : ''}`}>
                      {i.discrepancy > 0 ? `+${i.discrepancy}` : i.discrepancy}
                    </td>
                    <td className="text-right">${i.lossValueUsd.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="flex justify-end gap-6 mt-4 text-sm font-bold dark:text-white">
              <span>Pertes: ${activeAudit.totalLossUsd.toFixed(2)}</span>
              <span>Excédents: ${activeAudit.totalGainUsd.toFixed(2)}</span>
            </div>
          </div>
        )}

        {canValidate && activeAudit && activeAudit.items.length > 0 && (
          <button
            onClick={() => void handleComplete()}
            className="w-full py-3 bg-slate-900 dark:bg-emerald-600 text-white rounded-xl font-black uppercase text-xs"
          >
            Valider inventaire (ajustement atomique)
          </button>
        )}
      </div>
    </div>
  )
}
