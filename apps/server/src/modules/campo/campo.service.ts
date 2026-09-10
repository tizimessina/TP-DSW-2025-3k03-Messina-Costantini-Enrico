import { assertOwnerOrAdmin, hasRole, isAdmin } from "../../core/auth/middleware.js";
import type { AuthUser } from "../../core/auth/types.js";
import { campoRepo } from "./campo.repository.js";
import type { CampoCreateDTO, CampoUpdateDTO } from "./campo.schema.js";

const NOT_OWNER = "Solo el cliente dueño del campo puede operar sobre él";

export const campoService = {
  /** CLIENTE ve solo sus campos; ADMIN puede ver todos o filtrar por cliente. */
  list: (user: AuthUser, q?: string, id_cliente?: bigint, page?: number, pageSize?: number) => {
    const scopedCliente = isAdmin(user) ? id_cliente : user.id_user;
    return campoRepo.list(q, scopedCliente, page, pageSize);
  },

  get: async (user: AuthUser, id: bigint) => {
    const row = await campoRepo.getById(id);
    if (!row) throw { status: 404, code: "NOT_FOUND", message: "Campo no encontrado" };
    assertOwnerOrAdmin(user, row.id_cliente, NOT_OWNER);
    return row;
  },

  create: async (user: AuthUser, dto: CampoCreateDTO) => {
    let id_cliente: bigint;
    if (isAdmin(user) && dto.id_cliente) {
      id_cliente = dto.id_cliente;
    } else if (hasRole(user, "CLIENTE")) {
      id_cliente = user.id_user;
    } else {
      throw { status: 400, code: "CLIENTE_REQUIRED", message: "Indicá el cliente dueño del campo" };
    }
    try {
      return await campoRepo.create({
        id_cliente,
        coordenadas: dto.coordenadas.trim(),
        hectareas: dto.hectareas,
      });
    } catch (e: any) {
      if (e?.code === "P2003") {
        throw { status: 400, code: "FK_INVALID", message: "Cliente inexistente" };
      }
      throw e;
    }
  },

  update: async (user: AuthUser, id: bigint, dto: CampoUpdateDTO) => {
    await campoService.get(user, id);
    return campoRepo.update(id, {
      coordenadas: dto.coordenadas?.trim(),
      hectareas: dto.hectareas,
    });
  },

  remove: async (user: AuthUser, id: bigint) => {
    await campoService.get(user, id);
    try {
      return await campoRepo.remove(id);
    } catch (e: any) {
      if (e?.code === "P2003") {
        throw { status: 409, code: "IN_USE", message: "No se puede eliminar: el campo tiene solicitudes asociadas" };
      }
      throw e;
    }
  },
};
