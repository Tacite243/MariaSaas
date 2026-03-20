import React, { useState, useMemo, useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { RootState, AppDispatch } from '@renderer/app/store/store'
import { fetchProducts } from '@renderer/app/store/slice/inventorySlice'
import { fetchSalesHistory } from '@renderer/app/store/slice/salesSlice'
import { fetchCashHistory } from '@renderer/app/store/slice/financeSlice'
import { useCurrency } from '@renderer/hooks/useCurrently'
import { CurrencySwitch } from './CurrencySwitch'

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie
} from 'recharts'

// Interfaces locales pour le typage du composant
interface StatItem {
  label: string
  value: string | number
}

interface ChartItem {
  name: string
  value: number
  color: string
}

interface ReportRow {
  date: Date
  category: string
  amount: number
  description: string
}

const Reporting: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>()

  // --- REDUX STATES (Sécurisés avec les bons types globaux) ---
  const products = useSelector((state: RootState) => state.inventory.products)

  // Utilisation de .history car c'est le format de votre slice Sales
  const sales = useSelector((state: RootState) => state.sales.history)

  // --- HOOKS & DEVISES ---
  const { formatPrice } = useCurrency()
  const isDark = document.documentElement.classList.contains('dark')

  // --- UI STATES ---
  const [reportType, setReportType] = useState<'sales' | 'inventory' | 'credits'>('sales')
  const [dateRange, setDateRange] = useState({
    start: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  })

  // CHARGEMENT DES DONNÉES
  useEffect(() => {
    dispatch(fetchProducts())

    const start = new Date(dateRange.start)
    start.setHours(0, 0, 0, 0)
    const end = new Date(dateRange.end)
    end.setHours(23, 59, 59, 999)

    dispatch(fetchSalesHistory({ from: start, to: end }))
    dispatch(fetchCashHistory({ from: start, to: end }))
  }, [dateRange, dispatch])

  // MOTEUR DE CALCUL DES RAPPORTS
  const reportData = useMemo(() => {
    if (reportType === 'sales') {
      let totalRevenue = 0
      let estimatedCost = 0
      let transactionCount = 0

      const rawRows: ReportRow[] = []

      sales.forEach((sale) => {
        // En base, le statut est souvent implicite s'il n'est pas fourni.
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const status = (sale as any).status || 'COMPLETED'

        if (status === 'COMPLETED') {
          totalRevenue += sale.totalAmount
          transactionCount++

          // Calcul sécurisé du coût de la vente
          sale.items?.forEach((item) => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const qty = (item as any).quantity || 1;
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const productId = (item as any).product?.id || (item as any).productId;

            const product = products.find((p) => p.id === productId)
            const cost = product ? product.buyingPrice : 0
            estimatedCost += cost * qty
          })

          // Utilisation sécurisée de la date (fallback sur la date du jour si introuvable)
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const saleDate = new Date((sale as any).date || (sale as any).createdAt || new Date())

          rawRows.push({
            date: saleDate,
            category: 'Vente',
            amount: sale.totalAmount,
            description: `Réf: ${sale.reference} (${sale.items?.length || 0} articles)`
          })
        }
      })

      const profit = totalRevenue - estimatedCost
      const profitMargin = totalRevenue > 0 ? ((profit / totalRevenue) * 100).toFixed(1) : '0.0'

      return {
        mainValue: totalRevenue,
        stats: [
          { label: 'Volume (Transactions)', value: transactionCount },
          { label: 'Marge Commerciale', value: `${profitMargin}%` },
          { label: 'Profit Brut Estimé', value: `${formatPrice(profit).value} ${formatPrice(profit).symbol}` }
        ] as StatItem[],
        chart: [
          { name: 'Chiffre Affaires', value: totalRevenue, color: '#0ea5e9' },
          { name: 'Coût Estimé', value: estimatedCost, color: '#64748b' },
          { name: 'Marge Brute', value: profit, color: '#10b981' }
        ] as ChartItem[],
        raw: rawRows
      }

    } else if (reportType === 'inventory') {
      let totalSellingValue = 0
      let totalBuyingValue = 0
      const rawRows: ReportRow[] = []

      products.forEach((p) => {
        if (p.currentStock > 0) {
          totalSellingValue += p.currentStock * p.sellPrice
          totalBuyingValue += p.currentStock * p.buyingPrice

          rawRows.push({
            date: new Date(),
            category: p.category,
            amount: p.currentStock * p.sellPrice,
            description: `${p.name} (Stock: ${p.currentStock})`
          })
        }
      })

      const potentialProfit = totalSellingValue - totalBuyingValue

      return {
        mainValue: totalSellingValue,
        stats: [
          { label: 'Articles en stock', value: products.filter((p) => p.currentStock > 0).length },
          { label: 'Coût d\'Achat Immobilisé', value: `${formatPrice(totalBuyingValue).value} ${formatPrice(totalBuyingValue).symbol}` },
          { label: 'Profit Potentiel Latent', value: `${formatPrice(potentialProfit).value} ${formatPrice(potentialProfit).symbol}` }
        ] as StatItem[],
        chart: [
          { name: 'Valeur Vente', value: totalSellingValue, color: '#0ea5e9' },
          { name: 'Valeur Achat', value: totalBuyingValue, color: '#f59e0b' },
          { name: 'Marge Latente', value: potentialProfit, color: '#10b981' }
        ] as ChartItem[],
        raw: rawRows
      }

    } else {
      let outstanding = 0
      let recovered = 0
      let pendingCount = 0
      const rawRows: ReportRow[] = []

      sales.forEach((sale) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const status = (sale as any).status || 'COMPLETED'

        if (status === 'PENDING') {
          outstanding += sale.totalAmount
          pendingCount++
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const saleDate = new Date((sale as any).date || (sale as any).createdAt || new Date())

          rawRows.push({
            date: saleDate,
            category: 'Dette / Crédit',
            amount: sale.totalAmount,
            description: `Réf: ${sale.reference} (En attente)`
          })
        } else if (status === 'COMPLETED') {
          recovered += sale.totalAmount
        }
      })

      const recoveryRate = recovered + outstanding > 0 ? ((recovered / (recovered + outstanding)) * 100).toFixed(1) : '0.0'

      return {
        mainValue: outstanding,
        stats: [
          { label: 'Dossiers en attente', value: pendingCount },
          { label: 'Total Recouvré (Période)', value: `${formatPrice(recovered).value} ${formatPrice(recovered).symbol}` },
          { label: 'Taux de Recouvrement', value: `${recoveryRate}%` }
        ] as StatItem[],
        chart: [
          { name: 'Dû client (Impayés)', value: outstanding, color: '#ef4444' },
          { name: 'Total Recouvré', value: recovered, color: '#10b981' }
        ] as ChartItem[],
        raw: rawRows
      }
    }
  }, [reportType, sales, products, formatPrice])

  // EXPORT CSV
  const handleExport = (): void => {
    const headers = ['Date', 'Catégorie', 'Montant', 'Devise', 'Description']
    const rows = reportData.raw.map((m) => {
      const formatted = formatPrice(m.amount)
      return [
        m.date.toLocaleDateString(),
        m.category,
        String(formatted.value).replace(/,/g, ''), // Sécurité type string
        formatted.symbol,
        String(m.description).replace(/,/g, ' ') // Protection CSV
      ]
    })
    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `rapport_mariasass_${reportType}_${new Date().toISOString().split('T')[0]}.csv`
    link.click()
  }

  // FORMATTEUR TOOLTIP SÉCURISÉ POUR RECHARTS
  const customTooltipFormatter = (value: unknown) => {
    const numValue = Number(value) || 0;
    const formatted = formatPrice(numValue);
    // On renvoie un Tuple strict attendu par Recharts
    return [`${formatted.value} ${formatted.symbol}`, 'Montant'] as [string, string];
  }

  return (
    <div className="space-y-10 animate-in fade-in duration-500 pb-10">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <h2 className="text-4xl font-black italic text-slate-900 dark:text-white tracking-tighter uppercase leading-none">
            Analyses & Rapports
          </h2>
          <p className="text-slate-400 font-bold text-[10px] uppercase tracking-[0.3em] mt-3">
            Intelligence Décisionnelle • MariaSaas Bi Engine
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <CurrencySwitch />

          <div className="flex bg-white dark:bg-slate-900 p-1.5 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-sm transition-colors">
            {(['sales', 'inventory', 'credits'] as const).map((type) => (
              <button
                key={type}
                onClick={() => setReportType(type)}
                className={`px-6 py-3 rounded-[1.6rem] text-[10px] font-black uppercase tracking-widest transition-all ${reportType === type ? 'bg-slate-900 dark:bg-sky-600 text-white shadow-xl' : 'text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'}`}
              >
                {type === 'sales' ? 'Ventes' : type === 'inventory' ? 'Stock' : 'Créances'}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Paramètres & KPI Principal */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-sm transition-colors">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-8 italic">
              Paramètres du Rapport
            </h3>
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 ml-2">Période du :</label>
                <input
                  type="date"
                  value={dateRange.start}
                  onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                  className="w-full p-4 bg-slate-50 dark:bg-slate-800 dark:text-white border border-slate-200 dark:border-slate-700 rounded-2xl font-bold outline-none focus:border-sky-500"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 ml-2">Au :</label>
                <input
                  type="date"
                  value={dateRange.end}
                  onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                  className="w-full p-4 bg-slate-50 dark:bg-slate-800 dark:text-white border border-slate-200 dark:border-slate-700 rounded-2xl font-bold outline-none focus:border-sky-500"
                />
              </div>
              <button
                onClick={handleExport}
                className="w-full py-5 bg-slate-900 dark:bg-sky-600 hover:bg-slate-800 dark:hover:bg-sky-500 text-white rounded-[1.5rem] font-black uppercase text-[10px] tracking-[0.2em] shadow-xl transition-all"
              >
                Générer Export CSV
              </button>
            </div>
          </div>

          {/* KPI Principal */}
          <div className={`p-10 rounded-[2.5rem] text-white shadow-2xl relative overflow-hidden ${reportType === 'credits' ? 'bg-red-600' : 'bg-emerald-600'}`}>
            <div className="absolute top-0 right-0 -mt-10 -mr-10 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
            <p className="text-[10px] font-black opacity-80 uppercase tracking-widest relative z-10">
              {reportType === 'sales' ? 'Revenu Total Période' : reportType === 'inventory' ? 'Valeur Estimée Stock' : 'Total Impayés'}
            </p>
            <h4 className="text-4xl font-black tracking-tighter mt-3 italic relative z-10 flex items-baseline gap-2">
              {formatPrice(reportData.mainValue).value}
              <span className="text-xl font-bold opacity-80 not-italic">{formatPrice(reportData.mainValue).symbol}</span>
            </h4>
          </div>
        </div>

        {/* Graphiques et Stats détaillées */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-8 md:p-12 rounded-[3rem] border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col min-h-[500px]">

          {/* Section Chart */}
          <div className="flex-1 h-full w-full min-h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              {reportType === 'credits' ? (
                <PieChart>
                  <Pie
                    data={reportData.chart}
                    cx="50%"
                    cy="50%"
                    innerRadius={80}
                    outerRadius={120}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {reportData.chart.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={customTooltipFormatter}
                    contentStyle={{ borderRadius: '15px', border: 'none', fontWeight: 'bold', backgroundColor: isDark ? '#1e293b' : '#fff', color: isDark ? '#fff' : '#000' }}
                  />
                </PieChart>
              ) : (
                <BarChart
                  data={reportData.chart}
                  layout="vertical"
                  margin={{ left: 40, right: 40 }}
                >
                  <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke={isDark ? '#1e293b' : '#f1f5f9'} />
                  <XAxis type="number" hide />
                  <YAxis
                    dataKey="name"
                    type="category"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 10, fontWeight: 900, fill: '#64748b' }}
                    width={130}
                  />
                  <Tooltip
                    formatter={customTooltipFormatter}
                    cursor={{ fill: isDark ? '#334155' : '#f8fafc' }}
                    contentStyle={{ borderRadius: '15px', border: 'none', fontWeight: 'bold', backgroundColor: isDark ? '#1e293b' : '#fff', color: isDark ? '#fff' : '#000' }}
                  />
                  <Bar dataKey="value" radius={[0, 10, 10, 0]} barSize={40}>
                    {reportData.chart.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              )}
            </ResponsiveContainer>
          </div>

          {/* Stats Bottom */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-10 pt-10 border-t border-slate-100 dark:border-slate-800">
            {reportData.stats.map((stat, idx) => (
              <div key={idx} className="text-center bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-700/50">
                <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2">
                  {stat.label}
                </p>
                <p className="text-lg font-black dark:text-white italic tracking-tighter">
                  {stat.value}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Reporting
