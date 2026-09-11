import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { TOKEN_KEY, USER_KEY, setUnauthorizedHandler } from "../api/base";
import { auth as authApi, type RegisterPayload } from "../api";
import type { RoleName, Usuario } from "../api/types";

type AuthContextValue = {
  user: Usuario | null;
  token: string | null;
  /** true mientras se valida la sesión guardada al cargar la app */
  loading: boolean;
  login: (email: string, password: string) => Promise<Usuario>;
  register: (data: RegisterPayload) => Promise<Usuario>;
  logout: () => void;
  setUser: (user: Usuario) => void;
  refresh: () => Promise<void>;
  hasRole: (...roles: RoleName[]) => boolean;
  isAdmin: boolean;
  isProductor: boolean;
  isContratista: boolean;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function readStoredUser(): Usuario | null {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? (JSON.parse(raw) as Usuario) : null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem(TOKEN_KEY));
  const [user, setUserState] = useState<Usuario | null>(() => (token ? readStoredUser() : null));
  const [loading, setLoading] = useState<boolean>(!!token);

  const persist = useCallback((nextToken: string | null, nextUser: Usuario | null) => {
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

  const refresh = useCallback(async () => {
    const current = localStorage.getItem(TOKEN_KEY);
    if (!current) return;
    const u = await authApi.me();
    persist(current, u);
  }, [persist]);

  // Al montar: validar el token guardado contra /auth/me (roles vigentes)
  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    authApi
      .me()
      .then((u) => !cancelled && persist(token, u))
      .catch(() => !cancelled && logout())
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

  const setUser = useCallback((u: Usuario) => persist(token, u), [persist, token]);

  const value = useMemo<AuthContextValue>(() => {
    const hasRole = (...roles: RoleName[]) => !!user && roles.some((r) => user.roles.includes(r));
    return {
      user, token, loading, login, register, logout, setUser, refresh, hasRole,
      isAdmin: hasRole("ADMIN"),
      isProductor: hasRole("PRODUCTOR"),
      isContratista: hasRole("CONTRATISTA"),
    };
  }, [user, token, loading, login, register, logout, setUser, refresh]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth debe usarse dentro de <AuthProvider>");
  return ctx;
}
