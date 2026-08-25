import React, { useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { AppDispatch, RootState } from '@renderer/app/store/store'
import { setItemPrescription } from '@renderer/app/store/slice/salesSlice'
import { setPrescriptionModalOpen, setPaymentModalOpen } from '@renderer/app/store/slice/posSlice'
import { PrescriptionCartData } from '@renderer/app/store/slice/salesSlice'

export const PrescriptionModal: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>()
  const open = useSelector((s: RootState) => s.pos.prescriptionModalOpen)
  const cart = useSelector((s: RootState) => s.sales.cart)
  const rxItems = cart.filter((i) => i.isPrescriptionRequired || i.isNarcotic)

  const [forms, setForms] = useState<Record<string, PrescriptionCartData>>({})

  if (!open || rxItems.length === 0) return null

  const updateForm = (productId: string, field: keyof PrescriptionCartData, value: string | number) => {
    setForms((prev) => ({
      ...prev,
      [productId]: {
        prescriberName: prev[productId]?.prescriberName ?? '',
        prescriberQualification: prev[productId]?.prescriberQualification ?? 'Médecin',
        prescriberLicense: prev[productId]?.prescriberLicense ?? '',
        patientName: prev[productId]?.patientName ?? '',
        patientAge: prev[productId]?.patientAge,
        patientIdDocument: prev[productId]?.patientIdDocument ?? '',
        prescriptionDate: prev[productId]?.prescriptionDate ?? new Date().toISOString().slice(0, 10),
        quantityDispensed: prev[productId]?.quantityDispensed ?? cart.find((c) => c.productId === productId)?.quantity ?? 1,
        [field]: value
      }
    }))
  }

  const handleSubmit = () => {
    for (const item of rxItems) {
      const form = forms[item.productId]
      if (!form?.prescriberName || !form?.patientName) return
      dispatch(
        setItemPrescription({
          productId: item.productId,
          prescription: {
            ...form,
            quantityDispensed: item.quantity,
            prescriptionDate: form.prescriptionDate
          }
        })
      )
    }
    dispatch(setPrescriptionModalOpen(false))
    dispatch(setPaymentModalOpen(true))
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-lg p-6 space-y-4 my-8">
        <h2 className="text-lg font-black uppercase dark:text-white">Ordonnancier — saisie obligatoire</h2>
        <p className="text-xs text-red-500 font-bold">
          Produit(s) soumis à ordonnance ou stupéfiant(s). Enregistrement légal requis avant encaissement.
        </p>

        {rxItems.map((item) => (
          <div key={item.productId} className="border border-slate-200 dark:border-slate-700 rounded-2xl p-4 space-y-2">
            <p className="font-bold text-sm dark:text-white">
              {item.name} {item.isNarcotic && <span className="text-red-500 text-[10px]">STUPÉFIANT</span>}
            </p>
            <input
              placeholder="Prescripteur *"
              className="w-full px-3 py-2 rounded-lg border dark:bg-slate-800 dark:text-white text-sm"
              onChange={(e) => updateForm(item.productId, 'prescriberName', e.target.value)}
            />
            <input
              placeholder="Qualification (Médecin, Sage-femme...)"
              className="w-full px-3 py-2 rounded-lg border dark:bg-slate-800 dark:text-white text-sm"
              onChange={(e) => updateForm(item.productId, 'prescriberQualification', e.target.value)}
            />
            <input
              placeholder="N° ordre / Hôpital"
              className="w-full px-3 py-2 rounded-lg border dark:bg-slate-800 dark:text-white text-sm"
              onChange={(e) => updateForm(item.productId, 'prescriberLicense', e.target.value)}
            />
            <input
              placeholder="Patient *"
              className="w-full px-3 py-2 rounded-lg border dark:bg-slate-800 dark:text-white text-sm"
              onChange={(e) => updateForm(item.productId, 'patientName', e.target.value)}
            />
            <div className="grid grid-cols-2 gap-2">
              <input
                type="number"
                placeholder="Âge"
                className="px-3 py-2 rounded-lg border dark:bg-slate-800 dark:text-white text-sm"
                onChange={(e) => updateForm(item.productId, 'patientAge', parseInt(e.target.value, 10) || 0)}
              />
              <input
                type="date"
                className="px-3 py-2 rounded-lg border dark:bg-slate-800 dark:text-white text-sm"
                defaultValue={new Date().toISOString().slice(0, 10)}
                onChange={(e) => updateForm(item.productId, 'prescriptionDate', e.target.value)}
              />
            </div>
            <input
              placeholder="Pièce d'identité patient"
              className="w-full px-3 py-2 rounded-lg border dark:bg-slate-800 dark:text-white text-sm"
              onChange={(e) => updateForm(item.productId, 'patientIdDocument', e.target.value)}
            />
          </div>
        ))}

        <div className="flex gap-3">
          <button
            onClick={() => dispatch(setPrescriptionModalOpen(false))}
            className="flex-1 py-3 rounded-xl border font-bold text-slate-500"
          >
            Annuler
          </button>
          <button
            onClick={handleSubmit}
            className="flex-1 py-3 rounded-xl bg-emerald-600 text-white font-black uppercase text-xs"
          >
            Valider ordonnance
          </button>
        </div>
      </div>
    </div>
  )
}
