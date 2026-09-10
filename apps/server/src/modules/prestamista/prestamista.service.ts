import { prestamistaRepo } from "./prestamista.repository.js";
import type {
  PrestamistaCreateDto,
  PrestamistaUpdateDto,
} from "./prestamista.schema.js";

export const prestamistaService = {
  list: (filters?: { id_localidad?: bigint; id_provincia?: bigint; q?: string }) =>
    prestamistaRepo.list(filters),

  get: async (id: bigint) => {
    const p = await prestamistaRepo.getById(id);
    if (!p) throw { status: 404, code: "NOT_FOUND", message: "Prestamista no encontrado" };
    return p;
  },

  create: async (dto: PrestamistaCreateDto) => {
    try {
      return await prestamistaRepo.create({
        id_user: dto.id_user,
        cuit: dto.cuit ?? null,
      });
    } catch (e: any) {
      if (e.code === "P2003") {
        // FK inválida (users inexistente)
        throw { status: 400, code: "FK_INVALID", message: "Usuario inexistente" };
      }
      // P2002 si ya existe un perfil para ese id_user (PK duplicada)
      if (e.code === "P2002") {
        throw { status: 409, code: "DUPLICATE", message: "El usuario ya tiene perfil de prestamista" };
      }
      throw e;
    }
  },

  update: async (id: bigint, dto: PrestamistaUpdateDto) => {
    await prestamistaService.get(id); // 404 si no existe
    return prestamistaRepo.update(id, {
      cuit: dto.cuit ?? (dto.cuit === null ? null : undefined),
    });
  },

  remove: async (id: bigint) => {
    await prestamistaService.get(id);
    return prestamistaRepo.remove(id);
  },
};
