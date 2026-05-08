import { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { getModuleByPath } from "@/lib/modules";
import { RefreshCw } from "lucide-react";

export function ProtectedRoute({ children, requireAdmin }: { children: ReactNode; requireAdmin?: boolean }) {
  const { session, profile, isAdmin, allowedModules, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!session) return <Navigate to="/login" replace />;
  if (profile && !profile.approved) return <Navigate to="/pending" replace />;
  if (requireAdmin && !isAdmin) return <Navigate to="/" replace />;

  // Admins bypass module check
  if (!isAdmin) {
    const moduleKey = getModuleByPath(location.pathname);
    if (moduleKey && !allowedModules.includes(moduleKey)) {
      return <Navigate to="/" replace />;
    }
  }

  return <>{children}</>;
}
