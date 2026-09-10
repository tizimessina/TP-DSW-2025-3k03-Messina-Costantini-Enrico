import { prisma } from "@repo/db";
import { publicUserSelect } from "../../core/db/selects.js";

export const prestamistaRepo = {
  /** Listado público con filtro opcional por localidad o provincia del prestamista. */
  list: (filters?: { id_localidad?: bigint; id_provincia?: bigint; q?: string }) =>
    prisma.prestamista_profile.findMany({
      where: {
        users: {
          ...(filters?.id_localidad ? { id_localidad: filters.id_localidad } : {}),
          ...(filters?.id_provincia ? { localidad: { id_provincia: filters.id_provincia } } : {}),
          ...(filters?.q
            ? {
                OR: [
                  { nombre: { contains: filters.q } },
                  { apellido: { contains: filters.q } },
                ],
              }
            : {}),
        },
      },
      orderBy: { id_user: "asc" },
      include: {
        users: { select: publicUserSelect },
        servicio: { include: { categoria: true } },
      },
    }),

  getById: (id: bigint) =>
    prisma.prestamista_profile.findUnique({
      where: { id_user: id },
      include: {
        users: { select: publicUserSelect },
        servicio: {
          include: {
            categoria: true,
            precio: { orderBy: { fecha_desde: "desc" }, take: 1 },
          },
        },
      },
    }),

  create: (data: { id_user: bigint; cuit?: string | null }) =>
    prisma.prestamista_profile.create({
      data: { id_user: data.id_user, cuit: data.cuit ?? null },
      include: { users: { select: publicUserSelect } },
    }),

  update: (id: bigint, data: { cuit?: string | null }) =>
    prisma.prestamista_profile.update({
      where: { id_user: id },
      data: { ...(data.cuit !== undefined ? { cuit: data.cuit } : {}) },
      include: { users: { select: publicUserSelect } },
    }),

  remove: (id: bigint) => prisma.prestamista_profile.delete({ where: { id_user: id } }),
};
