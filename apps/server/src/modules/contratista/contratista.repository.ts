import { prisma, type Prisma } from "@repo/db";
import { publicUserSelect } from "../../core/db/selects.js";
import { todayCivil } from "../../core/util/dates.js";

const precioVigenteInclude = { where: { fecha_desde: { lte: todayCivil() } }, orderBy: { fecha_desde: "desc" as const }, take: 1 };

export const contratistaRepo = {
  list: async (where: Prisma.contratista_profileWhereInput, skip: number, take: number) => {
    const [items, total] = await Promise.all([
      prisma.contratista_profile.findMany({
        where,
        skip,
        take,
        orderBy: { users: { apellido: "asc" } },
        include: {
          users: { select: publicUserSelect },
          servicio: { where: { activo: true }, include: { categoria: true, precio: precioVigenteInclude } },
          _count: { select: { solicitud: { where: { estado: "completada" } } } },
        },
      }),
      prisma.contratista_profile.count({ where }),
    ]);
    return { items, total };
  },

  getById: (id: bigint) =>
    prisma.contratista_profile.findUnique({
      where: { id_user: id },
      include: {
        users: { select: publicUserSelect },
        servicio: { where: { activo: true }, include: { categoria: true, precio: precioVigenteInclude }, orderBy: { nombre: "asc" } },
        _count: { select: { solicitud: { where: { estado: "completada" } } } },
      },
    }),

  /** Promedio y cantidad de valoraciones por contratista (para una lista de ids). */
  valoracionStats: async (ids: bigint[]) => {
    if (!ids.length) return new Map<bigint, { promedio: number | null; cantidad: number }>();
    const rows = await prisma.valoracion.groupBy({
      by: ["id_solicitud"],
      where: { solicitud: { id_contratista: { in: ids } } },
      _avg: { puntaje: true },
    });
    // groupBy no permite agrupar por relación: resolvemos el contratista de cada solicitud
    const sols = await prisma.solicitud.findMany({
      where: { id_solicitud: { in: rows.map((r) => r.id_solicitud) } },
      select: { id_solicitud: true, id_contratista: true },
    });
    const byContratista = new Map<bigint, number[]>();
    for (const r of rows) {
      const s = sols.find((x) => x.id_solicitud === r.id_solicitud);
      if (!s) continue;
      byContratista.set(s.id_contratista, [...(byContratista.get(s.id_contratista) ?? []), Number(r._avg.puntaje ?? 0)]);
    }
    const out = new Map<bigint, { promedio: number | null; cantidad: number }>();
    for (const id of ids) {
      const v = byContratista.get(id) ?? [];
      out.set(id, { promedio: v.length ? Math.round((v.reduce((a, b) => a + b, 0) / v.length) * 10) / 10 : null, cantidad: v.length });
    }
    return out;
  },

  /** Marca o desmarca la insignia; la fecha queda registrada para poder auditarla. */
  setVerificado: (id_user: bigint, verificado: boolean) =>
    prisma.contratista_profile.update({
      where: { id_user },
      data: { verificado, verificado_at: verificado ? new Date() : null },
      include: { users: { select: publicUserSelect } },
    }),

  campoUbicacion: (id_campo: bigint) =>
    prisma.campo.findUnique({ where: { id_campo }, select: { id_localidad: true, localidad: { select: { id_provincia: true } } } }),
};
