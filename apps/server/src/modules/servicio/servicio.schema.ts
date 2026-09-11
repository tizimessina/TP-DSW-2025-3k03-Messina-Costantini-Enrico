import { z } from "zod";
import { PaginationQuerySchema } from "../../core/http/pagination.js";

export const ServicioIdSchema = z.object({ id: z.coerce.bigint().positive() });

export const ServicioQuerySchema = PaginationQuerySchema.extend({
  q: z.string().trim().max(120).optional(),
  id_categoria: z.coerce.bigint().positive().optional(),
  id_contratista: z.coerce.bigint().positive().optional(),
  id_provincia: z.coerce.bigint().positive().optional(),
  id_localidad: z.coerce.bigint().positive().optional(),
  /** Solo el dueño o ADMIN pueden pedir inactivos. */
  incluir_inactivos: z.coerce.boolean().optional(),
});

export const ServicioCreateSchema = z.object({
  nombre: z.string().trim().min(2).max(120),
  descripcion: z.string().trim().max(500).optional().nullable(),
  id_categoria: z.coerce.bigint().positive(),
  /** Precio inicial por hectárea; permite publicar en un solo paso. */
  precio_inicial: z.coerce.number().positive().max(999_999_999).optional(),
});

/** El dueño (id_contratista) es inmutable. */
export const ServicioUpdateSchema = z.object({
  nombre: z.string().trim().min(2).max(120).optional(),
  descripcion: z.string().trim().max(500).optional().nullable(),
  id_categoria: z.coerce.bigint().positive().optional(),
  activo: z.boolean().optional(),
});

export type ServicioQuery = z.infer<typeof ServicioQuerySchema>;
export type ServicioCreateDTO = z.infer<typeof ServicioCreateSchema>;
export type ServicioUpdateDTO = z.infer<typeof ServicioUpdateSchema>;
