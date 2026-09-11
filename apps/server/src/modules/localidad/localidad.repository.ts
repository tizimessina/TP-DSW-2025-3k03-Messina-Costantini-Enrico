import { prisma } from "@repo/db";

export const localidadRepo = {
  list: (q?: string, id_provincia?: bigint) =>
    prisma.localidad.findMany({
      where: {
        ...(q ? { nombre: { contains: q } } : {}),
        ...(id_provincia ? { id_provincia } : {}),
      },
      orderBy: [{ provincia: { nombre: 'asc' } }, { nombre: 'asc' }],
      include: { provincia: true },
    }),

  getById: (id: bigint) =>
    prisma.localidad.findUnique({ where: { id_localidad: id }, include: { provincia: true } }),

  create: (data: { id_provincia: bigint; nombre: string; codigo_postal: string | null }) =>
    prisma.localidad.create({ data, include: { provincia: true } }),

  update: (id: bigint, data: { nombre?: string; codigo_postal?: string | null }) =>
    prisma.localidad.update({ where: { id_localidad: id }, data, include: { provincia: true } }),

  remove: (id: bigint) => prisma.localidad.delete({ where: { id_localidad: id } }),

  countUsage: async (id: bigint) => {
    const [users, campos] = await Promise.all([
      prisma.users.count({ where: { id_localidad: id } }),
      prisma.campo.count({ where: { id_localidad: id } }),
    ]);
    return { users, campos };
  },
};
