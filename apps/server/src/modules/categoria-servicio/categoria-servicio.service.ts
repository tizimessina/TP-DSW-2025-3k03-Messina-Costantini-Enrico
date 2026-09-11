import { conflict, notFound, translatePrisma } from "../../core/errors/errors.js";
import { categoriaServicioRepo } from "./categoria-servicio.repository.js";
import type { CategoriaServicioCreateDTO, CategoriaServicioUpdateDTO } from "./categoria-servicio.schema.js";

const DUP = conflict("DUPLICATE", "Ya existe una categoría con ese nombre");
const NF = notFound("Categoría no encontrada");

export const categoriaServicioService = {
  list: (q?: string) => categoriaServicioRepo.list(q),

  getById: async (id: bigint) => {
    const cat = await categoriaServicioRepo.getById(id);
    if (!cat) throw NF;
    return cat;
  },

  create: (dto: CategoriaServicioCreateDTO) => categoriaServicioRepo.create(dto).catch((e) => translatePrisma(e, { P2002: DUP })),

  update: (id: bigint, dto: CategoriaServicioUpdateDTO) =>
    categoriaServicioRepo.update(id, dto).catch((e) => translatePrisma(e, { P2025: NF, P2002: DUP })),

  remove: async (id: bigint) => {
    await categoriaServicioRepo
      .remove(id)
      .catch((e) => translatePrisma(e, { P2025: NF, P2003: conflict("IN_USE", "No se puede eliminar: existen servicios en esta categoría") }));
    return { ok: true };
  },
};
