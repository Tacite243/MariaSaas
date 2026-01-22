import { HashRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from './store/store';
import { UserRole } from '@renderer/types';
// import { logout } from '../store/slice/authSlice'; // (À créer si pas fait, voir note en bas)


// Layouts & Guards
import ProtectedRoute from './ProtectedRoute';
import Layout from '@renderer/layouts/Layout';

// Pages
import Login from '../components/Login';
import Dashboard from '../components/Dashboard';
import Inventory from '../components/Inventory';
import POS from '@renderer/components/POS';
import CustomerManagement from '@renderer/components/CustomerManagement';
import BillingManagement from '@renderer/components/BillingManagement';
import AuditTrail from '@renderer/components/AuditTrail';
import Reporting from '@renderer/components/Reporting';
import CashJournal from '@renderer/components/CashJournal';

// --- COMPOSANT WRAPPER (LE PONT) ---
// Ce composant sert à injecter les données Redux dans le Layout
// et à dire au Layout d'afficher la route active via <Outlet />
const MainLayout = () => {
    // 1. Récupération des données depuis Redux
    // (Adapte selon ton authSlice, pour l'instant je mets des valeurs par défaut si tu n'as pas fini le slice)
    const userRole = useSelector((state: RootState) => UserRole.ADMIN);
    const dispatch = useDispatch();

    const handleLogout = () => {
        // dispatch(logout()); // Décommente quand ton slice Auth est prêt
        console.log("Logout triggered");
        // En attendant, on peut forcer un reload ou gérer via state local
    };

    return (
        <Layout 
            userRole={userRole} 
            onLogout={handleLogout}
        >
            {/* C'est ICI que React Router va injecter Dashboard, POS, etc. */}
            <Outlet />
        </Layout>
    );
};

export const AppRouter = () => {
    return (
        <HashRouter>
            <Routes>
                {/* 1. Route Publique (Login) */}
                {/* Note: Idéalement, Login doit rediriger vers /dashboard si déjà connecté */}
                <Route path="/login" element={<Login />} />

                {/* 2. Routes Protégées (Toute l'app) */}
                <Route element={<ProtectedRoute />}>
                    
                    {/* On utilise notre Wrapper qui contient le Layout */}
                    <Route element={<MainLayout />}>

                        {/* Redirection par défaut */}
                        <Route path="/" element={<Navigate to="/dashboard" replace />} />

                        {/* Modules accessibles aux Admins/SuperAdmins (géré par le Layout) */}
                        <Route path="/dashboard" element={<Dashboard />} />
                        <Route path="/pos" element={<POS />} />
                        <Route path="/inventory" element={<Inventory />} />
                        <Route path="/customers" element={<CustomerManagement />} />
                        <Route path="/billing" element={<BillingManagement />} />
                        <Route path="/reporting" element={<Reporting />} />
                        <Route path="/cash-journal" element={<CashJournal />} />

                        {/* Route restreinte spécifiquement (SuperAdmin uniquement) */}
                        {/* On imbrique une nouvelle protection pour cette route */}
                        <Route element={<ProtectedRoute allowedRoles={[UserRole.SUPERADMIN]} />}>
                            <Route path="/audit" element={<AuditTrail />} />
                        </Route>

                    </Route>
                </Route>

                {/* 3. Fallback (404) */}
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </HashRouter>
    );
};