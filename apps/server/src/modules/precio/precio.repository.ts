import { prisma } from "@repo/db";
import { todayCivil } from "../../core/util/dates.js";

export const precioRepo = {
  listByServicio: (id_servicio: bigint) =>
    prisma.precio.findMany({ where: { id_servicio }, orderBy: [{ fecha_desde: 'desc' }] }),

  /** Precio vigente: mayor fecha_desde no futura. */
  findVigente: (id_servicio: bigint, fecha: Date = todayCivil()) =>
    prisma.precio.findFirst({ where: { id_servicio, fecha_desde: { lte: fecha } }, orderBy: { fecha_desde: 'desc' } }),

  countVigentes: (id_servicio: bigint) => prisma.precio.count({ where: { id_servicio, fecha_desde: { lte: todayCivil() } } }),

  getById: (id: bigint) =>
    prisma.precio.findUnique({
      where: { id_precio: id },
      include: { servicio: { select: { id_servicio: true, id_contratista: true, nombre: true, activo: true } } },
    }),

  create: (data: { id_servicio: bigint; fecha_desde: Date; valor: number }) => prisma.precio.create({ data }),

  update: (id: bigint, data: { fecha_desde?: Date; valor?: number }) => prisma.precio.update({ where: { id_precio: id }, data }),

  remove: (id: bigint) => prisma.precio.delete({ where: { id_precio: id } }),
};
