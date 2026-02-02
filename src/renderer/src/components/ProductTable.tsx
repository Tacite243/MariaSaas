import React from 'react';
import { UIMedication } from '@renderer/features/inventory/types';



interface Props {
    medications: UIMedication[];
    onSelect: (med: UIMedication) => void;
}

export const ProductTable: React.FC<Props> = ({ medications, onSelect }) => (
    <table className="w-full text-left min-w-[750px]">
        <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
            <tr>
                <th className="px-6 md:px-10 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Article & QR</th>
                <th className="px-6 md:px-10 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Catégorie</th>
                <th className="px-6 md:px-10 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Dosage</th>
                <th className="px-6 md:px-10 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Stock</th>
                <th className="px-6 md:px-10 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Action</th>
            </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {medications.map(med => {
                const isLow = med.currentStock <= med.threshold;
                return (
                    <tr key={med.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all group">
                        <td className="px-6 md:px-10 py-5 md:py-6">
                            <div className="flex items-center gap-4 md:gap-6">
                                {med.qrCode && (
                                    <div className="w-12 h-12 md:w-14 md:h-14 bg-white p-1 rounded-xl md:rounded-2xl border dark:border-slate-700 overflow-hidden flex-none shadow-sm cursor-pointer hover:scale-105 transition-transform" onClick={() => onSelect(med)}>
                                        <img src={med.qrCode} alt="QR" className="w-full h-full object-contain" />
                                    </div>
                                )}
                                <div className="flex flex-col min-w-0">
                                    <span className="font-black text-slate-900 dark:text-white text-sm md:text-base truncate">{med.name}</span>
                                    <span className="text-[9px] md:text-[10px] font-black text-sky-600 uppercase tracking-widest mt-1">{med.code}</span>
                                </div>
                            </div>
                        </td>
                        <td className="px-6 md:px-10 py-5 md:py-6 whitespace-nowrap">
                            <span className="px-3 md:px-4 py-1.5 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 rounded-full text-[8px] md:text-[9px] font-black uppercase tracking-widest">
                                {med.category}
                            </span>
                        </td>
                        <td className="px-6 md:px-10 py-5 md:py-6 text-center font-bold text-slate-500 dark:text-slate-400 text-xs">{med.dosage}</td>
                        <td className="px-6 md:px-10 py-5 md:py-6 text-center">
                            <div className={`inline-flex flex-col items-center px-3 py-1.5 md:px-4 md:py-2 rounded-xl md:rounded-2xl ${isLow ? 'bg-red-50 dark:bg-red-900/10 text-red-600' : 'bg-emerald-50 dark:bg-emerald-900/10 text-emerald-600'}`}>
                                <span className="font-black text-lg leading-none">{med.currentStock}</span>
                                <span className="text-[8px] font-black uppercase tracking-widest mt-1 opacity-60">{isLow ? 'Bas' : 'Ok'}</span>
                            </div>
                        </td>
                        <td className="px-6 md:px-10 py-5 md:py-6 text-right whitespace-nowrap">
                            <button onClick={() => onSelect(med)} className="p-2.5 bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-sky-600 dark:hover:text-sky-400 rounded-xl transition-all active:scale-90">
                                <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
                            </button>
                        </td>
                    </tr>
                );
            })}
        </tbody>
    </table>
);