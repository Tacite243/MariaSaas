import React, { useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { AppDispatch, RootState } from '@renderer/app/store/store'
import { writeOffLot, fetchExpiryAlerts } from '@renderer/app/store/slice/stockAuditSlice'
import { WriteOffReason } from '@shared/types/stock.types'

interface Props {
  lotId: string
  productName: string
  batchNumber: string
  maxQuantity: number
  onClose: () => void
}

export const WriteOffModal: React.FC<Props> = ({
  lotId,
  productName,
  batchNumber,
  maxQuantity,
  onClose
}) => {
  const dispatch = useDispatch<AppDispatch>()
  const user = useSelector((s: RootState) => s.auth.user)
  const [quantity, setQuantity] = useState(1)
  const [reason, setReason] = useState<WriteOffReason>(WriteOffReason.EXPIRY_DESTRUCTION)
  const [notes, setNotes] = useState('')
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async () => {
    if (!user?.id || notes.trim().length < 3) {
      setError('Motif obligatoire (min. 3 caractères)')
      return
    }
    try {
      await dispatch(
        writeOffLot({
          stockLotId: lotId,
          quantity,
          reason,
          notes: notes.trim(),
          performedById: user.id
        })
      ).unwrap()
      await dispatch(fetchExpiryAlerts())
      onClose()
    } catch (err: unknown) {
      setError((err as Error).message)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 w-full max-w-md space-y-4">
        <h3 className="font-black uppercase dark:text-white">Déclasser / Sortie stock</h3>
        <p className="text-sm text-slate-500">
          {productName} — Lot {batchNumber}
        </p>
        <input
          type="number"
          min={1}
          max={maxQuantity}
          value={quantity}
          onChange={(e) => setQuantity(Math.min(maxQuantity, parseInt(e.target.value, 10) || 1))}
          className="w-full px-3 py-2 rounded-xl border dark:bg-slate-800 dark:text-white"
        />
        <select
          value={reason}
          onChange={(e) => setReason(e.target.value as WriteOffReason)}
          className="w-full px-3 py-2 rounded-xl border dark:bg-slate-800 dark:text-white"
        >
          <option value={WriteOffReason.EXPIRY_DESTRUCTION}>Destruction (péremption)</option>
          <option value={WriteOffReason.SUPPLIER_RETURN}>Retour fournisseur</option>
          <option value={WriteOffReason.OTHER}>Autre</option>
        </select>
        <textarea
          placeholder="Motif détaillé *"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="w-full px-3 py-2 rounded-xl border dark:bg-slate-800 dark:text-white text-sm"
          rows={3}
        />
        {error && <p className="text-red-500 text-xs font-bold">{error}</p>}
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 py-2 border rounded-xl font-bold text-slate-500">
            Annuler
          </button>
          <button
            onClick={() => void handleSubmit()}
            className="flex-1 py-2 bg-red-600 text-white rounded-xl font-black uppercase text-xs"
          >
            Confirmer sortie
          </button>
        </div>
      </div>
    </div>
  )
}
