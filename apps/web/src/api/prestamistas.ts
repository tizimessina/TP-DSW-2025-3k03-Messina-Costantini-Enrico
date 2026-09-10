import { api } from "./base";
import type { CategoriaServicio } from "./categoriasServicio";
import type { Precio } from "./precios";
import type { UsuarioResumen } from "./servicios";

export type Prestamista = {
  id_user: number;
  cuit?: string | null;
  users: UsuarioResumen;
  servicio?: {
    id_servicio: number;
    nombre: string;
    descripcion?: string | null;
    categoria?: CategoriaServicio;
    precio?: Precio[];
  }[];
};

export const getPrestamistas = async (params?: { q?: string; id_localidad?: number; id_provincia?: number }) =>
  (await api.get<Prestamista[]>("/prestamistas", { params })).data;

export const getPrestamista = async (id: number) => (await api.get<Prestamista>(`/prestamistas/${id}`)).data;
