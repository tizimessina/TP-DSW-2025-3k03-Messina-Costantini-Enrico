import { prisma } from "@repo/db";
import { publicUserSelect } from "../../core/db/selects.js";

export const clienteRepo = {
  list: () =>
    prisma.cliente_profile.findMany({
      include: { users: { select: publicUserSelect } },
      orderBy: { id_user: "asc" },
    }),

  getById: (id: bigint) =>
    prisma.cliente_profile.findUnique({
      where: { id_user: id },
      include: { users: { select: publicUserSelect }, campo: true },
    }),

  create: (data: { id_user: bigint; cuit?: string | null }) =>
    prisma.cliente_profile.create({
      data: { id_user: data.id_user, cuit: data.cuit ?? null },
      include: { users: { select: publicUserSelect } },
    }),

  update: (id: bigint, data: { cuit?: string | null }) =>
    prisma.cliente_profile.update({
      where: { id_user: id },
      data: { ...(data.cuit !== undefined ? { cuit: data.cuit } : {}) },
      include: { users: { select: publicUserSelect } },
    }),

  remove: (id: bigint) => prisma.cliente_profile.delete({ where: { id_user: id } }),
};
