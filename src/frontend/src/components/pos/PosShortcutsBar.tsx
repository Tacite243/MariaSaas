import React from 'react'

export const PosShortcutsBar: React.FC = () => (
  <div className="fixed bottom-0 left-0 right-0 z-30 bg-slate-900/95 text-slate-300 text-[10px] font-bold uppercase tracking-wider px-4 py-2 flex flex-wrap gap-x-4 gap-y-1 justify-center border-t border-slate-700">
    <span><kbd className="text-emerald-400">F1</kbd> Recherche</span>
    <span><kbd className="text-emerald-400">F2</kbd> Devise</span>
    <span><kbd className="text-emerald-400">F4</kbd> En attente</span>
    <span><kbd className="text-emerald-400">F5</kbd> Reprendre</span>
    <span><kbd className="text-emerald-400">F9</kbd> Paiement</span>
    <span><kbd className="text-emerald-400">Échap</kbd> Annuler</span>
  </div>
)
