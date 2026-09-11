import { prisma, type Prisma } from "@repo/db";

/** Datos mínimos para que el aviso pueda enlazar a la solicitud. */
const select = {
  id_notificacion: true,
  id_solicitud: true,
  titulo: true,
  cuerpo: true,
  leida_at: true,
  created_at: true,
} satisfies Prisma.notificacionSelect;

export const notificacionRepo = {
  list: async (id_user: bigint, soloNoLeidas: boolean, skip: number, take: number) => {
    const where: Prisma.notificacionWhereInput = { id_user, ...(soloNoLeidas ? { leida_at: null } : {}) };
    const [items, total, no_leidas] = await Promise.all([
      prisma.notificacion.findMany({ where, select, orderBy: { id_notificacion: "desc" }, skip, take }),
      prisma.notificacion.count({ where }),
      prisma.notificacion.count({ where: { id_user, leida_at: null } }),
    ]);
    return { items, total, no_leidas };
  },

  contarNoLeidas: (id_user: bigint) => prisma.notificacion.count({ where: { id_user, leida_at: null } }),

  /** Marca una sola, siempre acotada al dueño para que nadie lea las ajenas. */
  marcarLeida: (id_user: bigint, id_notificacion: bigint) =>
    prisma.notificacion.updateMany({ where: { id_notificacion, id_user, leida_at: null }, data: { leida_at: new Date() } }),

  marcarTodasLeidas: (id_user: bigint) =>
    prisma.notificacion.updateMany({ where: { id_user, leida_at: null }, data: { leida_at: new Date() } }),
};
