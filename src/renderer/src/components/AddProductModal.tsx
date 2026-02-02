import React, { useState } from 'react';
import { CATEGORIES } from '../features/inventory/types'

interface Props {
    onClose: () => void;
    onSubmit: (data: any) => void;
}

export const AddProductModal: React.FC<Props> = ({ onClose, onSubmit }) => {
    const [newMed, setNewMed] = useState({
        name: '',
        code: '',
        category: 'Générique',
        dosage: '',
        price: 0,
        buyingPrice: 0,
        threshold: 5,
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit(newMed);
    };

    return (
        <div className="fixed inset-0 z-[100] bg-slate-900/80 backdrop-blur-xl flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-[2rem] p-8 shadow-2xl border border-slate-200 dark:border-slate-800">
                <h3 className="text-xl font-black text-slate-900 dark:text-white mb-6">Nouveau Produit</h3>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <input
                        type="text"
                        placeholder="Nom du produit"
                        className="w-full p-4 bg-slate-50 dark:bg-slate-800 rounded-xl outline-none focus:ring-2 focus:ring-sky-500 font-bold dark:text-white"
                        value={newMed.name}
                        onChange={e => setNewMed({ ...newMed, name: e.target.value })}
                        required
                    />
                    <div className="grid grid-cols-2 gap-4">
                        <input
                            type="text"
                            placeholder="Code (CIP)"
                            className="w-full p-4 bg-slate-50 dark:bg-slate-800 rounded-xl outline-none focus:ring-2 focus:ring-sky-500 font-bold dark:text-white"
                            value={newMed.code}
                            onChange={e => setNewMed({ ...newMed, code: e.target.value })}
                        />
                        <input
                            type="text"
                            placeholder="Dosage"
                            className="w-full p-4 bg-slate-50 dark:bg-slate-800 rounded-xl outline-none focus:ring-2 focus:ring-sky-500 font-bold dark:text-white"
                            value={newMed.dosage}
                            onChange={e => setNewMed({ ...newMed, dosage: e.target.value })}
                        />
                    </div>

                    <div className="flex gap-2 overflow-x-auto no-scrollbar py-2">
                        {CATEGORIES.filter(c => c !== 'Tous').map(cat => (
                            <button
                                type="button"
                                key={cat}
                                onClick={() => setNewMed({ ...newMed, category: cat })}
                                className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap border ${newMed.category === cat ? 'bg-sky-600 text-white border-sky-600' : 'bg-transparent border-slate-200 text-slate-500'}`}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <input
                            type="number"
                            placeholder="Prix Vente"
                            className="w-full p-4 bg-slate-50 dark:bg-slate-800 rounded-xl outline-none focus:ring-2 focus:ring-sky-500 font-bold dark:text-white"
                            value={newMed.price || ''}
                            onChange={e => setNewMed({ ...newMed, price: Number(e.target.value) })}
                            required
                        />
                        <input
                            type="number"
                            placeholder="Seuil Alerte"
                            className="w-full p-4 bg-slate-50 dark:bg-slate-800 rounded-xl outline-none focus:ring-2 focus:ring-sky-500 font-bold dark:text-white"
                            value={newMed.threshold}
                            onChange={e => setNewMed({ ...newMed, threshold: Number(e.target.value) })}
                        />
                    </div>
                    <div className="flex gap-3 pt-4">
                        <button type="button" onClick={onClose} className="flex-1 py-4 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-bold rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">Annuler</button>
                        <button type="submit" className="flex-1 py-4 bg-sky-600 text-white font-bold rounded-xl hover:bg-sky-500 transition-colors shadow-lg shadow-sky-600/20">Créer</button>
                    </div>
                </form>
            </div>
        </div>
    );
};