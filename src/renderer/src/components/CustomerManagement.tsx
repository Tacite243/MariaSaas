import React, { useState, useCallback } from 'react';
import { Customer, LoyaltyStatus } from '../types';

const MOCK_CUSTOMERS: Customer[] = [
    { id: '1', name: 'Sarah Kabeya', phone: '+243 812 345 678', creditLimit: 50000, currentCredit: 12500, loyaltyStatus: LoyaltyStatus.GOLD, totalPurchases: 45 },
    { id: '2', name: 'Patient Anonyme', phone: '+243 998 765 432', creditLimit: 10000, currentCredit: 0, loyaltyStatus: LoyaltyStatus.NONE, totalPurchases: 1 },
    { id: '3', name: 'Michel Mwamba', phone: '+243 854 321 098', creditLimit: 100000, currentCredit: 85000, loyaltyStatus: LoyaltyStatus.SILVER, totalPurchases: 12 },
    { id: '4', name: 'Julie Ngoy', phone: '+243 971 112 233', creditLimit: 25000, currentCredit: 2000, loyaltyStatus: LoyaltyStatus.BRONZE, totalPurchases: 5 },
    { id: '5', name: 'David Kasongo', phone: '+243 811 223 344', creditLimit: 5000, currentCredit: 4800, loyaltyStatus: LoyaltyStatus.BRONZE, totalPurchases: 3 },
];

const MOCK_TRANSACTIONS: Record<string, any[]> = {
    '1': [
        { id: 'FAC-2024-1022', date: '2024-03-22', total: 15500, status: 'PAID', method: 'CASH' },
        { id: 'FAC-2024-0988', date: '2024-03-15', total: 8000, status: 'PAID', method: 'MOBILE' },
    ],
    '3': [
        { id: 'FAC-2024-1024', date: '2024-03-23', total: 85000, status: 'PENDING', method: 'CREDIT' },
        { id: 'FAC-2024-0850', date: '2024-02-28', total: 12000, status: 'PAID', method: 'CASH' },
    ]
};

const CustomerManagement: React.FC = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [showAddModal, setShowAddModal] = useState(false);
    const [selectedCustomerForHistory, setSelectedCustomerForHistory] = useState<Customer | null>(null);

    // Form State
    const [newCustomer, setNewCustomer] = useState({
        name: '',
        phone: '',
        creditLimit: 10000
    });
    const [isListening, setIsListening] = useState(false);

    const filteredCustomers = MOCK_CUSTOMERS.filter(c =>
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.phone.includes(searchTerm)
    );

    const totalCredit = MOCK_CUSTOMERS.reduce((acc, c) => acc + (c.currentCredit || 0), 0);

    const startVoiceInput = useCallback(() => {
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (!SpeechRecognition) {
            alert("La reconnaissance vocale n'est pas supportée par votre navigateur.");
            return;
        }

        const recognition = new SpeechRecognition();
        recognition.lang = 'fr-FR';
        recognition.interimResults = false;
        recognition.maxAlternatives = 1;

        recognition.onstart = () => setIsListening(true);
        recognition.onend = () => setIsListening(false);
        recognition.onerror = () => setIsListening(false);

        recognition.onresult = (event: any) => {
            const transcript = event.results[0][0].transcript;
            setNewCustomer(prev => ({ ...prev, name: transcript }));
        };

        recognition.start();
    }, []);

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Mini Dashboard Clients */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-5 transition-colors">
                    <div className="w-14 h-14 bg-sky-50 dark:bg-sky-900/20 rounded-2xl flex items-center justify-center text-sky-600 dark:text-sky-400">
                        <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Patients</p>
                        <h3 className="text-2xl font-black text-slate-900 dark:text-white leading-none mt-1">{MOCK_CUSTOMERS.length}</h3>
                    </div>
                </div>
                <div className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-5 transition-colors">
                    <div className="w-14 h-14 bg-amber-50 dark:bg-amber-900/20 rounded-2xl flex items-center justify-center text-amber-600 dark:text-amber-400">
                        <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M12 1v22m5-18H9.5a4.5 4.5 0 1 0 0 9h5a4.5 4.5 0 1 1 0 9H6" /></svg>
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Encours Crédit</p>
                        <h3 className="text-2xl font-black text-slate-900 dark:text-white leading-none mt-1">{totalCredit.toLocaleString()} FC</h3>
                    </div>
                </div>
                <div className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-5 transition-colors">
                    <div className="w-14 h-14 bg-emerald-50 dark:bg-emerald-900/20 rounded-2xl flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                        <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><path d="M22 4 12 14.01l-3-3" /></svg>
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Fidélité Active</p>
                        <h3 className="text-2xl font-black text-slate-900 dark:text-white leading-none mt-1">4</h3>
                    </div>
                </div>
            </div>

            {/* Barre d'outils */}
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                <div className="relative w-full md:w-96 group">
                    <input
                        type="text"
                        placeholder="Rechercher nom ou téléphone..."
                        className="w-full pl-12 pr-4 py-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl focus:ring-4 focus:ring-sky-500/5 focus:border-sky-500 outline-none transition-all font-semibold text-slate-700 dark:text-white shadow-sm"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    <svg className="absolute left-4 top-4 text-slate-400 group-focus-within:text-sky-500 transition-colors" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></svg>
                </div>
                <button
                    onClick={() => setShowAddModal(true)}
                    className="w-full md:w-auto px-8 py-4 bg-slate-900 dark:bg-sky-600 text-white font-black rounded-2xl hover:bg-slate-800 dark:hover:bg-sky-500 transition-all shadow-xl active:scale-95 flex items-center justify-center gap-3 uppercase text-xs tracking-widest"
                >
                    <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14" /></svg>
                    Nouveau Patient
                </button>
            </div>

            {/* Liste des Clients */}
            <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden transition-colors">
                <table className="w-full text-left">
                    <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
                        <tr>
                            <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Client & Rang</th>
                            <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Téléphone</th>
                            <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">État du Crédit</th>
                            <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Limite</th>
                            <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {filteredCustomers.map(customer => {
                            const creditPercentage = (customer.currentCredit || 0) / (customer.creditLimit || 1) * 100;
                            const isWarning = creditPercentage > 80;
                            return (
                                <tr key={customer.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors group">
                                    <td className="px-8 py-6">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-black text-slate-400 dark:text-slate-500 group-hover:bg-sky-100 dark:group-hover:bg-sky-900 group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors">
                                                {customer.name.charAt(0)}
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="font-bold text-slate-800 dark:text-white text-base leading-none">{customer.name}</span>
                                                {customer.loyaltyStatus && customer.loyaltyStatus !== LoyaltyStatus.NONE && (
                                                    <span className={`text-[8px] font-black uppercase tracking-widest mt-1 ${customer.loyaltyStatus === LoyaltyStatus.GOLD ? 'text-amber-500' :
                                                            customer.loyaltyStatus === LoyaltyStatus.SILVER ? 'text-slate-400' : 'text-orange-400'
                                                        }`}>
                                                        Patient {customer.loyaltyStatus}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6 font-medium text-slate-500 dark:text-slate-400">{customer.phone}</td>
                                    <td className="px-8 py-6">
                                        <div className="flex flex-col gap-2 w-48">
                                            <div className="flex justify-between text-[10px] font-black uppercase">
                                                <span className={isWarning ? 'text-amber-600' : 'text-slate-400 dark:text-slate-500'}>{customer.currentCredit?.toLocaleString()} FC</span>
                                                <span className="text-slate-300 dark:text-slate-700">/</span>
                                            </div>
                                            <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                                <div
                                                    className={`h-full rounded-full transition-all duration-1000 ${isWarning ? 'bg-amber-500' : 'bg-sky-500'}`}
                                                    style={{ width: `${Math.min(creditPercentage, 100)}%` }}
                                                ></div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6 font-black text-slate-900 dark:text-white">{customer.creditLimit?.toLocaleString()} FC</td>
                                    <td className="px-8 py-6 text-right">
                                        <div className="flex justify-end gap-2">
                                            <button
                                                onClick={() => setSelectedCustomerForHistory(customer)}
                                                className="p-3 text-sky-600 dark:text-sky-400 hover:bg-sky-50 dark:hover:bg-sky-900/30 rounded-xl transition-all"
                                                title="Historique Achats"
                                            >
                                                <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2M9 5a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2M9 5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2m-6 9h6m-6-4h6" /></svg>
                                            </button>
                                            <button className="p-3 text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all" title="Modifier Profil">
                                                <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="m11 4 7 7m-15 8v-5l11-11 5 5-11 11h-5" /></svg>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {/* Transaction History Modal */}
            {selectedCustomerForHistory && (
                <div className="fixed inset-0 z-[120] bg-slate-900/80 backdrop-blur-md flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-[3rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 border border-slate-200 dark:border-slate-800">
                        <div className="p-10 border-b border-slate-100 dark:border-slate-800 flex justify-between items-start">
                            <div>
                                <h2 className="text-3xl font-black italic tracking-tighter uppercase text-slate-900 dark:text-white">Historique des Achats</h2>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Client: {selectedCustomerForHistory.name}</p>
                            </div>
                            <button
                                onClick={() => setSelectedCustomerForHistory(null)}
                                className="p-3 bg-slate-50 dark:bg-slate-800 text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-2xl transition-all"
                            >
                                <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24"><path d="M18 6 6 18M6 6l12 12" /></svg>
                            </button>
                        </div>
                        <div className="p-10 max-h-[60vh] overflow-auto custom-scrollbar">
                            <table className="w-full text-left">
                                <thead className="border-b border-slate-100 dark:border-slate-800">
                                    <tr>
                                        <th className="pb-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">Référence</th>
                                        <th className="pb-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">Date</th>
                                        <th className="pb-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">Total</th>
                                        <th className="pb-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">Mode</th>
                                        <th className="pb-4 text-[9px] font-black text-slate-400 uppercase tracking-widest text-right">Statut</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                                    {(MOCK_TRANSACTIONS[selectedCustomerForHistory.id] || []).length > 0 ? (
                                        MOCK_TRANSACTIONS[selectedCustomerForHistory.id].map(tx => (
                                            <tr key={tx.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                                <td className="py-4 font-black text-slate-900 dark:text-white text-xs">{tx.id}</td>
                                                <td className="py-4 text-xs text-slate-500 dark:text-slate-400 font-medium">{tx.date}</td>
                                                <td className="py-4 font-black text-slate-900 dark:text-white text-xs">{tx.total.toLocaleString()} FC</td>
                                                <td className="py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">{tx.method}</td>
                                                <td className="py-4 text-right">
                                                    <span className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest ${tx.status === 'PAID' ? 'bg-emerald-50 dark:bg-emerald-900/10 text-emerald-600' : 'bg-amber-50 dark:bg-amber-900/10 text-amber-600'
                                                        }`}>
                                                        {tx.status}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan={5} className="py-12 text-center text-slate-400 font-bold uppercase text-[10px] tracking-widest italic">
                                                Aucune transaction trouvée pour ce client
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {/* New Patient Modal with Voice Input */}
            {showAddModal && (
                <div className="fixed inset-0 z-[120] bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-[2.5rem] p-10 shadow-2xl animate-in zoom-in-95 duration-200 border border-slate-200 dark:border-slate-800">
                        <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-2 italic tracking-tighter uppercase">Nouveau Patient</h2>
                        <p className="text-slate-400 dark:text-slate-500 text-sm font-medium mb-8">Créez le profil patient. Utilisez l'icône micro pour dicter le nom.</p>
                        <form className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Nom Complet</label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        value={newCustomer.name}
                                        onChange={(e) => setNewCustomer({ ...newCustomer, name: e.target.value })}
                                        className="w-full pl-5 pr-14 py-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:ring-4 focus:ring-sky-500/10 focus:border-sky-500 transition-all font-semibold dark:text-white"
                                        placeholder="Ex: Jean Paul Mbuyi"
                                    />
                                    <button
                                        type="button"
                                        onClick={startVoiceInput}
                                        className={`absolute right-3 top-1/2 -translate-y-1/2 p-2.5 rounded-xl transition-all ${isListening ? 'bg-red-500 text-white animate-pulse' : 'bg-slate-100 dark:bg-slate-700 text-slate-400 hover:text-sky-600'
                                            }`}
                                    >
                                        <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                                            <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
                                            <path d="M19 10v2a7 7 0 0 1-14 0v-2M12 19v4M8 23h8" />
                                        </svg>
                                    </button>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Téléphone</label>
                                <input
                                    type="text"
                                    value={newCustomer.phone}
                                    onChange={(e) => setNewCustomer({ ...newCustomer, phone: e.target.value })}
                                    className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:ring-4 focus:ring-sky-500/10 focus:border-sky-500 transition-all font-semibold dark:text-white"
                                    placeholder="+243 ..."
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Limite Crédit (FC)</label>
                                <input
                                    type="number"
                                    value={newCustomer.creditLimit}
                                    onChange={(e) => setNewCustomer({ ...newCustomer, creditLimit: Number(e.target.value) })}
                                    className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:ring-4 focus:ring-sky-500/10 focus:border-sky-500 transition-all font-black dark:text-white"
                                />
                            </div>
                            <div className="flex gap-4 pt-4">
                                <button type="button" onClick={() => setShowAddModal(false)} className="flex-1 py-4 text-slate-500 font-bold hover:bg-slate-100 dark:hover:bg-slate-800 rounded-2xl transition-all uppercase text-[10px] tracking-widest">Annuler</button>
                                <button type="button" className="flex-1 py-4 bg-sky-600 text-white font-black rounded-2xl shadow-xl shadow-sky-600/30 hover:bg-sky-500 transition-all uppercase text-[10px] tracking-widest">Enregistrer</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CustomerManagement;
