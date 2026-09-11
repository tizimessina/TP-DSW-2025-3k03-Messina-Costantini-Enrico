import { z } from "zod";
import { PaginationQuerySchema } from "../../core/http/pagination.js";

export const NotificacionIdSchema = z.object({ id: z.coerce.bigint().positive() });

export const NotificacionQuerySchema = PaginationQuerySchema.extend({
  /** Solo las pendientes de leer. */
  no_leidas: z.coerce.boolean().optional(),
});

export type NotificacionQuery = z.infer<typeof NotificacionQuerySchema>;
