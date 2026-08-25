import React, { useMemo, useState } from 'react'
import { UIMedication } from '../features/inventory/types'
import { ProductLotDTO } from '@shared/types'
import { WriteOffModal } from './inventory/WriteOffModal'
import { daysUntilExpiry, getExpirySeverity } from '@shared/utils/expiry'

interface FlatLot extends ProductLotDTO {
  medName: string
  medCode: string
  productId: string
  receivedDate: string
}

interface Props {
  medications: UIMedication[]
}

export const LotTable: React.FC<Props> = ({ medications }) => {
  const [writeOffTarget, setWriteOffTarget] = useState<FlatLot | null>(null)

  const lots = useMemo(() => {
    const flatLots: FlatLot[] = []
    medications.forEach((med) => {
      med.lots.forEach((lot) => {
        flatLots.push({
          id: lot.id,
          batchNumber: lot.batchNumber,
          expiryDate: lot.expiryDate,
          quantity: lot.quantity,
          receivedDate: lot.receivedDate,
          medName: med.name,
          medCode: med.code,
          productId: med.id
        })
      })
    })
    return flatLots.sort(
      (a, b) => new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime()
    )
  }, [medications])

  if (lots.length === 0) {
    return (
      <div className="p-20 text-center flex flex-col items-center justify-center gap-4">
        <p className="text-slate-400 font-black uppercase text-[10px] tracking-widest">
          Aucun lot détecté en stock
        </p>
      </div>
    )
  }

  return (
    <>
      <table className="w-full text-left min-w-[800px]">
        <thead className="bg-slate-50/50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
          <tr>
            <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase">Produit</th>
            <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase">Lot #</th>
            <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase">Péremption</th>
            <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase text-center">Qté</th>
            <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase text-right">Statut</th>
            <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase text-right">Action</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
          {lots.map((lot) => {
            const days = daysUntilExpiry(lot.expiryDate)
            const severity = getExpirySeverity(days)
            const label =
              severity === 'EXPIRED' || severity === 'CRITICAL'
                ? 'Critique'
                : severity === 'WARNING'
                  ? 'Attention'
                  : severity === 'WATCH'
                    ? 'Surveillance'
                    : 'Valide'

            return (
              <tr key={lot.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800">
                <td className="px-10 py-6">
                  <span className="font-black text-sm dark:text-white">{lot.medName}</span>
                </td>
                <td className="px-10 py-6 font-mono text-xs">{lot.batchNumber}</td>
                <td className="px-10 py-6">{new Date(lot.expiryDate).toLocaleDateString()}</td>
                <td className="px-10 py-6 text-center font-black dark:text-white">{lot.quantity}</td>
                <td className="px-10 py-6 text-right">
                  <span className="text-[8px] font-black uppercase px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800">
                    {label} ({days}j)
                  </span>
                </td>
                <td className="px-10 py-6 text-right">
                  {(severity === 'EXPIRED' || severity === 'CRITICAL' || severity === 'WARNING') && (
                    <button
                      onClick={() => setWriteOffTarget(lot)}
                      className="text-[9px] font-black uppercase text-red-500 hover:text-red-700"
                    >
                      Déclasser
                    </button>
                  )}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>

      {writeOffTarget && (
        <WriteOffModal
          lotId={writeOffTarget.id}
          productName={writeOffTarget.medName}
          batchNumber={writeOffTarget.batchNumber}
          maxQuantity={writeOffTarget.quantity}
          onClose={() => setWriteOffTarget(null)}
        />
      )}
    </>
  )
}
