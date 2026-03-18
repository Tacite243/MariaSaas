import React from 'react'
import { UIMedication } from '@renderer/features/inventory/types'
import { deleteProduct } from '@renderer/app/store/slice/inventorySlice'
import { useDispatch } from 'react-redux'
import { AppDispatch } from '@renderer/app/store/store'



interface Props {
  medications: UIMedication[]
  onSelect: (med: UIMedication) => void
  onEdit: (med: UIMedication) => void
}

export const ProductTable: React.FC<Props> = ({ medications, onSelect, onEdit }) => {
  const dispatch = useDispatch<AppDispatch>()

  return (
    <table className="w-full text-left min-w-[750px]">
      <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
        <tr>
          <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Article & QR</th>
          <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Catégorie</th>
          <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Dosage</th>
          <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Stock</th>
          <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">P. Achat</th>
          <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">P. Vente</th>
          <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Marge</th>
          <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Action</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
        {medications.map((med) => {
          const isLow = med.currentStock <= med.minStock
          const margin = med.sellPrice - med.buyingPrice
          const marginPercent = med.sellPrice > 0 ? ((margin / med.sellPrice) * 100).toFixed(0) : 0

          return (
            <tr
              key={med.id}
              className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all group"
            >
              {/* Article */}
              <td className="px-6 py-4">
                <div className="flex items-center gap-4">
                  {med.qrCode && (
                    <div
                      className="w-10 h-10 bg-white p-1 rounded-lg border dark:border-slate-700 flex-none cursor-pointer"
                      onClick={() => onSelect(med)}
                    >
                      <img src={med.qrCode} alt="QR" className="w-full h-full object-contain" />
                    </div>
                  )}
                  <div className="flex flex-col min-w-0">
                    <span className="font-black text-slate-900 dark:text-white text-sm truncate">
                      {med.name}
                    </span>
                    <span className="text-[9px] font-black text-sky-600 uppercase tracking-widest mt-0.5">
                      {med.code}
                    </span>
                  </div>
                </div>
              </td>

              {/* Catégorie (Ajouté pour aligner les colonnes) */}
              <td className="px-6 py-4 text-center font-bold text-slate-500 dark:text-slate-400 text-xs">
                {med.category || '-'}
              </td>

              {/* Dosage */}
              <td className="px-6 py-4 text-center font-bold text-slate-500 dark:text-slate-400 text-xs">
                {med.dosage || '-'}
              </td>

              {/* Stock */}
              <td className="px-6 py-4 text-center">
                <div
                  className={`inline-flex flex-col items-center px-3 py-1 rounded-lg ${isLow ? 'bg-red-50 dark:bg-red-900/20 text-red-600' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'}`}
                >
                  <span className="font-black text-sm leading-none">{med.currentStock}</span>
                </div>
              </td>

              {/* P. Achat */}
              <td className="px-6 py-4 text-right font-medium text-slate-400 text-xs">
                {med.buyingPrice.toLocaleString()} <span className="text-[9px] font-normal">Fc</span>
              </td>

              {/* P. Vente */}
              <td className="px-6 py-4 text-right font-black text-slate-700 dark:text-white text-sm">
                {med.sellPrice.toLocaleString()} <span className="text-[9px] text-slate-400 font-normal">Fc</span>
              </td>

              {/* Marge */}
              <td className="px-6 py-4 text-right">
                <span
                  className={`text-xs font-black ${margin >= 0 ? 'text-emerald-600' : 'text-red-500'}`}
                >
                  {margin > 0 ? '+' : ''}
                  {marginPercent}%
                </span>
              </td>

              {/* Action */}
              <td className="px-6 py-4 text-right flex items-center justify-end gap-2">
                <button
                  onClick={() => onEdit(med)}
                  className="p-2 text-slate-400 hover:text-sky-600 transition-colors"
                  title="Modifier"
                >
                  ✏️
                </button>
                <button
                  onClick={() => { if (confirm('Supprimer ce produit définitivement ?')) dispatch(deleteProduct(med.id)) }}
                  className="p-2 text-slate-400 hover:text-red-600 transition-colors"
                  title="Supprimer"
                >
                  🗑️
                </button>
              </td>
            </tr>
          )
        })}
      </tbody>
    </table>
  )
}