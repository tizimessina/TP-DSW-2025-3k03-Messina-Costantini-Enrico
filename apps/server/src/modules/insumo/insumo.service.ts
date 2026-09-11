import { conflict, notFound, translatePrisma } from "../../core/errors/errors.js";
import { insumoRepo } from "./insumo.repository.js";
import type { InsumoCreateDTO, InsumoUpdateDTO } from "./insumo.schema.js";

const DUP = conflict("DUPLICATE", "Ya existe un insumo con ese nombre");
const NF = notFound("Insumo no encontrado");

export const insumoService = {
  list: (q?: string) => insumoRepo.list(q),

  getById: async (id: bigint) => {
    const row = await insumoRepo.getById(id);
    if (!row) throw NF;
    return row;
  },

  create: (dto: InsumoCreateDTO) => insumoRepo.create(dto).catch((e) => translatePrisma(e, { P2002: DUP })),

  update: (id: bigint, dto: InsumoUpdateDTO) => insumoRepo.update(id, dto).catch((e) => translatePrisma(e, { P2025: NF, P2002: DUP })),

  remove: async (id: bigint) => {
    await insumoRepo
      .remove(id)
      .catch((e) => translatePrisma(e, { P2025: NF, P2003: conflict("IN_USE", "No se puede eliminar: hay solicitudes que usan este insumo") }));
    return { ok: true };
  },
};
