import React, { useEffect, useState, useMemo } from 'react';
import { CATEGORIES, UIMedication } from '../features/inventory/types';
import { ProductInput } from '@shared/schemas/inventorySchema';

interface Props {
    onClose: () => void;
    onSubmit: (data: ProductInput) => void;
    productToEdit?: UIMedication | null;
}

const inputClass = "w-full p-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-sky-500/50 dark:text-white transition-all text-sm font-medium placeholder:text-slate-400";

export const AddProductModal: React.FC<Props> = ({ onClose, onSubmit, productToEdit }) => {
    const isEditMode = !!productToEdit;
    const [showInitialStock, setShowInitialStock] = useState(false);
    const [initialStock, setInitialStock] = useState({
        quantity: 0,
        batchNumber: '',
        expiryDate: ''
    });

    const [newMed, setNewMed] = useState<ProductInput>({
        name: '', dci: '', code: '', codeCip7: '', codeAtc: '',
        category: 'Générique', form: '', dosage: '', packaging: '',
        description: '', isPrescriptionRequired: false,
        minStock: 5, maxStock: 0, location: '',
        sellPrice: 0, buyingPrice: 0, vatRate: 0
    });

    // Initialisation en mode édition
    useEffect(() => {
        if (productToEdit) {
            setNewMed({
                name: productToEdit.name,
                dci: productToEdit.dci || '',
                code: productToEdit.code,
                codeCip7: productToEdit.codeCip7 || '',
                codeAtc: productToEdit.codeAtc || '',
                category: productToEdit.category,
                form: productToEdit.form || '',
                dosage: productToEdit.dosage || '',
                packaging: productToEdit.packaging || '',
                description: productToEdit.description || '',
                isPrescriptionRequired: productToEdit.isPrescriptionRequired,
                minStock: productToEdit.minStock,
                maxStock: productToEdit.maxStock || 0,
                location: productToEdit.location || '',
                sellPrice: productToEdit.sellPrice,
                buyingPrice: productToEdit.buyingPrice,
                vatRate: productToEdit.vatRate
            });
        }
    }, [productToEdit]);

    // Calcul de la marge en temps réel (en USD)
    const marginStats = useMemo(() => {
        const buy = Number(newMed.buyingPrice) || 0;
        const sell = Number(newMed.sellPrice) || 0;
        const profit = sell - buy;
        const marginPercent = sell > 0 ? ((profit / sell) * 100).toFixed(1) : '0';
        return { profit, marginPercent, isPositive: profit >= 0 };
    }, [newMed.buyingPrice, newMed.sellPrice]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const payload: ProductInput = {
            ...newMed,
            ...(!isEditMode && showInitialStock && initialStock.quantity > 0 ? {
                initialStock: { ...initialStock, expiryDate: new Date(initialStock.expiryDate) }
            } : {})
        };
        onSubmit(payload);
    };

    return (
        <div className="fixed inset-0 z-[100] bg-slate-900/80 backdrop-blur-md flex justify-center p-4 sm:p-6 md:p-10 overflow-y-auto custom-scrollbar">
            <div className="bg-white dark:bg-slate-900 w-full max-w-3xl rounded-[2rem] shadow-2xl border border-slate-200 dark:border-slate-800 h-fit my-auto">

                <div className="p-6 md:p-8 border-b border-slate-100 dark:border-slate-800">
                    <h3 className="text-2xl font-black text-slate-900 dark:text-white">
                        {isEditMode ? 'Modifier le produit' : 'Référencer un produit'}
                    </h3>
                    <p className="text-xs text-slate-400 mt-1 uppercase tracking-widest font-bold">
                        {isEditMode ? `Mise à jour de la fiche (ID: ${productToEdit?.code})` : 'Ajout d\'un nouvel article au catalogue'}
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="p-6 md:p-8 space-y-8">

                    {/* Identification */}
                    <div className="space-y-4">
                        <h4 className="text-[10px] font-black text-sky-600 uppercase tracking-widest">Identification</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <label className="text-[10px] font-bold text-slate-500 ml-1">Nom commercial *</label>
                                <input type="text" placeholder="ex: Paracétamol 500mg" className={inputClass} value={newMed.name} onChange={e => setNewMed({ ...newMed, name: e.target.value })} required />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-bold text-slate-500 ml-1">Molécule active (DCI)</label>
                                <input type="text" placeholder="ex: Paracétamol" className={inputClass} value={newMed.dci || ''} onChange={e => setNewMed({ ...newMed, dci: e.target.value })} />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="space-y-1">
                                <label className="text-[10px] font-bold text-slate-500 ml-1">Code-barres (EAN13)</label>
                                <input type="text" placeholder="Scanner ou saisir" className={inputClass} value={newMed.code || ''} onChange={e => setNewMed({ ...newMed, code: e.target.value })} />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-bold text-slate-500 ml-1">Code CIP7</label>
                                <input type="text" placeholder="Optionnel" className={inputClass} value={newMed.codeCip7 || ''} onChange={e => setNewMed({ ...newMed, codeCip7: e.target.value })} />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-bold text-slate-500 ml-1">Classe ATC</label>
                                <input type="text" placeholder="Optionnel" className={inputClass} value={newMed.codeAtc || ''} onChange={e => setNewMed({ ...newMed, codeAtc: e.target.value })} />
                            </div>
                        </div>

                        <div className="space-y-1">
                            <label className="text-[10px] font-bold text-slate-500 ml-1">Description / Indications</label>
                            <textarea placeholder="Indications thérapeutiques principales..." rows={2} className={`${inputClass} resize-none`} value={newMed.description || ''} onChange={e => setNewMed({ ...newMed, description: e.target.value })} />
                        </div>
                    </div>

                    {/* Galénique */}
                    <div className="space-y-4">
                        <h4 className="text-[10px] font-black text-sky-600 uppercase tracking-widest">Caractéristiques & Réglementation</h4>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="space-y-1">
                                <label className="text-[10px] font-bold text-slate-500 ml-1">Forme</label>
                                <input type="text" placeholder="ex: Comprimé" className={inputClass} value={newMed.form || ''} onChange={e => setNewMed({ ...newMed, form: e.target.value })} />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-bold text-slate-500 ml-1">Dosage</label>
                                <input type="text" placeholder="ex: 500mg" className={inputClass} value={newMed.dosage || ''} onChange={e => setNewMed({ ...newMed, dosage: e.target.value })} />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-bold text-slate-500 ml-1">Conditionnement</label>
                                <input type="text" placeholder="ex: Boîte de 10" className={inputClass} value={newMed.packaging || ''} onChange={e => setNewMed({ ...newMed, packaging: e.target.value })} />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-slate-500 ml-1">Catégorie de produit</label>
                            <div className="flex gap-2 flex-wrap">
                                {CATEGORIES.filter(c => c !== 'Tous').map(cat => (
                                    <button type="button" key={cat} onClick={() => setNewMed({ ...newMed, category: cat })}
                                        className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all border ${newMed.category === cat ? 'bg-sky-600 text-white border-sky-600 shadow-md' : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700'}`}>
                                        {cat}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Ordonnance */}
                        <div className="flex items-center gap-3 p-4 bg-red-50 dark:bg-red-900/10 rounded-xl border border-red-100 dark:border-red-900/30 mt-4 transition-all hover:bg-red-100/50">
                            <input type="checkbox" id="prescription" checked={newMed.isPrescriptionRequired} onChange={e => setNewMed({ ...newMed, isPrescriptionRequired: e.target.checked })} className="w-5 h-5 accent-red-600 cursor-pointer rounded" />
                            <label htmlFor="prescription" className="text-sm font-bold text-red-600 dark:text-red-400 cursor-pointer select-none flex-1">
                                Exige une ordonnance médicale (Liste I/II / Stupéfiants)
                            </label>
                        </div>
                    </div>

                    {/* Finances (MODIFIÉ POUR FORCER USD) */}
                    <div className="space-y-4 bg-slate-50 dark:bg-slate-800/50 p-6 rounded-2xl border border-slate-100 dark:border-slate-800">
                        <div className="flex justify-between items-center mb-2">
                            <h4 className="text-[10px] font-black text-sky-600 uppercase tracking-widest">Finances & Tarification (Base USD)</h4>
                            {newMed.sellPrice > 0 && (
                                <span className={`text-[10px] font-black px-3 py-1.5 rounded-lg uppercase tracking-widest ${marginStats.isPositive ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                                    Marge: ${marginStats.profit.toLocaleString('en-US', { minimumFractionDigits: 2 })} ({marginStats.marginPercent}%)
                                </span>
                            )}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="space-y-1">
                                <label className="text-[10px] font-bold text-slate-500 ml-1">Prix d'Achat (USD)</label>
                                {/* IMPORTANT: step="0.01" permet de taper des centimes (ex: 1.50) */}
                                <input type="number" min="0" step="0.01" className={inputClass} value={newMed.buyingPrice === 0 ? '' : newMed.buyingPrice} onChange={e => setNewMed({ ...newMed, buyingPrice: Number(e.target.value) })} />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-bold text-slate-500 ml-1">Taxe TVA (%)</label>
                                <input type="number" min="0" max="100" step="1" className={inputClass} value={newMed.vatRate === 0 ? '' : newMed.vatRate} onChange={e => setNewMed({ ...newMed, vatRate: Number(e.target.value) })} />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-black text-emerald-600 ml-1 uppercase tracking-widest">Prix de Vente (USD) *</label>
                                {/* IMPORTANT: step="0.01" permet de taper des centimes (ex: 2.25) */}
                                <input type="number" min="0" step="0.01" className={`${inputClass} !border-emerald-200 dark:!border-emerald-800 focus:!ring-emerald-500 font-bold text-emerald-700 dark:text-emerald-400`} value={newMed.sellPrice === 0 ? '' : newMed.sellPrice} onChange={e => setNewMed({ ...newMed, sellPrice: Number(e.target.value) })} required />
                            </div>
                        </div>
                    </div>

                    {/* Logistique */}
                    <div className="space-y-4">
                        <h4 className="text-[10px] font-black text-sky-600 uppercase tracking-widest">Logistique & Stockage</h4>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="space-y-1">
                                <label className="text-[10px] font-bold text-slate-500 ml-1">Stock Min (Alerte)</label>
                                <input type="number" min="0" className={inputClass} value={newMed.minStock} onChange={e => setNewMed({ ...newMed, minStock: Number(e.target.value) })} />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-bold text-slate-500 ml-1">Stock Max</label>
                                <input type="number" min="0" className={inputClass} value={newMed.maxStock || ''} onChange={e => setNewMed({ ...newMed, maxStock: Number(e.target.value) })} />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-bold text-slate-500 ml-1">Emplacement (Rayon)</label>
                                <input type="text" placeholder="ex: Rayon A2" className={inputClass} value={newMed.location || ''} onChange={e => setNewMed({ ...newMed, location: e.target.value })} />
                            </div>
                        </div>
                    </div>

                    {/* Stock Initial */}
                    {!isEditMode && (
                        <div className="p-6 bg-sky-50 dark:bg-sky-900/10 rounded-2xl border border-sky-100 dark:border-sky-900/30">
                            <label className="flex items-center gap-3 cursor-pointer">
                                <input type="checkbox" checked={showInitialStock} onChange={(e) => setShowInitialStock(e.target.checked)} className="w-5 h-5 accent-sky-600 rounded" />
                                <span className="text-sm font-black text-sky-800 dark:text-sky-300 uppercase tracking-widest select-none">Ajouter un lot de stock initial</span>
                            </label>

                            {showInitialStock && (
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-bold text-sky-700 dark:text-sky-400 uppercase tracking-widest ml-1">Qté (Unités)</label>
                                        <input type="number" min="1" placeholder="ex: 50" className={`${inputClass} !bg-white dark:!bg-slate-900`} onChange={e => setInitialStock({ ...initialStock, quantity: Number(e.target.value) })} />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-bold text-sky-700 dark:text-sky-400 uppercase tracking-widest ml-1">Numéro de Lot</label>
                                        <input type="text" placeholder="ex: LOT-2024-A" className={`${inputClass} !bg-white dark:!bg-slate-900`} onChange={e => setInitialStock({ ...initialStock, batchNumber: e.target.value })} />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-bold text-sky-700 dark:text-sky-400 uppercase tracking-widest ml-1">Date d'expiration</label>
                                        <input type="date" className={`${inputClass} !bg-white dark:!bg-slate-900`} onChange={e => setInitialStock({ ...initialStock, expiryDate: e.target.value })} />
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t border-slate-100 dark:border-slate-800">
                        <button type="button" onClick={onClose} className="flex-1 py-4 bg-slate-100 dark:bg-slate-800 text-slate-500 font-bold rounded-2xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
                            Annuler
                        </button>
                        <button type="submit" className="flex-1 py-4 bg-sky-600 text-white font-black rounded-2xl shadow-lg shadow-sky-600/20 hover:bg-sky-500 transition-all flex items-center justify-center gap-2">
                            <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"></path></svg>
                            {isEditMode ? 'Mettre à jour le produit' : 'Enregistrer le produit'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};