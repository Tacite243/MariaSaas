import React from 'react';

interface Props {
    title: string;
    value: string;
    change: string;
    color: 'sky' | 'red' | 'amber' | 'emerald';
}

export const StatCard: React.FC<Props> = ({ title, value, change, color }) => {
    const themes = {
        // En light : on force des teintes plus "pharmaceutiques"
        sky: 'text-emerald-600 bg-emerald-50 dark:text-sky-400 dark:bg-sky-900/10',
        red: 'text-red-600 bg-red-50 dark:bg-red-900/10',
        amber: 'text-amber-600 bg-amber-50 dark:bg-amber-900/10',
        emerald: 'text-emerald-700 bg-emerald-100 dark:text-emerald-400 dark:bg-emerald-900/10',
    };

    return (
        <div className="bg-white dark:bg-slate-900 p-6 md:p-8 rounded-[1.8rem] md:rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-sm transition-all hover:-translate-y-1 group">
            <div className="flex justify-between items-start mb-4 md:mb-6">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{title}</p>
                <span className={`px-2 py-1 rounded-lg text-[8px] font-black uppercase ${themes[color]}`}>
                    {change}
                </span>
            </div>
            <h4 className="text-xl md:text-3xl font-black text-slate-900 dark:text-white tracking-tighter italic leading-none truncate group-hover:text-emerald-600 dark:group-hover:text-sky-600 transition-colors">
                {value}
            </h4>
        </div>
    );
};