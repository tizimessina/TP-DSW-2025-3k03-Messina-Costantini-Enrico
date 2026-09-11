import { z } from "zod";

export const ValoracionCreateSchema = z.object({
  id_solicitud: z.coerce.bigint().positive(),
  puntaje: z.coerce.number().int().min(1).max(5),
  comentario: z.string().trim().max(500).optional().nullable(),
});

export const ValoracionQuerySchema = z
  .object({
    id_contratista: z.coerce.bigint().positive().optional(),
    id_servicio: z.coerce.bigint().positive().optional(),
  })
  .refine((q) => q.id_contratista || q.id_servicio, { message: "Indicá id_contratista o id_servicio" });

export type ValoracionCreateDTO = z.infer<typeof ValoracionCreateSchema>;
export type ValoracionQuery = z.infer<typeof ValoracionQuerySchema>;
