import { z } from "zod";

export const PrestamistaCreateSchema = z.object({
  id_user: z.coerce.bigint().positive(),          
  cuit: z.string().max(20).optional().nullable(),  
});

export const PrestamistaUpdateSchema = PrestamistaCreateSchema.partial();

export const PrestamistaQuerySchema = z.object({
  q: z.string().trim().optional(),
  id_localidad: z.coerce.bigint().positive().optional(),
  id_provincia: z.coerce.bigint().positive().optional(),
});

export const PrestamistaParamsSchema = z.object({
  id: z.coerce.bigint().positive(),                
});

export type PrestamistaCreateDto = z.infer<typeof PrestamistaCreateSchema>;
export type PrestamistaUpdateDto = z.infer<typeof PrestamistaUpdateSchema>;
