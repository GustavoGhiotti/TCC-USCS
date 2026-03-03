import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { UserRole } from '../types/domain';

interface ProtectedRouteProps {
  children: ReactNode;
  requiredRole?: UserRole;
  /** true para rotas que não devem verificar consentimento (ex: /consentimento) */
  skipConsentCheck?: boolean;
}

export function ProtectedRoute({
  children,
  requiredRole,
  skipConsentCheck,
}: ProtectedRouteProps) {
  const { user, loading } = useAuth();

  console.log('ProtectedRoute:', { user, loading, requiredRole });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-slate-600">Carregando...</p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (requiredRole && user.role !== requiredRole) {
    return <Navigate to="/login" replace />;
  }

  // Guard de consentimento LGPD — redireciona enquanto não aceito
  if (!skipConsentCheck && user.consentimentoAceito === false) {
    return <Navigate to="/consentimento" replace />;
  }

  return <>{children}</>;
}

export default ProtectedRoute;
