import { z } from 'zod';

export const ProvinciaCreateSchema = z.object({
  nombre: z.string().trim().min(2).max(120),
});
export const ProvinciaUpdateSchema = ProvinciaCreateSchema;
export const ProvinciaParamsSchema = z.object({ id: z.coerce.bigint().positive() });
export const ProvinciaQuerySchema = z.object({ q: z.string().trim().max(120).optional() });

export type ProvinciaCreateDto = z.infer<typeof ProvinciaCreateSchema>;
export type ProvinciaUpdateDto = z.infer<typeof ProvinciaUpdateSchema>;
