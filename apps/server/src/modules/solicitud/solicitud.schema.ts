import { z } from "zod";

export const SolicitudEstadoEnum = z.enum([
  "pendiente",
  "aceptada",
  "rechazada",
  "completada",
]);

export const SolicitudInsumoProveedorEnum = z.enum(["CLIENTE", "PRESTAMISTA"]);

export const SolicitudIdSchema = z.object({
  id: z.coerce.bigint().positive(),
});

export const SolicitudQuerySchema = z.object({
  estado: SolicitudEstadoEnum.optional(),
  // Solo aplican para ADMIN; para CLIENTE/PRESTAMISTA se fuerza el propio id.
  id_cliente: z.coerce.bigint().positive().optional(),
  id_prestamista: z.coerce.bigint().positive().optional(),
});

export const SolicitudInsumoInputSchema = z.object({
  id_insumo: z.coerce.bigint().positive(),
  cantidad: z.coerce.number().positive(),
  precio_unit: z.coerce.number().nonnegative(),
  proveedor: SolicitudInsumoProveedorEnum,
});

/**
 * El cliente se toma del token y el prestamista del servicio elegido;
 * el precio del servicio se calcula con el precio vigente × hectáreas.
 */
export const CreateSolicitudInputSchema = z
  .object({
    id_servicio: z.coerce.bigint().positive(),
    id_campo: z.coerce.bigint().positive(),
    hectareas_trabajadas: z.coerce.number().positive(),
    fecha_inicio: z.coerce.date().optional().nullable(),
    fecha_fin: z.coerce.date().optional().nullable(),
    insumos: z.array(SolicitudInsumoInputSchema).default([]),
  })
  .refine(
    (d) => !d.fecha_inicio || !d.fecha_fin || d.fecha_fin >= d.fecha_inicio,
    { message: "La fecha de fin debe ser posterior a la de inicio", path: ["fecha_fin"] },
  );

export const UpdateSolicitudEstadoSchema = z.object({
  estado: SolicitudEstadoEnum,
  fecha_inicio: z.coerce.date().optional().nullable(),
  fecha_fin: z.coerce.date().optional().nullable(),
});

export type SolicitudEstado = z.infer<typeof SolicitudEstadoEnum>;
export type CreateSolicitudInput = z.infer<typeof CreateSolicitudInputSchema>;
export type UpdateSolicitudEstadoInput = z.infer<typeof UpdateSolicitudEstadoSchema>;
export type SolicitudQuery = z.infer<typeof SolicitudQuerySchema>;
