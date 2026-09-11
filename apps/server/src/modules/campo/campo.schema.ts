import { z } from "zod";

export const CampoIdSchema = z.object({ id: z.coerce.bigint().positive() });

export const CampoQuerySchema = z.object({
  q: z.string().trim().max(100).optional(),
  /** Solo ADMIN puede filtrar por otro productor. */
  id_productor: z.coerce.bigint().positive().optional(),
});

const Coordenadas = {
  latitud: z.coerce.number().min(-90).max(90).optional().nullable(),
  longitud: z.coerce.number().min(-180).max(180).optional().nullable(),
};

export const CampoCreateSchema = z
  .object({
    nombre: z.string().trim().min(2).max(100),
    id_localidad: z.coerce.bigint().positive(),
    hectareas: z.coerce.number().positive().max(1_000_000),
    ...Coordenadas,
    /** Solo ADMIN; para un PRODUCTOR se toma del token. */
    id_productor: z.coerce.bigint().positive().optional(),
  })
  .refine((c) => (c.latitud == null) === (c.longitud == null), { message: "Latitud y longitud van juntas", path: ["longitud"] });

export const CampoUpdateSchema = z
  .object({
    nombre: z.string().trim().min(2).max(100).optional(),
    id_localidad: z.coerce.bigint().positive().optional(),
    hectareas: z.coerce.number().positive().max(1_000_000).optional(),
    ...Coordenadas,
  })
  .refine((c) => (c.latitud === undefined && c.longitud === undefined) || (c.latitud == null) === (c.longitud == null), {
    message: "Latitud y longitud van juntas",
    path: ["longitud"],
  });

export type CampoQuery = z.infer<typeof CampoQuerySchema>;
export type CampoCreateDTO = z.infer<typeof CampoCreateSchema>;
export type CampoUpdateDTO = z.infer<typeof CampoUpdateSchema>;
