import { prisma, type Prisma } from '@repo/db';
import { contactUserSelect, publicUserSelect } from '../../core/db/selects.js';
import type { SolicitudEstado } from './solicitud.schema.js';

/** Listado: contrapartes sin datos de contacto. */
const listInclude = {
  servicio: { select: { id_servicio: true, nombre: true, categoria: true } },
  campo: { select: { id_campo: true, nombre: true, hectareas: true, localidad: { include: { provincia: true } } } },
  productor_profile: { include: { users: { select: publicUserSelect } } },
  contratista_profile: { include: { users: { select: publicUserSelect } } },
  valoracion: { select: { puntaje: true } },
} satisfies Prisma.solicitudInclude;

/** Detalle: las dos partes de la solicitud ven el contacto de la otra. */
const detailInclude = {
  servicio: { include: { categoria: true } },
  campo: { include: { localidad: { include: { provincia: true } } } },
  productor_profile: { include: { users: { select: contactUserSelect } } },
  contratista_profile: { include: { users: { select: contactUserSelect } } },
  solicitud_insumo: { include: { insumo: true } },
  valoracion: true,
} satisfies Prisma.solicitudInclude;

export type SolicitudCreateData = {
  id_servicio: bigint;
  id_productor: bigint;
  id_contratista: bigint;
  id_campo: bigint;
  hectareas_trabajadas: number;
  precio_hectarea: number;
  precio_servicio: number;
  costo_insumos: number;
  precio_total: number;
  fecha_inicio: Date | null;
  fecha_fin: Date | null;
  observaciones: string | null;
  insumos: { id_insumo: bigint; cantidad: number; precio_unit: number; proveedor: 'PRODUCTOR' | 'CONTRATISTA' }[];
};

export const solicitudRepo = {
  list: async (where: Prisma.solicitudWhereInput, skip: number, take: number) => {
    const [items, total] = await Promise.all([
      prisma.solicitud.findMany({ where, skip, take, orderBy: { fecha_solicitud: 'desc' }, include: listInclude }),
      prisma.solicitud.count({ where }),
    ]);
    return { items, total };
  },

  getById: (id: bigint) => prisma.solicitud.findUnique({ where: { id_solicitud: id }, include: detailInclude }),

  create: (data: SolicitudCreateData) => {
    const { insumos, ...rest } = data;
    return prisma.solicitud.create({
      data: { ...rest, estado: 'pendiente', solicitud_insumo: { create: insumos } },
      include: detailInclude,
    });
  },

  updateEstado: (id: bigint, data: { estado: SolicitudEstado; fecha_inicio?: Date | null; fecha_fin?: Date | null; motivo?: string | null }) =>
    prisma.solicitud.update({ where: { id_solicitud: id }, data, include: detailInclude }),

  delete: (id: bigint) => prisma.solicitud.delete({ where: { id_solicitud: id } }),
};
