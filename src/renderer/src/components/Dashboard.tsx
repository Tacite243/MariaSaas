import React, { useEffect, useState } from 'react';
import { useCurrency } from '@renderer/hooks/useCurrently';

// Composants
import { StatCard } from './StatCard';
import { SalesChart } from './SalesCharts';
import { AlertsPanel } from './AlertsPanel';
import { VolumeChart } from './VolumeChart';
import { AIBanner } from './AIBanner';


interface DashboardStats {
  revenueToday: number;
  salesCount: number;
  lowStockCount: number;
  stockValue: number;
  recentSales: { date: string; totalAmount: number }[];
}

const Dashboard: React.FC = () => {
  const { formatPrice } = useCurrency();
  const [data, setData] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadStats = async () => {
      try {
        const res = await window.api.stats.getDashboard();
        if (res.success && res.data) setData(res.data);
      } catch (err) {
        console.error("Dashboard Error:", err);
      } finally {
        setIsLoading(false);
      }
    };
    loadStats();
  }, []);

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse p-4">
        <div className="grid grid-cols-4 gap-6">
          {[1,2,3,4].map(i => <div key={i} className="h-40 bg-slate-100 dark:bg-slate-800 rounded-[2.5rem]"></div>)}
        </div>
        <div className="h-80 bg-slate-100 dark:bg-slate-800 rounded-[2.5rem]"></div>
      </div>
    );
  }

  const stats = data || { revenueToday: 0, salesCount: 0, lowStockCount: 0, stockValue: 0, recentSales: [] };

  const chartData = stats.recentSales.map(s => ({
    name: new Date(s.date).toLocaleDateString(undefined, { weekday: 'short' }),
    sales: s.totalAmount
  }));

  const displayChartData = chartData.length > 0 ? chartData : [{ name: 'Auj', sales: 0 }];

  return (
    <div className="space-y-6 md:space-y-10 animate-in fade-in duration-700 pb-10">
      
      {/* 1. KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <StatCard title="Ventes Jour" value={`${formatPrice(stats.revenueToday).value.toLocaleString()} ${formatPrice(stats.revenueToday).symbol}`} change={`${stats.salesCount} tickets`} color="sky" />
        <StatCard title="Valeur Stock" value={`${formatPrice(stats.stockValue).value.toLocaleString()} ${formatPrice(stats.stockValue).symbol}`} change="Actif" color="emerald" />
        <StatCard title="Alertes Stock" value={stats.lowStockCount.toString()} change="Rupture" color="red" />
        <StatCard title="Patients" value="-" change="Bientôt" color="amber" />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 md:gap-10">
        {/* 2. Main Chart */}
        <SalesChart data={displayChartData} />
        
        {/* 3. Alerts */}
        <AlertsPanel count={stats.lowStockCount} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-10">
        {/* 4. Volume Chart */}
        <VolumeChart data={displayChartData} />
        
        {/* 5. AI */}
        <AIBanner />
      </div>
    </div>
  );
};

export default Dashboard;