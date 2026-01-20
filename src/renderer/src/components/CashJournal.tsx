
import React, { useState } from 'react';
import { cashJournalService } from '../services/cashJournalService';
import { CashMovementType, CashCategory } from '../types';

const CashJournal: React.FC = () => {
    const [showModal, setShowModal] = useState(false);
    const [filter, setFilter] = useState<CashMovementType | 'ALL'>('ALL');
    const [newMovement, setNewMovement] = useState({
        type: CashMovementType.OUT,
        category: CashCategory.OTHER,
        amount: 0,
        description: ''
    });

    const movements = cashJournalService.getMovements().filter(m => filter === 'ALL' || m.type === filter);
    const totals = cashJournalService.getTotals();

    const handleAdd = (e: React.FormEvent) => {
        e.preventDefault();
        if (newMovement.amount <= 0) return;

        cashJournalService.addMovement({
            ...newMovement,
            performedBy: 'JD (Caisse)'
        });
        setShowModal(false);
        setNewMovement({ type: CashMovementType.OUT, category: CashCategory.OTHER, amount: 0, description: '' });
    };

    const handleExportCSV = () => {
        const headers = ['ID', 'Date', 'Type', 'Categorie', 'Description', 'Montant', 'Utilisateur'];
        const rows = movements.map(m => [
            m.id,
            new Date(m.timestamp).toLocaleString(),
            m.type,
            m.category,
            m.description.replace(/,/g, ';'),
            m.amount,
            m.performedBy
        ]);

        const csvContent = [
            headers.join(','),
            ...rows.map(r => r.join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `journal_caisse_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="space-y-10 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row justify-between items-end gap-6">
                <div>
                    <h2 className="text-3xl font-black italic text-slate-900 dark:text-white tracking-tighter uppercase">Journal de Caisse</h2>
                    <p className="text-slate-400 font-bold text-[10px] uppercase tracking-[0.3em] mt-2">Suivi des flux financiers • MariaSaas Ledger</p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={handleExportCSV}
                        className="px-6 py-4 bg-white dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 font-black rounded-2xl shadow-sm active:scale-95 transition-all flex items-center gap-3 uppercase text-[10px] tracking-widest"
                    >
                        <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4m4-5 5 5 5-5m-5 5V3" /></svg>
                        Exporter CSV
                    </button>
                    <button
                        onClick={() => setShowModal(true)}
                        className="px-8 py-4 bg-slate-900 dark:bg-sky-600 text-white font-black rounded-2xl shadow-xl active:scale-95 transition-all flex items-center gap-3 uppercase text-[10px] tracking-widest"
                    >
                        <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14" /></svg>
                        Nouvelle Opération
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-emerald-500 text-white p-8 rounded-[2.5rem] shadow-xl shadow-emerald-500/10">
                    <p className="text-[10px] font-black text-emerald-100 uppercase tracking-widest">Entrées (Total)</p>
                    <h3 className="text-3xl font-black mt-2 tracking-tighter">{totals.in.toLocaleString()} FC</h3>
                    <div className="mt-4 w-full h-1 bg-white/20 rounded-full overflow-hidden">
                        <div className="h-full bg-white w-full"></div>
                    </div>
                </div>
                <div className="bg-red-500 text-white p-8 rounded-[2.5rem] shadow-xl shadow-red-500/10">
                    <p className="text-[10px] font-black text-red-100 uppercase tracking-widest">Sorties (Total)</p>
                    <h3 className="text-3xl font-black mt-2 tracking-tighter">{totals.out.toLocaleString()} FC</h3>
                    <div className="mt-4 w-full h-1 bg-white/20 rounded-full overflow-hidden">
                        <div className="h-full bg-white w-full"></div>
                    </div>
                </div>
                <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border-2 border-slate-200 dark:border-slate-800 shadow-sm transition-colors">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Solde Théorique</p>
                    <h3 className={`text-3xl font-black mt-2 tracking-tighter ${totals.balance >= 0 ? 'text-sky-600 dark:text-sky-400' : 'text-red-500'}`}>
                        {totals.balance.toLocaleString()} FC
                    </h3>
                    <p className="text-[9px] font-bold text-slate-400 mt-2 uppercase italic">Réconciliation requise en fin de shift</p>
                </div>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden transition-colors">
                <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row justify-between items-center gap-4">
                    <h4 className="text-sm font-black uppercase text-slate-900 dark:text-white tracking-widest">Mouvements de fonds</h4>
                    <div className="flex gap-2 bg-slate-50 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
                        {(['ALL', CashMovementType.IN, CashMovementType.OUT] as const).map(t => (
                            <button
                                key={t}
                                onClick={() => setFilter(t)}
                                className={`px-4 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${filter === t ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm' : 'text-slate-400'}`}
                            >
                                {t === 'ALL' ? 'Tous' : t === CashMovementType.IN ? 'Entrées' : 'Sorties'}
                            </button>
                        ))}
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50/50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
                            <tr>
                                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Date & Heure</th>
                                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Catégorie</th>
                                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Description</th>
                                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Montant</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {movements.map(m => (
                                <tr key={m.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
                                    <td className="px-8 py-6">
                                        <div className="flex flex-col">
                                            <span className="text-xs font-bold text-slate-800 dark:text-white">{new Date(m.timestamp).toLocaleDateString()}</span>
                                            <span className="text-[10px] text-slate-400 font-bold uppercase">{new Date(m.timestamp).toLocaleTimeString()}</span>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6">
                                        <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border ${m.type === CashMovementType.IN
                                                ? 'bg-emerald-50 dark:bg-emerald-900/10 text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-900/30'
                                                : 'bg-red-50 dark:bg-red-900/10 text-red-600 dark:text-red-400 border-red-100 dark:border-red-900/30'
                                            }`}>
                                            {m.category.replace('_', ' ')}
                                        </span>
                                    </td>
                                    <td className="px-8 py-6">
                                        <p className="text-sm font-semibold text-slate-700 dark:text-slate-300 italic">"{m.description}"</p>
                                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1 block">{m.performedBy}</span>
                                    </td>
                                    <td className={`px-8 py-6 text-right font-black text-lg ${m.type === CashMovementType.IN ? 'text-emerald-500' : 'text-red-500'}`}>
                                        {m.type === CashMovementType.IN ? '+' : '-'}{m.amount.toLocaleString()} FC
                                    </td>
                                </tr>
                            ))}
                            {movements.length === 0 && (
                                <tr>
                                    <td colSpan={4} className="px-8 py-20 text-center text-slate-400 font-black uppercase text-[10px] tracking-widest italic">
                                        Aucun mouvement enregistré pour cette période
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {showModal && (
                <div className="fixed inset-0 z-[120] bg-slate-900/80 backdrop-blur-md flex items-center justify-center p-6">
                    <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-[3rem] p-10 shadow-2xl animate-in zoom-in-95 duration-200 border border-slate-200 dark:border-slate-800">
                        <div className="flex justify-between items-center mb-8">
                            <h2 className="text-2xl font-black text-slate-900 dark:text-white italic uppercase tracking-tighter">Opération de Caisse</h2>
                            <button onClick={() => setShowModal(false)} className="p-3 bg-slate-100 dark:bg-slate-800 rounded-2xl text-slate-400 hover:text-slate-900 dark:hover:text-white transition-all">
                                <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24"><path d="M18 6 6 18M6 6l12 12" /></svg>
                            </button>
                        </div>

                        <form onSubmit={handleAdd} className="space-y-6">
                            <div className="grid grid-cols-2 gap-4">
                                <button
                                    type="button"
                                    onClick={() => setNewMovement({ ...newMovement, type: CashMovementType.IN })}
                                    className={`py-5 rounded-[1.5rem] font-black text-xs uppercase tracking-[0.2em] border-2 transition-all ${newMovement.type === CashMovementType.IN ? 'bg-emerald-500 border-emerald-500 text-white shadow-xl shadow-emerald-500/20' : 'bg-slate-50 dark:bg-slate-800 border-slate-100 dark:border-slate-700 text-slate-400'}`}
                                >
                                    Entrée (+)
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setNewMovement({ ...newMovement, type: CashMovementType.OUT })}
                                    className={`py-5 rounded-[1.5rem] font-black text-xs uppercase tracking-[0.2em] border-2 transition-all ${newMovement.type === CashMovementType.OUT ? 'bg-red-500 border-red-500 text-white shadow-xl shadow-red-500/20' : 'bg-slate-50 dark:bg-slate-800 border-slate-100 dark:border-slate-700 text-slate-400'}`}
                                >
                                    Sortie (-)
                                </button>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Catégorie de Flux</label>
                                <select
                                    className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:ring-4 focus:ring-sky-500/10 focus:border-sky-500 transition-all font-bold text-slate-700 dark:text-white"
                                    value={newMovement.category}
                                    onChange={(e) => setNewMovement({ ...newMovement, category: e.target.value as CashCategory })}
                                >
                                    {Object.values(CashCategory).map(cat => (
                                        <option key={cat} value={cat} className="dark:bg-slate-900">{cat.replace('_', ' ')}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Montant (FC)</label>
                                <input
                                    type="number"
                                    required
                                    className="w-full px-6 py-5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:ring-4 focus:ring-sky-500/10 focus:border-sky-500 transition-all font-black text-slate-900 dark:text-white text-2xl"
                                    placeholder="0"
                                    value={newMovement.amount || ''}
                                    onChange={(e) => setNewMovement({ ...newMovement, amount: Number(e.target.value) })}
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Motif / Justification</label>
                                <textarea
                                    required
                                    className="w-full px-6 py-5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:ring-4 focus:ring-sky-500/10 focus:border-sky-500 transition-all font-medium text-slate-700 dark:text-slate-300 h-28 resize-none"
                                    placeholder="Ex: Achat fournitures bureau..."
                                    value={newMovement.description}
                                    onChange={(e) => setNewMovement({ ...newMovement, description: e.target.value })}
                                />
                            </div>

                            <button type="submit" className="w-full py-6 bg-slate-900 dark:bg-sky-600 text-white rounded-[1.8rem] font-black uppercase text-xs tracking-[0.3em] shadow-2xl active:scale-95 transition-all mt-4">
                                Valider l'opération
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CashJournal;
