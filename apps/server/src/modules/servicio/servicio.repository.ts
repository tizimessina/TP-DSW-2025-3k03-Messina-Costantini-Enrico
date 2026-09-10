import { prisma } from '@repo/db';
import { publicUserSelect } from '../../core/db/selects.js';

const servicioInclude = {
  categoria: true,
  prestamista_profile: { include: { users: { select: publicUserSelect } } },
  // último precio cargado (el front lo muestra como "precio actual")
  precio: { orderBy: { fecha_desde: 'desc' as const }, take: 1 },
};

export const servicioRepo = {
  list: (q?: string, id_categoria?: bigint, id_prestamista?: bigint) =>
    prisma.servicio.findMany({
      where: {
        ...(q
          ? {
              OR: [
                { nombre: { contains: q } },
                { descripcion: { contains: q } },
              ],
            }
          : {}),
        ...(id_categoria ? { id_categoria } : {}),
        ...(id_prestamista ? { id_prestamista } : {}),
      },
      orderBy: [{ nombre: 'asc' }],
      include: servicioInclude,
    }),

  getById: (id: bigint) =>
    prisma.servicio.findUnique({
      where: { id_servicio: id },
      include: {
        ...servicioInclude,
        precio: { orderBy: { fecha_desde: 'desc' } }, // historial completo en el detalle
      },
    }),

  create: (data: {
    nombre: string;
    descripcion?: string | null;
    id_categoria: bigint;
    id_prestamista: bigint;
    precio_inicial?: number;
  }) =>
    prisma.servicio.create({
      data: {
        nombre: data.nombre,
        descripcion: data.descripcion ?? null,
        id_categoria: data.id_categoria,
        id_prestamista: data.id_prestamista,
        ...(data.precio_inicial
          ? { precio: { create: { fecha_desde: new Date(), valor: data.precio_inicial } } }
          : {}),
      },
      include: servicioInclude,
    }),

  update: (id: bigint, data: {
    nombre?: string;
    descripcion?: string | null;
    id_categoria?: bigint;
    id_prestamista?: bigint;
  }) =>
    prisma.servicio.update({
      where: { id_servicio: id },
      data: {
        ...(data.nombre !== undefined ? { nombre: data.nombre } : {}),
        ...(data.descripcion !== undefined ? { descripcion: data.descripcion } : {}),
        ...(data.id_categoria !== undefined ? { id_categoria: data.id_categoria } : {}),
        ...(data.id_prestamista !== undefined ? { id_prestamista: data.id_prestamista } : {}),
        updated_at: new Date(),
      },
      include: servicioInclude,
    }),

  remove: (id: bigint) =>
    prisma.servicio.delete({
      where: { id_servicio: id },
    }),
};
