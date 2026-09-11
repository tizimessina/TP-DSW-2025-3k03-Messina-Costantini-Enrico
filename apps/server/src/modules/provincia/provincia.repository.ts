import { prisma } from "@repo/db";

export const provinciaRepo = {
  list: (q?: string) =>
    prisma.provincia.findMany({
      where: q ? { nombre: { contains: q } } : undefined,
      orderBy: { nombre: 'asc' },
      include: { _count: { select: { localidad: true } } },
    }),

  getById: (id: bigint) =>
    prisma.provincia.findUnique({ where: { id_provincia: id }, include: { localidad: { orderBy: { nombre: 'asc' } } } }),

  create: (data: { nombre: string }) => prisma.provincia.create({ data }),

  update: (id: bigint, data: { nombre: string }) => prisma.provincia.update({ where: { id_provincia: id }, data }),

  remove: (id: bigint) => prisma.provincia.delete({ where: { id_provincia: id } }),

  countLocalidades: (id: bigint) => prisma.localidad.count({ where: { id_provincia: id } }),
};
