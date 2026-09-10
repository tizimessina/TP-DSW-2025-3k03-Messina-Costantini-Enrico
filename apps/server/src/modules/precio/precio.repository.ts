import { prisma } from "@repo/db";

export const precioRepo = {
  // Listar precios del servicio (histórico)
  listByServicio: (id_servicio: bigint) =>
    prisma.precio.findMany({
      where: { id_servicio },
      orderBy: [{ fecha_desde: 'desc' }],
    }),

  /** Precio vigente: el de mayor fecha_desde que no sea futura respecto a `fecha`. */
  findVigente: (id_servicio: bigint, fecha: Date = new Date()) =>
    prisma.precio.findFirst({
      where: { id_servicio, fecha_desde: { lte: fecha } },
      orderBy: { fecha_desde: 'desc' },
    }),

  getById: (id: bigint) =>
    prisma.precio.findUnique({
      where: { id_precio: id },
      include: { servicio: { select: { id_servicio: true, id_prestamista: true, nombre: true } } },
    }),

  create: (data: { id_servicio: bigint; fecha_desde: Date; valor: number }) =>
    prisma.precio.create({
      data: {
        id_servicio: data.id_servicio,
        fecha_desde: data.fecha_desde,
        valor: data.valor,
      },
    }),

  update: (id: bigint, data: { fecha_desde?: Date; valor?: number }) =>
    prisma.precio.update({
      where: { id_precio: id },
      data: {
        ...(data.fecha_desde !== undefined ? { fecha_desde: data.fecha_desde } : {}),
        ...(data.valor !== undefined ? { valor: data.valor } : {}),
      },
    }),

  remove: (id: bigint) =>
    prisma.precio.delete({
      where: { id_precio: id },
    }),
};
