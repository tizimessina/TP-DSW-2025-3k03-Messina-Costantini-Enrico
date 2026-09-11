import { prisma } from "@repo/db";

export const categoriaServicioRepo = {
  list: (q?: string) =>
    prisma.categoria.findMany({
      where: q ? { OR: [{ nombre: { contains: q } }, { descripcion: { contains: q } }] } : undefined,
      orderBy: { nombre: 'asc' },
      include: { _count: { select: { servicio: { where: { activo: true } } } } },
    }),

  getById: (id: bigint) => prisma.categoria.findUnique({ where: { id_categoria: id } }),

  create: (data: { nombre: string; descripcion?: string | null }) => prisma.categoria.create({ data }),

  update: (id: bigint, data: Partial<{ nombre: string; descripcion: string | null }>) =>
    prisma.categoria.update({ where: { id_categoria: id }, data }),

  remove: (id: bigint) => prisma.categoria.delete({ where: { id_categoria: id } }),
};
