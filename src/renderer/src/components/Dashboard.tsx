import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Cell } from 'recharts';

const dailyData = [
  { name: 'Lun', sales: 4000 }, { name: 'Mar', sales: 3000 }, { name: 'Mer', sales: 2000 }, { name: 'Jeu', sales: 2780 }, { name: 'Ven', sales: 1890 }, { name: 'Sam', sales: 2390 }, { name: 'Dim', sales: 3490 },
];

const monthlyTrendData = Array.from({ length: 30 }, (_, i) => ({
  date: `2024-03-${String(i + 1).padStart(2, '0')}`, day: i + 1, sales: Math.floor(Math.random() * 5000) + 2000,
}));

const Dashboard: React.FC = () => {
  const isDark = document.documentElement.classList.contains('dark');

  return (
    <div className="space-y-6 md:space-y-10 animate-in fade-in duration-700">
      {/* Stats Grid - 1 col on small mobile, 2 on sm, 4 on lg */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <StatCard title="Ventes Jour" value="452.000 FC" change="+12.5%" color="sky" />
        <StatCard title="Ruptures" value="12" change="Alert" color="red" />
        <StatCard title="Périmés < 30j" value="8" change="Action" color="amber" />
        <StatCard title="Nouv. Patients" value="24" change="+4" color="emerald" />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 md:gap-10">
        {/* Main Chart Section */}
        <div className="xl:col-span-2 bg-white dark:bg-slate-900 p-6 md:p-10 rounded-[2rem] md:rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-sm transition-colors">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 mb-8 md:mb-10">
             <div>
                <h3 className="text-xl md:text-2xl font-black italic text-slate-900 dark:text-white tracking-tighter uppercase leading-none">Activité MariaSaas</h3>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-2 leading-none">Chiffre d'Affaires • 30 jours</p>
             </div>
             <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl border border-emerald-100 dark:border-emerald-900/50">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                <span className="text-[9px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">+8.4% croissance</span>
             </div>
          </div>
          <div className="h-56 md:h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthlyTrendData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? "#1e293b" : "#f1f5f9"} />
                <XAxis dataKey="day" hide />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 9, fontWeight: 900, fill: '#94a3b8' }} />
                <Tooltip 
                  contentStyle={{ backgroundColor: isDark ? '#1e293b' : '#0f172a', border: 'none', borderRadius: '15px', color: '#fff', fontSize: '10px', fontWeight: '900', boxShadow: '0 25px 50px -12px rgb(0 0 0 / 0.5)' }}
                  itemStyle={{ color: '#38bdf8' }}
                />
                <Line type="monotone" dataKey="sales" stroke="#0ea5e9" strokeWidth={4} dot={false} strokeLinecap="round" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Live Alerts Section */}
        <div className="bg-white dark:bg-slate-900 p-6 md:p-10 rounded-[2rem] md:rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-sm transition-colors">
          <div className="flex justify-between items-center mb-8">
             <h3 className="text-lg md:text-xl font-black italic text-slate-900 dark:text-white tracking-tighter uppercase">Alertes GxP</h3>
             <span className="w-2 h-2 rounded-full bg-red-500 animate-ping"></span>
          </div>
          <div className="space-y-3 md:space-y-4">
            <AlertItem type="danger" title="Paracétamol" message="Stock épuisé (Batch #45)" date="2h" />
            <AlertItem type="warning" title="Amoxicilline" message="Péremption imminente" date="5h" />
            <AlertItem type="info" title="Logistique" message="Arrivage GOMA MED demain" date="Planifié" />
          </div>
          <button className="w-full mt-8 py-4 bg-slate-50 dark:bg-slate-800 text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-2xl font-black uppercase text-[10px] tracking-widest transition-all">
             Audit Complet
          </button>
        </div>
      </div>

      {/* Activities Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-10">
        <div className="bg-white dark:bg-slate-900 p-6 md:p-10 rounded-[2rem] md:rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-sm transition-colors overflow-hidden">
           <h3 className="text-xl font-black italic text-slate-900 dark:text-white tracking-tighter uppercase mb-10">Volume Hebdomadaire</h3>
           <div className="h-60 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dailyData}>
                   <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? "#1e293b" : "#f1f5f9"} />
                   <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 900, fill: '#64748b' }} />
                   <YAxis hide />
                   <Bar dataKey="sales" radius={[8, 8, 0, 0]} barSize={35}>
                      {dailyData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={index === 6 ? '#0ea5e9' : '#e2e8f0'} className="dark:fill-slate-800" />
                      ))}
                   </Bar>
                </BarChart>
              </ResponsiveContainer>
           </div>
        </div>

        <div className="bg-slate-900 p-8 md:p-10 rounded-[2.5rem] md:rounded-[3rem] text-white relative overflow-hidden group shadow-2xl">
           <div className="absolute top-0 right-0 w-64 h-64 bg-sky-600/20 rounded-full blur-[80px] group-hover:bg-sky-600/30 transition-all duration-700"></div>
           <div className="relative z-10">
              <h3 className="text-2xl md:text-3xl font-black italic tracking-tighter uppercase mb-4 leading-tight">Maria Live AI</h3>
              <p className="text-slate-400 font-medium text-base md:text-lg leading-relaxed max-w-xs mb-8">
                L'intelligence artificielle au service de votre productivité pharmaceutique.
              </p>
              <div className="flex items-center gap-6">
                 <div className="flex -space-x-3">
                    {[1, 2, 3].map(i => (
                      <div key={i} className="w-10 h-10 md:w-12 md:h-12 rounded-2xl bg-slate-800 border-4 border-slate-900 flex items-center justify-center font-black text-[10px]">U{i}</div>
                    ))}
                 </div>
                 <p className="text-[10px] font-black text-sky-400 uppercase tracking-widest">3 Actifs</p>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ title, value, change, color }: any) => {
  const themes = {
    sky: 'text-sky-600 bg-sky-50 dark:bg-sky-900/10',
    red: 'text-red-600 bg-red-50 dark:bg-red-900/10',
    amber: 'text-amber-600 bg-amber-50 dark:bg-amber-900/10',
    emerald: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/10',
  };
  return (
    <div className="bg-white dark:bg-slate-900 p-6 md:p-8 rounded-[1.8rem] md:rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-sm transition-all hover:-translate-y-1 group">
      <div className="flex justify-between items-start mb-4 md:mb-6">
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{title}</p>
        <span className={`px-2 py-1 rounded-lg text-[8px] font-black uppercase ${themes[color as keyof typeof themes]}`}>
          {change}
        </span>
      </div>
      <h4 className="text-xl md:text-3xl font-black text-slate-900 dark:text-white tracking-tighter italic leading-none truncate group-hover:text-sky-600 transition-colors">{value}</h4>
    </div>
  );
};

const AlertItem = ({ type, title, message, date }: any) => {
  const indicators = {
    danger: 'bg-red-500 shadow-red-500/50',
    warning: 'bg-amber-500 shadow-amber-500/50',
    info: 'bg-sky-500 shadow-sky-500/50'
  };
  return (
    <div className="flex items-center gap-4 p-4 md:p-5 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-700/50 transition-colors hover:bg-white dark:hover:bg-slate-800">
       <div className={`w-2 h-2 rounded-full flex-none shadow-lg ${indicators[type as keyof typeof indicators]}`}></div>
       <div className="flex-1 min-w-0">
          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1 truncate">{title}</p>
          <p className="text-xs font-bold text-slate-700 dark:text-slate-200 truncate">{message}</p>
       </div>
       <span className="text-[9px] font-black text-slate-400 uppercase flex-none">{date}</span>
    </div>
  );
};

export default Dashboard;
