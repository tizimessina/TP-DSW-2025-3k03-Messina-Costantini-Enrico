import { api } from "./base";
import type { AuthUser, RoleName } from "./auth";

/** Gestión de usuarios (solo ADMIN). */
export type Usuario = AuthUser;

export type UsuarioCreateInput = {
  email: string;
  password: string;
  nombre: string;
  apellido: string;
  roles: RoleName[];
  cuil_cuit?: string | null;
  domicilio?: string | null;
  id_localidad?: number | null;
};

export type UsuarioUpdateInput = Partial<UsuarioCreateInput>;

export const getUsuarios = async (params?: { q?: string; role?: RoleName; id_localidad?: number }) =>
  (await api.get<Usuario[]>("/usuarios", { params })).data;

export const getUsuario = async (id: number) => (await api.get<Usuario>(`/usuarios/${id}`)).data;

export const createUsuario = async (data: UsuarioCreateInput) => (await api.post<Usuario>("/usuarios", data)).data;

export const updateUsuario = async (id: number, data: UsuarioUpdateInput) =>
  (await api.put<Usuario>(`/usuarios/${id}`, data)).data;

export const deleteUsuario = async (id: number) => {
  await api.delete(`/usuarios/${id}`);
};
