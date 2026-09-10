import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { TOKEN_KEY, USER_KEY, setUnauthorizedHandler } from "../api/base";
import * as authApi from "../api/auth";
import type { AuthUser, RegisterPayload, RoleName } from "../api/auth";

type AuthContextValue = {
  user: AuthUser | null;
  token: string | null;
  /** true mientras se valida la sesión guardada al cargar la app */
  loading: boolean;
  login: (email: string, password: string) => Promise<AuthUser>;
  register: (data: RegisterPayload) => Promise<AuthUser>;
  logout: () => void;
  /** Reemplaza el usuario en memoria y storage (p. ej. tras editar el perfil) */
  setUser: (user: AuthUser) => void;
  hasRole: (...roles: RoleName[]) => boolean;
  isAdmin: boolean;
  isCliente: boolean;
  isPrestamista: boolean;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function readStoredUser(): AuthUser | null {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? (JSON.parse(raw) as AuthUser) : null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem(TOKEN_KEY));
  const [user, setUserState] = useState<AuthUser | null>(() => (token ? readStoredUser() : null));
  const [loading, setLoading] = useState<boolean>(!!token);

  const persist = useCallback((nextToken: string | null, nextUser: AuthUser | null) => {
    if (nextToken && nextUser) {
      localStorage.setItem(TOKEN_KEY, nextToken);
      localStorage.setItem(USER_KEY, JSON.stringify(nextUser));
    } else {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
    }
    setToken(nextToken);
    setUserState(nextUser);
  }, []);

  const logout = useCallback(() => persist(null, null), [persist]);

  // Al montar: si hay token guardado, validarlo contra /auth/me.
  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    authApi
      .me()
      .then((u) => {
        if (!cancelled) persist(token, u);
      })
      .catch(() => {
        if (!cancelled) logout();
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
    // Solo al montar
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Si cualquier request devuelve 401, cerramos sesión.
  useEffect(() => {
    setUnauthorizedHandler(logout);
    return () => setUnauthorizedHandler(null);
  }, [logout]);

  const login = useCallback(
    async (email: string, password: string) => {
      const res = await authApi.login(email, password);
      persist(res.token, res.user);
      return res.user;
    },
    [persist],
  );

  const register = useCallback(
    async (data: RegisterPayload) => {
      const res = await authApi.register(data);
      persist(res.token, res.user);
      return res.user;
    },
    [persist],
  );

  const setUser = useCallback((u: AuthUser) => persist(token, u), [persist, token]);

  const value = useMemo<AuthContextValue>(() => {
    const hasRole = (...roles: RoleName[]) => !!user && roles.some((r) => user.roles.includes(r));
    return {
      user,
      token,
      loading,
      login,
      register,
      logout,
      setUser,
      hasRole,
      isAdmin: hasRole("ADMIN"),
      isCliente: hasRole("CLIENTE"),
      isPrestamista: hasRole("PRESTAMISTA"),
    };
  }, [user, token, loading, login, register, logout, setUser]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth debe usarse dentro de <AuthProvider>");
  return ctx;
}
