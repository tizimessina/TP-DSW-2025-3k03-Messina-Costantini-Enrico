import { api } from "./base";
import type { UsuarioResumen } from "./servicios";

export type Campo = {
  id_campo: number;
  id_cliente: number;
  coordenadas: string;
  /** DECIMAL: llega como string */
  hectareas: string | number;
  cliente_profile?: { id_user: number; cuit?: string | null; users: UsuarioResumen } | null;
  /** Solo en el detalle */
  solicitud?: {
    id_solicitud: number;
    estado: string;
    fecha_solicitud: string;
    hectareas_trabajadas: string | number;
    precio_total: string | number;
    servicio: { id_servicio: number; nombre: string };
  }[];
};

export type CampoCreateInput = {
  coordenadas: string;
  hectareas: number;
  /** Solo ADMIN */
  id_cliente?: number;
};

export type CampoUpdateInput = Partial<Pick<CampoCreateInput, "coordenadas" | "hectareas">>;

export const listCampos = async (params?: { q?: string; id_cliente?: number }) =>
  (await api.get<Campo[]>("/campos", { params })).data;

export const getCampo = async (id: number) => (await api.get<Campo>(`/campos/${id}`)).data;

export const createCampo = async (data: CampoCreateInput) => (await api.post<Campo>("/campos", data)).data;

export const updateCampo = async (id: number, data: CampoUpdateInput) =>
  (await api.put<Campo>(`/campos/${id}`, data)).data;

export const deleteCampo = async (id: number) => {
  await api.delete(`/campos/${id}`);
};
