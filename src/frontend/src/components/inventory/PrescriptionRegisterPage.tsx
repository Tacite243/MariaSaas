import React, { useEffect, useState } from 'react'
import { PrescriptionRegisterDTO } from '@shared/types/stock.types'

export const PrescriptionRegisterPage: React.FC = () => {
  const [entries, setEntries] = useState<PrescriptionRegisterDTO[]>([])
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [narcoticOnly, setNarcoticOnly] = useState(false)

  const load = async () => {
    const res = await window.api.prescription.list({
      from: from ? new Date(from) : undefined,
      to: to ? new Date(to) : undefined,
      narcoticOnly
    })
    if (res.success && res.data) setEntries(res.data)
  }

  useEffect(() => {
    void load()
  }, [])

  const handlePrint = async () => {
    const res = await window.api.prescription.print({
      from: from ? new Date(from) : undefined,
      to: to ? new Date(to) : undefined,
      narcoticOnly
    })
    if (!res.success) alert(res.error?.message ?? 'Impression échouée')
  }

  return (
    <div className="space-y-6 print:p-0" id="ordonnancier-printable">
      <div className="flex flex-wrap gap-4 items-end no-print">
        <div>
          <label className="text-xs font-bold text-slate-400 uppercase">Du</label>
          <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="block px-3 py-2 rounded-xl border dark:bg-slate-800 dark:text-white" />
        </div>
        <div>
          <label className="text-xs font-bold text-slate-400 uppercase">Au</label>
          <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="block px-3 py-2 rounded-xl border dark:bg-slate-800 dark:text-white" />
        </div>
        <label className="flex items-center gap-2 text-sm dark:text-white">
          <input type="checkbox" checked={narcoticOnly} onChange={(e) => setNarcoticOnly(e.target.checked)} />
          Stupéfiants uniquement
        </label>
        <button onClick={() => void load()} className="px-4 py-2 bg-sky-600 text-white rounded-xl font-black text-xs uppercase">
          Filtrer
        </button>
        <button onClick={handlePrint} className="px-4 py-2 border rounded-xl font-black text-xs uppercase dark:text-white">
          Imprimer / PDF
        </button>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-3xl border dark:border-slate-800 overflow-hidden">
        <table className="w-full text-sm min-w-[900px]">
          <thead className="bg-slate-50 dark:bg-slate-800">
            <tr className="text-[10px] uppercase text-slate-400">
              <th className="px-4 py-3 text-left">N° Ordre</th>
              <th className="px-4 py-3 text-left">Date délivrance</th>
              <th className="px-4 py-3 text-left">Produit</th>
              <th className="px-4 py-3 text-left">Prescripteur</th>
              <th className="px-4 py-3 text-left">Patient</th>
              <th className="px-4 py-3 text-center">Qté</th>
              <th className="px-4 py-3 text-left">Pharmacien</th>
            </tr>
          </thead>
          <tbody className="divide-y dark:divide-slate-800">
            {entries.map((e) => (
              <tr key={e.id}>
                <td className="px-4 py-3 font-mono font-bold dark:text-white">{e.orderNumber}</td>
                <td className="px-4 py-3 dark:text-slate-300">{new Date(e.dispensedDate).toLocaleDateString('fr-CD')}</td>
                <td className="px-4 py-3 dark:text-white">
                  {e.productName}
                  {e.isNarcotic && <span className="ml-1 text-red-500 text-[9px] font-black">STUP</span>}
                </td>
                <td className="px-4 py-3 dark:text-slate-300">{e.prescriberName} ({e.prescriberQualification})</td>
                <td className="px-4 py-3 dark:text-slate-300">{e.patientName}{e.patientAge ? `, ${e.patientAge}a` : ''}</td>
                <td className="px-4 py-3 text-center font-black dark:text-white">{e.quantityDispensed}</td>
                <td className="px-4 py-3 dark:text-slate-300">{e.validatedByName}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {entries.length === 0 && (
          <p className="text-center py-12 text-slate-400 text-sm">Aucune entrée ordonnancier</p>
        )}
      </div>
    </div>
  )
}
