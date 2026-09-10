import { api } from "./base";
import type { Localidad } from "./localidades";

export { getApiErrorMessage } from "./base";

export type RoleName = "ADMIN" | "CLIENTE" | "PRESTAMISTA";

export const ROLE_LABELS: Record<RoleName, string> = {
  ADMIN: "Administrador",
  CLIENTE: "Cliente",
  PRESTAMISTA: "Prestamista",
};

/** Usuario público tal como lo devuelve la API (sin password_hash). */
export interface AuthUser {
  id_user: number;
  email: string;
  nombre: string;
  apellido: string;
  cuil_cuit?: string | null;
  fecha_nac?: string | null;
  domicilio?: string | null;
  id_localidad?: number | null;
  localidad?: (Localidad & { provincia?: { id_provincia: number; nombre: string } }) | null;
  roles: RoleName[];
}

export interface AuthResponse {
  token: string;
  user: AuthUser;
}

export interface RegisterPayload {
  email: string;
  password: string;
  nombre: string;
  apellido: string;
  rol: "CLIENTE" | "PRESTAMISTA";
  id_localidad?: number | null;
}

export interface UpdateMePayload {
  nombre?: string;
  apellido?: string;
  password?: string;
  cuil_cuit?: string | null;
  fecha_nac?: string | null;
  domicilio?: string | null;
  id_localidad?: number | null;
}

export const login = async (email: string, password: string) =>
  (await api.post<AuthResponse>("/auth/login", { email, password })).data;

export const register = async (data: RegisterPayload) =>
  (await api.post<AuthResponse>("/auth/register", data)).data;

export const me = async () => (await api.get<AuthUser>("/auth/me")).data;

export const updateMe = async (data: UpdateMePayload) =>
  (await api.put<AuthUser>("/auth/me", data)).data;
