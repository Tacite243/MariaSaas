import { Navigate, Outlet } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from './store/store';
import { UserRole } from '@renderer/types';

interface ProtectedRouteProps {
  allowedRoles?: UserRole[];
}

const ProtectedRoute = ({ allowedRoles }: ProtectedRouteProps) => {
  // Supposons que tu as un authSlice dans Redux (on le fera plus tard si pas fait)
  // Pour l'instant on simule ou on prend ton state local si tu n'as pas encore migré auth dans Redux
  const auth = useSelector((state: RootState) => state.theme); // TODO: Replace with actual auth state when available
  const isAuthenticated = true; // TODO: Get from auth state
  const user = null; // TODO: Get from auth state

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    return <div className="p-10 text-red-500">Accès Interdit (Rôle insuffisant)</div>;
  }

  // Si tout est bon, on affiche la route enfant (Outlet)
  return <Outlet />;
};

export default ProtectedRoute;