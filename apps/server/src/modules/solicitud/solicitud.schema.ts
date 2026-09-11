import { z } from "zod";
import { PaginationQuerySchema } from "../../core/http/pagination.js";

export const SolicitudEstadoEnum = z.enum(["pendiente", "aceptada", "rechazada", "cancelada", "completada"]);
export const InsumoProveedorEnum = z.enum(["PRODUCTOR", "CONTRATISTA"]);

export const SolicitudIdSchema = z.object({ id: z.coerce.bigint().positive() });

export const SolicitudQuerySchema = PaginationQuerySchema.extend({
  estado: SolicitudEstadoEnum.optional(),
  /** Solo ADMIN. */
  id_productor: z.coerce.bigint().positive().optional(),
  id_contratista: z.coerce.bigint().positive().optional(),
  id_campo: z.coerce.bigint().positive().optional(),
});

/** El productor indica qué insumos y quién los aporta; el precio sale del catálogo. */
export const SolicitudInsumoInputSchema = z.object({
  id_insumo: z.coerce.bigint().positive(),
  cantidad: z.coerce.number().positive().max(1_000_000),
  proveedor: InsumoProveedorEnum,
});

const fechasCoherentes = (d: { fecha_inicio?: Date | null; fecha_fin?: Date | null }) =>
  !d.fecha_inicio || !d.fecha_fin || d.fecha_fin >= d.fecha_inicio;

export const CreateSolicitudInputSchema = z
  .object({
    id_servicio: z.coerce.bigint().positive(),
    id_campo: z.coerce.bigint().positive(),
    hectareas_trabajadas: z.coerce.number().positive().max(1_000_000),
    fecha_inicio: z.coerce.date().optional().nullable(),
    fecha_fin: z.coerce.date().optional().nullable(),
    observaciones: z.string().trim().max(500).optional().nullable(),
    insumos: z.array(SolicitudInsumoInputSchema).max(20).default([]),
  })
  .refine(fechasCoherentes, { message: "La fecha de fin debe ser posterior a la de inicio", path: ["fecha_fin"] })
  .refine((d) => new Set(d.insumos.map((i) => i.id_insumo.toString())).size === d.insumos.length, {
    message: "No repitas el mismo insumo",
    path: ["insumos"],
  });

/** Cambio de estado. `motivo` es obligatorio al rechazar o cancelar. */
export const UpdateSolicitudEstadoSchema = z
  .object({
    estado: z.enum(["aceptada", "rechazada", "cancelada", "completada"]),
    fecha_inicio: z.coerce.date().optional().nullable(),
    fecha_fin: z.coerce.date().optional().nullable(),
    motivo: z.string().trim().min(3).max(500).optional().nullable(),
  })
  .refine(fechasCoherentes, { message: "La fecha de fin debe ser posterior a la de inicio", path: ["fecha_fin"] })
  .refine((d) => !["rechazada", "cancelada"].includes(d.estado) || !!d.motivo, {
    message: "Indicá el motivo",
    path: ["motivo"],
  });

export type SolicitudEstado = z.infer<typeof SolicitudEstadoEnum>;
export type SolicitudQuery = z.infer<typeof SolicitudQuerySchema>;
export type CreateSolicitudInput = z.infer<typeof CreateSolicitudInputSchema>;
export type UpdateSolicitudEstadoInput = z.infer<typeof UpdateSolicitudEstadoSchema>;
