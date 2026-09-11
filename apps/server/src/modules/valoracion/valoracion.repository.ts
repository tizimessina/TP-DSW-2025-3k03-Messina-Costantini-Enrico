import { prisma, type Prisma } from "@repo/db";
import { publicUserSelect } from "../../core/db/selects.js";
import type { EventoNuevo } from "../../core/events/eventos.js";

const include = {
  solicitud: {
    select: {
      id_solicitud: true,
      id_contratista: true,
      fecha_fin: true,
      servicio: { select: { id_servicio: true, nombre: true } },
      productor_profile: { include: { users: { select: publicUserSelect } } },
    },
  },
} satisfies Prisma.valoracionInclude;

async function listWhere(where: Prisma.valoracionWhereInput) {
  const [items, agg] = await Promise.all([
    prisma.valoracion.findMany({ where, orderBy: { fecha: "desc" }, include }),
    prisma.valoracion.aggregate({ where, _avg: { puntaje: true }, _count: { _all: true } }),
  ]);
  return { items, promedio: agg._avg.puntaje ? Math.round(agg._avg.puntaje * 10) / 10 : null, cantidad: agg._count._all };
}

export const valoracionRepo = {
  listByContratista: (id_contratista: bigint) => listWhere({ solicitud: { id_contratista } }),
  listByServicio: (id_servicio: bigint) => listWhere({ solicitud: { id_servicio } }),
  getBySolicitud: (id_solicitud: bigint) => prisma.valoracion.findUnique({ where: { id_solicitud } }),
  /** La valoración y su entrada en el historial se escriben juntas. */
  create: (data: { id_solicitud: bigint; puntaje: number; comentario: string | null }, evento: EventoNuevo) =>
    prisma.$transaction(async (tx) => {
      const row = await tx.valoracion.create({ data, include });
      await tx.solicitud_evento.create({ data: { ...evento, id_solicitud: data.id_solicitud } });
      return row;
    }),
};
