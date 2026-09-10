import { api } from "./base";

export type Precio = {
  id_precio: number;
  id_servicio: number;
  /** DECIMAL: llega como string */
  valor: string | number;
  fecha_desde: string; // ISO
};

export const getPrecios = async (id_servicio: number) =>
  (await api.get<Precio[]>(`/precios/servicio/${id_servicio}`)).data;

export const getPrecioVigente = async (id_servicio: number) =>
  (await api.get<Precio>(`/precios/servicio/${id_servicio}/vigente`)).data;

export const createPrecio = async (id_servicio: number, valor: number, fecha_desde: string) =>
  (await api.post<Precio>("/precios", { id_servicio, valor, fecha_desde })).data;

export const updatePrecio = async (id_precio: number, data: Partial<{ valor: number; fecha_desde: string }>) =>
  (await api.put<Precio>(`/precios/${id_precio}`, data)).data;

export const deletePrecio = async (id_precio: number) =>
  (await api.delete<{ ok: boolean }>(`/precios/${id_precio}`)).data;
