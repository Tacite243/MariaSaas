import Layout from './components/Layout'
import React, { useState } from 'react'
import { UserRole, AuditAction } from '@renderer/types';
import { auditService } from './services/auditService';
import Dashboard from './components/Dashboard';
import POS from './components/POS';
import Inventory from './components/Inventory';
// import CustomerManagement from './components/CustomerManagement';
// import BillingManagement from './components/BillingManagement';
// import AuditTrail from './components/AuditTrail';
// import Reporting from './components/Reporting';
// import CashJournal from './components/CashJournal';
import Login from './components/Login';
import PharmacyAI from './components/PharmacyAi';

function App(): React.JSX.Element {
   const [currentView, setCurrentView] = useState('dashboard');
   const [userRole, setUserRole] = useState<UserRole>(UserRole.ADMIN);
   const [isLoggedIn, setIsLoggedIn] = useState(false);
   const [currentUser, setCurrentUser] = useState({ id: '1', name: 'User' });

   const handleLogin = (email: string, role: string) => {
    const selectedRole = role === 'SUPERADMIN' ? UserRole.SUPERADMIN : UserRole.ADMIN;
    setUserRole(selectedRole);
    setIsLoggedIn(true);
    setCurrentUser({ id: 'U-99', name: email.split('@')[0] });
    
    auditService.logAction({
      userId: 'U-99',
      userName: email.split('@')[0],
      action: AuditAction.LOGIN,
      resource: 'System',
      details: `Connexion réussie avec le rôle ${selectedRole}`
    });
  };

  const handleLogout = () => {
    auditService.logAction({
      userId: currentUser.id,
      userName: currentUser.name,
      action: AuditAction.LOGOUT,
      resource: 'System',
      details: 'Déconnexion volontaire'
    });
    setIsLoggedIn(false);
  };

  if (!isLoggedIn) {
    return <Login onLogin={handleLogin} />;
  }

  const navigateTo = (view: string) => {
    if (view === 'audit' && userRole !== UserRole.SUPERADMIN) {
      alert("Accès refusé : Droits SuperAdmin requis.");
      return;
    }
    setCurrentView(view);
  };

  const renderView = () => {
    switch (currentView) {
      case 'dashboard': return <Dashboard />;
      case 'pos': return <POS />;
      case 'inventory': return <Inventory />;
      // case 'customers': return <CustomerManagement />;
      // case 'billing': return <BillingManagement />;
      // case 'reporting': return <Reporting />;
      // case 'cash_journal': return <CashJournal />;
      // case 'audit': return <AuditTrail />;
      case 'users': return (
        <div className="bg-white dark:bg-slate-900 p-12 rounded-[3rem] border border-slate-200 dark:border-slate-800 shadow-sm transition-colors">
           <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter italic uppercase mb-10">Gestion Équipage</h2>
           <div className="p-10 border border-slate-100 dark:border-slate-800 rounded-[2.5rem] bg-slate-50/50 dark:bg-slate-800/50 max-w-md">
              <div className="flex items-center gap-6 mb-8">
                 <div className="w-16 h-16 bg-sky-600 rounded-3xl flex items-center justify-center text-white font-black text-2xl">JD</div>
                 <div>
                    <p className="font-black text-slate-900 dark:text-white text-xl tracking-tight leading-none">Admin Demo</p>
                    <span className="text-[10px] font-black text-sky-600 uppercase tracking-widest mt-2 hidden sm:inline-block">Directeur Général</span>
                 </div>
              </div>
           </div>
        </div>
      );
      default: return <Dashboard />;
    }
  };

  return (
    <>
      <Layout 
        userRole={userRole} 
        currentView={currentView} 
        onNavigate={navigateTo}
        onLogout={handleLogout}
      >
        {renderView()}
      </Layout>
      <PharmacyAI />
    </>
  );
}

export default App
