import React, { useState, useMemo } from 'react';
import { auditService } from '../services/auditService';
import { AuditLog, AuditAction } from '../types';

const AuditTrail: React.FC = () => {
  const logs = auditService.getLogs();
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

  const stats = useMemo(() => {
    return {
      total: logs.length,
      critical: logs.filter(l => l.severity === 'CRITICAL').length,
      warnings: logs.filter(l => l.severity === 'WARNING').length,
      recent: logs.filter(l => (new Date().getTime() - new Date(l.timestamp).getTime()) < 3600000).length
    };
  }, [logs]);

  const getActionIcon = (action: AuditAction) => {
    switch (action) {
      case AuditAction.LOGIN: return <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4m-7-7 3-3m0 0-3-3m3 3H3"/></svg>;
      default: return <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4m0-4h.01"/></svg>;
    }
  };

  return (
    <div className="space-y-6 md:space-y-10 animate-in fade-in duration-500 pb-10">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-6">
        <div>
          <h2 className="text-3xl md:text-4xl font-black italic text-slate-900 dark:text-white tracking-tighter uppercase leading-none">Journal d'Audit</h2>
          <p className="text-slate-400 font-bold text-[10px] uppercase tracking-[0.3em] mt-3">Traçabilité Intégrale • Conformité GxP</p>
        </div>
        <button className="w-full lg:w-auto px-8 py-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-400 hover:bg-slate-50 transition-all shadow-sm active:scale-95 flex items-center justify-center gap-3">
          <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4m4-5 5 5 5-5m-5 5V3"/></svg>
          Générer Rapport
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <AuditStat title="Événements" value={stats.total} icon="📜" />
        <AuditStat title="Critiques" value={stats.critical} color="text-red-500" icon="⚠️" />
        <AuditStat title="Avertissements" value={stats.warnings} color="text-amber-500" icon="⚡" />
        <AuditStat title="Récents" value={stats.recent} color="text-sky-500" icon="⏱️" />
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-[2rem] md:rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden transition-colors">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left min-w-[700px]">
            <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
              <tr>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Heure</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Utilisateur</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Action</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Gravité</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {logs.map(log => (
                <tr key={log.id} onClick={() => setSelectedLog(log)} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition-all">
                  <td className="px-8 py-6">
                    <span className="text-[10px] font-black text-slate-400 uppercase">{new Date(log.timestamp).toLocaleTimeString()}</span>
                  </td>
                  <td className="px-8 py-6">
                     <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-black text-slate-400 text-[10px]">{log.userName.charAt(0)}</div>
                        <span className="font-black text-slate-900 dark:text-white text-sm">{log.userName}</span>
                     </div>
                  </td>
                  <td className="px-8 py-6 whitespace-nowrap">
                     <span className="text-[10px] font-black text-slate-600 dark:text-slate-400 uppercase tracking-widest">{log.action.replace('_', ' ')}</span>
                  </td>
                  <td className="px-8 py-6 text-right">
                     <span className={`px-3 py-1 rounded-full text-[8px] font-black uppercase ${log.severity === 'CRITICAL' ? 'bg-red-500 text-white' : log.severity === 'WARNING' ? 'bg-amber-400 text-white' : 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600'}`}>{log.severity}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {selectedLog && (
        <div className="fixed inset-0 z-[120] bg-slate-900/80 backdrop-blur-xl flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 w-full max-w-xl rounded-3xl md:rounded-[3rem] p-8 md:p-12 shadow-2xl animate-in zoom-in-95 border border-slate-200 dark:border-slate-800">
            <div className="flex justify-between items-start mb-8">
              <h2 className="text-2xl md:text-3xl font-black italic tracking-tighter uppercase text-slate-900 dark:text-white leading-none">Détail Log</h2>
              <button onClick={() => setSelectedLog(null)} className="p-2 text-slate-400">
                <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24"><path d="M18 6 6 18M6 6l12 12"/></svg>
              </button>
            </div>
            <div className="space-y-6">
               <div className="p-6 bg-slate-50 dark:bg-slate-800 rounded-2xl">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Détails de l'action</p>
                  <p className="text-sm font-bold text-slate-800 dark:text-slate-200 italic leading-relaxed">"{selectedLog.details}"</p>
               </div>
               <div className="grid grid-cols-2 gap-6">
                  <div>
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Utilisateur</p>
                    <p className="font-black text-slate-900 dark:text-white">{selectedLog.userName}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Ressource</p>
                    <p className="font-black text-slate-900 dark:text-white uppercase">{selectedLog.resource}</p>
                  </div>
               </div>
            </div>
            <button onClick={() => setSelectedLog(null)} className="w-full mt-10 py-5 bg-slate-900 dark:bg-sky-600 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest">Fermer</button>
          </div>
        </div>
      )}
    </div>
  );
};

const AuditStat = ({ title, value, color = "text-slate-900 dark:text-white", icon }: any) => (
  <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl md:rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-5 transition-all">
    <div className="text-2xl">{icon}</div>
    <div>
      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">{title}</p>
      <h4 className={`text-xl md:text-2xl font-black italic tracking-tighter ${color}`}>{value}</h4>
    </div>
  </div>
);

export default AuditTrail;
