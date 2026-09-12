import { z } from "zod";
import { PaginationQuerySchema } from "../../core/http/pagination.js";

export const ContratistaParamsSchema = z.object({ id: z.coerce.bigint().positive() });

export const ContratistaQuerySchema = PaginationQuerySchema.extend({
  q: z.string().trim().max(120).optional(),
  id_localidad: z.coerce.bigint().positive().optional(),
  id_provincia: z.coerce.bigint().positive().optional(),
  /** Cercanía: toma como origen la ubicación del campo indicado. */
  id_campo: z.coerce.bigint().positive().optional(),
  id_categoria: z.coerce.bigint().positive().optional(),
  /** Solo contratistas verificados por la administración. */
  verificado: z.coerce.boolean().optional(),
  /**
   * Radio de búsqueda en kilómetros alrededor del campo. Al indicarlo, el filtro
   * geográfico pasa a ser la distancia real y deja de ser la localidad.
   */
  radio_km: z.coerce.number().positive().max(500).optional(),
  /** Por distancia solo tiene efecto si hay un origen resoluble. */
  orden: z.enum(["distancia", "apellido"]).optional(),
});

/** Alta o baja de la insignia de verificado (solo ADMIN). */
export const VerificarSchema = z.object({ verificado: z.boolean() });

export type ContratistaQuery = z.infer<typeof ContratistaQuerySchema>;
