import React, { useState, useMemo } from 'react';
// import { Html5QrcodeScanner } from 'html5-qrcode'; // Tu pourras déplacer ça dans un composant ScannerModal plus tard
import { InventoryHeader } from './InventoryHeader';
import { ProductTable } from './ProductTable';
import { AddProductModal } from './AddProductModal';
import { LotTable } from './LotTable';
import { ProductDetailModal } from './ProductDetailModal';
import { useInventoryLogic } from '@renderer/app/store/hooks/useInventoryLogic';
import { createProduct } from '@renderer/app/store/slice/inventorySlice';
import { CATEGORIES, UIMedication } from '../features/inventory/types';

const Inventory: React.FC = () => {
  // Logic Hook
  const { enrichedMeds, isLoading, dispatch } = useInventoryLogic();

  // State UI Local
  const [activeTab, setActiveTab] = useState<'stock' | 'lots' | 'ai'>('stock');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Tous');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [selectedMed, setSelectedMed] = useState<UIMedication | null>(null);

  // Filtres
  const filteredMedications = useMemo(() => {
    const term = searchTerm.toLowerCase().trim();
    return enrichedMeds.filter(med => {
      const matchesSearch = !term || med.name.toLowerCase().includes(term) || med.code.toLowerCase().includes(term);
      const matchesCategory = selectedCategory === 'Tous' || med.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [searchTerm, enrichedMeds, selectedCategory]);

  // Handler Création
  const handleCreate = async (data: any) => {
    const productData = {
      name: data.name,
      code: data.code,
      category: data.category,
      dosage: data.dosage,
      sellPrice: Number(data.price),
      buyingPrice: Number(data.buyingPrice),
      minStock: Number(data.threshold),
    };
    await dispatch(createProduct(productData));
    setShowAddModal(false);
  };

  if (isLoading && enrichedMeds.length === 0) return <div className="p-10 text-center">Chargement...</div>;

  return (
    <div className="space-y-6 md:space-y-8 animate-in fade-in duration-500 pb-10">

      {/* 1. Header */}
      <InventoryHeader
        onScan={() => setShowScanner(true)}
        onNew={() => setShowAddModal(true)}
      />

      {/* 2. Controls (Search + Tabs + Categories) */}
      {/* J'ai inline le code ici pour que ça marche direct, mais tu peux le sortir en composant */}
      <div className="flex flex-col gap-6 bg-white dark:bg-slate-900 p-6 md:p-8 rounded-3xl md:rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-sm transition-colors">
        <div className="flex flex-col lg:flex-row gap-6">
          <div className="relative flex-1 group">
            <input
              type="text"
              placeholder="Chercher par nom, code..."
              className="w-full pl-12 pr-10 py-4 md:py-5 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl md:rounded-[1.8rem] focus:ring-4 focus:ring-sky-500/10 outline-none transition-all font-black dark:text-white text-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <svg className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-sky-500" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></svg>
          </div>
          <div className="flex bg-slate-50 dark:bg-slate-800 p-1.5 rounded-2xl md:rounded-[1.8rem] w-full lg:w-fit overflow-x-auto no-scrollbar">
            {[{ id: 'stock', label: 'Médocs', icon: '📦' }, { id: 'lots', label: 'Lots', icon: '🏷️' }, { id: 'ai', label: 'IA', icon: '✨' }].map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id as any)} className={`flex-1 lg:flex-none px-4 md:px-8 py-3 md:py-3.5 rounded-xl md:rounded-[1.5rem] text-[9px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${activeTab === tab.id ? 'bg-slate-900 dark:bg-sky-600 text-white shadow-xl' : 'text-slate-400 hover:bg-white dark:hover:bg-slate-700'}`}>
                <span>{tab.icon}</span><span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
          {CATEGORIES.map(cat => (
            <button key={cat} onClick={() => setSelectedCategory(cat)} className={`flex-none px-4 py-2 rounded-xl text-[8px] font-black uppercase tracking-widest transition-all border ${selectedCategory === cat ? 'bg-sky-50 dark:bg-sky-900/20 text-sky-600 border-sky-200' : 'bg-white dark:bg-slate-900 text-slate-400 border-slate-100'}`}>{cat}</button>
          ))}
        </div>
      </div>

      {/* 3. Content Area */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl md:rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden transition-colors animate-in slide-in-from-bottom-4 duration-500">
        <div className="overflow-x-auto custom-scrollbar">
          {activeTab === 'stock' && <ProductTable medications={filteredMedications} onSelect={setSelectedMed} />}
          {activeTab === 'lots' && <LotTable medications={filteredMedications} />}
          {activeTab === 'ai' && <div className="p-10 text-center">Module IA en cours de chargement...</div>}
        </div>
      </div>

      {/* 4. Modals */}
      {showAddModal && <AddProductModal onClose={() => setShowAddModal(false)} onSubmit={handleCreate} />}
      {selectedMed && <ProductDetailModal medication={selectedMed} onClose={() => setSelectedMed(null)} />}

      {/* 5. Scanner (Peut aussi être extrait) */}
      {showScanner && (
        <div className="fixed inset-0 z-[100] bg-slate-900/90 flex flex-col items-center justify-center p-4">
          <div id="reader" className="w-full max-w-sm bg-white rounded-xl overflow-hidden"></div>
          <button onClick={() => setShowScanner(false)} className="mt-8 px-8 py-3 bg-white text-slate-900 font-bold rounded-xl">Fermer</button>
        </div>
      )}
    </div>
  );
};

export default Inventory;