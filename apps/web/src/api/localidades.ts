import { api } from "./base";

export type Localidad = {
  id_localidad: number;
  id_provincia: number;
  nombre: string;
  codigo_postal?: string | null;
  provincia?: { id_provincia: number; nombre: string };
};

export type LocalidadInput = { id_provincia: number; nombre: string; codigo_postal?: string | null };

export const getLocalidades = async (q?: string, id_provincia?: number) =>
  (await api.get<Localidad[]>("/localidades", { params: { q, id_provincia } })).data;

export const getLocalidadById = async (id: number) => (await api.get<Localidad>(`/localidades/${id}`)).data;

export const createLocalidad = async (payload: LocalidadInput) =>
  (await api.post<Localidad>("/localidades", payload)).data;

export const updateLocalidad = async (id: number, payload: Partial<LocalidadInput>) =>
  (await api.put<Localidad>(`/localidades/${id}`, payload)).data;

export const deleteLocalidad = async (id: number) => {
  await api.delete(`/localidades/${id}`);
};
