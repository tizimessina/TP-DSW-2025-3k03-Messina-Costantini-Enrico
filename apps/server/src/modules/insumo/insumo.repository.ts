import { prisma } from "@repo/db";

export const insumoRepo = {
  list: (q?: string) =>
    prisma.insumo.findMany({
      where: q ? { OR: [{ nombre: { contains: q } }, { descripcion: { contains: q } }] } : undefined,
      orderBy: { nombre: 'asc' },
    }),

  getById: (id: bigint) => prisma.insumo.findUnique({ where: { id_insumo: id } }),

  getManyByIds: (ids: bigint[]) => prisma.insumo.findMany({ where: { id_insumo: { in: ids } } }),

  create: (data: { nombre: string; descripcion?: string | null; unidad: string; precio_referencia: number }) =>
    prisma.insumo.create({ data }),

  update: (id: bigint, data: Partial<{ nombre: string; descripcion: string | null; unidad: string; precio_referencia: number }>) =>
    prisma.insumo.update({ where: { id_insumo: id }, data }),

  remove: (id: bigint) => prisma.insumo.delete({ where: { id_insumo: id } }),
};
