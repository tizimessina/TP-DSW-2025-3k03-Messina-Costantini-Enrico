import { z } from "zod";

export const PrecioIdSchema = z.object({ id: z.coerce.bigint().positive() });
export const PrecioServicioParamsSchema = z.object({ id_servicio: z.coerce.bigint().positive() });

const FechaDesde = z.coerce.date().refine(
  (d) => {
    const y = new Date().getUTCFullYear();
    return d.getUTCFullYear() >= y - 1 && d.getUTCFullYear() <= y + 1;
  },
  { message: "La fecha debe estar entre el año pasado y el próximo" },
);

export const PrecioCreateSchema = z.object({
  id_servicio: z.coerce.bigint().positive(),
  fecha_desde: FechaDesde,
  valor: z.coerce.number().positive().max(999_999_999),
});

export const PrecioUpdateSchema = z.object({
  fecha_desde: FechaDesde.optional(),
  valor: z.coerce.number().positive().max(999_999_999).optional(),
});

export type PrecioCreateDTO = z.infer<typeof PrecioCreateSchema>;
export type PrecioUpdateDTO = z.infer<typeof PrecioUpdateSchema>;
