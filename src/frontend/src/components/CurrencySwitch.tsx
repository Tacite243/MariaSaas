import React from 'react'
import { useDispatch } from 'react-redux'
import { toggleCurrency } from '@renderer/app/store/slice/sessionSlice'
import { useCurrency } from '@renderer/hooks/useCurrently'



export const CurrencySwitch: React.FC = () => {
    const dispatch = useDispatch()
    const { currency } = useCurrency()

    return (
        <button
            onClick={() => dispatch(toggleCurrency())}
            className="flex flex-col items-center gap-1.5 bg-white dark:bg-slate-800 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-emerald-500 transition-all shadow-sm group"
            title="Changer la devise globale"
        >
            <div className="flex items-center gap-2">
                <span className={`text-[9px] font-black transition-colors ${currency === 'CDF' ? 'text-sky-600' : 'text-slate-400'}`}>CDF</span>
                <div className="w-8 h-4 bg-slate-100 dark:bg-slate-900 rounded-full relative border border-slate-200 dark:border-slate-600 shadow-inner">
                    <div className={`absolute top-0.5 w-3 h-3 bg-white shadow-md rounded-full transition-all duration-300 ${currency === 'USD' ? 'left-4 bg-emerald-500' : 'left-0.5 bg-sky-500'}`}></div>
                </div>
                <span className={`text-[9px] font-black transition-colors ${currency === 'USD' ? 'text-emerald-500' : 'text-slate-400'}`}>USD</span>
            </div>
            <span className="text-[7px] text-slate-400 uppercase font-bold group-hover:text-emerald-500 transition-colors">Basculer</span>
        </button>
    )
}