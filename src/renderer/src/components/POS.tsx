import React, { useState, useMemo, useRef } from 'react';
import { Medication, CartItem, Customer, CashMovementType, CashCategory, LoyaltyStatus } from '../types';
import { cashJournalService } from '../services/cashJournalService';
import { AreaChart, Area, ResponsiveContainer, Tooltip, YAxis } from 'recharts';

const MOCK_MEDS: Medication[] = [
  { id: '1', name: 'Paracétamol', code: 'P001', category: 'Analgésique', dosage: '500mg', price: 1500, buyingPrice: 1000, threshold: 10, lots: [{ id: 'L1', batchNumber: 'L2401', expiryDate: '2025-12-01', quantity: 100, receivedDate: '2024-01-01' }] },
  { id: '2', name: 'Amoxicilline', code: 'A002', category: 'Antibiotique', dosage: '500mg', price: 3500, buyingPrice: 2200, threshold: 5, lots: [{ id: 'L2', batchNumber: 'L2402', expiryDate: '2024-11-15', quantity: 45, receivedDate: '2024-01-01' }] },
  { id: '3', name: 'Ibuprofène', code: 'I003', category: 'Anti-inflammatoire', dosage: '400mg', price: 2000, buyingPrice: 1400, threshold: 15, lots: [{ id: 'L3', batchNumber: 'L2403', expiryDate: '2025-06-20', quantity: 80, receivedDate: '2024-01-01' }] },
  { id: '4', name: 'Vitamine C', code: 'V004', category: 'Supplément', dosage: '1000mg', price: 5000, buyingPrice: 3500, threshold: 20, lots: [{ id: 'L4', batchNumber: 'L2404', expiryDate: '2026-01-10', quantity: 200, receivedDate: '2024-01-01' }] },
];

const MOCK_CUSTOMERS: Customer[] = [
  { id: '1', name: 'Sarah Kabeya', phone: '+243 812 345 678', loyaltyStatus: LoyaltyStatus.GOLD },
  { id: '2', name: 'Michel Mwamba', phone: '+243 854 321 098', loyaltyStatus: LoyaltyStatus.SILVER },
];

type PaymentMethod = 'CASH' | 'MOBILE_MONEY' | 'CARD';

const POS: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [customerSearch, setCustomerSearch] = useState('');
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('CASH');
  const dropdownRef = useRef<HTMLDivElement>(null);

  const filteredMeds = MOCK_MEDS.filter(m => 
    m.name.toLowerCase().includes(searchTerm.toLowerCase()) || m.code.includes(searchTerm)
  );

  const filteredCustomers = MOCK_CUSTOMERS.filter(c => 
    c.name.toLowerCase().includes(customerSearch.toLowerCase()) || c.phone.includes(customerSearch)
  );

  const subtotal = useMemo(() => cart.reduce((acc, item) => acc + (item.price * item.quantity), 0), [cart]);
  const total = subtotal;

  const salesEvolutionData = useMemo(() => {
    const movements = cashJournalService.getMovements();
    const today = new Date().toISOString().split('T')[0];
    const todaySales = movements
      .filter(m => m.category === CashCategory.SALE && m.timestamp.startsWith(today))
      .sort((a, b) => a.timestamp.localeCompare(b.timestamp));

    let runningTotal = 0;
    const data = todaySales.map(s => {
      runningTotal += s.amount;
      return { time: new Date(s.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), amount: runningTotal };
    });

    if (total > 0) {
      data.push({ time: 'Projection', amount: runningTotal + total });
    } else if (data.length === 0) {
      data.push({ time: 'Début', amount: 0 });
    }
    return data;
  }, [total]);

  const addToCart = (med: Medication) => {
    const lot = med.lots[0];
    if (!lot) return;
    setCart(prev => {
      const existing = prev.find(i => i.id === med.id);
      if (existing) return prev.map(i => i.id === med.id ? { ...i, quantity: i.quantity + 1 } : i);
      return [...prev, { ...med, quantity: 1, selectedLotId: lot.id, selectedLotBatch: lot.batchNumber, selectedLotExpiry: lot.expiryDate }];
    });
  };

  const handleCompleteSale = () => {
    setIsProcessing(true);
    setTimeout(() => {
      const methodLabel = paymentMethod === 'CASH' ? 'Espèces' : paymentMethod === 'MOBILE_MONEY' ? 'M-Pesa/Airtel' : 'Carte';
      cashJournalService.addMovement({
        type: CashMovementType.IN,
        category: CashCategory.SALE,
        amount: total,
        description: `Vente POS [${methodLabel}] - Client: ${selectedCustomer?.name || 'Comptoir'}`,
        performedBy: 'JD'
      });
      setCart([]);
      setSelectedCustomer(null);
      setPaymentMethod('CASH');
      setIsProcessing(false);
      alert('Vente validée avec succès !');
    }, 800);
  };

  return (
    <div className="flex flex-col lg:flex-row h-full gap-6 md:gap-8 pb-4">
      {/* Product Selection Area */}
      <div className="flex-1 flex flex-col gap-4 md:gap-6 bg-white dark:bg-slate-900 p-4 md:p-8 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden min-h-[450px] lg:min-h-0 transition-colors">
        <div className="flex flex-col gap-4">
          <div className="flex justify-between items-center lg:hidden">
             <h2 className="text-xl font-black italic uppercase tracking-tighter dark:text-white">Sélection</h2>
             <span className="text-[10px] font-black text-sky-600 bg-sky-50 dark:bg-sky-900/30 px-3 py-1 rounded-full uppercase tracking-widest">{MOCK_MEDS.length} Articles</span>
          </div>
          <div className="relative group">
            <input 
              type="text"
              placeholder="Rechercher produit..."
              className="w-full pl-12 pr-4 py-4 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl outline-none focus:ring-4 focus:ring-sky-500/10 font-bold dark:text-white transition-all text-sm md:text-base shadow-inner"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <svg className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-sky-500 transition-colors" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6 custom-scrollbar pr-1 pb-4">
          {filteredMeds.map(med => (
            <div key={med.id} onClick={() => addToCart(med)} className="p-4 md:p-6 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-[1.8rem] hover:border-sky-500 hover:shadow-2xl hover:-translate-y-1 transition-all flex flex-col cursor-pointer group active:scale-95 shadow-sm">
              <span className="text-[8px] md:text-[9px] font-black text-sky-600 mb-2 uppercase tracking-widest leading-none">{med.code}</span>
              <h4 className="font-black text-slate-900 dark:text-white leading-tight line-clamp-2 text-xs md:text-sm mb-4 h-8">{med.name}</h4>
              <div className="mt-auto flex justify-between items-end">
                <div className="min-w-0">
                  <p className="text-[9px] text-slate-400 font-bold uppercase truncate">{med.dosage}</p>
                  <span className="font-black text-sm md:text-lg text-slate-900 dark:text-white whitespace-nowrap">{med.price.toLocaleString()} FC</span>
                </div>
                <div className="p-2 md:p-2.5 bg-slate-900 dark:bg-sky-600 text-white rounded-xl shadow-lg opacity-100 lg:opacity-0 group-hover:opacity-100 transition-all flex-none">
                  <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Cart & Payment - Side on Large, Bottom on Mobile */}
      <div className="w-full lg:w-[380px] xl:w-[420px] flex flex-col bg-slate-900 rounded-[2.5rem] shadow-2xl overflow-hidden text-white border border-slate-800 flex-none h-fit lg:h-full max-h-[90vh] lg:max-h-none transition-all">
        <div className="p-6 md:p-8 border-b border-white/10 flex-none">
           <div className="flex justify-between items-center mb-4">
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none">Caisse / Patient</p>
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.5)]"></div>
           </div>
           <div className="relative" ref={dropdownRef}>
              <input 
                type="text"
                placeholder="Chercher patient..."
                className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-sm font-bold outline-none focus:border-sky-500 focus:bg-white/10 transition-all shadow-inner"
                value={selectedCustomer ? selectedCustomer.name : customerSearch}
                onChange={(e) => {
                  setCustomerSearch(e.target.value);
                  setShowCustomerDropdown(true);
                  if (selectedCustomer) setSelectedCustomer(null);
                }}
                onFocus={() => setShowCustomerDropdown(true)}
              />
              {showCustomerDropdown && !selectedCustomer && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-slate-800 border border-white/10 rounded-2xl shadow-2xl z-50 max-h-48 overflow-auto custom-scrollbar animate-in zoom-in-95 duration-200">
                  {filteredCustomers.map(c => (
                    <div key={c.id} onClick={() => { setSelectedCustomer(c); setShowCustomerDropdown(false); }} className="p-4 hover:bg-white/5 cursor-pointer border-b border-white/5 last:border-0 flex flex-col transition-colors">
                      <span className="font-black text-sm">{c.name}</span>
                      <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">{c.phone}</span>
                    </div>
                  ))}
                  {filteredCustomers.length === 0 && <div className="p-4 text-[10px] font-black uppercase text-slate-500 italic">Aucun résultat</div>}
                </div>
              )}
           </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-4 custom-scrollbar min-h-[120px] lg:min-h-0 bg-white/5">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center opacity-20 text-center py-10 grayscale">
               <svg width="40" height="40" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24" className="mb-4"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/><path d="M3 6h18"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>
               <p className="text-[10px] font-black uppercase tracking-[0.2em]">Le panier est vide</p>
            </div>
          ) : (
            cart.map(item => (
              <div key={item.id} className="flex items-center gap-4 group animate-in slide-in-from-right-4 duration-300">
                 <div className="flex-1 min-w-0">
                    <h4 className="font-black text-sm text-slate-200 truncate">{item.name}</h4>
                    <p className="text-[9px] text-slate-500 uppercase font-black tracking-widest">x{item.quantity} • {item.price.toLocaleString()} FC</p>
                 </div>
                 <button onClick={() => setCart(cart.filter(i => i.id !== item.id))} className="p-2 text-slate-600 hover:text-red-400 transition-colors active:scale-90">
                    <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24"><path d="M18 6 6 18M6 6l12 12"/></svg>
                 </button>
              </div>
            ))
          )}
        </div>

        <div className="p-6 md:p-8 bg-black/20 border-t border-white/10 space-y-6 backdrop-blur-md flex-none">
          {/* Payment Method Selection */}
          <div className="space-y-3">
             <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest text-center">Mode de règlement</p>
             <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'CASH', label: 'Cash', icon: (props: any) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" {...props}><rect width="20" height="12" x="2" y="6" rx="2"/><circle cx="12" cy="12" r="3"/><path d="M6 12h.01M18 12h.01"/></svg> },
                  { id: 'MOBILE_MONEY', label: 'M-Money', icon: (props: any) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" {...props}><rect width="14" height="20" x="5" y="2" rx="2" ry="2"/><path d="M12 18h.01"/></svg> },
                  { id: 'CARD', label: 'Carte', icon: (props: any) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" {...props}><rect width="20" height="14" x="2" y="5" rx="2"/><path d="M2 10h20"/></svg> }
                ].map((method) => (
                  <button
                    key={method.id}
                    onClick={() => setPaymentMethod(method.id as PaymentMethod)}
                    className={`flex flex-col items-center gap-2 p-3 rounded-2xl border transition-all ${
                      paymentMethod === method.id 
                        ? 'bg-sky-600/20 border-sky-500 text-sky-400 shadow-lg shadow-sky-500/10' 
                        : 'bg-white/5 border-white/10 text-slate-500 hover:border-white/20'
                    }`}
                  >
                    <method.icon className="w-5 h-5" />
                    <span className="text-[9px] font-black uppercase tracking-tighter">{method.label}</span>
                  </button>
                ))}
             </div>
          </div>

          {/* Real-time Sales Trend Area */}
          <div className="h-16 w-full opacity-60 hover:opacity-100 transition-opacity">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={salesEvolutionData}>
                <defs>
                  <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <YAxis hide domain={['auto', 'auto']} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '12px', fontSize: '9px', fontWeight: '900', color: '#fff', boxShadow: '0 10px 20px rgba(0,0,0,0.5)' }}
                  labelStyle={{ display: 'none' }}
                  itemStyle={{ padding: 0 }}
                  formatter={(value: number | undefined) => [`${(value ?? 0).toLocaleString()} FC`, 'Cumul']}
                />
                <Area type="monotone" dataKey="amount" stroke="#0ea5e9" fillOpacity={1} fill="url(#colorSales)" strokeWidth={3} isAnimationActive={true} />
              </AreaChart>
            </ResponsiveContainer>
            <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest text-center mt-2 italic">Productivité journalière (Cumul)</p>
          </div>

          <div className="flex justify-between items-end border-t border-white/5 pt-4">
             <div className="flex flex-col">
               <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Total Net</span>
               <span className="text-[9px] text-sky-500/50 font-bold uppercase leading-none">TTC Incluse</span>
             </div>
             <span className="text-3xl md:text-4xl xl:text-5xl font-black text-sky-400 tracking-tighter animate-in zoom-in-95 duration-200">
                {total.toLocaleString()} <span className="text-xs md:text-sm font-black opacity-50 uppercase ml-1">FC</span>
             </span>
          </div>
          <button 
            disabled={cart.length === 0 || isProcessing} 
            onClick={handleCompleteSale} 
            className="w-full py-5 md:py-6 bg-sky-600 hover:bg-sky-500 disabled:bg-slate-800 disabled:text-slate-600 text-white rounded-2xl md:rounded-[1.8rem] font-black text-lg xl:text-xl shadow-2xl transition-all active:scale-95 flex items-center justify-center gap-4 group"
          >
             {isProcessing ? (
               <div className="w-6 h-6 border-4 border-white/20 border-t-white rounded-full animate-spin"></div>
             ) : (
               <>
                 <span className="uppercase tracking-[0.2em] text-xs md:text-sm">Encaisser Vente</span>
                 <svg className="group-hover:translate-x-1 transition-transform" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
               </>
             )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default POS;
