import { prisma, type Prisma } from "@repo/db";
import { publicUserSelect } from "../../core/db/selects.js";

const campoInclude = {
  localidad: { include: { provincia: true } },
  productor_profile: { include: { users: { select: publicUserSelect } } },
  _count: { select: { solicitud: true } },
} satisfies Prisma.campoInclude;

export const campoRepo = {
  list: (where: Prisma.campoWhereInput) =>
    prisma.campo.findMany({ where, orderBy: { nombre: "asc" }, include: campoInclude }),

  getById: (id: bigint) =>
    prisma.campo.findUnique({
      where: { id_campo: id },
      include: {
        ...campoInclude,
        solicitud: {
          orderBy: { fecha_solicitud: "desc" },
          include: {
            servicio: { select: { id_servicio: true, nombre: true, categoria: { select: { nombre: true } } } },
            contratista_profile: { include: { users: { select: publicUserSelect } } },
          },
        },
      },
    }),

  /** Mayor superficie comprometida en solicitudes vivas (pendientes o aceptadas). */
  maxHectareasComprometidas: async (id_campo: bigint) => {
    const r = await prisma.solicitud.aggregate({
      where: { id_campo, estado: { in: ["pendiente", "aceptada"] } },
      _max: { hectareas_trabajadas: true },
    });
    return Number(r._max.hectareas_trabajadas ?? 0);
  },

  create: (data: Prisma.campoUncheckedCreateInput) => prisma.campo.create({ data, include: campoInclude }),

  update: (id: bigint, data: Prisma.campoUncheckedUpdateInput) =>
    prisma.campo.update({ where: { id_campo: id }, data, include: campoInclude }),

  remove: (id: bigint) => prisma.campo.delete({ where: { id_campo: id } }),
};
