import React, { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { AppDispatch } from '@renderer/app/store/store';
import { validateRequisition, fetchProducts } from '@renderer/app/store/slice/inventorySlice';

interface Requisition {
    id: string;
    reference: string;
    status: string;
    date: string;
    supplier: { name: string };
    createdBy: { name: string };
    items: any[];
}

export const RequisitionList: React.FC = () => {
    const dispatch = useDispatch<AppDispatch>();
    const [requisitions, setRequisitions] = useState<Requisition[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const loadData = async () => {
        setIsLoading(true);
        // Appel direct pour l'instant (ou via thunk si tu préfères)
        const res = await window.api.inventory.getRequisitions();
        if (res.success && res.data) {
            setRequisitions(res.data as Requisition[]);
        }
        setIsLoading(false);
    };

    useEffect(() => {
        loadData();
    }, []);

    const handleValidate = async (id: string) => {
        if (confirm("Confirmer la réception de ce stock ? Cette action est irréversible.")) {
            try {
                await dispatch(validateRequisition(id)).unwrap();
                alert("Stock mis à jour !");
                loadData(); // Recharger la liste
                dispatch(fetchProducts()); // Recharger le stock global
            } catch (err) {
                alert("Erreur validation : " + err);
            }
        }
    };

    if (isLoading) return <div className="p-10 text-center">Chargement des commandes...</div>;

    return (
        <div className="w-full overflow-x-auto custom-scrollbar bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800">
            <table className="w-full text-left min-w-[800px]">
                <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
                    <tr>
                        <th className="p-6 text-xs font-black text-slate-400 uppercase tracking-widest">Référence</th>
                        <th className="p-6 text-xs font-black text-slate-400 uppercase tracking-widest">Date</th>
                        <th className="p-6 text-xs font-black text-slate-400 uppercase tracking-widest">Fournisseur</th>
                        <th className="p-6 text-xs font-black text-slate-400 uppercase tracking-widest text-center">Statut</th>
                        <th className="p-6 text-xs font-black text-slate-400 uppercase tracking-widest text-right">Action</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {requisitions.map(req => (
                        <tr key={req.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                            <td className="p-6 font-bold text-slate-700 dark:text-slate-200">{req.reference}</td>
                            <td className="p-6 text-sm text-slate-500">{new Date(req.date).toLocaleDateString()}</td>
                            <td className="p-6 text-sm font-medium">{req.supplier?.name || 'Inconnu'}</td>
                            <td className="p-6 text-center">
                                <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${req.status === 'VALIDATED' ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'
                                    }`}>
                                    {req.status === 'VALIDATED' ? 'Reçu' : 'Brouillon'}
                                </span>
                            </td>
                            <td className="p-6 text-right">
                                {req.status === 'DRAFT' && (
                                    <button
                                        onClick={() => handleValidate(req.id)}
                                        className="px-4 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-transform"
                                    >
                                        Valider Réception
                                    </button>
                                )}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};