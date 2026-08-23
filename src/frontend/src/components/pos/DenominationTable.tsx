import React, { useCallback, useState } from 'react'
import { CDF_DENOMINATIONS, USD_DENOMINATIONS } from '@shared/schemas/pos.schema'

interface DenominationTableProps {
  currency: 'USD' | 'CDF'
  values: Record<number, number>
  onChange: (denomination: number, quantity: number) => void
}

export const DenominationTable: React.FC<DenominationTableProps> = ({
  currency,
  values,
  onChange
}) => {
  const denominations = currency === 'USD' ? USD_DENOMINATIONS : CDF_DENOMINATIONS

  return (
    <div className="space-y-2">
      <h4 className="text-xs font-black uppercase tracking-widest text-slate-500">
        {currency === 'USD' ? 'Billets USD ($)' : 'Billets CDF (FC)'}
      </h4>
      <div className="grid grid-cols-2 gap-2">
        {denominations.map((denom) => (
          <label
            key={denom}
            className="flex items-center justify-between bg-slate-50 dark:bg-slate-800 rounded-xl px-3 py-2 border border-slate-100 dark:border-slate-700"
          >
            <span className="font-bold text-sm dark:text-white">
              {currency === 'USD' ? `$${denom}` : `${denom.toLocaleString()} FC`}
            </span>
            <input
              type="number"
              min={0}
              value={values[denom] ?? 0}
              onChange={(e) => onChange(denom, Math.max(0, parseInt(e.target.value, 10) || 0))}
              className="w-16 text-right font-black bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-600 rounded-lg px-2 py-1 text-sm"
            />
          </label>
        ))}
      </div>
    </div>
  )
}

export const useDenominationState = (currency: 'USD' | 'CDF') => {
  const denominations = currency === 'USD' ? USD_DENOMINATIONS : CDF_DENOMINATIONS
  const [values, setValues] = useState<Record<number, number>>(() =>
    Object.fromEntries(denominations.map((d) => [d, 0]))
  )

  const setQuantity = useCallback((denomination: number, quantity: number) => {
    setValues((prev) => ({ ...prev, [denomination]: quantity }))
  }, [])

  const toEntries = useCallback(() => {
    return denominations.map((d) => ({ denomination: d, quantity: values[d] ?? 0 }))
  }, [denominations, values])

  return { values, setQuantity, toEntries }
}
