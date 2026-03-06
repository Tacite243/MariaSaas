import React, { useMemo, useState } from 'react'
import { CATEGORIES } from '../features/inventory/types'
import { ProductInput } from '@shared/schemas/inventorySchema'

interface Props {
  onClose: () => void
  onSubmit: (data: ProductInput) => void
}

export const AddProductModal: React.FC<Props> = ({ onClose, onSubmit }) => {
  const [newMed, setNewMed] = useState<ProductInput>({
    name: '',
    dci: '',
    code: '',
    codeCip7: '',
    codeAtc: '',
    category: 'Générique',
    form: '',
    dosage: '',
    packaging: '',
    description: '',
    isPrescriptionRequired: false,
    minStock: 5,
    maxStock: 0,
    location: '',
    sellPrice: 0,
    buyingPrice: 0,
    vatRate: 0
  })

  const marginStats = useMemo(() => {
    const buy = Number(newMed.buyingPrice) || 0
    const sell = Number(newMed.sellPrice) || 0
    const profit = sell - buy

    const marginPercent = sell > 0 ? ((profit / sell) * 100).toFixed(1) : '0'

    return {
      profit,
      marginPercent,
      isPositive: profit >= 0
    }
  }, [newMed.buyingPrice, newMed.sellPrice])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(newMed)
  }

  const inputStyle =
    'w-full p-4 bg-slate-50 dark:bg-slate-800 rounded-xl outline-none dark:text-white'

  const inputMono =
    'w-full p-4 bg-slate-50 dark:bg-slate-800 rounded-xl outline-none dark:text-white font-mono text-sm'

  return (
    <div className="fixed inset-0 z-[100] bg-slate-900/80 backdrop-blur-xl flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-[2rem] p-8 shadow-2xl border border-slate-200 dark:border-slate-800 max-h-[90vh] overflow-y-auto custom-scrollbar">
        <div className="mb-6 border-b border-slate-100 dark:border-slate-800 pb-4">
          <h3 className="text-xl font-black text-slate-900 dark:text-white">Nouveau Médicament</h3>
          <p className="text-xs text-slate-400 mt-1">Fiche produit réglementaire</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* IDENTIFICATION */}

          <div className="space-y-4">
            <h4 className="text-xs font-bold text-sky-600 uppercase tracking-widest">
              Identification
            </h4>

            <div className="grid grid-cols-1 gap-4">
              <input
                type="text"
                placeholder="Nom Commercial (ex: Doliprane)"
                className={`${inputStyle} font-bold`}
                value={newMed.name}
                onChange={(e) => setNewMed({ ...newMed, name: e.target.value })}
                required
              />

              <input
                type="text"
                placeholder="DCI / Molécule (ex: Paracétamol)"
                className={inputStyle}
                value={newMed.dci || ''}
                onChange={(e) => setNewMed({ ...newMed, dci: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <input
                type="text"
                placeholder="Code EAN13"
                className={inputMono}
                value={newMed.code || ''}
                onChange={(e) => setNewMed({ ...newMed, code: e.target.value })}
              />

              <input
                type="text"
                placeholder="Code CIP7"
                className={inputMono}
                value={newMed.codeCip7 || ''}
                onChange={(e) => setNewMed({ ...newMed, codeCip7: e.target.value })}
              />

              <input
                type="text"
                placeholder="Code ATC"
                className={inputMono}
                value={newMed.codeAtc || ''}
                onChange={(e) => setNewMed({ ...newMed, codeAtc: e.target.value })}
              />
            </div>
          </div>

          {/* GALÉNIQUE */}

          <div className="space-y-4">
            <h4 className="text-xs font-bold text-sky-600 uppercase tracking-widest">
              Galénique & Conditionnement
            </h4>

            <div className="grid grid-cols-3 gap-4">
              <input
                type="text"
                placeholder="Forme (Comp, Sirop...)"
                className={inputStyle}
                value={newMed.form || ''}
                onChange={(e) => setNewMed({ ...newMed, form: e.target.value })}
              />

              <input
                type="text"
                placeholder="Dosage (500mg)"
                className={inputStyle}
                value={newMed.dosage || ''}
                onChange={(e) => setNewMed({ ...newMed, dosage: e.target.value })}
              />

              <input
                type="text"
                placeholder="Conditionnement"
                className={inputStyle}
                value={newMed.packaging || ''}
                onChange={(e) => setNewMed({ ...newMed, packaging: e.target.value })}
              />
            </div>

            {/* CATEGORIES */}

            <div className="flex gap-2 overflow-x-auto no-scrollbar py-2">
              {CATEGORIES.filter((c) => c !== 'Tous').map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setNewMed({ ...newMed, category: cat })}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap border transition-all
                    ${
                      newMed.category === cat
                        ? 'bg-sky-600 text-white border-sky-600'
                        : 'bg-transparent border-slate-200 text-slate-500'
                    }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* ORDONNANCE */}

            <div className="flex items-center gap-3 p-3 bg-red-50 dark:bg-red-900/10 rounded-xl border border-red-100 dark:border-red-900/30">
              <input
                type="checkbox"
                id="prescription"
                checked={newMed.isPrescriptionRequired}
                onChange={(e) =>
                  setNewMed({
                    ...newMed,
                    isPrescriptionRequired: e.target.checked
                  })
                }
                className="w-5 h-5 accent-red-600 cursor-pointer"
              />

              <label
                htmlFor="prescription"
                className="text-sm font-bold text-red-600 dark:text-red-400 cursor-pointer"
              >
                Ordonnance Obligatoire (Liste I/II)
              </label>
            </div>
          </div>

          {/* FINANCES */}

          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h4 className="text-xs font-bold text-sky-600 uppercase tracking-widest">
                Finances & Logistique
              </h4>

              {newMed.sellPrice > 0 && (
                <span
                  className={`text-xs font-bold px-2 py-1 rounded
                  ${
                    marginStats.isPositive
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'bg-red-100 text-red-700'
                  }`}
                >
                  Marge : {marginStats.profit} ({marginStats.marginPercent}%)
                </span>
              )}
            </div>

            {/* PRIX */}

            <div className="grid grid-cols-2 gap-4">
              <input
                type="number"
                placeholder="Prix Achat"
                className={`${inputStyle} font-bold`}
                value={newMed.buyingPrice || ''}
                onChange={(e) =>
                  setNewMed({
                    ...newMed,
                    buyingPrice: Number(e.target.value)
                  })
                }
              />

              <input
                type="number"
                placeholder="Prix Vente"
                className={`${inputStyle} font-bold text-emerald-600`}
                value={newMed.sellPrice || ''}
                onChange={(e) =>
                  setNewMed({
                    ...newMed,
                    sellPrice: Number(e.target.value)
                  })
                }
                required
              />
            </div>

            {/* STOCK */}

            <div className="grid grid-cols-3 gap-4">
              <input
                type="number"
                placeholder="Min Stock"
                className={inputStyle}
                value={newMed.minStock}
                onChange={(e) =>
                  setNewMed({
                    ...newMed,
                    minStock: Number(e.target.value)
                  })
                }
              />

              <input
                type="number"
                placeholder="Max Stock"
                className={inputStyle}
                value={newMed.maxStock || ''}
                onChange={(e) =>
                  setNewMed({
                    ...newMed,
                    maxStock: Number(e.target.value)
                  })
                }
              />

              <input
                type="text"
                placeholder="Emplacement (Rayon...)"
                className={inputStyle}
                value={newMed.location || ''}
                onChange={(e) =>
                  setNewMed({
                    ...newMed,
                    location: e.target.value
                  })
                }
              />
            </div>
          </div>

          {/* BOUTONS */}

          <div className="flex gap-3 pt-6 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-4 bg-slate-100 dark:bg-slate-800 text-slate-500 font-bold rounded-xl"
            >
              Annuler
            </button>

            <button
              type="submit"
              className="flex-1 py-4 bg-sky-600 text-white font-bold rounded-xl shadow-lg hover:bg-sky-500"
            >
              Enregistrer Fiche
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
