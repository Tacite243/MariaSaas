import React, { useState, useMemo, useEffect } from 'react';
import { Medication, Lot } from '../types';
import { analyzeInventory } from '../services/geminiService';
import QRCode from 'qrcode';
import { Html5QrcodeScanner } from 'html5-qrcode';

const INITIAL_DATA: Medication[] = [
  { 
    id: '1', name: 'Paracétamol', code: 'P001', category: 'Analgésique', dosage: '500mg', price: 1500, buyingPrice: 1000, threshold: 10,
    lots: [
      { id: 'l1', batchNumber: 'BAT-2401', expiryDate: '2024-05-15', quantity: 20, receivedDate: '2024-01-01' },
      { id: 'l2', batchNumber: 'BAT-2402', expiryDate: '2025-12-01', quantity: 80, receivedDate: '2024-01-10' }
    ]
  },
  { 
    id: '2', name: 'Amoxicilline', code: 'A002', category: 'Antibiotique', dosage: '500mg', price: 3500, buyingPrice: 2200, threshold: 5,
    lots: [
      { id: 'l3', batchNumber: 'BAT-EXP', expiryDate: '2023-12-01', quantity: 10, receivedDate: '2023-01-01' },
      { id: 'l4', batchNumber: 'BAT-OK', expiryDate: '2026-06-15', quantity: 35, receivedDate: '2024-02-01' }
    ]
  },
  {
    id: '3', name: 'Ibuprofène', code: 'I003', category: 'Anti-inflammatoire', dosage: '400mg', price: 2000, buyingPrice: 1400, threshold: 15,
    lots: [{ id: 'l5', batchNumber: 'BAT-2405', expiryDate: '2025-08-20', quantity: 120, receivedDate: '2024-01-15' }]
  }
];

const CATEGORIES = ['Tous', 'Analgésique', 'Antibiotique', 'Anti-inflammatoire', 'Supplément', 'Générique'];

interface ScannedItem {
  medication: Medication;
  count: number;
}

const Inventory: React.FC = () => {
  const [medications, setMedications] = useState<Medication[]>(INITIAL_DATA);
  const [activeTab, setActiveTab] = useState<'stock' | 'lots' | 'ai'>('stock');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Tous');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiReport, setAiReport] = useState<{summary: string, critical_actions: string[]} | null>(null);
  
  const [showAddModal, setShowAddModal] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [scannedItems, setScannedItems] = useState<ScannedItem[]>([]);
  const [lastScannedCode, setLastScannedCode] = useState<string | null>(null);
  const [selectedMed, setSelectedMed] = useState<Medication | null>(null);

  const [newMed, setNewMed] = useState({
    name: '',
    code: '',
    category: 'Générique',
    dosage: '',
    price: 0,
    buyingPrice: 0,
    threshold: 5,
    initialQuantity: 0,
    expiryDate: ''
  });

  useEffect(() => {
    const enrichData = async () => {
      const enriched = await Promise.all(medications.map(async (m) => {
        if (!m.qrCode) {
          const qr = await QRCode.toDataURL(m.code || m.id);
          return { ...m, qrCode: qr };
        }
        return m;
      }));
      setMedications(enriched);
    };
    enrichData();
  }, []);

  useEffect(() => {
    if (showScanner) {
      const scanner = new Html5QrcodeScanner("reader", { 
        fps: 20, 
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.0
      }, false);

      scanner.render((decodedText) => {
        if (decodedText === lastScannedCode) return;
        const found = medications.find(m => m.code === decodedText || m.id === decodedText);
        if (found) {
          setScannedItems(prev => {
            const existingIdx = prev.findIndex(item => item.medication.id === found.id);
            if (existingIdx > -1) {
              const updated = [...prev];
              updated[existingIdx].count += 1;
              return updated;
            }
            return [...prev, { medication: found, count: 1 }];
          });
          setLastScannedCode(decodedText);
          setTimeout(() => setLastScannedCode(null), 2000);
        }
      }, (error) => {});

      return () => { scanner.clear().catch(console.error); };
    }
  }, [showScanner, medications, lastScannedCode]);

  const handleFinalizeInventory = () => {
    setMedications(prevMeds => {
      return prevMeds.map(med => {
        const scan = scannedItems.find(s => s.medication.id === med.id);
        if (scan) {
          const updatedLots = [...med.lots];
          if (updatedLots.length > 0) {
            updatedLots[0] = { ...updatedLots[0], quantity: updatedLots[0].quantity + scan.count };
          } else {
            updatedLots.push({
              id: `INV-${Date.now()}`,
              batchNumber: 'INVENTAIRE-MANUEL',
              expiryDate: new Date(Date.now() + 31536000000).toISOString().split('T')[0],
              quantity: scan.count,
              receivedDate: new Date().toISOString()
            });
          }
          return { ...med, lots: updatedLots };
        }
        return med;
      });
    });
    setScannedItems([]);
    setShowScanner(false);
    alert('Inventaire mis à jour avec succès !');
  };

  const handleAddMedication = async (e: React.FormEvent) => {
    e.preventDefault();
    const qr = await QRCode.toDataURL(newMed.code || Date.now().toString());
    const initialLots: Lot[] = [];
    if (newMed.initialQuantity > 0 || newMed.expiryDate) {
      initialLots.push({
        id: `L-${Date.now()}`,
        batchNumber: 'BATCH-INITIAL',
        expiryDate: newMed.expiryDate || new Date(Date.now() + 31536000000).toISOString().split('T')[0],
        quantity: newMed.initialQuantity,
        receivedDate: new Date().toISOString().split('T')[0]
      });
    }
    const med: Medication = {
      name: newMed.name,
      code: newMed.code,
      category: newMed.category,
      dosage: newMed.dosage,
      price: newMed.price,
      buyingPrice: newMed.buyingPrice,
      threshold: newMed.threshold,
      id: Date.now().toString(),
      lots: initialLots,
      qrCode: qr
    };
    setMedications([med, ...medications]);
    setShowAddModal(false);
    setNewMed({ name: '', code: '', category: 'Générique', dosage: '', price: 0, buyingPrice: 0, threshold: 5, initialQuantity: 0, expiryDate: '' });
  };

  const handleAiAudit = async () => {
    setIsAnalyzing(true);
    try {
      const result = await analyzeInventory(medications);
      setAiReport(result);
    } catch (err) {
      console.error("Audit AI Error:", err);
      setAiReport({ summary: "Erreur lors de l'analyse IA.", critical_actions: ["Le service est momentanément indisponible.", "Veuillez réessayer."] });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const filteredMedications = useMemo(() => {
    const term = searchTerm.toLowerCase().trim();
    return medications.filter(med => {
      const matchesSearch = !term || 
                          med.name.toLowerCase().includes(term) ||
                          med.code.toLowerCase().includes(term) ||
                          med.category.toLowerCase().includes(term);
      const matchesCategory = selectedCategory === 'Tous' || med.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [searchTerm, medications, selectedCategory]);

  const filteredLots = useMemo(() => {
    const term = searchTerm.toLowerCase().trim();
    const lots: (Lot & { medName: string, medCode: string, medCategory: string })[] = [];
    medications.forEach(med => {
      const matchesCategory = selectedCategory === 'Tous' || med.category === selectedCategory;
      const matchesSearch = !term || med.name.toLowerCase().includes(term) || med.code.toLowerCase().includes(term);
      if (matchesCategory && matchesSearch) {
        med.lots.forEach(lot => {
          lots.push({ ...lot, medName: med.name, medCode: med.code, medCategory: med.category });
        });
      }
    });
    return lots.sort((a, b) => new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime());
  }, [medications, searchTerm, selectedCategory]);

  return (
    <div className="space-y-6 md:space-y-8 animate-in fade-in duration-500 pb-10">
      <div className="flex flex-col gap-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <h2 className="text-3xl md:text-4xl font-black italic text-slate-900 dark:text-white tracking-tighter uppercase leading-none">Stock Professionnel</h2>
            <p className="text-slate-400 font-bold text-[10px] uppercase tracking-[0.3em] mt-3 italic">Contrôle Inventaire • GxP Compliance</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
             <button onClick={() => { setShowScanner(true); setScannedItems([]); }} className="flex-1 sm:flex-none px-6 md:px-8 py-3.5 md:py-4 bg-slate-900 dark:bg-slate-800 text-white font-black rounded-2xl md:rounded-[1.5rem] text-[10px] uppercase tracking-widest shadow-xl active:scale-95 transition-all flex items-center justify-center gap-3 border border-slate-700">
                <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24"><path d="M3 7V5a2 2 0 0 1 2-2h2m10 0h2a2 2 0 0 1 2 2v2m0 10v2a2 2 0 0 1-2 2h-2M7 21H5a2 2 0 0 1-2-2v-2M7 12h10M12 7v10"/></svg>
                Scanner
             </button>
             <button onClick={() => setShowAddModal(true)} className="flex-1 sm:flex-none px-6 md:px-8 py-3.5 md:py-4 bg-sky-600 text-white font-black rounded-2xl md:rounded-[1.5rem] text-[10px] uppercase tracking-widest shadow-xl active:scale-95 transition-all flex items-center justify-center gap-3">
                <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>
                Nouveau
             </button>
          </div>
        </div>

        <div className="flex flex-col gap-6 bg-white dark:bg-slate-900 p-6 md:p-8 rounded-3xl md:rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-sm transition-colors">
          <div className="flex flex-col lg:flex-row gap-6">
            <div className="relative flex-1 group">
              <input 
                type="text" 
                placeholder="Chercher par nom, code, catégorie..."
                className="w-full pl-12 pr-10 py-4 md:py-5 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl md:rounded-[1.8rem] focus:ring-4 focus:ring-sky-500/10 outline-none transition-all font-black dark:text-white text-sm tracking-tight shadow-inner"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <svg className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-sky-500 transition-colors" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
                <circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>
              </svg>
            </div>

            <div className="flex bg-slate-50 dark:bg-slate-800 p-1.5 rounded-2xl md:rounded-[1.8rem] w-full lg:w-fit overflow-x-auto no-scrollbar">
              {[
                { id: 'stock', label: 'Médocs', icon: '📦' },
                { id: 'lots', label: 'Lots', icon: '🏷️' },
                { id: 'ai', label: 'IA', icon: '✨' },
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex-1 lg:flex-none px-4 md:px-8 py-3 md:py-3.5 rounded-xl md:rounded-[1.5rem] text-[9px] md:text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 md:gap-3 ${activeTab === tab.id ? 'bg-slate-900 dark:bg-sky-600 text-white shadow-xl' : 'text-slate-400 hover:bg-white dark:hover:bg-slate-700'}`}
                >
                  <span className="hidden sm:inline">{tab.icon}</span>
                  <span>{tab.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`flex-none px-4 py-2 rounded-xl text-[8px] md:text-[9px] font-black uppercase tracking-widest transition-all border ${
                  selectedCategory === cat 
                    ? 'bg-sky-50 dark:bg-sky-900/20 text-sky-600 border-sky-200 dark:border-sky-800 shadow-sm' 
                    : 'bg-white dark:bg-slate-900 text-slate-400 border-slate-100 dark:border-slate-800 hover:border-slate-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-3xl md:rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden transition-colors animate-in slide-in-from-bottom-4 duration-500">
        <div className="overflow-x-auto custom-scrollbar">
          {activeTab === 'stock' ? (
            <table className="w-full text-left min-w-[750px]">
              <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
                <tr>
                  <th className="px-6 md:px-10 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Article & QR</th>
                  <th className="px-6 md:px-10 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Catégorie</th>
                  <th className="px-6 md:px-10 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Dosage</th>
                  <th className="px-6 md:px-10 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Unités</th>
                  <th className="px-6 md:px-10 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredMedications.map(med => {
                  const totalStock = med.lots.reduce((acc, l) => acc + l.quantity, 0);
                  const isLow = totalStock <= med.threshold;
                  return (
                    <tr key={med.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all group">
                      <td className="px-6 md:px-10 py-5 md:py-6">
                        <div className="flex items-center gap-4 md:gap-6">
                          {med.qrCode && (
                            <div className="w-12 h-12 md:w-14 md:h-14 bg-white p-1 rounded-xl md:rounded-2xl border dark:border-slate-700 overflow-hidden flex-none shadow-sm cursor-pointer hover:scale-105 transition-transform" onClick={() => setSelectedMed(med)}>
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
                          <span className="font-black text-lg leading-none">{totalStock}</span>
                          <span className="text-[8px] font-black uppercase tracking-widest mt-1 opacity-60">{isLow ? 'Critique' : 'Valide'}</span>
                        </div>
                      </td>
                      <td className="px-6 md:px-10 py-5 md:py-6 text-right whitespace-nowrap">
                        <button onClick={() => setSelectedMed(med)} className="p-2.5 bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-sky-600 dark:hover:text-sky-400 rounded-xl transition-all active:scale-90">
                          <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : activeTab === 'lots' ? (
            <table className="w-full text-left min-w-[800px]">
              <thead className="bg-slate-50/50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
                <tr>
                  <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Produit</th>
                  <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Lot #</th>
                  <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Péremption</th>
                  <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Quantité</th>
                  <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Statut</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredLots.map(lot => {
                  const expiry = new Date(lot.expiryDate);
                  const today = new Date();
                  const diffMonths = (expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24 * 30);
                  const isExpired = diffMonths < 0;
                  const isUrgent = diffMonths < 3;
                  return (
                    <tr key={lot.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all">
                      <td className="px-10 py-6">
                        <div className="flex flex-col min-w-0">
                          <span className="font-black text-slate-900 dark:text-white text-sm truncate">{lot.medName}</span>
                          <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mt-1">{lot.medCode}</span>
                        </div>
                      </td>
                      <td className="px-10 py-6 font-black text-slate-500 dark:text-slate-400 text-xs uppercase italic whitespace-nowrap">{lot.batchNumber}</td>
                      <td className="px-10 py-6 whitespace-nowrap">
                        <span className={`font-black text-sm ${isExpired ? 'text-red-600' : isUrgent ? 'text-amber-500' : 'text-slate-900 dark:text-white'}`}>
                          {new Date(lot.expiryDate).toLocaleDateString()}
                        </span>
                      </td>
                      <td className="px-10 py-6 text-center font-black dark:text-white">{lot.quantity}</td>
                      <td className="px-10 py-6 text-right whitespace-nowrap">
                        <span className={`px-4 py-1.5 rounded-full text-[8px] font-black uppercase tracking-widest ${
                          isExpired ? 'bg-red-600 text-white shadow-lg shadow-red-500/20' : isUrgent ? 'bg-amber-100 text-amber-600 dark:bg-amber-900/20' : 'bg-emerald-50 dark:bg-emerald-900/10 text-emerald-600'
                        }`}>
                          {isExpired ? 'Expiré' : isUrgent ? 'Urgent' : 'Valide'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : (
            <div className="p-8 md:p-12 space-y-8 min-w-full">
               <div className="bg-slate-900 p-8 md:p-12 rounded-3xl text-white relative overflow-hidden shadow-2xl">
                  <div className="absolute top-0 right-0 w-64 h-64 md:w-80 md:h-80 bg-sky-600/20 rounded-full blur-[100px]"></div>
                  <div className="relative z-10 max-w-xl">
                    <h3 className="text-2xl md:text-3xl font-black italic tracking-tighter uppercase mb-4 leading-none">Analyse GxP Maria</h3>
                    <p className="text-slate-400 font-medium text-base md:text-lg leading-relaxed">Intelligence prédictive sur l'état de votre inventaire et risques logistiques.</p>
                    <button onClick={handleAiAudit} disabled={isAnalyzing} className="mt-8 px-10 py-4 bg-sky-600 hover:bg-sky-500 text-white font-black rounded-2xl shadow-2xl transition-all flex items-center justify-center gap-4 uppercase text-[10px] tracking-[0.3em] active:scale-95 w-full sm:w-auto">
                      {isAnalyzing ? <div className="w-5 h-5 border-4 border-white/30 border-t-white rounded-full animate-spin"></div> : "Lancer l'Audit IA"}
                    </button>
                  </div>
               </div>
               {aiReport && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8 animate-in fade-in slide-in-from-bottom-6">
                  <div className="bg-white dark:bg-slate-900 p-8 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-sm transition-colors">
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6">Résumé Exécutif</h4>
                    <p className="text-slate-800 dark:text-slate-300 text-lg md:text-xl font-black italic leading-tight">"{aiReport.summary}"</p>
                  </div>
                  <div className="bg-white dark:bg-slate-900 p-8 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-sm transition-colors">
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6">Actions Requises</h4>
                    <div className="space-y-4">
                      {aiReport.critical_actions.map((action, i) => (
                        <div key={i} className="flex gap-4 p-4 bg-red-50 dark:bg-red-900/10 rounded-2xl border border-red-100 dark:border-red-900/30 text-red-600 dark:text-red-400">
                          <div className="w-6 h-6 flex-none bg-red-500 rounded-lg flex items-center justify-center text-white text-[10px] font-black">{i + 1}</div>
                          <p className="text-sm font-black italic leading-snug">{action}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
               )}
            </div>
          )}
        </div>
      </div>

      {/* Medication Detail Modal */}
      {selectedMed && (
        <div className="fixed inset-0 z-[100] bg-slate-900/80 backdrop-blur-xl flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-[3rem] p-8 md:p-12 shadow-2xl animate-in zoom-in-95 border border-slate-200 dark:border-slate-800">
             <div className="flex flex-col items-center text-center">
                <div className="w-40 h-40 md:w-48 md:h-48 bg-white p-2 rounded-[2rem] border-2 border-slate-100 dark:border-slate-800 shadow-2xl mb-8">
                   <img src={selectedMed.qrCode} alt="QR" className="w-full h-full object-contain" />
                </div>
                <h3 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white italic tracking-tighter uppercase mb-4 leading-tight">{selectedMed.name}</h3>
                <p className="text-sky-600 font-black tracking-widest text-[10px] uppercase mb-8">{selectedMed.code} • {selectedMed.dosage}</p>
                <div className="w-full grid grid-cols-2 gap-4 mb-10">
                   <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl">
                      <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Total Stock</p>
                      <p className="text-2xl font-black dark:text-white italic">{selectedMed.lots.reduce((acc, l) => acc + l.quantity, 0)}</p>
                   </div>
                   <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl">
                      <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Seuil Alerte</p>
                      <p className="text-2xl font-black dark:text-white italic">{selectedMed.threshold}</p>
                   </div>
                </div>
                <button onClick={() => setSelectedMed(null)} className="w-full py-5 bg-slate-900 dark:bg-sky-600 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl active:scale-95 transition-all">Fermer</button>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Inventory;
