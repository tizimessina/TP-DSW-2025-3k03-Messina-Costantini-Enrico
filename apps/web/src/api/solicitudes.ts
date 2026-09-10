import { api } from "./base";
import type { CategoriaServicio } from "./categoriasServicio";
import type { Insumo } from "./insumos";
import type { UsuarioResumen } from "./servicios";

export type SolicitudEstado = "pendiente" | "aceptada" | "rechazada" | "completada";
export const ESTADOS: SolicitudEstado[] = ["pendiente", "aceptada", "rechazada", "completada"];

export type SolicitudInsumoProveedor = "CLIENTE" | "PRESTAMISTA";

export type SolicitudInsumo = {
  id_solicitud_insumo?: number;
  id_insumo: number;
  cantidad: number | string;
  precio_unit: number | string;
  proveedor: SolicitudInsumoProveedor;
  insumo?: Insumo;
};

type Perfil = { id_user: number; users: UsuarioResumen };

export type Solicitud = {
  id_solicitud: number;
  id_servicio: number;
  id_cliente: number;
  id_prestamista: number;
  id_campo: number;
  estado: SolicitudEstado;
  fecha_solicitud: string;
  fecha_inicio: string | null;
  fecha_fin: string | null;
  hectareas_trabajadas: number | string;
  precio_servicio: number | string;
  costo_insumos: number | string;
  precio_total: number | string;
  servicio?: {
    id_servicio: number;
    nombre: string;
    descripcion?: string | null;
    categoria?: CategoriaServicio;
    prestamista_profile?: Perfil;
  };
  campo?: { id_campo: number; coordenadas: string; hectareas: number | string };
  cliente_profile?: Perfil;
  prestamista_profile?: Perfil;
  solicitud_insumo?: SolicitudInsumo[];
};

export type CreateSolicitudInput = {
  id_servicio: number;
  id_campo: number;
  hectareas_trabajadas: number;
  fecha_inicio?: string;
  fecha_fin?: string;
  insumos: Omit<SolicitudInsumo, "insumo" | "id_solicitud_insumo">[];
};

export type UpdateSolicitudEstadoInput = {
  estado: SolicitudEstado;
  fecha_inicio?: string;
  fecha_fin?: string;
};

export const getSolicitudes = async (params?: { estado?: SolicitudEstado; id_prestamista?: number; id_cliente?: number }) =>
  (await api.get<Solicitud[]>("/solicitudes", { params })).data;

export const getSolicitud = async (id: number) => (await api.get<Solicitud>(`/solicitudes/${id}`)).data;

export const createSolicitud = async (data: CreateSolicitudInput) =>
  (await api.post<Solicitud>("/solicitudes", data)).data;

export const updateSolicitudEstado = async (id: number, data: UpdateSolicitudEstadoInput) =>
  (await api.patch<Solicitud>(`/solicitudes/${id}/estado`, data)).data;

export const deleteSolicitud = async (id: number) => {
  await api.delete(`/solicitudes/${id}`);
};
