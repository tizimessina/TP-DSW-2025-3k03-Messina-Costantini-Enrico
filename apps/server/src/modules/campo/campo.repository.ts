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

  /**
   * Ficha histórica del campo: qué se le hizo y cuánto costó. Solo cuentan las
   * solicitudes completadas, que son las únicas que representan trabajo hecho y
   * plata gastada.
   */
  resumenHistorico: async (id_campo: bigint) => {
    const [completadas, porEstado, ultima] = await Promise.all([
      prisma.solicitud.aggregate({
        where: { id_campo, estado: "completada" },
        _sum: { hectareas_trabajadas: true, precio_total: true },
        _count: { _all: true },
      }),
      prisma.solicitud.groupBy({ by: ["estado"], where: { id_campo }, _count: { _all: true } }),
      prisma.solicitud.findFirst({
        where: { id_campo, estado: "completada" },
        orderBy: [{ fecha_fin: "desc" }, { id_solicitud: "desc" }],
        select: { id_solicitud: true, fecha_fin: true, servicio: { select: { nombre: true } } },
      }),
    ]);
    return {
      trabajos_completados: completadas._count._all,
      hectareas_trabajadas: Number(completadas._sum.hectareas_trabajadas ?? 0),
      total_invertido: Number(completadas._sum.precio_total ?? 0),
      por_estado: Object.fromEntries(porEstado.map((e) => [e.estado, e._count._all])),
      ultimo_trabajo: ultima,
    };
  },

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
