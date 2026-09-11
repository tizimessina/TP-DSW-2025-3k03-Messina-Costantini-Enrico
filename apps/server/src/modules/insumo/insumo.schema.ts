import { z } from "zod";

export const InsumoIdSchema = z.object({ id: z.coerce.bigint().positive() });
export const InsumoQuerySchema = z.object({ q: z.string().trim().max(120).optional() });

export const InsumoCreateSchema = z.object({
  nombre: z.string().trim().min(2).max(120),
  descripcion: z.string().trim().max(255).optional().nullable(),
  unidad: z.string().trim().min(1).max(20).default("unidad"),
  precio_referencia: z.coerce.number().nonnegative().max(999_999_999),
});

export const InsumoUpdateSchema = InsumoCreateSchema.partial();

export type InsumoCreateDTO = z.infer<typeof InsumoCreateSchema>;
export type InsumoUpdateDTO = z.infer<typeof InsumoUpdateSchema>;
