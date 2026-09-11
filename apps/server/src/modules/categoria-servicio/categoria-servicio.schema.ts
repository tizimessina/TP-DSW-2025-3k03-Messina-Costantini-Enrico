import { z } from "zod";

export const CategoriaServicioIdSchema = z.object({ id: z.coerce.bigint().positive() });
export const CategoriaServicioQuerySchema = z.object({ q: z.string().trim().max(120).optional() });

export const CategoriaServicioCreateSchema = z.object({
  nombre: z.string().trim().min(2).max(120),
  descripcion: z.string().trim().max(255).optional().nullable(),
});

export const CategoriaServicioUpdateSchema = CategoriaServicioCreateSchema.partial();

export type CategoriaServicioCreateDTO = z.infer<typeof CategoriaServicioCreateSchema>;
export type CategoriaServicioUpdateDTO = z.infer<typeof CategoriaServicioUpdateSchema>;
