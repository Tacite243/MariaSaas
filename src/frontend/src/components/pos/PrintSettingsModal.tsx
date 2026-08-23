import React, { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { AppDispatch, RootState } from '@renderer/app/store/store'
import { setPrintSettingsModalOpen } from '@renderer/app/store/slice/posSlice'

export const PrintSettingsModal: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>()
  const open = useSelector((s: RootState) => s.pos.printSettingsModalOpen)
  const [printers, setPrinters] = useState<{ name: string; displayName: string; isDefault: boolean }[]>([])
  const [settings, setSettings] = useState({
    defaultPrinter: '',
    receiptWidth: '80' as '58' | '80',
    pharmacyName: 'Pharmacie Maria',
    pharmacyAddress: '',
    pharmacyPhone: '',
    pharmacyRccm: '',
    pharmacyIdNat: ''
  })

  useEffect(() => {
    if (!open) return
    void (async () => {
      const [pRes, sRes] = await Promise.all([
        window.api.pos.getPrinters(),
        window.api.pos.getPrintSettings()
      ])
      if (pRes.success && pRes.data) setPrinters(pRes.data as typeof printers)
      if (sRes.success && sRes.data) {
        const s = sRes.data as typeof settings & { id: string }
        setSettings({
          defaultPrinter: s.defaultPrinter ?? '',
          receiptWidth: (s.receiptWidth === '58' ? '58' : '80') as '58' | '80',
          pharmacyName: s.pharmacyName,
          pharmacyAddress: s.pharmacyAddress ?? '',
          pharmacyPhone: s.pharmacyPhone ?? '',
          pharmacyRccm: s.pharmacyRccm ?? '',
          pharmacyIdNat: s.pharmacyIdNat ?? ''
        })
      }
    })()
  }, [open])

  if (!open) return null

  const handleSave = async () => {
    await window.api.pos.updatePrintSettings(settings)
    dispatch(setPrintSettingsModalOpen(false))
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-md p-6 space-y-4">
        <h2 className="text-lg font-black uppercase dark:text-white">Imprimante thermique</h2>

        <label className="block text-xs font-bold text-slate-500 uppercase">
          Imprimante
          <select
            value={settings.defaultPrinter}
            onChange={(e) => setSettings((s) => ({ ...s, defaultPrinter: e.target.value }))}
            className="w-full mt-1 px-3 py-2 rounded-xl border dark:bg-slate-800 dark:text-white"
          >
            <option value="">Par défaut système</option>
            {printers.map((p) => (
              <option key={p.name} value={p.name}>
                {p.displayName || p.name}
              </option>
            ))}
          </select>
        </label>

        <label className="block text-xs font-bold text-slate-500 uppercase">
          Largeur rouleau
          <select
            value={settings.receiptWidth}
            onChange={(e) =>
              setSettings((s) => ({ ...s, receiptWidth: e.target.value as '58' | '80' }))
            }
            className="w-full mt-1 px-3 py-2 rounded-xl border dark:bg-slate-800 dark:text-white"
          >
            <option value="58">58 mm</option>
            <option value="80">80 mm</option>
          </select>
        </label>

        <input
          placeholder="Nom pharmacie"
          value={settings.pharmacyName}
          onChange={(e) => setSettings((s) => ({ ...s, pharmacyName: e.target.value }))}
          className="w-full px-3 py-2 rounded-xl border dark:bg-slate-800 dark:text-white text-sm"
        />

        <div className="flex gap-3">
          <button
            onClick={() => dispatch(setPrintSettingsModalOpen(false))}
            className="flex-1 py-2 rounded-xl border font-bold text-slate-500 text-sm"
          >
            Annuler
          </button>
          <button
            onClick={() => void handleSave()}
            className="flex-1 py-2 rounded-xl bg-emerald-600 text-white font-black text-xs uppercase"
          >
            Enregistrer
          </button>
        </div>
      </div>
    </div>
  )
}
