import React, { useMemo, useState } from 'react';
import { CATEGORIES } from '../features/inventory/types'
import { ProductInput } from '@shared/schemas/inventorySchema';



interface Props {
    onClose: () => void;
    onSubmit: (data: ProductInput) => void;
}

export const AddProductModal: React.FC<Props> = ({ onClose, onSubmit }) => {
    // 👇 ON TYPE EXPLICITEMENT LE STATE
    const [newMed, setNewMed] = useState<ProductInput>({
        name: '',
        code: '',
        category: 'Générique',
        dci: '', // Molécule
        form: '', // Forme
        dosage: '',
        packaging: '',
        minStock: 5,
        sellPrice: 0,
        buyingPrice: 0, // Valeur par défaut
        isPrescriptionRequired: false // Valeur par défaut
    });

    // Calcul dynamique de la marge pour l'aide à la décision
    const marginStats = useMemo(() => {
        const buy = Number(newMed.buyingPrice) || 0;
        const sell = Number(newMed.sellPrice) || 0;
        const profit = sell - buy;
        // Marge commerciale (%) = (Marge / Prix Vente) * 100
        const marginPercent = sell > 0 ? ((profit / sell) * 100).toFixed(1) : '0';

        return { profit, marginPercent, isPositive: profit >= 0 };
    }, [newMed.buyingPrice, newMed.sellPrice]);


    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit(newMed);
    };

    return (
        <div className="fixed inset-0 z-[100] bg-slate-900/80 backdrop-blur-xl flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-[2rem] p-8 shadow-2xl border border-slate-200 dark:border-slate-800 max-h-[90vh] overflow-y-auto custom-scrollbar">

                <div className="mb-6 border-b border-slate-100 dark:border-slate-800 pb-4">
                    <h3 className="text-xl font-black text-slate-900 dark:text-white">Référencer un Produit</h3>
                    <p className="text-xs text-slate-400 mt-1">Crée la fiche dans le catalogue. Le stock restera à 0.</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Nom & DCI */}
                    <input type="text" placeholder="Nom Commercial (ex: Doliprane)" className="w-full p-4 bg-slate-50 dark:bg-slate-800 rounded-xl font-bold dark:text-white outline-none focus:ring-2 focus:ring-sky-500" value={newMed.name} onChange={e => setNewMed({ ...newMed, name: e.target.value })} required />
                    <input type="text" placeholder="Molécule DCI (ex: Paracétamol)" className="w-full p-4 bg-slate-50 dark:bg-slate-800 rounded-xl outline-none dark:text-white" value={newMed.dci || ''} onChange={e => setNewMed({ ...newMed, dci: e.target.value })} />

                    {/* Détails Techniques */}
                    <div className="grid grid-cols-2 gap-4">
                        <input type="text" placeholder="Code CIP / EAN" className="p-4 bg-slate-50 dark:bg-slate-800 rounded-xl outline-none dark:text-white" value={newMed.code || ''} onChange={e => setNewMed({ ...newMed, code: e.target.value })} />
                        <input type="text" placeholder="Dosage (500mg)" className="p-4 bg-slate-50 dark:bg-slate-800 rounded-xl outline-none dark:text-white" value={newMed.dosage || ''} onChange={e => setNewMed({ ...newMed, dosage: e.target.value })} />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <input type="text" placeholder="Forme (Comp...)" className="p-4 bg-slate-50 dark:bg-slate-800 rounded-xl outline-none dark:text-white" value={newMed.form || ''} onChange={e => setNewMed({ ...newMed, form: e.target.value })} />
                        <input type="text" placeholder="Condit. (Bte 8...)" className="p-4 bg-slate-50 dark:bg-slate-800 rounded-xl outline-none dark:text-white" value={newMed.packaging || ''} onChange={e => setNewMed({ ...newMed, packaging: e.target.value })} />
                    </div>

                    {/* Catégorie */}
                    <div className="flex gap-2 overflow-x-auto no-scrollbar py-2">
                        {CATEGORIES.filter(c => c !== 'Tous').map(cat => (
                            <button type="button" key={cat} onClick={() => setNewMed({ ...newMed, category: cat })} className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap border transition-all ${newMed.category === cat ? 'bg-sky-600 text-white border-sky-600' : 'bg-transparent border-slate-200 text-slate-500'}`}>{cat}</button>
                        ))}
                    </div>

                    {/* Prix de Référence (Pas d'entrée en stock) */}
                    <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-700">
                        <p className="text-[10px] uppercase font-bold text-slate-400 mb-3 tracking-widest">Politique de Prix</p>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <label className="text-[10px] font-bold text-slate-500">P. Achat Réf.</label>
                                <input type="number" className="w-full p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-bold dark:text-white" value={newMed.buyingPrice || ''} onChange={e => setNewMed({ ...newMed, buyingPrice: Number(e.target.value) })} />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-bold text-slate-500">P. Vente Public</label>
                                <input type="number" className="w-full p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-bold dark:text-white" value={newMed.sellPrice || ''} onChange={e => setNewMed({ ...newMed, sellPrice: Number(e.target.value) })} required />
                            </div>
                        </div>
                    </div>

                    {/* SECTION PRIX & MARGE (NOUVEAU) */}
                    <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-700 space-y-4">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-black uppercase text-slate-400 tracking-widest">Stratégie Prix</span>
                            {newMed.sellPrice > 0 && (
                                <div className={`text-xs font-bold px-2 py-1 rounded-lg ${marginStats.isPositive ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                                    Marge: {marginStats.profit} ({marginStats.marginPercent}%)
                                </div>
                            )}
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Prix Achat (Unitaire)</label>
                                <input
                                    type="number"
                                    placeholder="0"
                                    className="w-full p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-sky-500 font-bold dark:text-white"
                                    value={newMed.buyingPrice || ''}
                                    onChange={e => setNewMed({ ...newMed, buyingPrice: Number(e.target.value) })}
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Prix Vente</label>
                                <input
                                    type="number"
                                    placeholder="0"
                                    className="w-full p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-emerald-500 font-bold dark:text-white"
                                    value={newMed.sellPrice || ''}
                                    onChange={e => setNewMed({ ...newMed, sellPrice: Number(e.target.value) })}
                                    required
                                />
                            </div>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3 pt-4">
                        <button type="button" onClick={onClose} className="flex-1 py-4 bg-slate-100 dark:bg-slate-800 text-slate-500 font-bold rounded-xl hover:bg-slate-200">Annuler</button>
                        <button type="submit" className="flex-1 py-4 bg-sky-600 text-white font-bold rounded-xl hover:bg-sky-500 shadow-lg shadow-sky-600/20">Référencer</button>
                    </div>
                </form>
            </div>
        </div>
    );
};
