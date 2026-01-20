
import React, { useState, useMemo } from 'react';
import { reportingService } from '../services/reportingService';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from 'recharts';

// Simulation de données de stock pour la valorisation (à remplacer par un vrai service de données si disponible)
const MOCK_INVENTORY_DATA = [
    { name: 'Paracétamol', price: 1500, buyingPrice: 1000, lots: [{ quantity: 100 }] },
    { name: 'Amoxicilline', price: 3500, buyingPrice: 2200, lots: [{ quantity: 45 }] },
    { name: 'Ibuprofène', price: 2000, buyingPrice: 1400, lots: [{ quantity: 80 }] },
    { name: 'Vitamine C', price: 5000, buyingPrice: 3500, lots: [{ quantity: 200 }] },
];

const Reporting: React.FC = () => {
    const [reportType, setReportType] = useState<'sales' | 'inventory' | 'credits'>('sales');
    const [dateRange, setDateRange] = useState({
        start: '2024-01-01',
        end: new Date().toISOString().split('T')[0]
    });

    const reportData = useMemo(() => {
        if (reportType === 'sales') {
            const sales = reportingService.generateSalesReport(dateRange.start, dateRange.end);
            return {
                mainValue: sales.totalRevenue,
                stats: [
                    { label: 'Volume', value: sales.transactionCount },
                    { label: 'Rentabilité', value: `${((sales.profit / (sales.totalRevenue || 1)) * 100).toFixed(1)}%` },
                    { label: 'Net Profit', value: sales.profit.toLocaleString() + ' FC' }
                ],
                chart: [
                    { name: 'Chiffre Affaires', value: sales.totalRevenue, color: '#0ea5e9' },
                    { name: 'Coût Estimé', value: sales.estimatedCost, color: '#64748b' },
                    { name: 'Marge Brute', value: sales.profit, color: '#10b981' },
                ],
                raw: sales.data
            };
        } else if (reportType === 'inventory') {
            const inv = reportingService.getInventoryValuation(MOCK_INVENTORY_DATA);
            return {
                mainValue: inv.totalSellingValue,
                stats: [
                    { label: 'Articles', value: inv.count },
                    { label: 'Coût Stock', value: inv.totalBuyingValue.toLocaleString() + ' FC' },
                    { label: 'Profit Potentiel', value: inv.potentialProfit.toLocaleString() + ' FC' }
                ],
                chart: [
                    { name: 'Valeur Vente', value: inv.totalSellingValue, color: '#0ea5e9' },
                    { name: 'Valeur Achat', value: inv.totalBuyingValue, color: '#f59e0b' },
                    { name: 'Marge Latente', value: inv.potentialProfit, color: '#10b981' },
                ],
                raw: []
            };
        } else {
            const credits = reportingService.generateCreditsReport(dateRange.start, dateRange.end);
            return {
                mainValue: credits.outstanding,
                stats: [
                    { label: 'Paiements', value: credits.count },
                    { label: 'Recouvré', value: credits.recovered.toLocaleString() + ' FC' },
                    { label: 'Taux Recouvr.', value: `${((credits.recovered / (credits.total || 1)) * 100).toFixed(1)}%` }
                ],
                chart: [
                    { name: 'Dû Patient', value: credits.outstanding, color: '#ef4444' },
                    { name: 'Recouvré', value: credits.recovered, color: '#10b981' },
                ],
                raw: credits.data
            };
        }
    }, [reportType, dateRange]);

    const handleExport = () => {
        const headers = ['Date', 'Catégorie', 'Montant', 'Description'];
        const rows = (reportData.raw || []).map((m: any) => [
            new Date(m.timestamp).toLocaleDateString(),
            m.category,
            m.amount,
            m.description
        ]);
        const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `rapport_${reportType}_${dateRange.start}_${dateRange.end}.csv`;
        link.click();
    };

    const isDark = document.documentElement.classList.contains('dark');

    return (
        <div className="space-y-10 animate-in fade-in duration-500 pb-10">
            <div className="flex flex-col md:flex-row justify-between items-end gap-6">
                <div>
                    <h2 className="text-4xl font-black italic text-slate-900 dark:text-white tracking-tighter uppercase leading-none">Analyses & Rapports</h2>
                    <p className="text-slate-400 font-bold text-[10px] uppercase tracking-[0.3em] mt-3">Intelligence Décisionnelle • MariaSaas Bi Engine</p>
                </div>

                <div className="flex bg-white dark:bg-slate-900 p-1.5 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-sm transition-colors">
                    <button onClick={() => setReportType('sales')} className={`px-8 py-3 rounded-[1.6rem] text-[10px] font-black uppercase tracking-widest transition-all ${reportType === 'sales' ? 'bg-slate-900 dark:bg-sky-600 text-white shadow-xl' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'}`}>Ventes</button>
                    <button onClick={() => setReportType('inventory')} className={`px-8 py-3 rounded-[1.6rem] text-[10px] font-black uppercase tracking-widest transition-all ${reportType === 'inventory' ? 'bg-slate-900 dark:bg-sky-600 text-white shadow-xl' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'}`}>Stock</button>
                    <button onClick={() => setReportType('credits')} className={`px-8 py-3 rounded-[1.6rem] text-[10px] font-black uppercase tracking-widest transition-all ${reportType === 'credits' ? 'bg-slate-900 dark:bg-sky-600 text-white shadow-xl' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'}`}>Créances</button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-sm transition-colors">
                        <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-8 italic">Paramètres de Filtrage</h3>
                        <div className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Période du</label>
                                <input
                                    type="date"
                                    value={dateRange.start}
                                    onChange={e => setDateRange({ ...dateRange, start: e.target.value })}
                                    className="w-full p-4 bg-slate-50 dark:bg-slate-800 dark:text-white border-none rounded-2xl font-bold outline-none focus:ring-4 focus:ring-sky-500/10 transition-all"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Au</label>
                                <input
                                    type="date"
                                    value={dateRange.end}
                                    onChange={e => setDateRange({ ...dateRange, end: e.target.value })}
                                    className="w-full p-4 bg-slate-50 dark:bg-slate-800 dark:text-white border-none rounded-2xl font-bold outline-none focus:ring-4 focus:ring-sky-500/10 transition-all"
                                />
                            </div>
                            <button onClick={handleExport} className="w-full mt-4 py-5 bg-slate-900 dark:bg-sky-600 text-white rounded-[1.5rem] font-black uppercase text-[10px] tracking-[0.3em] shadow-2xl active:scale-95 transition-all flex items-center justify-center gap-3">
                                <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4m4-5 5 5 5-5m-5 5V3" /></svg>
                                Générer CSV
                            </button>
                        </div>
                    </div>

                    <div className={`p-10 rounded-[2.5rem] text-white shadow-2xl transition-all relative overflow-hidden group ${reportType === 'credits' ? 'bg-red-600 shadow-red-500/20' : 'bg-sky-600 shadow-sky-500/20'
                        }`}>
                        <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-1000"></div>
                        <p className="text-[10px] font-black text-white/60 uppercase tracking-widest relative z-10">
                            {reportType === 'sales' ? 'Chiffre d\'Affaires' : reportType === 'inventory' ? 'Valeur Marchande' : 'Encours Créances'}
                        </p>
                        <h4 className="text-4xl font-black tracking-tighter mt-3 italic relative z-10">{reportData.mainValue.toLocaleString()} <span className="text-lg">FC</span></h4>
                        <p className="text-[9px] font-bold text-white/40 mt-6 uppercase tracking-[0.2em] relative z-10 italic">Indicateur Clé de Performance</p>
                    </div>
                </div>

                <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-12 rounded-[3rem] border border-slate-200 dark:border-slate-800 shadow-sm transition-colors flex flex-col">
                    <div className="flex justify-between items-start mb-12">
                        <div>
                            <h3 className="text-2xl font-black italic uppercase tracking-tighter text-slate-900 dark:text-white leading-none">Visualisation Analytique</h3>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-2 tracking-widest">Répartition des Flux financiers GxP</p>
                        </div>
                        <div className="px-4 py-2 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700">
                            <span className="text-[9px] font-black uppercase text-slate-500">Live Data</span>
                        </div>
                    </div>

                    <div className="flex-1 h-[400px] w-full">
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
                                        {reportData.chart.map((entry: any, index: number) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        contentStyle={{ backgroundColor: isDark ? '#1e293b' : '#fff', border: 'none', borderRadius: '15px', fontWeight: 'bold' }}
                                        itemStyle={{ color: isDark ? '#fff' : '#000' }}
                                    />
                                </PieChart>
                            ) : (
                                <BarChart data={reportData.chart} layout="vertical" margin={{ left: 40, right: 40 }}>
                                    <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke={isDark ? "#1e293b" : "#f1f5f9"} />
                                    <XAxis type="number" hide />
                                    <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 900, fill: '#64748b' }} width={120} />
                                    <Tooltip
                                        cursor={{ fill: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)' }}
                                        contentStyle={{ backgroundColor: isDark ? '#1e293b' : '#fff', borderRadius: '20px', border: 'none', fontWeight: 'bold', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)' }}
                                    />
                                    <Bar dataKey="value" radius={[0, 10, 10, 0]} barSize={40}>
                                        {reportData.chart.map((entry: any, index: number) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            )}
                        </ResponsiveContainer>
                    </div>

                    <div className="grid grid-cols-3 gap-6 mt-12 pt-12 border-t border-slate-50 dark:border-slate-800">
                        {reportData.stats.map((stat: any, idx: number) => (
                            <div key={idx} className="text-center group">
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2 group-hover:text-sky-500 transition-colors">{stat.label}</p>
                                <p className="text-xl font-black dark:text-white italic tracking-tighter">{stat.value}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Reporting;
