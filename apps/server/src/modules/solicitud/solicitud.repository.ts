import { prisma } from '@repo/db';
import { publicUserSelect } from '../../core/db/selects.js';
import type { SolicitudEstado } from './solicitud.schema.js';

const listInclude = {
  servicio: { select: { id_servicio: true, nombre: true, categoria: true } },
  campo: { select: { id_campo: true, coordenadas: true, hectareas: true } },
  cliente_profile: { include: { users: { select: publicUserSelect } } },
  prestamista_profile: { include: { users: { select: publicUserSelect } } },
};

const detailInclude = {
  servicio: {
    include: {
      categoria: true,
      prestamista_profile: { include: { users: { select: publicUserSelect } } },
    },
  },
  campo: true,
  cliente_profile: { include: { users: { select: publicUserSelect } } },
  prestamista_profile: { include: { users: { select: publicUserSelect } } },
  solicitud_insumo: { include: { insumo: true } },
};

export type SolicitudCreateData = {
  id_servicio: bigint;
  id_cliente: bigint;
  id_prestamista: bigint;
  id_campo: bigint;
  hectareas_trabajadas: number;
  precio_servicio: number;
  costo_insumos: number;
  precio_total: number;
  fecha_inicio: Date | null;
  fecha_fin: Date | null;
  insumos: { id_insumo: bigint; cantidad: number; precio_unit: number; proveedor: 'CLIENTE' | 'PRESTAMISTA' }[];
};

export const solicitudRepo = {
  list: (where: { estado?: SolicitudEstado; id_cliente?: bigint; id_prestamista?: bigint }) =>
    prisma.solicitud.findMany({
      where: {
        ...(where.estado ? { estado: where.estado } : {}),
        ...(where.id_cliente ? { id_cliente: where.id_cliente } : {}),
        ...(where.id_prestamista ? { id_prestamista: where.id_prestamista } : {}),
      },
      orderBy: { fecha_solicitud: 'desc' },
      include: listInclude,
    }),

  getById: (id: bigint) =>
    prisma.solicitud.findUnique({
      where: { id_solicitud: id },
      include: detailInclude,
    }),

  create: (data: SolicitudCreateData) =>
    prisma.solicitud.create({
      data: {
        id_servicio: data.id_servicio,
        id_cliente: data.id_cliente,
        id_prestamista: data.id_prestamista,
        id_campo: data.id_campo,
        hectareas_trabajadas: data.hectareas_trabajadas,
        precio_servicio: data.precio_servicio,
        costo_insumos: data.costo_insumos,
        precio_total: data.precio_total,
        estado: 'pendiente',
        fecha_inicio: data.fecha_inicio,
        fecha_fin: data.fecha_fin,
        solicitud_insumo: { create: data.insumos },
      },
      include: detailInclude,
    }),

  updateEstado: (
    id: bigint,
    data: { estado: SolicitudEstado; fecha_inicio?: Date | null; fecha_fin?: Date | null },
  ) =>
    prisma.solicitud.update({
      where: { id_solicitud: id },
      data: {
        estado: data.estado,
        ...(data.fecha_inicio !== undefined ? { fecha_inicio: data.fecha_inicio } : {}),
        ...(data.fecha_fin !== undefined ? { fecha_fin: data.fecha_fin } : {}),
      },
      include: detailInclude,
    }),

  delete: (id: bigint) => prisma.solicitud.delete({ where: { id_solicitud: id } }),
};
