import { z } from "zod";

export const ServicioIdSchema = z.object({
  id: z.coerce.bigint(),
});

export const ServicioQuerySchema = z.object({
  q: z.string().trim().optional(),
  id_categoria: z.coerce.bigint().positive().optional(),
  id_prestamista: z.coerce.bigint().positive().optional(),
});

export const ServicioCreateSchema = z.object({
  nombre: z.string().min(2).max(120),
  descripcion: z.string().max(255).optional().nullable(),
  id_categoria: z.coerce.bigint(),
  // Solo lo puede indicar un ADMIN; para un PRESTAMISTA se toma del token.
  id_prestamista: z.coerce.bigint().optional(),
  // Precio inicial opcional (permite "publicar servicio" en un solo paso).
  precio_inicial: z.coerce.number().positive().optional(),
});

export const ServicioUpdateSchema = z.object({
  nombre: z.string().min(2).max(120).optional(),
  descripcion: z.string().max(255).optional().nullable(),
  id_categoria: z.coerce.bigint().optional(),
  id_prestamista: z.coerce.bigint().optional(),
});

export type ServicioCreateDTO = z.infer<typeof ServicioCreateSchema>;
export type ServicioUpdateDTO = z.infer<typeof ServicioUpdateSchema>;
