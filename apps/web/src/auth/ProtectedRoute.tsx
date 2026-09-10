import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import type { RoleName } from "../api/auth";
import { useAuth } from "./AuthContext";
import { PageSpinner } from "../components/ui";
import ForbiddenPage from "../pages/ForbiddenPage";

type Props = {
  /** Si se indica, el usuario debe tener al menos uno de estos roles. */
  roles?: RoleName[];
  children: ReactNode;
};

/**
 * Protege una ruta del frontend: sin sesión redirige a /auth (recordando a dónde iba);
 * con sesión pero sin el rol requerido muestra la página 403.
 */
export default function ProtectedRoute({ roles, children }: Props) {
  const { user, loading, hasRole } = useAuth();
  const location = useLocation();

  if (loading) return <PageSpinner />;
  if (!user) return <Navigate to="/auth" replace state={{ from: location.pathname }} />;
  if (roles && !hasRole(...roles)) return <ForbiddenPage />;
  return <>{children}</>;
}
