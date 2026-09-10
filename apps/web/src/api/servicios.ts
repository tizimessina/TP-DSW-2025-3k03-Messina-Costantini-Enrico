import { api } from "./base";
import type { CategoriaServicio } from "./categoriasServicio";
import type { Precio } from "./precios";

export interface UsuarioResumen {
  id_user: number;
  email: string;
  nombre: string;
  apellido: string;
  domicilio?: string | null;
  id_localidad?: number | null;
  localidad?: {
    id_localidad: number;
    nombre: string;
    provincia?: { id_provincia: number; nombre: string };
  } | null;
}

export interface Servicio {
  id_servicio: number;
  nombre: string;
  descripcion?: string | null;
  id_categoria: number;
  id_prestamista: number;
  created_at?: string;
  categoria?: CategoriaServicio;
  prestamista_profile?: { id_user: number; cuit?: string | null; users: UsuarioResumen };
  /** En el listado viene solo el último precio; en el detalle el historial completo (desc). */
  precio?: Precio[];
}

export interface ServicioCreateInput {
  nombre: string;
  descripcion?: string | null;
  id_categoria: number;
  /** Solo ADMIN */
  id_prestamista?: number;
  precio_inicial?: number;
}

export type ServicioUpdateInput = Partial<Omit<ServicioCreateInput, "precio_inicial">>;

export const precioActual = (s: Servicio) => s.precio?.[0] ?? null;

export const getServicios = async (params?: { q?: string; id_categoria?: number; id_prestamista?: number }) =>
  (await api.get<Servicio[]>("/servicios", { params })).data;

export const getServicio = async (id: number) => (await api.get<Servicio>(`/servicios/${id}`)).data;

export const createServicio = async (data: ServicioCreateInput) =>
  (await api.post<Servicio>("/servicios", data)).data;

export const updateServicio = async (id: number, data: ServicioUpdateInput) =>
  (await api.put<Servicio>(`/servicios/${id}`, data)).data;

export const deleteServicio = async (id: number) => (await api.delete(`/servicios/${id}`)).data;
