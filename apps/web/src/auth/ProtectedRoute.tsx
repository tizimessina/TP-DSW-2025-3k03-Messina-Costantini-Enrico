import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import type { RoleName } from "../api/types";
import { useAuth } from "./AuthContext";
import { PageSpinner } from "../components/ui";
import ForbiddenPage from "../pages/ForbiddenPage";

/**
 * Protege una ruta: sin sesión redirige a /ingresar (recordando a dónde iba);
 * con sesión pero sin el rol requerido muestra la página 403.
 */
export default function ProtectedRoute({ roles, children }: { roles?: RoleName[]; children: ReactNode }) {
  const { user, loading, hasRole } = useAuth();
  const location = useLocation();

  if (loading) return <PageSpinner />;
  if (!user) return <Navigate to="/ingresar" replace state={{ from: location.pathname }} />;
  if (roles && !hasRole(...roles)) return <ForbiddenPage />;
  return <>{children}</>;
}
