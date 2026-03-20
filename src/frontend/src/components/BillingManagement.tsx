import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { RootState, AppDispatch } from '@renderer/app/store/store'
import { CashMovementType, CashCategory, CreateMovementInput, CashJournalEntry } from '@shared/types'
import { fetchCashHistory, createCashMovement } from '@renderer/app/store/slice/financeSlice'
import { fetchSalesHistory } from '@renderer/app/store/slice/salesSlice'
import { useCurrency } from '@renderer/hooks/useCurrently'




interface UISaleItem {
  quantity: number
  unitPrice: number
  total?: number
  product?: { name: string }
}

interface UISale {
  id: string
  reference: string
  date?: string | Date
  createdAt?: string | Date
  totalAmount: number
  paymentMethod?: string
  status?: string
  seller?: { name: string }
  items?: UISaleItem[]
}

// Extension sécurisée du RootState
type ExtendedRootState = RootState & {
  finance?: { movements: CashJournalEntry[], isLoading: boolean, error: string | null }
  session: RootState['session'] & { dailyRate?: number }
}

const BillingManagement: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>()

  // -- REDUX STATES --
  const { user } = useSelector((state: ExtendedRootState) => state.auth)
  const financeState = useSelector((state: ExtendedRootState) => state.finance)
  const salesState = useSelector((state: ExtendedRootState) => state.sales)
  const dailyRate = useSelector((state: ExtendedRootState) => state.session?.dailyRate || 2500)

  const movements = financeState?.movements || []

  // 2. CASTING SÉCURISÉ EN UISale[] POUR ÉVITER LES ERREURS DE PROPRIÉTÉS MANQUANTES
  const salesHistory = (salesState?.history || []) as unknown as UISale[]

  // -- HOOKS & DEVISES --
  const { currency, formatPrice } = useCurrency()

  // -- UI STATES --
  const [activeTab, setActiveTab] = useState<'journal' | 'factures' | 'avoirs'>('journal')
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'COMPLETED' | 'PENDING' | 'CANCELLED'>('ALL')
  const [showAddMovement, setShowAddMovement] = useState(false)

  // 3. UTILISATION DE UISale AU LIEU DE "any"
  const [selectedDocForPrint, setSelectedDocForPrint] = useState<UISale | null>(null)

  const [newMovement, setNewMovement] = useState({
    type: CashMovementType.OUT,
    category: CashCategory.OTHER,
    amount: 0,
    description: ''
  })

  // CHARGEMENT DES DONNÉES DEPUIS LE BACKEND
  const loadData = useCallback(() => {
    const fromDate = new Date()
    fromDate.setDate(fromDate.getDate() - 30)
    fromDate.setHours(0, 0, 0, 0)
    const toDate = new Date()
    toDate.setHours(23, 59, 59, 999)

    dispatch(fetchCashHistory({ from: fromDate, to: toDate }))
    dispatch(fetchSalesHistory({ from: fromDate, to: toDate }))
  }, [dispatch])

  useEffect(() => {
    loadData()
  }, [loadData])

  // FILTRES ET CALCULS
  const filteredSales = useMemo(() => {
    return salesHistory.filter((sale) => {
      const saleStatus = sale.status || 'COMPLETED'; // Fallback si le backend ne l'a pas envoyé
      const statusMatch = statusFilter === 'ALL' || saleStatus === statusFilter;
      return statusMatch;
    })
  }, [salesHistory, statusFilter])

  const totals = useMemo(() => {
    return movements.reduce(
      (acc, m) => {
        const amount = Number(m.amount) || 0
        if (m.type === CashMovementType.IN) acc.in += amount
        else acc.out += amount
        acc.balance = acc.in - acc.out
        return acc
      },
      { in: 0, out: 0, balance: 0 }
    )
  }, [movements])

  const totalIn = formatPrice(totals.in)
  const totalOut = formatPrice(totals.out)
  const totalBalance = formatPrice(totals.balance)

  // SOUMISSION NOUVELLE OPÉRATION
  const handleAddMovement = async (e: React.FormEvent) => {
    e.preventDefault()
    if (newMovement.amount <= 0 || !user?.id) return

    try {
      let amountToSend = newMovement.amount;
      if (currency === 'CDF' && dailyRate > 0) {
        amountToSend = newMovement.amount / dailyRate;
      }

      const payload: CreateMovementInput = {
        type: newMovement.type as CashMovementType,
        category: newMovement.category as CashCategory,
        amount: amountToSend,
        description: newMovement.description,
        performedById: user.id
      }

      await dispatch(createCashMovement(payload)).unwrap()
      setShowAddMovement(false)
      setNewMovement({ type: CashMovementType.OUT, category: CashCategory.OTHER, amount: 0, description: '' })
    } catch (error) {
      console.error('Erreur création mouvement:', error)
    }
  }

  const handlePrint = () => {
    window.print()
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-700">

      {/* HEADER DE LA PAGE */}
      <div className="flex flex-col md:flex-row gap-6 justify-between items-end no-print">
        <div>
          <h2 className="text-4xl font-black italic text-slate-900 dark:text-white tracking-tighter uppercase leading-none">
            Gestion Financière
          </h2>
          <p className="text-slate-400 font-bold text-[10px] uppercase tracking-[0.3em] mt-3">
            Ledger MariaSaas • Flux de Trésorerie & Facturation
          </p>
        </div>

        <div className="flex bg-white dark:bg-slate-900 p-1.5 rounded-[1.8rem] border border-slate-200 dark:border-slate-800 shadow-sm shadow-slate-200/50 transition-colors">
          <button
            onClick={() => setActiveTab('journal')}
            className={`px-8 py-3 rounded-[1.4rem] text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'journal' ? 'bg-slate-900 dark:bg-sky-600 text-white shadow-xl' : 'text-slate-400 hover:text-slate-900 dark:hover:text-white'}`}
          >
            Mouvements (Caisse)
          </button>
          <button
            onClick={() => setActiveTab('factures')}
            className={`px-8 py-3 rounded-[1.4rem] text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'factures' ? 'bg-slate-900 dark:bg-sky-600 text-white shadow-xl' : 'text-slate-400 hover:text-slate-900 dark:hover:text-white'}`}
          >
            Factures & Ventes
          </button>
        </div>
      </div>

      {/* ================================================================= */}
      {/* ONGLET 1 : JOURNAL DE CAISSE (Mouvements manuels et ventes)         */}
      {/* ================================================================= */}
      {activeTab === 'journal' && (
        <div className="space-y-10 animate-in slide-in-from-bottom-4 duration-500 no-print">

          {/* Cartes de Totaux */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-emerald-600 p-10 rounded-[2.5rem] shadow-2xl shadow-emerald-500/20 relative overflow-hidden group">
              <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-700"></div>
              <p className="text-[10px] font-black text-emerald-100 uppercase tracking-widest relative z-10">Recettes Totales</p>
              <h3 className="text-4xl font-black mt-2 tracking-tighter text-white relative z-10 flex items-baseline gap-2">
                {totalIn.value} <span className="text-xl opacity-80">{totalIn.symbol}</span>
              </h3>
            </div>

            <div className="bg-red-600 p-10 rounded-[2.5rem] shadow-2xl shadow-red-500/20 relative overflow-hidden group">
              <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-700"></div>
              <p className="text-[10px] font-black text-red-100 uppercase tracking-widest relative z-10">Dépenses Sortantes</p>
              <h3 className="text-4xl font-black mt-2 tracking-tighter text-white relative z-10 flex items-baseline gap-2">
                {totalOut.value} <span className="text-xl opacity-80">{totalOut.symbol}</span>
              </h3>
            </div>

            <div className="bg-slate-900 dark:bg-slate-800 p-10 rounded-[2.5rem] shadow-2xl relative overflow-hidden group border border-slate-800">
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest relative z-10">Solde Réel Caisse</p>
              <h3 className={`text-4xl font-black mt-2 tracking-tighter relative z-10 flex items-baseline gap-2 ${totals.balance >= 0 ? 'text-sky-400' : 'text-red-400'}`}>
                {totalBalance.value} <span className="text-xl opacity-80">{totalBalance.symbol}</span>
              </h3>
            </div>
          </div>

          {/* Tableau des Mouvements */}
          <div className="flex flex-col gap-6">
            <div className="flex justify-between items-center px-4">
              <h3 className="text-xl font-black italic uppercase text-slate-900 dark:text-white tracking-tighter">Flux de Trésorerie</h3>
              <button
                onClick={() => setShowAddMovement(true)}
                className="px-8 py-4 bg-slate-900 dark:bg-sky-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-2xl shadow-sky-600/20 active:scale-95 transition-all"
              >
                Nouvelle Opération
              </button>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-[3rem] border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden transition-colors">
              <table className="w-full text-left">
                <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
                  <tr>
                    <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Date / Réf</th>
                    <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Catégorie</th>
                    <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Description</th>
                    <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Montant</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {movements.map((m) => {
                    const mFormat = formatPrice(Number(m.amount) || 0);
                    return (
                      <tr key={m.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800 transition-colors group">
                        <td className="px-10 py-6">
                          <div className="flex flex-col">
                            <span className="text-xs font-black text-slate-800 dark:text-white uppercase">{m.reference || 'MANUEL'}</span>
                            <span className="text-[10px] text-slate-400 font-bold">
                              {new Date(m.timestamp).toLocaleDateString()} • {new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        </td>
                        <td className="px-10 py-6">
                          <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border ${m.type === CashMovementType.IN ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-red-50 text-red-600 border-red-100'}`}>
                            {m.category.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="px-10 py-6">
                          <p className="text-sm font-black text-slate-600 dark:text-slate-400 italic">&quot;{m.description}&quot;</p>
                        </td>
                        <td className={`px-10 py-6 text-right font-black text-xl tracking-tighter ${m.type === CashMovementType.IN ? 'text-emerald-500' : 'text-red-500'}`}>
                          {m.type === CashMovementType.IN ? '+' : '-'}{mFormat.value} <span className="text-xs">{mFormat.symbol}</span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ================================================================= */}
      {/* ONGLET 2 : FACTURES (Liste des Ventes)                              */}
      {/* ================================================================= */}
      {activeTab === 'factures' && (
        <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500 no-print">

          <div className="flex items-center gap-3 overflow-x-auto pb-4">
            <span className="text-[10px] font-black text-slate-400 dark:text-slate-600 uppercase tracking-widest mr-4">Filtre Statut :</span>
            {(['ALL', 'COMPLETED', 'PENDING', 'CANCELLED'] as const).map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`px-6 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest border transition-all ${statusFilter === s ? 'bg-sky-600 text-white border-sky-600 shadow-xl shadow-sky-600/20' : 'bg-white dark:bg-slate-900 text-slate-500 border-slate-200 dark:border-slate-800'
                  }`}
              >
                {s === 'COMPLETED' ? 'Payé' : s === 'PENDING' ? 'En attente' : s === 'CANCELLED' ? 'Annulé' : 'Tous'}
              </button>
            ))}
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-[3rem] border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            <table className="w-full text-left">
              <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
                <tr>
                  <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Référence</th>
                  <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Date</th>
                  <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Statut</th>
                  <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Total Net</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredSales.length === 0 ? (
                  <tr><td colSpan={4} className="p-10 text-center text-slate-400 italic font-bold">Aucune facture trouvée pour ce statut.</td></tr>
                ) : filteredSales.map((sale) => {
                  const saleTotal = formatPrice(Number(sale.totalAmount) || 0);
                  const saleStatus = sale.status || 'COMPLETED'; // Sécurité supplémentaire
                  const saleDate = sale.date || sale.createdAt || new Date();

                  return (
                    <tr key={sale.id} className="hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors group">
                      <td className="px-10 py-7 font-black text-slate-900 dark:text-white uppercase italic tracking-tighter">
                        {sale.reference}
                      </td>
                      <td className="px-10 py-7">
                        <span className="text-sm font-bold text-slate-500">
                          {new Date(saleDate).toLocaleDateString()}
                        </span>
                      </td>
                      <td className="px-10 py-7 text-center">
                        <span className={`px-5 py-2 rounded-full text-[9px] font-black uppercase tracking-widest ${saleStatus === 'COMPLETED' ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600' :
                          saleStatus === 'CANCELLED' ? 'bg-red-50 dark:bg-red-900/20 text-red-600' :
                            'bg-amber-50 dark:bg-amber-900/20 text-amber-600'
                          }`}
                        >
                          {saleStatus === 'COMPLETED' ? 'PAYÉ' : saleStatus}
                        </span>
                      </td>
                      <td className="px-10 py-7 font-black text-slate-900 dark:text-sky-400 text-right">
                        <div className="flex items-center justify-end gap-6">
                          <span className="text-xl tracking-tighter">
                            {saleTotal.value} <span className="text-xs">{saleTotal.symbol}</span>
                          </span>
                          {/* Action: Imprimer */}
                          <button
                            onClick={() => setSelectedDocForPrint(sale)}
                            className="p-3 bg-slate-100 dark:bg-slate-800 rounded-xl text-slate-500 hover:text-sky-600 dark:hover:text-sky-400 transition-all active:scale-90"
                            title="Imprimer le ticket"
                          >
                            <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M6 9V2h12v7M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2m-2 4H8v-6h8v6z" /></svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ================================================================= */}
      {/* MODAL : PREVIEW IMPRESSION (DYNAMIQUE ET SANS ANY)                  */}
      {/* ================================================================= */}
      {selectedDocForPrint && (
        <div className="fixed inset-0 z-[150] bg-slate-900/90 backdrop-blur-xl flex items-center justify-center p-4 md:p-8 overflow-auto">
          <div className="bg-white text-slate-900 w-full max-w-3xl rounded-[2.5rem] shadow-2xl animate-in zoom-in-95 duration-200 flex flex-col min-h-[80vh]">
            {/* Header No-Print */}
            <div className="p-8 border-b border-slate-100 flex justify-between items-center no-print bg-slate-50 rounded-t-[2.5rem]">
              <h3 className="text-xl font-black italic uppercase tracking-tighter text-slate-800">
                Prévisualisation Facture / Ticket
              </h3>
              <div className="flex gap-4">
                <button
                  onClick={handlePrint}
                  className="px-8 py-3 bg-sky-600 text-white rounded-xl font-black uppercase text-[10px] tracking-widest shadow-lg shadow-sky-600/20 hover:bg-sky-500 active:scale-95 transition-all flex items-center gap-2"
                >
                  <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24"><path d="M6 9V2h12v7M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2m-2 4H8v-6h8v6z" /></svg>
                  Imprimer
                </button>
                <button
                  onClick={() => setSelectedDocForPrint(null)}
                  className="p-3 bg-slate-200 rounded-xl text-slate-500 hover:text-slate-900 transition-all active:scale-90"
                >
                  <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24"><path d="M18 6 6 18M6 6l12 12" /></svg>
                </button>
              </div>
            </div>

            {/* Printable Content */}
            <div className="p-12 print:p-0 flex-1 flex flex-col bg-white" id="invoice-printable">
              <div className="flex justify-between items-start mb-16">
                <div className="flex flex-col gap-1">
                  <div className="w-12 h-12 bg-slate-900 rounded-xl flex items-center justify-center text-white font-black text-xl mb-4">M</div>
                  <h2 className="text-3xl font-black italic uppercase tracking-tighter">MariaSaas</h2>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Pharmacie Maria • GxP Certified</p>
                  <p className="text-[9px] font-medium text-slate-500 mt-2">123 Boulevard de la Santé, Kinshasa</p>
                  <p className="text-[9px] font-medium text-slate-500">+243 812 345 678</p>
                </div>
                <div className="text-right">
                  <h1 className="text-5xl font-black text-slate-200 uppercase tracking-tighter leading-none mb-4">Facture</h1>
                  <p className="text-sm font-black text-slate-900">Réf: {selectedDocForPrint.reference}</p>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">
                    Date: {new Date(selectedDocForPrint.date || selectedDocForPrint.createdAt || new Date()).toLocaleDateString()}
                  </p>
                </div>
              </div>

              <div className="mb-12 grid grid-cols-2 gap-12 border-y border-slate-100 py-8">
                <div>
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-3">Vendeur :</p>
                  <h4 className="text-xl font-black text-slate-900">
                    {selectedDocForPrint.seller?.name || 'Vendeur Comptoir'}
                  </h4>
                </div>
                <div className="text-right">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-3">Statut :</p>
                  <h4 className="text-lg font-black text-slate-900">
                    {selectedDocForPrint.paymentMethod || 'CASH'}
                  </h4>
                  <span className="px-4 py-1 rounded-full text-[8px] font-black uppercase tracking-widest inline-block mt-2 bg-emerald-100 text-emerald-700">
                    {selectedDocForPrint.status || 'COMPLETED'}
                  </span>
                </div>
              </div>

              <table className="w-full text-left mb-16">
                <thead>
                  <tr className="border-b-2 border-slate-900">
                    <th className="py-4 text-[10px] font-black uppercase tracking-widest">Désignation</th>
                    <th className="py-4 text-[10px] font-black uppercase tracking-widest text-center">Qté</th>
                    <th className="py-4 text-[10px] font-black uppercase tracking-widest text-right">Prix Unit.</th>
                    <th className="py-4 text-[10px] font-black uppercase tracking-widest text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {selectedDocForPrint.items?.map((item, idx) => {
                    const unitPrice = formatPrice(item.unitPrice || 0);
                    const lineTotal = formatPrice(item.total || ((item.unitPrice || 0) * (item.quantity || 1)));

                    return (
                      <tr key={idx}>
                        <td className="py-4 font-bold text-sm">
                          <div className="flex flex-col">
                            <span>{item.product?.name || 'Article Inconnu'}</span>
                          </div>
                        </td>
                        <td className="py-4 text-center font-bold text-sm">x{item.quantity}</td>
                        <td className="py-4 text-right font-bold text-sm">{unitPrice.value} {unitPrice.symbol}</td>
                        <td className="py-4 text-right font-black text-sm">{lineTotal.value} {lineTotal.symbol}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>

              <div className="mt-auto flex flex-col items-end gap-3 pt-8 border-t-4 border-slate-900">
                <div className="flex justify-between w-64 text-slate-900 mt-2">
                  <span className="text-sm font-black uppercase tracking-widest">Total Net</span>
                  <span className="text-3xl font-black italic tracking-tighter">
                    {formatPrice(selectedDocForPrint.totalAmount).value} {formatPrice(selectedDocForPrint.totalAmount).symbol}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================================================================= */}
      {/* MODAL : NOUVELLE OPÉRATION DE CAISSE                              */}
      {/* ================================================================= */}
      {showAddMovement && (
        <div className="fixed inset-0 z-[110] bg-slate-900/80 backdrop-blur-xl flex items-center justify-center p-6">
          <div className="bg-white dark:bg-slate-900 w-full max-w-xl rounded-[3.5rem] p-12 shadow-2xl animate-in zoom-in-95 duration-200 border border-slate-200 dark:border-slate-800">
            <div className="flex justify-between items-start mb-10">
              <div>
                <h2 className="text-3xl font-black text-slate-900 dark:text-white italic uppercase tracking-tighter leading-none">
                  Nouvelle Opération
                </h2>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-2">
                  Enregistrement Trésorerie
                </p>
              </div>
              <button
                onClick={() => setShowAddMovement(false)}
                className="p-3 bg-slate-100 dark:bg-slate-800 rounded-2xl text-slate-400 hover:text-slate-900 dark:hover:text-white transition-all"
              >
                <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24"><path d="M18 6 6 18M6 6l12 12" /></svg>
              </button>
            </div>

            <form onSubmit={handleAddMovement} className="space-y-8">
              <div className="grid grid-cols-2 gap-6">
                <button
                  type="button"
                  onClick={() => setNewMovement({ ...newMovement, type: CashMovementType.IN })}
                  className={`py-5 rounded-[1.8rem] font-black text-xs uppercase tracking-widest border-2 transition-all ${newMovement.type === CashMovementType.IN ? 'bg-emerald-600 border-emerald-600 text-white shadow-xl shadow-emerald-500/30' : 'bg-slate-50 dark:bg-slate-800 border-slate-100 dark:border-slate-700 text-slate-400'}`}
                >
                  Encaissement (+)
                </button>
                <button
                  type="button"
                  onClick={() => setNewMovement({ ...newMovement, type: CashMovementType.OUT })}
                  className={`py-5 rounded-[1.8rem] font-black text-xs uppercase tracking-widest border-2 transition-all ${newMovement.type === CashMovementType.OUT ? 'bg-red-600 border-red-600 text-white shadow-xl shadow-red-500/30' : 'bg-slate-50 dark:bg-slate-800 border-slate-100 dark:border-slate-700 text-slate-400'}`}
                >
                  Décaissement (-)
                </button>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-4">
                  Catégorie de Flux
                </label>
                <select
                  className="w-full px-8 py-5 bg-slate-50 dark:bg-slate-800 border-none rounded-[1.8rem] outline-none focus:ring-4 focus:ring-sky-500/10 font-bold dark:text-white appearance-none"
                  value={newMovement.category}
                  onChange={(e) =>
                    setNewMovement({ ...newMovement, category: e.target.value as CashCategory })
                  }
                >
                  {Object.values(CashCategory).map((cat) => (
                    <option key={cat} value={cat}>
                      {cat.replace('_', ' ')}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-4">
                  Montant de l&apos;opération en {currency}
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  className="w-full px-8 py-5 bg-slate-50 dark:bg-slate-800 border-none rounded-[1.8rem] outline-none focus:ring-4 focus:ring-sky-500/10 font-black text-slate-900 dark:text-white text-3xl tracking-tighter"
                  placeholder="0"
                  value={newMovement.amount || ''}
                  onChange={(e) =>
                    setNewMovement({ ...newMovement, amount: Number(e.target.value) })
                  }
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-4">
                  Justification du Mouvement
                </label>
                <textarea
                  required
                  className="w-full px-8 py-5 bg-slate-50 dark:bg-slate-800 border-none rounded-[1.8rem] outline-none focus:ring-4 focus:ring-sky-500/10 font-medium dark:text-white h-32 resize-none"
                  placeholder="Ex: Facture fournisseur SNEL, Achat consommables..."
                  value={newMovement.description}
                  onChange={(e) => setNewMovement({ ...newMovement, description: e.target.value })}
                />
              </div>

              <button
                type="submit"
                className="w-full py-6 bg-slate-900 dark:bg-sky-600 text-white rounded-[1.8rem] font-black uppercase text-sm tracking-[0.3em] shadow-2xl active:scale-95 transition-all mt-4"
              >
                Enregistrer la transaction
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default BillingManagement