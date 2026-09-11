import { z } from "zod";
import { PaginationQuerySchema } from "../../core/http/pagination.js";

export const ContratistaParamsSchema = z.object({ id: z.coerce.bigint().positive() });

export const ContratistaQuerySchema = PaginationQuerySchema.extend({
  q: z.string().trim().max(120).optional(),
  id_localidad: z.coerce.bigint().positive().optional(),
  id_provincia: z.coerce.bigint().positive().optional(),
  /** Cercanía: filtra por la localidad (o provincia) del campo indicado. */
  id_campo: z.coerce.bigint().positive().optional(),
  id_categoria: z.coerce.bigint().positive().optional(),
});

export type ContratistaQuery = z.infer<typeof ContratistaQuerySchema>;
