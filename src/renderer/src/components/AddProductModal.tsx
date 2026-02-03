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
                <h3 className="text-xl font-black text-slate-900 dark:text-white mb-6">Nouveau Produit</h3>
                <form onSubmit={handleSubmit} className="space-y-4">

                    {/* Nom Commercial */}
                    <input
                        type="text"
                        placeholder="Nom du produit"
                        className="w-full p-4 bg-slate-50 dark:bg-slate-800 rounded-xl outline-none focus:ring-2 focus:ring-sky-500 font-bold dark:text-white"
                        value={newMed.name}
                        onChange={e => setNewMed({ ...newMed, name: e.target.value })}
                        required
                    />

                    {/* DCI (Molécule) */}
                    <input
                        type="text"
                        placeholder="Molécule (DCI) - ex: Paracétamol"
                        className="w-full p-4 bg-slate-50 dark:bg-slate-800 rounded-xl outline-none dark:text-white"
                        value={newMed.dci || ''}
                        onChange={e => setNewMed({ ...newMed, dci: e.target.value })}
                    />

                    {/* Code & Dosage */}
                    <div className="grid grid-cols-2 gap-4">
                        <input
                            type="text"
                            placeholder="Code (CIP)"
                            className="w-full p-4 bg-slate-50 dark:bg-slate-800 rounded-xl outline-none focus:ring-2 focus:ring-sky-500 font-bold dark:text-white"
                            value={newMed.code || ''}
                            onChange={e => setNewMed({ ...newMed, code: e.target.value })}
                        />
                        <input
                            type="text"
                            placeholder="Dosage"
                            className="w-full p-4 bg-slate-50 dark:bg-slate-800 rounded-xl outline-none focus:ring-2 focus:ring-sky-500 font-bold dark:text-white"
                            value={newMed.dosage || ''}
                            onChange={e => setNewMed({ ...newMed, dosage: e.target.value })}
                        />
                    </div>

                    {/* Forme & Conditionnement */}
                    <div className="grid grid-cols-2 gap-4">
                        <input
                            type="text"
                            placeholder="Forme (Comp, Sirop...)"
                            className="p-4 bg-slate-50 dark:bg-slate-800 rounded-xl outline-none dark:text-white"
                            value={newMed.form || ''}
                            onChange={e => setNewMed({ ...newMed, form: e.target.value })}
                        />
                        <input
                            type="text"
                            placeholder="Conditionnement (Bte 10...)"
                            className="p-4 bg-slate-50 dark:bg-slate-800 rounded-xl outline-none dark:text-white"
                            value={newMed.packaging || ''}
                            onChange={e => setNewMed({ ...newMed, packaging: e.target.value })}
                        />
                    </div>

                    {/* Toggle Ordonnance */}
                    <div className="flex items-center gap-3 p-2 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                        <input
                            type="checkbox"
                            id="prescription"
                            checked={newMed.isPrescriptionRequired}
                            onChange={e => setNewMed({ ...newMed, isPrescriptionRequired: e.target.checked })}
                            className="w-5 h-5 accent-sky-600 rounded cursor-pointer"
                        />
                        <label htmlFor="prescription" className="text-sm font-bold text-slate-600 dark:text-slate-400 cursor-pointer select-none">
                            Ordonnance Obligatoire (Liste I/II)
                        </label>
                    </div>

                    {/* Catégories */}
                    <div className="flex gap-2 overflow-x-auto no-scrollbar py-2">
                        {CATEGORIES.filter(c => c !== 'Tous').map(cat => (
                            <button
                                type="button"
                                key={cat}
                                onClick={() => setNewMed({ ...newMed, category: cat })}
                                className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap border transition-all ${newMed.category === cat ? 'bg-sky-600 text-white border-sky-600' : 'bg-transparent border-slate-200 text-slate-500 hover:bg-slate-50'}`}
                            >
                                {cat}
                            </button>
                        ))}
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

                    {/* Seuil Alerte */}
                    <div className="space-y-1">
                        <label className="text-[10px] uppercase font-bold text-slate-400 ml-1">Seuil Alerte (Stock Min)</label>
                        <input
                            type="number"
                            placeholder="5"
                            className="w-full p-4 bg-slate-50 dark:bg-slate-800 rounded-xl outline-none dark:text-white"
                            value={newMed.minStock}
                            onChange={e => setNewMed({ ...newMed, minStock: Number(e.target.value) })}
                        />
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3 pt-4">
                        <button type="button" onClick={onClose} className="flex-1 py-4 bg-slate-100 dark:bg-slate-800 text-slate-500 font-bold rounded-xl hover:bg-slate-200 transition-colors">Annuler</button>
                        <button type="submit" className="flex-1 py-4 bg-sky-600 text-white font-bold rounded-xl hover:bg-sky-500 transition-colors shadow-lg shadow-sky-600/20">Créer</button>
                    </div>
                </form>
            </div>
        </div>
    );
};