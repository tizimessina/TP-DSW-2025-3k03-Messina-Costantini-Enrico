import { prisma } from "@repo/db";
import { publicUserSelect } from "../../core/db/selects.js";

const campoInclude = {
  cliente_profile: { include: { users: { select: publicUserSelect } } },
};

export const campoRepo = {
  list: (q?: string, id_cliente?: bigint, page?: number, pageSize?: number) => {
    const where = {
      ...(q ? { coordenadas: { contains: q } } : {}),
      ...(id_cliente ? { id_cliente } : {}),
    };

    const p = Number(page), ps = Number(pageSize);
    const hasPaging = Number.isFinite(p) && Number.isFinite(ps) && p > 0 && ps > 0;

    return prisma.campo.findMany({
      where,
      ...(hasPaging ? { skip: (p - 1) * ps, take: ps } : {}),
      orderBy: { id_campo: "desc" },
      include: campoInclude,
    });
  },

  getById: (id: bigint) =>
    prisma.campo.findUnique({
      where: { id_campo: id },
      include: {
        ...campoInclude,
        solicitud: {
          orderBy: { fecha_solicitud: "desc" },
          include: { servicio: { select: { id_servicio: true, nombre: true } } },
        },
      },
    }),

  create: (data: { id_cliente: bigint; coordenadas: string; hectareas: number }) =>
    prisma.campo.create({
      data,
      include: campoInclude,
    }),

  update: (id: bigint, data: { coordenadas?: string; hectareas?: number }) =>
    prisma.campo.update({
      where: { id_campo: id },
      data: {
        ...(data.coordenadas !== undefined ? { coordenadas: data.coordenadas } : {}),
        ...(data.hectareas !== undefined ? { hectareas: data.hectareas } : {}),
      },
      include: campoInclude,
    }),

  remove: (id: bigint) => prisma.campo.delete({ where: { id_campo: id } }),
};
