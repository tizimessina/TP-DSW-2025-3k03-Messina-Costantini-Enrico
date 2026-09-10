import { z } from "zod";

export const ClienteCreateSchema = z.object({
  id_user: z.coerce.bigint().positive(),
  cuit: z.string().max(20).optional().nullable(),
});

export const ClienteUpdateSchema = z.object({
  cuit: z.string().max(20).optional().nullable(),
});
export const ClienteParamsSchema = z.object({ id: z.coerce.bigint().positive() });

export type ClienteCreateDto = z.infer<typeof ClienteCreateSchema>;
export type ClienteUpdateDto = z.infer<typeof ClienteUpdateSchema>;
